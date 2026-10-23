/**
 * uploadMiddleware.ts
 * Multer configuration for document uploads.
 * - Extension allowlist
 * - Server-generated filenames (no user-supplied paths)
 * - 50 MB max
 * Magic byte validation is done post-upload in the controller.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, _file, cb) => {
    // Server-generated filename — user-supplied name is NOT used in the path
    const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${id}`);
  },
});

// Strict allowlist — extension only at this stage; magic bytes checked in controller
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
const LEGACY_EXTENSIONS = new Set(['.doc', '.ppt', '.pptx']);

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (LEGACY_EXTENSIONS.has(ext)) {
    cb(new Error(`Format ${ext} is not supported. Please convert to DOCX or PDF.`));
    return;
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error('Unsupported file type. Accepted: PDF, DOCX, TXT, MD.'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 10,
  },
});

export { uploadsDir };
