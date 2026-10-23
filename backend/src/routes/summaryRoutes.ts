/**
 * summaryRoutes.ts
 * POST /api/documents/:id/summary — Generate or return cached summary.
 * Requires auth, validates input, applies rate limiting.
 * If extractedText in DB is empty, re-extracts from the file on disk.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { get } from '../database/db.js';
import { generateSummary } from '../services/summaryService.js';
import { extractText } from '../services/textExtractorService.js';
import type { SummaryLanguage, SummaryLength } from '../services/summaryService.js';
import { getAIProviderHttpStatus, isAIProviderErrorCode } from '../services/aiProvider.js';

const router = Router();

// 10 summary requests per user per 10 minutes
const summaryRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many summary requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const SummaryRequestSchema = z.object({
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  mode: z.enum([
    'summary',
    'key_concepts',
    'simplified',
    'revision_points',
    'chapter_breakdown',
    'revision_questions',
  ]).default('summary'),
});

router.post('/:id/summary', requireAuth, summaryRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    // Fetch doc with storedPath for fallback extraction
    const doc = await get<any>(
      `SELECT id, extractedText, storedPath, fileType, status FROM documents WHERE id = ?`,
      [id]
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    // Document permission check:
    // ADMIN can summarise any document.
    // VIEWER can summarise any 'ready' document (all documents are public in this library).
    if (doc.status !== 'ready' && req.user?.role !== 'ADMIN') {
      res.status(422).json({ error: 'Document is still processing. Please try again shortly.' });
      return;
    }

    // Input validation
    const parsed = SummaryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const { language, length, mode } = parsed.data;

    // Use stored extracted text, or re-extract from disk if it's missing
    let extractedText = (doc.extractedText || '').trim();
    let pages: any[] | undefined;

    if (!extractedText && doc.storedPath) {
      const ext = (doc.fileType || '').toLowerCase().replace('.', '');
      const extracted = await extractText(doc.storedPath, ext);
      if (extracted.extractionError) {
        const msg = extracted.extractionError.code === 'SCANNED'
          ? 'Document appears to be a scanned image. No extractable text found.'
          : extracted.extractionError.code === 'EMPTY'
          ? 'Document appears to be empty.'
          : extracted.extractionError.code === 'CORRUPT'
          ? 'Document is corrupt or unreadable.'
          : extracted.extractionError.message;
        res.status(422).json({ error: msg, code: extracted.extractionError.code });
        return;
      }
      extractedText = extracted.text;
      pages = extracted.pages;
    }

    const result = await generateSummary(
      id,
      extractedText,
      pages,
      { language: language as SummaryLanguage, length: length as SummaryLength, mode }
    );

    if ('error' in result) {
      const statusCode = result.code === 'INSUFFICIENT_CONTENT'
        ? 422
        : result.code === 'DOCUMENT_NOT_FOUND'
        ? 404
        : isAIProviderErrorCode(result.code)
        ? result.status ?? getAIProviderHttpStatus(result.code)
        : 500;
      res.status(statusCode).json({ error: result.error, code: result.code });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
