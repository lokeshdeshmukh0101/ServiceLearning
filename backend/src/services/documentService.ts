/**
 * documentService.ts
 * Handles all CRUD operations for documents:
 * - Creating a new document (upload + text extraction)
 * - Fetching all documents with optional filters
 * - Fetching a single document by ID
 * - Updating document metadata (description + tags)
 * - Deleting a document and its file from disk
 * - Getting library statistics for the admin dashboard
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { run, query, get } from '../database/db.js';
import { extractText } from './textExtractorService.js';
import { createChunks } from './chunkingService.js';
import { addDocumentChunks, deleteDocumentChunks } from './vectorSearchService.js';
import { invalidateSummaryCache } from './summaryService.js';
import { getConfiguredAIModel } from './aiProvider.js';
import { DocumentMetadata, SystemStatus } from '../types/index.js';

/**
 * Creates a new document record in the database.
 * Steps:
 * 1. Save metadata to DB with status = 'processing'
 * 2. Extract text from the uploaded file
 * 3. Store extracted text and update status to 'ready'
 * 4. Create chunks for search indexing
 */
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

  // Parse tags from either a comma-separated string or an array
  let tagList: string[] = [];
  if (typeof rawTags === 'string') {
    tagList = rawTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  } else if (Array.isArray(rawTags)) {
    tagList = rawTags.map((t) => String(t).trim()).filter((t) => t.length > 0);
  }

  // Step 1: Insert initial document record
  await run(
    `INSERT INTO documents (id, filename, storedPath, fileType, fileSize, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [docId, originalFilename, storedPath, fileType, fileSize, description || null, 'processing']
  );

  // Save tags if provided
  if (tagList.length > 0) {
    await setDocumentTags(docId, tagList);
  }

  // Step 2 & 3: Extract text and update document status
  try {
    const extraction = await extractText(storedPath, fileType);

    if (extraction.error || !extraction.text || extraction.text.trim().length === 0) {
      // Extraction failed or returned nothing - still mark as 'ready'
      const note = extraction.error ? `Extraction Note: ${extraction.error}` : 'No text content extracted.';
      await run(
        `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        ['ready', note, docId]
      );
    } else {
      const fullText = extraction.text.trim();

      await run(
        `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        ['ready', fullText, docId]
      );

      // Step 4: Create text chunks and index them for search
      const chunks = createChunks(docId, fullText, extraction.pages);
      await addDocumentChunks(docId, chunks);
    }
  } catch (err: any) {
    console.error(`Document processing error for ID ${docId}:`, err);
    await run(
      `UPDATE documents SET status = ?, extractedText = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      ['failed', `Processing error: ${err?.message || 'Unknown'}`, docId]
    );
  }

  return await getDocumentById(docId);
}

/**
 * Returns all documents, with optional filters:
 * - userQuery: searches in filename, description, and extracted text
 * - tagFilter: filters by a specific tag name
 * - typeFilter: filters by file type (pdf, docx, txt/md)
 */
export async function getAllDocuments(
  userQuery?: string,
  tagFilter?: string,
  typeFilter?: string
): Promise<DocumentMetadata[]> {
  let sql = `SELECT * FROM documents WHERE 1=1`;
  const params: any[] = [];

  // Filter by file type
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

  // Full-text search across filename, description, and extracted content
  if (userQuery && userQuery.trim() !== '') {
    const q = `%${userQuery.trim().toLowerCase()}%`;
    sql += ` AND (LOWER(filename) LIKE ? OR LOWER(description) LIKE ? OR LOWER(extractedText) LIKE ?)`;
    params.push(q, q, q);
  }

  // Filter by a specific tag using a subquery on document_tags
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

  // Format each document row (includes fetching its tags)
  const documents: DocumentMetadata[] = [];
  for (const row of rows) {
    documents.push(await formatDocument(row));
  }

  return documents;
}

/**
 * Fetch a single document by its UUID.
 * Throws an error if not found.
 */
export async function getDocumentById(id: string): Promise<DocumentMetadata> {
  const doc = await get<any>(`SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) {
    throw new Error(`Document with ID ${id} not found.`);
  }
  return await formatDocument(doc);
}

/**
 * Update the description and/or tags for an existing document.
 */
export async function updateDocument(
  id: string,
  updates: { description?: string; tags?: string[] }
): Promise<DocumentMetadata> {
  if (updates.description !== undefined) {
    await run(
      `UPDATE documents SET description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [updates.description, id]
    );
  }

  if (updates.tags !== undefined) {
    await setDocumentTags(id, updates.tags);
  }

  return await getDocumentById(id);
}

/**
 * Delete a document: removes physical file from disk, its chunks, tags, and DB record.
 */
export async function deleteDocument(id: string): Promise<void> {
  const doc = await get<any>(`SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) return; // Already deleted, nothing to do

  // Remove the uploaded file from disk
  if (fs.existsSync(doc.storedPath)) {
    try {
      await fs.promises.unlink(doc.storedPath);
    } catch (e) {
      console.warn(`Could not delete file from disk: ${doc.storedPath}`, e);
    }
  }

  // Invalidate summary cache
  try { await invalidateSummaryCache(id); } catch {}

  // Clean up related DB records
  await deleteDocumentChunks(id);
  await run(`DELETE FROM document_tags WHERE documentId = ?`, [id]);
  await run(`DELETE FROM documents WHERE id = ?`, [id]);
}

/**
 * Get statistics for the admin dashboard:
 * - Total document count, storage used, counts per format, AI config status
 */
export async function getLibraryStats(): Promise<SystemStatus> {
  const docs = await query<any>(`SELECT fileType, fileSize FROM documents`);

  const totalDocuments = docs.length;
  const totalStorageBytes = docs.reduce((total: number, d: any) => total + d.fileSize, 0);

  let pdfCount = 0;
  let docxCount = 0;
  let txtCount = 0;

  for (const d of docs) {
    const type = d.fileType.toLowerCase();
    if (type === 'pdf') pdfCount++;
    else if (type === 'docx' || type === 'doc') docxCount++;
    else if (type === 'txt' || type === 'md' || type === 'markdown') txtCount++;
  }

  let totalCategories = 0;
  try {
    const catRows = await query<any>(`SELECT COUNT(*) as cnt FROM categories`);
    totalCategories = catRows[0]?.cnt || 0;
  } catch {}

  let totalUsers = 0;
  let activeUsers = 0;
  try {
    const userRows = await query<any>(`SELECT COUNT(*) as cnt, SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeCnt FROM users`);
    totalUsers = userRows[0]?.cnt || 0;
    activeUsers = userRows[0]?.activeCnt || 0;
  } catch {}

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const aiProvider = process.env.LLM_PROVIDER || 'GEMINI';
  const model = getConfiguredAIModel();

  return {
    totalDocuments,
    totalStorageBytes,
    pdfCount,
    docxCount,
    txtCount,
    aiProvider,
    aiConfigured: Boolean(apiKey && apiKey.trim().length > 0),
    model,
    totalCategories,
    totalUsers,
    activeUsers,
  };
}

// ─── Private Helper Functions ─────────────────────────────────────────────

/**
 * Replace all tags for a document.
 * Creates new tag records if they don't already exist.
 */
async function setDocumentTags(documentId: string, tagNames: string[]) {
  // Remove existing tags for this document first
  await run(`DELETE FROM document_tags WHERE documentId = ?`, [documentId]);

  for (const rawName of tagNames) {
    const cleanName = rawName.trim().toLowerCase();
    if (!cleanName) continue;

    // Check if this tag already exists
    let tag = await get<any>(`SELECT id FROM tags WHERE name = ?`, [cleanName]);
    let tagId = tag ? tag.id : null;

    // If tag doesn't exist, create it
    if (!tagId) {
      tagId = randomUUID();
      await run(`INSERT INTO tags (id, name) VALUES (?, ?)`, [tagId, cleanName]);
    }

    // Link the tag to this document
    await run(`INSERT INTO document_tags (documentId, tagId) VALUES (?, ?)`, [documentId, tagId]);
  }
}

/**
 * Convert a raw database row into a proper DocumentMetadata object.
 * Also fetches the document's tag names from the tags table.
 */
async function formatDocument(doc: any): Promise<DocumentMetadata> {
  const tagRows = await query<any>(
    `SELECT t.name FROM tags t JOIN document_tags dt ON t.id = dt.tagId WHERE dt.documentId = ?`,
    [doc.id]
  );
  const tags = tagRows.map((r: any) => r.name);

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
