import fs from 'fs';
import path from 'path';
import prisma from '../database/prismaClient.js';
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

  // 1. Parse tags array
  let tagList: string[] = [];
  if (typeof rawTags === 'string') {
    tagList = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  } else if (Array.isArray(rawTags)) {
    tagList = rawTags.map((t) => String(t).trim()).filter((t) => t.length > 0);
  }

  // 2. Create document record in database (status = processing)
  const doc = await prisma.document.create({
    data: {
      filename: originalFilename,
      storedPath,
      fileType,
      fileSize,
      description: description || null,
      status: 'processing',
    },
  });

  // Attach tags if provided
  if (tagList.length > 0) {
    await setDocumentTags(doc.id, tagList);
  }

  // 3. Process text extraction & chunk indexing
  try {
    const extraction = await extractText(storedPath, fileType);

    if (extraction.error || !extraction.text || extraction.text.trim().length === 0) {
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          status: 'ready', // File ready but note text extraction limitation
          extractedText: extraction.error ? `Extraction Note: ${extraction.error}` : 'No text content extracted.',
        },
      });
    } else {
      const fullText = extraction.text.trim();
      
      // Update document with extracted text
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          extractedText: fullText,
          status: 'ready',
        },
      });

      // Split into chunks and build vector index
      const chunks = createChunks(doc.id, fullText, extraction.pages);
      await addDocumentChunks(doc.id, chunks);
    }
  } catch (err: any) {
    console.error(`Document processing failed for ${doc.id}:`, err);
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'failed',
        extractedText: `Processing error: ${err?.message || 'Unknown error'}`,
      },
    });
  }

  return await getDocumentById(doc.id);
}

export async function getAllDocuments(
  query?: string,
  tagFilter?: string,
  typeFilter?: string
): Promise<DocumentMetadata[]> {
  const where: any = {};

  if (typeFilter && typeFilter.trim() !== '') {
    where.fileType = typeFilter.toLowerCase();
  }

  if (query && query.trim() !== '') {
    const q = query.trim().toLowerCase();
    where.OR = [
      { filename: { contains: q } },
      { description: { contains: q } },
      { extractedText: { contains: q } },
    ];
  }

  if (tagFilter && tagFilter.trim() !== '') {
    where.tags = {
      some: {
        tag: {
          name: { equals: tagFilter.trim().toLowerCase() },
        },
      },
    };
  }

  const docs = await prisma.document.findMany({
    where,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return docs.map(formatDocument);
}

export async function getDocumentById(id: string): Promise<DocumentMetadata> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!doc) {
    throw new Error(`Document with ID ${id} not found.`);
  }

  return formatDocument(doc);
}

export async function updateDocument(
  id: string,
  updates: { description?: string; tags?: string[] }
): Promise<DocumentMetadata> {
  if (updates.description !== undefined) {
    await prisma.document.update({
      where: { id },
      data: { description: updates.description },
    });
  }

  if (updates.tags !== undefined) {
    await setDocumentTags(id, updates.tags);
  }

  return await getDocumentById(id);
}

export async function deleteDocument(id: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return;
  }

  // 1. Delete physical file from disk safely
  if (fs.existsSync(doc.storedPath)) {
    try {
      await fs.promises.unlink(doc.storedPath);
    } catch (e) {
      console.warn(`Could not remove file ${doc.storedPath}:`, e);
    }
  }

  // 2. Delete document chunks & vector records
  await deleteDocumentChunks(id);

  // 3. Delete document tag relations explicitly
  await prisma.documentTag.deleteMany({
    where: { documentId: id },
  });

  // 4. Delete Prisma document record
  await prisma.document.delete({
    where: { id },
  });
}

export async function getLibraryStats(): Promise<SystemStatus> {
  const docs = await prisma.document.findMany({
    select: {
      fileType: true,
      fileSize: true,
    },
  });

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
  // Delete existing tags for document
  await prisma.documentTag.deleteMany({
    where: { documentId },
  });

  for (const rawName of tagNames) {
    const cleanName = rawName.trim().toLowerCase();
    if (!cleanName) continue;

    // Upsert Tag
    const tag = await prisma.tag.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    });

    // Create relation
    await prisma.documentTag.create({
      data: {
        documentId,
        tagId: tag.id,
      },
    });
  }
}

function formatDocument(doc: any): DocumentMetadata {
  const tags = doc.tags ? doc.tags.map((t: any) => t.tag.name) : [];
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
