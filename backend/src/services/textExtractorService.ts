/**
 * textExtractorService.ts
 * Shared extraction pipeline returning {text, pages, metadata}.
 * Typed errors for: unsupported format, corrupt, empty/scanned, oversized.
 * Magic byte validation is performed here so it can be reused in tests.
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ExtractionResult, ExtractedPage } from '../types/index.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TEXT_BYTES = 2 * 1024 * 1024; // 2 MB of text before we truncate (safety)
const MIN_MEANINGFUL_CHARS = 30;         // fewer chars = scanned/empty

// Supported extensions (enforced alongside magic bytes)
export const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
// Legacy formats that we explicitly reject with a friendly message
export const LEGACY_EXTENSIONS = new Set(['.doc', '.ppt', '.pptx']);

// Magic bytes (file signatures)
const MAGIC_PDF = [0x25, 0x50, 0x44, 0x46];          // %PDF
const MAGIC_DOCX_ZIP = [0x50, 0x4b, 0x03, 0x04];     // PK.. (ZIP-based)

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ExtractionError {
  code: 'UNSUPPORTED' | 'CORRUPT' | 'EMPTY' | 'SCANNED' | 'OVERSIZED' | 'NOT_FOUND' | 'READ_ERROR';
  message: string;
}

export interface RichExtractionResult extends ExtractionResult {
  extractionError?: ExtractionError;
  pageCount?: number;
  wordCount?: number;
  contentHash?: string;
}

/**
 * Extract text from a file. Always returns a result object.
 * On failure, sets extractionError and returns text=''.
 */
export async function extractText(
  filePath: string,
  fileType: string
): Promise<RichExtractionResult> {
  const normalizedType = fileType.toLowerCase().trim().replace(/^\./, '');

  // File existence check
  if (!fs.existsSync(filePath)) {
    return makeError('NOT_FOUND', 'File does not exist on disk');
  }

  // Size check
  const stat = await fs.promises.stat(filePath);
  if (stat.size === 0) {
    return makeError('EMPTY', 'File is empty');
  }

  // Read magic bytes (first 8 bytes)
  let header: Buffer;
  try {
    const fd = await fs.promises.open(filePath, 'r');
    header = Buffer.alloc(8);
    await fd.read(header, 0, 8, 0);
    await fd.close();
  } catch {
    return makeError('READ_ERROR', 'Could not read file header');
  }

  try {
    // Legacy unsupported formats
    if (['doc', 'ppt', 'pptx'].includes(normalizedType)) {
      return makeError(
        'UNSUPPORTED',
        `Format .${normalizedType} is not supported. Please convert to DOCX or PDF.`
      );
    }

    if (normalizedType === 'pdf' || isHeaderMatch(header, MAGIC_PDF)) {
      return await extractPdfText(filePath);
    }

    if (
      normalizedType === 'docx' ||
      (isHeaderMatch(header, MAGIC_DOCX_ZIP) && normalizedType !== 'pdf')
    ) {
      return await extractDocxText(filePath);
    }

    if (['txt', 'md', 'markdown'].includes(normalizedType)) {
      return await extractPlainText(filePath);
    }

    // Unknown type — attempt as plain text
    return await extractPlainText(filePath);
  } catch (err: any) {
    console.error(`Extraction error for ${filePath}:`, err?.message);
    return makeError('CORRUPT', err?.message || 'Document could not be parsed');
  }
}

// ─── Per-format extractors ────────────────────────────────────────────────────

async function extractPdfText(filePath: string): Promise<RichExtractionResult> {
  const dataBuffer = await fs.promises.readFile(filePath);
  const pages: ExtractedPage[] = [];

  const options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY: number | undefined;
        let text = '';
        for (const item of textContent.items) {
          if (lastY == item.transform[5] || lastY === undefined) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        const pageNumber = pageData.pageIndex + 1;
        const pageText = text.trim();
        if (pageText) {
          pages.push({ pageNumber, text: pageText });
        }
        return `\n--- Page ${pageNumber} ---\n` + text;
      });
    },
  };

  let parsed: any;
  try {
    parsed = await pdfParse(dataBuffer, options);
  } catch {
    // Fallback without custom renderer
    try {
      parsed = await pdfParse(dataBuffer);
    } catch (e2: any) {
      return makeError('CORRUPT', 'PDF could not be parsed: ' + (e2?.message || 'unknown'));
    }
  }

  const fullText = (parsed.text || '').trim();
  const pageCount = parsed.numpages || pages.length;

  if (fullText.length < MIN_MEANINGFUL_CHARS) {
    return {
      text: '',
      pages: [],
      pageCount,
      wordCount: 0,
      extractionError: {
        code: 'SCANNED',
        message: 'No extractable text found. This may be a scanned PDF. OCR is not supported.',
      },
    };
  }

  const truncated = fullText.length > MAX_TEXT_BYTES
    ? fullText.slice(0, MAX_TEXT_BYTES)
    : fullText;

  return {
    text: truncated,
    pages: pages.length > 0 ? pages : undefined,
    pageCount,
    wordCount: countWords(truncated),
  };
}

async function extractDocxText(filePath: string): Promise<RichExtractionResult> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = (result.value || '').trim();

  if (text.length < MIN_MEANINGFUL_CHARS) {
    return {
      text: '',
      extractionError: {
        code: 'EMPTY',
        message: 'DOCX file contains no readable text.',
      },
    };
  }

  return {
    text: text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text,
    wordCount: countWords(text),
  };
}

async function extractPlainText(filePath: string): Promise<RichExtractionResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const text = content.trim();

  if (text.length < MIN_MEANINGFUL_CHARS) {
    return {
      text: '',
      extractionError: {
        code: 'EMPTY',
        message: 'Text file appears to be empty.',
      },
    };
  }

  return {
    text: text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text,
    wordCount: countWords(text),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHeaderMatch(buf: Buffer, magic: number[]): boolean {
  for (let i = 0; i < magic.length; i++) {
    if (buf[i] !== magic[i]) return false;
  }
  return true;
}

function makeError(code: ExtractionError['code'], message: string): RichExtractionResult {
  return { text: '', extractionError: { code, message } };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Validate file extension AND magic bytes. Returns error string or null. */
export function validateFileType(
  filePath: string,
  originalName: string,
  headerBuf: Buffer
): string | null {
  const ext = path.extname(originalName).toLowerCase();

  if (LEGACY_EXTENSIONS.has(ext)) {
    return `Format ${ext} is not supported. Please convert to DOCX or PDF.`;
  }

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return `Format ${ext} is not allowed. Accepted: PDF, DOCX, TXT, MD.`;
  }

  if (ext === '.pdf' && !isHeaderMatch(headerBuf, MAGIC_PDF)) {
    return 'File claims to be PDF but does not have PDF magic bytes.';
  }

  if (ext === '.docx' && !isHeaderMatch(headerBuf, MAGIC_DOCX_ZIP)) {
    return 'File claims to be DOCX but does not have valid ZIP/DOCX magic bytes.';
  }

  return null;
}
