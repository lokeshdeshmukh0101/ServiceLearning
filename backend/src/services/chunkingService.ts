import { ChunkItem, ExtractedPage } from '../types/index.js';

const CHUNK_SIZE = 800; // Character size (~150-200 words)
const CHUNK_OVERLAP = 150; // Character overlap

export function createChunks(
  documentId: string,
  fullText: string,
  pages?: ExtractedPage[]
): ChunkItem[] {
  if (!fullText || fullText.trim().length === 0) {
    return [];
  }

  const chunks: ChunkItem[] = [];

  // If page information is available, chunk per page first to preserve exact page citations
  if (pages && pages.length > 0) {
    let chunkIndex = 0;
    for (const page of pages) {
      const pageText = page.text.trim();
      if (!pageText) continue;

      const pageChunks = splitTextIntoChunks(pageText, CHUNK_SIZE, CHUNK_OVERLAP);
      for (const chunkStr of pageChunks) {
        chunks.push({
          documentId,
          chunkText: chunkStr,
          pageNumber: page.pageNumber,
          chunkIndex: chunkIndex++,
        });
      }
    }
    if (chunks.length > 0) {
      return chunks;
    }
  }

  // Fallback: chunk fullText directly if no explicit pages structure
  const rawChunks = splitTextIntoChunks(fullText, CHUNK_SIZE, CHUNK_OVERLAP);
  return rawChunks.map((chunkText, idx) => ({
    documentId,
    chunkText,
    pageNumber: extractPageNumberFromText(chunkText),
    chunkIndex: idx,
  }));
}

function splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const result: string[] = [];
  const cleanText = text.replace(/\r\n/g, '\n');
  
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  let start = 0;
  while (start < cleanText.length) {
    let end = Math.min(start + chunkSize, cleanText.length);
    
    // Try to break at paragraph or sentence boundary if possible
    if (end < cleanText.length) {
      const nextNewline = cleanText.lastIndexOf('\n', end);
      const nextPeriod = cleanText.lastIndexOf('. ', end);
      
      if (nextNewline > start + chunkSize / 2) {
        end = nextNewline + 1;
      } else if (nextPeriod > start + chunkSize / 2) {
        end = nextPeriod + 1;
      }
    }

    const chunk = cleanText.substring(start, end).trim();
    if (chunk.length > 0) {
      result.push(chunk);
    }

    if (end >= cleanText.length) break;
    start = Math.max(start + 1, end - overlap);
  }

  return result;
}

function extractPageNumberFromText(text: string): number | null {
  const match = text.match(/--- Page (\d+) ---/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
