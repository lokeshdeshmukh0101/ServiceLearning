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
export type StudyMode =
  | 'summary'
  | 'key_concepts'
  | 'simplified'
  | 'revision_points'
  | 'chapter_breakdown'
  | 'revision_questions';

export interface SummaryOptions {
  language: SummaryLanguage;
  length: SummaryLength;
  mode?: StudyMode;
}

export interface SummaryResult {
  summary: string;
  cached: boolean;
  language: SummaryLanguage;
  length: SummaryLength;
  mode: StudyMode;
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
  short: 'Write a concise output in 3-5 key points or sentences.',
  medium: 'Write a comprehensive, balanced output in 2-3 structured sections.',
  long: 'Write a detailed output with deep explanations and clear headings.',
};

const MODE_INSTRUCTIONS: Record<StudyMode, string> = {
  summary: 'Write a well-structured academic summary highlighting core principles.',
  key_concepts:
    'Extract and define the top 5 to 8 key concepts, core terminology, and formulas/theories from the document. Format as clear bullet points with bold term names followed by concise definitions and significance.',
  simplified:
    'Explain the core lessons and ideas in intuitive, friendly language suitable for a beginner student or child (Explain Like I am 5). Use real-world analogies, step-by-step thinking, and simple sentences while keeping factual correctness.',
  revision_points:
    'Generate high-yield revision notes. Group into bulleted sections: Key Facts to Remember, Important Formulas/Rules, and Common Exam Traps/Pitfalls.',
  chapter_breakdown:
    'Provide a section-by-section or topic-by-topic summary of this material. Highlight the logical progression from foundational ideas to advanced takeaways.',
  revision_questions:
    'Generate 5 comprehensive study and revision questions based directly on this document. Under each question, provide a brief bulleted "Key Hint / Answer Points" section so the student can verify their understanding.',
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
      mode TEXT NOT NULL DEFAULT 'summary',
      model TEXT NOT NULL,
      summary TEXT NOT NULL,
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Non-destructive migration if table existed before mode column
  try {
    await run(`ALTER TABLE summary_cache ADD COLUMN mode TEXT NOT NULL DEFAULT 'summary'`);
  } catch {
    // Column already exists
  }
}

function makeHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

async function getCached(
  documentId: string,
  contentHash: string,
  language: SummaryLanguage,
  length: SummaryLength,
  mode: StudyMode,
  model: string
): Promise<string | null> {
  const row = await get<any>(
    `SELECT summary FROM summary_cache WHERE documentId=? AND contentHash=? AND language=? AND length=? AND mode=? AND model=?`,
    [documentId, contentHash, language, length, mode, model]
  );
  return row ? row.summary : null;
}

async function putCache(
  documentId: string,
  contentHash: string,
  language: SummaryLanguage,
  length: SummaryLength,
  mode: StudyMode,
  model: string,
  summary: string
): Promise<void> {
  const id = `${documentId}-${contentHash}-${language}-${length}-${mode}`;
  await run(
    `INSERT OR REPLACE INTO summary_cache (id, documentId, contentHash, language, length, mode, model, summary) VALUES (?,?,?,?,?,?,?,?)`,
    [id, documentId, contentHash, language, length, mode, model, summary]
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
  const mode: StudyMode = opts.mode || 'summary';

  // Check cache
  const cached = await getCached(documentId, contentHash, opts.language, opts.length, mode, model);
  if (cached) {
    return {
      summary: cached,
      cached: true,
      language: opts.language,
      length: opts.length,
      mode,
      model,
      generatedAt: new Date().toISOString(),
    };
  }

  const provider = overrideProvider || getAIProvider();

  try {
    let summary: string;

    if (cleanText.length <= CHUNK_TOKEN_LIMIT) {
      // Single-pass summary
      summary = await singlePassSummary(cleanText, { ...opts, mode }, provider);
    } else {
      // Map-reduce for long documents
      summary = await mapReduceSummary(cleanText, pages, { ...opts, mode }, provider);
    }

    // Cache and return
    await putCache(documentId, contentHash, opts.language, opts.length, mode, model, summary);

    return {
      summary,
      cached: false,
      language: opts.language,
      length: opts.length,
      mode,
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
  return provider.generate(prompt, { maxOutputTokens: 1536, temperature: 0.3 });
}

// ─── Map-reduce ───────────────────────────────────────────────────────────────

async function mapReduceSummary(
  text: string,
  pages: ExtractedPage[] | undefined,
  opts: SummaryOptions,
  provider: AIProvider
): Promise<string> {
  const mode = opts.mode || 'summary';
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
    const prompt = `Extract the essential facts and key concepts from the following document excerpt in 2-3 sentences. ${LANGUAGE_INSTRUCTION[opts.language]}\n\n${chunk}`;
    const s = await provider.generate(prompt, { maxOutputTokens: 256, temperature: 0.2 });
    chunkSummaries.push(s);
  }

  if (chunkSummaries.length === 0) {
    throw new Error('All chunk summaries failed');
  }

  // Reduce: merge chunk summaries into final formatted output
  const merged = chunkSummaries.join('\n\n');
  const reducePrompt = buildSummaryPrompt(merged, { ...opts, mode }, true);
  return provider.generate(reducePrompt, { maxOutputTokens: 1536, temperature: 0.3 });
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildSummaryPrompt(text: string, opts: SummaryOptions, isMerge = false): string {
  const mode: StudyMode = opts.mode || 'summary';
  const langInstr = LANGUAGE_INSTRUCTION[opts.language];
  const lenInstr = LENGTH_INSTRUCTION[opts.length];
  const modeInstr = MODE_INSTRUCTIONS[mode];
  const context = isMerge
    ? 'You are combining multi-section excerpts of an educational document into a cohesive final study output.'
    : 'You are an intelligent educational learning assistant analyzing source curriculum material.';

  return `${context}
Goal: ${modeInstr}
Language instruction: ${langInstr}
Detail guideline: ${lenInstr}

STRICT GROUNDING RULES:
1. Base your output ONLY on the content provided below. Never invent external facts.
2. If the document content does not contain sufficient details for a topic, explicitly state that.
3. Preserve technical terms, proper names, and formulas in their standard form alongside translations.
4. Output cleanly formatted readable prose or markdown bullet points. Do not wrap in JSON.

DOCUMENT CONTENT:
${text.slice(0, CHUNK_TOKEN_LIMIT * 2)}`;
}
