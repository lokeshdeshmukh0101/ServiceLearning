import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { run, query, get } from '../database/db.js';
import { extractText } from './textExtractorService.js';
import { createChunks } from './chunkingService.js';
import { addDocumentChunks, deleteDocumentChunks } from './vectorSearchService.js';
import { DocumentMetadata, SystemStatus } from '../types/index.js';

export async function createDocument(
  file: Express.Multer.File,
  description?: string,
  rawTags?: string | string[]
): Promise<DocumentMetadata> {
  const originalFilename = file.originalname;
  const storedPath = file.path;
  const fileSize = file.size;
  const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
  const fileType = ext || 'unknown';
  const docId = randomUUID();

  let tagList: string[] = [];
  if (typeof rawTags === 'string') {
    tagList = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  } else if (Array.isArray(rawTags)) {
    tagList = rawTags.map((t) => String(t).trim()).filter((t) => t.length > 0);
  }

  await run(
    `INSERT INTO documents (id, filename, storedPath, fileType, fileSize, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [docId, originalFilename, storedPath, fileType, fileSize, description || null, 'processing']
  );

  if (tagList.length > 0) {
    await setDocumentTags(docId, tagList);
  }

  try {
    const extraction = await extractText(storedPath, fileType);

    if (extraction.error || !extraction.text || extraction.text.trim().length === 0) {
      await run(
        `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        ['ready', extraction.error ? `Extraction Note: ${extraction.error}` : 'No text content extracted.', docId]
      );
    } else {
      const fullText = extraction.text.trim();
      
      await run(
        `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        ['ready', fullText, docId]
      );

      const chunks = createChunks(docId, fullText, extraction.pages);
      await addDocumentChunks(docId, chunks);
    }
  } catch (err: any) {
    console.error(`Document processing failed for ${docId}:`, err);
    await run(
      `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      ['failed', `Processing error: ${err?.message || 'Unknown error'}`, docId]
    );
  }

  return await getDocumentById(docId);
}

export async function getAllDocuments(
  userQuery?: string,
  tagFilter?: string,
  typeFilter?: string
): Promise<DocumentMetadata[]> {
  let sql = `SELECT * FROM documents WHERE 1=1`;
  const params: any[] = [];

  if (typeFilter && typeFilter.trim() !== '') {
    const tf = typeFilter.trim().toLowerCase();
    if (tf === 'txt' || tf === 'md' || tf === 'markdown') {
      sql += ` AND LOWER(fileType) IN ('txt', 'md', 'markdown')`;
    } else if (tf === 'docx' || tf === 'doc') {
      sql += ` AND LOWER(fileType) IN ('docx', 'doc')`;
    } else {
      sql += ` AND LOWER(fileType) = ?`;
      params.push(tf);
    }
  }

  if (userQuery && userQuery.trim() !== '') {
    const q = `%${userQuery.trim().toLowerCase()}%`;
    sql += ` AND (LOWER(filename) LIKE ? OR LOWER(description) LIKE ? OR LOWER(extractedText) LIKE ?)`;
    params.push(q, q, q);
  }

  if (tagFilter && tagFilter.trim() !== '') {
    sql += ` AND id IN (
      SELECT dt.documentId FROM document_tags dt 
      JOIN tags t ON dt.tagId = t.id 
      WHERE LOWER(t.name) = ?
    )`;
    params.push(tagFilter.trim().toLowerCase());
  }

  sql += ` ORDER BY createdAt DESC`;

  const rows = await query<any>(sql, params);

  const formattedDocs: DocumentMetadata[] = [];
  for (const doc of rows) {
    const formatted = await formatDocument(doc);
    formattedDocs.push(formatted);
  }

  return formattedDocs;
}

export async function getDocumentById(id: string): Promise<DocumentMetadata> {
  const doc = await get<any>(`SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) {
    throw new Error(`Document with ID ${id} not found.`);
  }
  return await formatDocument(doc);
}

export async function updateDocument(
  id: string,
  updates: { description?: string; tags?: string[] }
): Promise<DocumentMetadata> {
  if (updates.description !== undefined) {
    await run(`UPDATE documents SET description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [updates.description, id]);
  }

  if (updates.tags !== undefined) {
    await setDocumentTags(id, updates.tags);
  }

  return await getDocumentById(id);
}

export async function deleteDocument(id: string): Promise<void> {
  const doc = await get<any>(`SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) {
    return;
  }

  if (fs.existsSync(doc.storedPath)) {
    try {
      await fs.promises.unlink(doc.storedPath);
    } catch (e) {
      console.warn(`Could not remove file ${doc.storedPath}:`, e);
    }
  }

  await deleteDocumentChunks(id);
  await run(`DELETE FROM document_tags WHERE documentId = ?`, [id]);
  await run(`DELETE FROM documents WHERE id = ?`, [id]);
}

export async function getLibraryStats(): Promise<SystemStatus> {
  const docs = await query<any>(`SELECT fileType, fileSize FROM documents`);

  const totalDocuments = docs.length;
  const totalStorageBytes = docs.reduce((acc, d) => acc + d.fileSize, 0);

  let pdfCount = 0;
  let docxCount = 0;
  let txtCount = 0;

  for (const d of docs) {
    const t = d.fileType.toLowerCase();
    if (t === 'pdf') pdfCount++;
    else if (t === 'docx' || t === 'doc') docxCount++;
    else if (t === 'txt' || t === 'md' || t === 'markdown') txtCount++;
  }

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const aiProvider = process.env.LLM_PROVIDER || 'GEMINI';
  const model = process.env.LLM_MODEL || 'gemini-2.5-flash';

  return {
    totalDocuments,
    totalStorageBytes,
    pdfCount,
    docxCount,
    txtCount,
    aiProvider,
    aiConfigured: Boolean(apiKey && apiKey.trim().length > 0),
    model,
  };
}

async function setDocumentTags(documentId: string, tagNames: string[]) {
  await run(`DELETE FROM document_tags WHERE documentId = ?`, [documentId]);

  for (const rawName of tagNames) {
    const cleanName = rawName.trim().toLowerCase();
    if (!cleanName) continue;

    let tag = await get<any>(`SELECT id FROM tags WHERE name = ?`, [cleanName]);
    let tagId = tag ? tag.id : null;

    if (!tagId) {
      tagId = randomUUID();
      await run(`INSERT INTO tags (id, name) VALUES (?, ?)`, [tagId, cleanName]);
    }

    await run(`INSERT INTO document_tags (documentId, tagId) VALUES (?, ?)`, [documentId, tagId]);
  }
}

async function formatDocument(doc: any): DocumentMetadata {
  const tagRows = await query<any>(
    `SELECT t.name FROM tags t JOIN document_tags dt ON t.id = dt.tagId WHERE dt.documentId = ?`,
    [doc.id]
  );
  const tags = tagRows.map((r) => r.name);

  return {
    id: doc.id,
    filename: doc.filename,
    storedPath: doc.storedPath,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    description: doc.description,
    uploadDate: doc.uploadDate,
    status: doc.status as any,
    extractedText: doc.extractedText,
    tags,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
