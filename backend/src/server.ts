/**
 * server.ts
 * Main entry point for KnowledgeHub Backend.
 */

import './config/bootstrapEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Route imports
import documentRoutes from './routes/documentRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import learningPathRoutes from './routes/learningPathRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { initDb } from './database/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Rate Limit ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── Middleware Setup ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded files as static content (documents only — screenshots are served via authorized route)
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/documents', documentRoutes);
app.use('/api/documents', summaryRoutes);
app.use('/api', quizRoutes);            // /api/documents/:id/quiz, /api/quiz/:id
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'KnowledgeHub backend is running.' });
});

// Global error handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`--------------------------------------------------`);
        console.log(` KnowledgeHub Backend running at http://localhost:${PORT}`);
        console.log(` Health check: http://localhost:${PORT}/api/health`);
        console.log(`--------------------------------------------------`);
      });
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

export default app;
