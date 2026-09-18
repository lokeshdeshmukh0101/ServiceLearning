import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'crypto';
import { run, query } from '../database/db.js';
import { ChunkItem } from '../types/index.js';

export async function addDocumentChunks(documentId: string, chunks: ChunkItem[]): Promise<void> {
  if (chunks.length === 0) return;

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const embeddingModelName = process.env.EMBEDDING_MODEL || 'text-embedding-004';
  
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (e) {
      console.warn('Failed to initialize GoogleGenerativeAI for embeddings, using fallback.');
    }
  }

  for (const chunk of chunks) {
    let embeddingJson: string | null = null;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: embeddingModelName });
        const embedResult = await model.embedContent(chunk.chunkText);
        if (embedResult.embedding && embedResult.embedding.values) {
          embeddingJson = JSON.stringify(embedResult.embedding.values);
        }
      } catch (err: any) {
        console.warn(`Embedding API call failed for chunk ${chunk.chunkIndex}, using text fallback:`, err?.message || err);
      }
    }

    const chunkId = randomUUID();
    await run(
      `INSERT INTO document_chunks (id, documentId, chunkText, pageNumber, chunkIndex, embedding) VALUES (?, ?, ?, ?, ?, ?)`,
      [chunkId, documentId, chunk.chunkText, chunk.pageNumber ?? null, chunk.chunkIndex, embeddingJson]
    );
  }
}

export async function searchSimilarChunks(
  userQuery: string,
  topK: number = 5,
  filterDocumentId?: string
): Promise<{
  chunkText: string;
  pageNumber: number | null;
  chunkIndex: number;
  score: number;
  documentId: string;
  documentName: string;
}[]> {
  let sql = `
    SELECT dc.*, d.filename as documentName 
    FROM document_chunks dc 
    JOIN documents d ON dc.documentId = d.id
  `;
  const params: any[] = [];
  if (filterDocumentId) {
    sql += ` WHERE dc.documentId = ?`;
    params.push(filterDocumentId);
  }

  const allChunks = await query<any>(sql, params);

  if (allChunks.length === 0) {
    return [];
  }

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const embeddingModelName = process.env.EMBEDDING_MODEL || 'text-embedding-004';

  let queryVector: number[] | null = null;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: embeddingModelName });
      const embedResult = await model.embedContent(userQuery);
      if (embedResult.embedding && embedResult.embedding.values) {
        queryVector = embedResult.embedding.values;
      }
    } catch (err) {
      console.warn('Query embedding generation failed, falling back to TF-IDF text similarity.');
    }
  }

  const scoredChunks = allChunks.map((chunk) => {
    let score = 0;

    if (queryVector && chunk.embedding) {
      try {
        const chunkVector: number[] = JSON.parse(chunk.embedding);
        score = cosineSimilarity(queryVector, chunkVector);
      } catch {
        score = tfIdfSimilarity(userQuery, chunk.chunkText);
      }
    } else {
      score = tfIdfSimilarity(userQuery, chunk.chunkText);
    }

    return {
      chunkText: chunk.chunkText,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      score,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
    };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((item) => item.score > 0.05);
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await run(`DELETE FROM document_chunks WHERE documentId = ?`, [documentId]);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function tfIdfSimilarity(userQuery: string, text: string): number {
  const tokenize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const queryTerms = tokenize(userQuery);
  const textTerms = tokenize(text);

  if (queryTerms.length === 0 || textTerms.length === 0) return 0;

  const textTermFreq: Record<string, number> = {};
  for (const term of textTerms) {
    textTermFreq[term] = (textTermFreq[term] || 0) + 1;
  }

  let matchScore = 0;
  for (const qTerm of queryTerms) {
    if (textTermFreq[qTerm]) {
      matchScore += (1 + Math.log(textTermFreq[qTerm])) / queryTerms.length;
    } else {
      const partialMatch = textTerms.some((t) => t.includes(qTerm) || qTerm.includes(t));
      if (partialMatch) {
        matchScore += 0.3 / queryTerms.length;
      }
    }
  }

  return matchScore;
}
