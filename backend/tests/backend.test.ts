import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractText } from '../src/services/textExtractorService.js';
import { createChunks } from '../src/services/chunkingService.js';
import { searchSimilarChunks } from '../src/services/vectorSearchService.js';
import prisma from '../src/database/prismaClient.js';
import { generateRAGAnswer } from '../src/services/llmService.js';
import { createDocument, deleteDocument, getAllDocuments } from '../src/services/documentService.js';

describe('Digital Library Backend Test Suite', () => {
  const sampleFilePath = path.join(__dirname, 'sample_test_doc.txt');
  let testDocumentId: string = '';

  beforeAll(async () => {
    // Create temporary sample file
    const sampleContent = `
--- Page 1 ---
Computer Networks Overview.
Classless Inter-Domain Routing (CIDR) is an IP addressing scheme that replaces class-based IP addresses.
CIDR allows allocation of IP addresses using variable-length subnet masks (VLSM).
CIDR reduces the size of routing tables on the Internet.

--- Page 2 ---
Transmission Control Protocol (TCP) provides reliable connection-oriented communication.
User Datagram Protocol (UDP) provides connectionless lightweight transmission.
    `.trim();

    await fs.promises.writeFile(sampleFilePath, sampleContent, 'utf-8');
  });

  afterAll(async () => {
    if (fs.existsSync(sampleFilePath)) {
      await fs.promises.unlink(sampleFilePath);
    }
    if (testDocumentId) {
      await deleteDocument(testDocumentId);
    }
    await prisma.$disconnect();
  });

  it('1. Should extract text accurately from text/markdown files', async () => {
    const res = await extractText(sampleFilePath, 'txt');
    expect(res.text).toContain('Classless Inter-Domain Routing');
    expect(res.error).toBeUndefined();
  });

  it('2. Should chunk document text into readable overlapping segments with page numbers', async () => {
    const text = 'Classless Inter-Domain Routing (CIDR) is an IP addressing scheme. --- Page 42 --- TCP provides reliable communication.';
    const chunks = createChunks('doc-123', text);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkText).toBeDefined();
  });

  it('3. Should complete end-to-end document lifecycle: create, search, RAG chat, and delete', async () => {
    const mockFile: any = {
      originalname: 'Computer Networks Notes.txt',
      path: sampleFilePath,
      size: fs.statSync(sampleFilePath).size,
    };

    // Upload & index
    const doc = await createDocument(mockFile, 'Computer Networks sample notes', ['CN', 'Networking']);
    expect(doc.id).toBeDefined();
    expect(doc.status).toBe('ready');
    testDocumentId = doc.id;

    // Retrieve library docs
    const allDocs = await getAllDocuments('Networks');
    expect(allDocs.length).toBeGreaterThan(0);
    expect(allDocs[0].filename).toContain('Computer Networks');

    // Vector similarity search
    const vectorHits = await searchSimilarChunks('What is CIDR?');
    expect(vectorHits.length).toBeGreaterThan(0);

    // Chatbot RAG query test
    const chatRes = await generateRAGAnswer('What is CIDR?');
    expect(chatRes.answer).toBeDefined();
    expect(chatRes.usedLibrary).toBe(true);
    expect(chatRes.sources.length).toBeGreaterThan(0);
    expect(chatRes.sources[0].documentName).toContain('Computer Networks');

    // Unrelated query fallback test
    const unrelatedRes = await generateRAGAnswer('What is quantum physics gravity?');
    expect(unrelatedRes.answer).toContain("couldn't find enough information");
  });
});
