/**
 * feedbackService.ts
 * Handles creation and management of feedback/issue reports.
 * Screenshots stored outside /uploads, served via authorized route only.
 */

import fs from 'fs';
import path from 'path';
import crypto, { randomUUID } from 'crypto';
import { run, get, query } from '../database/db.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackCategory =
  | 'Bug'
  | 'Broken File'
  | 'Incorrect Content'
  | 'AI Summary/Quiz Issue'
  | 'Translation Issue'
  | 'Accessibility Issue'
  | 'Feature Request'
  | 'Other';

export type FeedbackStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface FeedbackReport {
  id: string;
  reportId: string; // human-readable e.g. KH-2024-0001
  title: string;
  description: string;
  category: FeedbackCategory;
  rating?: number | null;
  relatedDocumentId?: string | null;
  screenshotPath?: string | null;
  status: FeedbackStatus;
  submittedBy: string; // userId
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackInput {
  title: string;
  description: string;
  category: FeedbackCategory;
  rating?: number;
  relatedDocumentId?: string;
  screenshotPath?: string; // server-stored path, set after upload
  submittedBy: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  adminNotes?: string;
}

// ─── DB Setup ─────────────────────────────────────────────────────────────────

export async function ensureFeedbackTables(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS feedback_reports (
      id TEXT PRIMARY KEY,
      reportId TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      rating INTEGER,
      relatedDocumentId TEXT,
      screenshotPath TEXT,
      status TEXT NOT NULL DEFAULT 'Open',
      submittedBy TEXT NOT NULL,
      adminNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audit entries table for feedback status changes
  await run(`
    CREATE TABLE IF NOT EXISTS feedback_audit (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ─── Human-readable Report ID ─────────────────────────────────────────────────

async function generateReportId(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await query<any>(
    `SELECT COUNT(*) as cnt FROM feedback_reports WHERE reportId LIKE ?`,
    [`KH-${year}-%`]
  );
  const seq = ((rows[0]?.cnt || 0) + 1).toString().padStart(4, '0');
  return `KH-${year}-${seq}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createFeedback(input: CreateFeedbackInput): Promise<FeedbackReport> {
  await ensureFeedbackTables();
  const id = randomUUID();
  const reportId = await generateReportId();

  await run(
    `INSERT INTO feedback_reports (id, reportId, title, description, category, rating, relatedDocumentId, screenshotPath, submittedBy)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      reportId,
      input.title,
      input.description,
      input.category,
      input.rating ?? null,
      input.relatedDocumentId ?? null,
      input.screenshotPath ?? null,
      input.submittedBy,
    ]
  );

  await logFeedbackAudit(reportId, 'CREATED', input.submittedBy, `Report created: ${input.title}`);

  return (await getFeedbackById(id))!;
}

export async function getFeedbackById(id: string): Promise<FeedbackReport | null> {
  const row = await get<any>(`SELECT * FROM feedback_reports WHERE id = ?`, [id]);
  return row ? mapRow(row) : null;
}

export async function getFeedbackByReportId(reportId: string): Promise<FeedbackReport | null> {
  const row = await get<any>(`SELECT * FROM feedback_reports WHERE reportId = ?`, [reportId]);
  return row ? mapRow(row) : null;
}

export async function listFeedbackForUser(userId: string): Promise<FeedbackReport[]> {
  const rows = await query<any>(
    `SELECT * FROM feedback_reports WHERE submittedBy = ? ORDER BY createdAt DESC`,
    [userId]
  );
  return rows.map(mapRow);
}

export async function listAllFeedback(
  filterStatus?: FeedbackStatus,
  filterCategory?: FeedbackCategory
): Promise<FeedbackReport[]> {
  let sql = `SELECT * FROM feedback_reports WHERE 1=1`;
  const params: any[] = [];
  if (filterStatus) { sql += ` AND status = ?`; params.push(filterStatus); }
  if (filterCategory) { sql += ` AND category = ?`; params.push(filterCategory); }
  sql += ` ORDER BY createdAt DESC`;
  const rows = await query<any>(sql, params);
  return rows.map(mapRow);
}

export async function updateFeedback(
  id: string,
  updates: UpdateFeedbackInput,
  actorId: string
): Promise<FeedbackReport | null> {
  const existing = await getFeedbackById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
    await logFeedbackAudit(existing.reportId, 'STATUS_CHANGE', actorId, `Status changed to ${updates.status}`);
  }
  if (updates.adminNotes !== undefined) {
    fields.push('adminNotes = ?');
    params.push(updates.adminNotes);
    await logFeedbackAudit(existing.reportId, 'NOTE_ADDED', actorId, 'Admin note updated');
  }

  if (fields.length > 0) {
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    await run(`UPDATE feedback_reports SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  return getFeedbackById(id);
}

// ─── Screenshot storage ───────────────────────────────────────────────────────

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

export function ensureScreenshotDir(): void {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

export function getScreenshotDir(): string {
  return SCREENSHOT_DIR;
}

export async function getScreenshotPath(feedbackId: string): Promise<string | null> {
  const row = await get<any>(`SELECT screenshotPath FROM feedback_reports WHERE id = ?`, [feedbackId]);
  return row?.screenshotPath ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logFeedbackAudit(
  reportId: string,
  action: string,
  actor: string,
  detail?: string
): Promise<void> {
  try {
    await run(
      `INSERT INTO feedback_audit (id, reportId, action, actor, detail) VALUES (?,?,?,?,?)`,
      [randomUUID(), reportId, action, actor, detail ?? null]
    );
  } catch {
    // Non-critical
  }
}

function mapRow(row: any): FeedbackReport {
  return {
    id: row.id,
    reportId: row.reportId,
    title: row.title,
    description: row.description,
    category: row.category,
    rating: row.rating,
    relatedDocumentId: row.relatedDocumentId,
    screenshotPath: row.screenshotPath,
    status: row.status,
    submittedBy: row.submittedBy,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
