/**
 * summaryService.ts
 * Generates AI document summaries using chunked map-reduce strategy.
 * Cache keyed by: documentId + contentHash + language + length + model.
 * Cache is stored in the summary_cache table.
 */

import crypto from 'crypto';
import { get, run, query } from '../database/db.js';
import {
  AIProviderError,
  getAIProvider,
  getConfiguredAIModel,
  mapAIProviderError,
  type AIProvider,
  type AIProviderErrorCode,
} from './aiProvider.js';
import { createChunks } from './chunkingService.js';
import type { ExtractedPage } from '../types/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SummaryLanguage = 'en' | 'hi' | 'mr';
export type SummaryLength = 'short' | 'medium' | 'long';

export interface SummaryOptions {
  language: SummaryLanguage;
  length: SummaryLength;
}

export interface SummaryResult {
  summary: string;
  cached: boolean;
  language: SummaryLanguage;
  length: SummaryLength;
  model: string;
  generatedAt: string;
}

export interface SummaryError {
  error: string;
  code: 'INSUFFICIENT_CONTENT' | 'DOCUMENT_NOT_FOUND' | AIProviderErrorCode;
  status?: number;
}

// ─── Language prompts ─────────────────────────────────────────────────────────

const LANGUAGE_INSTRUCTION: Record<SummaryLanguage, string> = {
  en: 'Respond entirely in English.',
  hi: 'Respond entirely in Hindi (हिन्दी). Use Devanagari script.',
  mr: 'Respond entirely in Marathi (मराठी). Use Devanagari script.',
};

const LENGTH_INSTRUCTION: Record<SummaryLength, string> = {
  short: 'Write a concise summary in 3-5 sentences.',
  medium: 'Write a comprehensive summary in 2-3 paragraphs covering key points.',
  long: 'Write a detailed summary with sections: Overview, Key Concepts, and Conclusion.',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CHUNK_TOKEN_LIMIT = 3000; // Characters per chunk for map phase
const MIN_TEXT_LENGTH = 100;    // Minimum chars to attempt summarisation
const MAX_SUMMARY_CHUNKS = 8;

// ─── Cache DB helpers ─────────────────────────────────────────────────────────

async function ensureCacheTable(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS summary_cache (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      contentHash TEXT NOT NULL,
      language TEXT NOT NULL,
      length TEXT NOT NULL,
      model TEXT NOT NULL,
      summary TEXT NOT NULL,
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(documentId, contentHash, language, length, model)
    )
  `);
}

function makeHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

async function getCached(
  documentId: string,
  contentHash: string,
  language: SummaryLanguage,
  length: SummaryLength,
  model: string
): Promise<string | null> {
  const row = await get<any>(
    `SELECT summary FROM summary_cache WHERE documentId=? AND contentHash=? AND language=? AND length=? AND model=?`,
    [documentId, contentHash, language, length, model]
  );
  return row ? row.summary : null;
}

async function putCache(
  documentId: string,
  contentHash: string,
  language: SummaryLanguage,
  length: SummaryLength,
  model: string,
  summary: string
): Promise<void> {
  const id = `${documentId}-${contentHash}-${language}-${length}`;
  await run(
    `INSERT OR REPLACE INTO summary_cache (id, documentId, contentHash, language, length, model, summary) VALUES (?,?,?,?,?,?,?)`,
    [id, documentId, contentHash, language, length, model, summary]
  );
}

/** Invalidate cache for a document when its content changes. */
export async function invalidateSummaryCache(documentId: string): Promise<void> {
  await run(`DELETE FROM summary_cache WHERE documentId = ?`, [documentId]);
}

// ─── Summarization Core ───────────────────────────────────────────────────────

/**
 * Generate (or return cached) summary for a document.
 * @param documentId DB document ID
 * @param text The full extracted text
 * @param pages Optional extracted pages array
 * @param opts Language + length
 * @param overrideProvider Optional (for tests)
 */
export async function generateSummary(
  documentId: string,
  text: string,
  pages: ExtractedPage[] | undefined,
  opts: SummaryOptions,
  overrideProvider?: AIProvider
): Promise<SummaryResult | SummaryError> {
  await ensureCacheTable();

  const cleanText = text.trim();
  if (cleanText.length < MIN_TEXT_LENGTH) {
    return {
      error: 'Document does not contain enough extractable text to summarize.',
      code: 'INSUFFICIENT_CONTENT',
    };
  }

  const model = getConfiguredAIModel();
  const contentHash = makeHash(cleanText);

  // Check cache
  const cached = await getCached(documentId, contentHash, opts.language, opts.length, model);
  if (cached) {
    return {
      summary: cached,
      cached: true,
      language: opts.language,
      length: opts.length,
      model,
      generatedAt: new Date().toISOString(),
    };
  }

  const provider = overrideProvider || getAIProvider();

  try {
    let summary: string;

    if (cleanText.length <= CHUNK_TOKEN_LIMIT) {
      // Single-pass summary
      summary = await singlePassSummary(cleanText, opts, provider);
    } else {
      // Map-reduce for long documents
      summary = await mapReduceSummary(cleanText, pages, opts, provider);
    }

    // Cache and return
    await putCache(documentId, contentHash, opts.language, opts.length, model, summary);

    return {
      summary,
      cached: false,
      language: opts.language,
      length: opts.length,
      model,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    const providerError = err instanceof AIProviderError
      ? err
      : mapAIProviderError(err);
    return {
      error: providerError.message,
      code: providerError.code,
      status: providerError.status,
    };
  }
}

// ─── Single-pass ──────────────────────────────────────────────────────────────

async function singlePassSummary(
  text: string,
  opts: SummaryOptions,
  provider: AIProvider
): Promise<string> {
  const prompt = buildSummaryPrompt(text, opts);
  return provider.generate(prompt, { maxOutputTokens: 1024, temperature: 0.3 });
}

// ─── Map-reduce ───────────────────────────────────────────────────────────────

async function mapReduceSummary(
  text: string,
  pages: ExtractedPage[] | undefined,
  opts: SummaryOptions,
  provider: AIProvider
): Promise<string> {
  // Map: summarise each chunk
  const allChunks = createChunks('_summary', text, pages).map((c) => c.chunkText);
  const chunks = allChunks.length <= MAX_SUMMARY_CHUNKS
    ? allChunks
    : Array.from({ length: MAX_SUMMARY_CHUNKS }, (_, index) => {
      const sourceIndex = Math.round(
        index * (allChunks.length - 1) / (MAX_SUMMARY_CHUNKS - 1)
      );
      return allChunks[sourceIndex];
    });

  const chunkSummaries: string[] = [];
  for (const chunk of chunks) {
    if (chunk.trim().length < 50) continue;
    const prompt = `Summarize the following document excerpt in 2-3 sentences. ${LANGUAGE_INSTRUCTION[opts.language]}\n\n${chunk}`;
    const s = await provider.generate(prompt, { maxOutputTokens: 256, temperature: 0.2 });
    chunkSummaries.push(s);
  }

  if (chunkSummaries.length === 0) {
    throw new Error('All chunk summaries failed');
  }

  // Reduce: merge chunk summaries into final
  const merged = chunkSummaries.join('\n\n');
  const reducePrompt = buildSummaryPrompt(merged, opts, true);
  return provider.generate(reducePrompt, { maxOutputTokens: 1024, temperature: 0.3 });
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildSummaryPrompt(text: string, opts: SummaryOptions, isMerge = false): string {
  const langInstr = LANGUAGE_INSTRUCTION[opts.language];
  const lenInstr = LENGTH_INSTRUCTION[opts.length];
  const context = isMerge
    ? 'You are merging multiple document section summaries into one coherent final summary.'
    : 'You are summarizing an educational document.';

  return `${context}
${langInstr}
${lenInstr}
Important: Base your summary ONLY on the content provided. Do not add external information.
Do not output JSON or code blocks—plain prose only.

DOCUMENT CONTENT:
${text.slice(0, CHUNK_TOKEN_LIMIT * 2)}`;
}
