/**
 * feedbackRoutes.ts
 * POST /api/feedback — Submit a report (student or admin)
 * GET  /api/feedback — List own reports (student) or all (admin)
 * GET  /api/feedback/:id — Get single report (own or admin)
 * PATCH /api/feedback/:id — Update status/notes (admin only)
 * GET  /api/feedback/:id/screenshot — Serve screenshot (authorized)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import {
  createFeedback,
  getFeedbackById,
  listFeedbackForUser,
  listAllFeedback,
  updateFeedback,
  ensureScreenshotDir,
  getScreenshotDir,
  getScreenshotPath,
  type FeedbackCategory,
  type FeedbackStatus,
} from '../services/feedbackService.js';

const router = Router();

// Rate limit: 10 feedback submissions per hour
const feedbackLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many feedback submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Screenshot upload — stored in screenshots/ (not public /uploads)
ensureScreenshotDir();

const ALLOWED_SCREENSHOT_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SCREENSHOT_MAGIC: Record<string, number[]> = {
  '.png': [0x89, 0x50, 0x4e, 0x47],
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff],
  '.webp': [0x52, 0x49, 0x46, 0x46],
};
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024; // 2 MB

const screenshotStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getScreenshotDir()),
  filename: (_req, _file, cb) => {
    const name = `ss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.bin`;
    cb(null, name);
  },
});

const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: MAX_SCREENSHOT_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_SCREENSHOT_EXTS.has(ext)) {
      cb(new Error('Screenshot must be PNG, JPEG, or WebP.'));
    } else {
      cb(null, true);
    }
  },
});

// ─── Validation schemas ────────────────────────────────────────────────────────

const CATEGORIES: FeedbackCategory[] = [
  'Bug', 'Broken File', 'Incorrect Content', 'AI Summary/Quiz Issue',
  'Translation Issue', 'Accessibility Issue', 'Feature Request', 'Other',
];
const STATUSES: FeedbackStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

const CreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(CATEGORIES as [FeedbackCategory, ...FeedbackCategory[]]),
  rating: z.number().int().min(1).max(5).optional(),
  relatedDocumentId: z.string().uuid().optional(),
});

const UpdateSchema = z.object({
  status: z.enum(STATUSES as [FeedbackStatus, ...FeedbackStatus[]]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Submit feedback (optional screenshot in same request)
router.post(
  '/',
  requireAuth,
  feedbackLimit,
  screenshotUpload.single('screenshot'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateSchema.safeParse(
        typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body
      );
      if (!parsed.success) {
        // Remove uploaded screenshot if validation fails
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Invalid feedback data', details: parsed.error.flatten() });
        return;
      }

      // Validate screenshot magic bytes
      let screenshotPath: string | undefined;
      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const magic = SCREENSHOT_MAGIC[ext];
        if (magic) {
          const buf = Buffer.alloc(magic.length);
          const fd = await fs.promises.open(req.file.path, 'r');
          await fd.read(buf, 0, magic.length, 0);
          await fd.close();
          const valid = magic.every((b, i) => buf[i] === b);
          if (!valid) {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ error: 'Screenshot file failed magic byte validation.' });
            return;
          }
        }
        screenshotPath = req.file.path;
      }

      const report = await createFeedback({
        ...parsed.data,
        submittedBy: req.user!.sub,
        screenshotPath,
      });

      res.status(201).json({
        report: sanitizeForClient(report, req.user!.role),
        message: 'Issue reported successfully!'
      });
    } catch (err) {
      next(err);
    }
  }
);

// List reports
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let reports;
    if (req.user!.role === 'ADMIN') {
      const status = req.query.status as FeedbackStatus | undefined;
      const category = req.query.category as FeedbackCategory | undefined;
      reports = await listAllFeedback(status, category);
    } else {
      reports = await listFeedbackForUser(req.user!.sub);
    }
    res.json({ reports: reports.map((r) => sanitizeForClient(r, req.user!.role)) });
  } catch (err) {
    next(err);
  }
});

// Get single report
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getFeedbackById(req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    // Students can only see their own
    if (req.user!.role !== 'ADMIN' && report.submittedBy !== req.user!.sub) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.json({ report: sanitizeForClient(report, req.user!.role) });
  } catch (err) {
    next(err);
  }
});

// Update status / notes (admin only)
router.patch('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid update data', details: parsed.error.flatten() });
      return;
    }
    const updated = await updateFeedback(req.params.id, parsed.data, req.user!.sub);
    if (!updated) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    res.json({ report: sanitizeForClient(updated, 'ADMIN') });
  } catch (err) {
    next(err);
  }
});

// Serve screenshot (authorized — no public access)
router.get('/:id/screenshot', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getFeedbackById(req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    // Students can only access their own report screenshot
    if (req.user!.role !== 'ADMIN' && report.submittedBy !== req.user!.sub) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    const ssPath = report.screenshotPath;
    if (!ssPath || !fs.existsSync(ssPath)) {
      res.status(404).json({ error: 'No screenshot attached.' });
      return;
    }
    // Detect content type from original extension stored in DB path
    const ext = path.extname(ssPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.webp': 'image/webp', '.bin': 'image/png', // fallback
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.sendFile(path.resolve(ssPath));
  } catch (err) {
    next(err);
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function sanitizeForClient(report: any, role: string): any {
  const out = { ...report };
  // Never send the raw filesystem path to clients
  out.hasScreenshot = Boolean(out.screenshotPath);
  delete out.screenshotPath;
  return out;
}

export default router;
