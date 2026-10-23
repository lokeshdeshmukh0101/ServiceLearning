/**
 * quizRoutes.ts
 * POST /api/documents/:id/quiz — Generate quiz
 * GET  /api/quiz/:quizId — Get quiz (questions only, no answers)
 * POST /api/quiz/:quizId/attempt — Submit answers and get score
 * GET  /api/quiz/:quizId/attempts — Get attempt history
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { get } from '../database/db.js';
import { extractText } from '../services/textExtractorService.js';
import { getAIProviderHttpStatus, isAIProviderErrorCode } from '../services/aiProvider.js';
import {
  generateQuiz,
  submitAttempt,
  getQuizById,
  getAttemptsByQuiz,
} from '../services/quizService.js';

const router = Router();

// Rate limit: 5 quiz generations per user per 10 minutes
const quizGenLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many quiz generation requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const QuizRequestSchema = z.object({
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  quizType: z.enum(['mcq', 'true_false', 'mixed']).default('mcq'),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

const AttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.union([z.number().int().min(0).max(3), z.boolean()]),
  })).min(1),
});

// Generate quiz from a document
router.post('/documents/:id/quiz', requireAuth, quizGenLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const doc = await get<any>(
      `SELECT id, extractedText, storedPath, fileType FROM documents WHERE id = ?`,
      [id]
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const parsed = QuizRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid quiz options', details: parsed.error.flatten() });
      return;
    }

    let extractedText = (doc.extractedText || '').trim();
    let pages;
    if (!extractedText && doc.storedPath) {
      const ext = (doc.fileType || '').toLowerCase().replace('.', '');
      const extracted = await extractText(doc.storedPath, ext);
      if (extracted.extractionError) {
        res.status(422).json({
          error: extracted.extractionError.message,
          code: extracted.extractionError.code,
        });
        return;
      }
      extractedText = extracted.text;
      pages = extracted.pages;
    }

    const result = await generateQuiz(id, extractedText, pages, parsed.data);

    if ('error' in result) {
      const statusCode = result.code && isAIProviderErrorCode(result.code)
        ? result.status ?? getAIProviderHttpStatus(result.code)
        : 422;
      res.status(statusCode).json({ error: result.error, ...(result.code ? { code: result.code } : {}) });
      return;
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Get quiz (client-safe — no answers)
router.get('/quiz/:quizId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getQuizById(req.params.quizId);
    if (!result) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Submit attempt
router.post('/quiz/:quizId/attempt', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.quizId;
    const userId = req.user!.sub;

    const parsed = AttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid attempt data', details: parsed.error.flatten() });
      return;
    }

    const result = await submitAttempt(quizId, userId, parsed.data.answers);

    if ('error' in result) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get attempt history for a quiz
router.get('/quiz/:quizId/attempts', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const allAttempts = await getAttemptsByQuiz(req.params.quizId);
    // Students see only their own attempts
    const filtered = req.user!.role === 'ADMIN'
      ? allAttempts
      : allAttempts.filter((a) => a.userId === userId);
    res.json({ attempts: filtered });
  } catch (err) {
    next(err);
  }
});

export default router;
