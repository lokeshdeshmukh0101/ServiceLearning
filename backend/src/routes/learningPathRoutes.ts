/**
 * learningPathRoutes.ts
 * Express router for Smart Learning Path:
 * - GET  /api/learning-path
 * - GET  /api/learning-path/:documentId
 * - POST /api/learning-path/:documentId/progress
 * - POST /api/learning-path/:documentId/sync-quiz
 * - POST /api/learning-path/:documentId/follow-up-quiz
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getLearningPath,
  updateLearningPathStep,
  recordQuizResultToPath,
  createFollowUpQuiz,
  listAllLearningPaths,
} from '../services/learningPathService.js';

const router = Router();

const pathActionLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'Too many learning path requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// List all learning paths for the user
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const paths = await listAllLearningPaths(userId);
    res.json({ paths });
  } catch (err) {
    next(err);
  }
});

// Get learning path for a specific document
router.get('/:documentId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const documentId = req.params.documentId;
    const pathRecord = await getLearningPath(userId, documentId);
    if (!pathRecord) {
      res.status(404).json({ error: 'Document or learning path not found.' });
      return;
    }
    res.json({ path: pathRecord });
  } catch (err) {
    next(err);
  }
});

// Update progress step
const ProgressSchema = z.object({
  step: z.number().int().min(1).max(6),
});

router.post('/:documentId/progress', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const documentId = req.params.documentId;
    const parsed = ProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid step' });
      return;
    }

    const updated = await updateLearningPathStep(userId, documentId, parsed.data.step);
    res.json({ path: updated });
  } catch (err) {
    next(err);
  }
});

// Sync quiz results into learning path
const SyncQuizSchema = z.object({
  quizId: z.string().uuid(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  weakTopics: z.array(z.string()).default([]),
  strongTopics: z.array(z.string()).default([]),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

router.post('/:documentId/sync-quiz', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const documentId = req.params.documentId;
    const parsed = SyncQuizSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid sync data', details: parsed.error.flatten() });
      return;
    }

    const { quizId, score, total, weakTopics, strongTopics, language } = parsed.data;
    const updated = await recordQuizResultToPath(
      userId,
      documentId,
      quizId,
      score,
      total,
      weakTopics,
      strongTopics,
      language
    );

    res.json({ path: updated });
  } catch (err) {
    next(err);
  }
});

// Generate follow-up quiz targeting knowledge gaps
const FollowUpSchema = z.object({
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

router.post('/:documentId/follow-up-quiz', requireAuth, pathActionLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const documentId = req.params.documentId;
    const parsed = FollowUpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid quiz options' });
      return;
    }

    const result = await createFollowUpQuiz(
      userId,
      documentId,
      parsed.data.language,
      parsed.data.difficulty
    );

    if ('error' in result) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
