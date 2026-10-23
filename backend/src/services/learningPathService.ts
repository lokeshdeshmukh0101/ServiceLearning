/**
 * learningPathService.ts
 * Core engine for ServiceLearning's Smart Learning Path signature USP:
 * Upload document → Understand → Practice → Identify knowledge gaps → Revise → Improve.
 *
 * Persists user learning paths, identifies weak topics, synthesizes grounded
 * revision guidance from extracted text, and generates targeted follow-up quizzes.
 */

import { randomUUID } from 'crypto';
import { run, get, query } from '../database/db.js';
import { searchSimilarChunks } from './vectorSearchService.js';
import { generateQuiz, QuizResult, QuizDifficulty, QuizLanguage } from './quizService.js';
import { getAIProvider, type AIProvider } from './aiProvider.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface RevisionRecommendation {
  topic: string;
  advice: string;
  excerpt: string;
  pageReference?: number | null;
}

export interface LearningPathRecord {
  id: string;
  userId: string;
  documentId: string;
  documentTitle: string;
  fileType: string;
  step: number; // 1: Document, 2: Understand, 3: Practice, 4: Gaps, 5: Revise, 6: Improve
  lastQuizId: string | null;
  lastScore: number | null;
  lastTotal: number | null;
  lastPercentage: number | null;
  previousPercentage: number | null;
  weakTopics: string[];
  strongTopics: string[];
  revisions: RevisionRecommendation[];
  followUpQuizId: string | null;
  updatedAt: string;
  createdAt: string;
}

// ─── DB Initialization ────────────────────────────────────────────────────────

export async function ensureLearningPathTables(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      documentId TEXT NOT NULL,
      step INTEGER NOT NULL DEFAULT 1,
      lastQuizId TEXT,
      lastScore INTEGER,
      lastTotal INTEGER,
      lastPercentage INTEGER,
      previousPercentage INTEGER,
      weakTopicsJson TEXT,
      strongTopicsJson TEXT,
      revisionsJson TEXT,
      followUpQuizId TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, documentId),
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);
}

// ─── Learning Path Management ─────────────────────────────────────────────────

export async function getLearningPath(
  userId: string,
  documentId: string
): Promise<LearningPathRecord | null> {
  await ensureLearningPathTables();

  const doc = await get<any>(`SELECT id, filename, fileType FROM documents WHERE id = ?`, [documentId]);
  if (!doc) return null;

  const row = await get<any>(
    `SELECT * FROM learning_paths WHERE userId = ? AND documentId = ?`,
    [userId, documentId]
  );

  if (!row) {
    // Return initial path record
    return {
      id: `${userId}-${documentId}`,
      userId,
      documentId,
      documentTitle: doc.filename,
      fileType: doc.fileType,
      step: 1,
      lastQuizId: null,
      lastScore: null,
      lastTotal: null,
      lastPercentage: null,
      previousPercentage: null,
      weakTopics: [],
      strongTopics: [],
      revisions: [],
      followUpQuizId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: row.id,
    userId: row.userId,
    documentId: row.documentId,
    documentTitle: doc.filename,
    fileType: doc.fileType,
    step: row.step,
    lastQuizId: row.lastQuizId,
    lastScore: row.lastScore,
    lastTotal: row.lastTotal,
    lastPercentage: row.lastPercentage,
    previousPercentage: row.previousPercentage,
    weakTopics: row.weakTopicsJson ? JSON.parse(row.weakTopicsJson) : [],
    strongTopics: row.strongTopicsJson ? JSON.parse(row.strongTopicsJson) : [],
    revisions: row.revisionsJson ? JSON.parse(row.revisionsJson) : [],
    followUpQuizId: row.followUpQuizId,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

export async function updateLearningPathStep(
  userId: string,
  documentId: string,
  step: number
): Promise<LearningPathRecord | null> {
  await ensureLearningPathTables();

  const current = await getLearningPath(userId, documentId);
  if (!current) return null;

  const newStep = Math.max(current.step, Math.min(step, 6));

  await run(
    `INSERT INTO learning_paths (id, userId, documentId, step, updatedAt)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(userId, documentId) DO UPDATE SET
       step = ?,
       updatedAt = CURRENT_TIMESTAMP`,
    [`${userId}-${documentId}`, userId, documentId, newStep, newStep]
  );

  return getLearningPath(userId, documentId);
}

export async function recordQuizResultToPath(
  userId: string,
  documentId: string,
  quizId: string,
  score: number,
  total: number,
  weakTopics: string[],
  strongTopics: string[],
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<LearningPathRecord | null> {
  await ensureLearningPathTables();

  const current = await getLearningPath(userId, documentId);
  const previousPct = current?.lastPercentage ?? null;
  const currentPct = total > 0 ? Math.round((score / total) * 100) : 0;

  // Synthesize grounded revisions for weak topics
  const revisions = await generateGroundedRevisions(documentId, weakTopics, language);

  await run(
    `INSERT INTO learning_paths (
       id, userId, documentId, step, lastQuizId, lastScore, lastTotal,
       lastPercentage, previousPercentage, weakTopicsJson, strongTopicsJson, revisionsJson, updatedAt
     )
     VALUES (?, ?, ?, 4, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(userId, documentId) DO UPDATE SET
       step = 4,
       lastQuizId = ?,
       lastScore = ?,
       lastTotal = ?,
       previousPercentage = CASE WHEN lastPercentage IS NOT NULL THEN lastPercentage ELSE previousPercentage END,
       lastPercentage = ?,
       weakTopicsJson = ?,
       strongTopicsJson = ?,
       revisionsJson = ?,
       updatedAt = CURRENT_TIMESTAMP`,
    [
      `${userId}-${documentId}`,
      userId,
      documentId,
      quizId,
      score,
      total,
      currentPct,
      previousPct,
      JSON.stringify(weakTopics),
      JSON.stringify(strongTopics),
      JSON.stringify(revisions),
      // update bindings
      quizId,
      score,
      total,
      currentPct,
      JSON.stringify(weakTopics),
      JSON.stringify(strongTopics),
      JSON.stringify(revisions),
    ]
  );

  return getLearningPath(userId, documentId);
}

// ─── Grounded Revisions Generator ─────────────────────────────────────────────

export async function generateGroundedRevisions(
  documentId: string,
  weakTopics: string[],
  language: 'en' | 'hi' | 'mr' = 'en',
  overrideProvider?: AIProvider
): Promise<RevisionRecommendation[]> {
  if (weakTopics.length === 0) return [];

  const recommendations: RevisionRecommendation[] = [];
  const provider = overrideProvider || getAIProvider();

  for (const topic of weakTopics.slice(0, 4)) {
    // Find closest document passages for this weak topic
    const searchMatches = await searchSimilarChunks(topic, 2, documentId);
    let excerpt = '';
    let pageRef: number | null = null;

    if (searchMatches.length > 0) {
      excerpt = searchMatches[0].chunkText.slice(0, 300);
      pageRef = searchMatches[0].pageNumber;
    } else {
      const doc = await get<any>(`SELECT extractedText FROM documents WHERE id = ?`, [documentId]);
      excerpt = (doc?.extractedText || '').slice(0, 300);
    }

    const langName = language === 'hi' ? 'Hindi (हिन्दी)' : language === 'mr' ? 'Marathi (मराठी)' : 'English';
    const advicePrompt = `You are an academic coach helping a student who missed quiz questions on "${topic}".
Based strictly on this document excerpt:
"""
${excerpt}
"""
Provide concise, targeted revision advice in 2-3 sentences. Explain the common confusion and clarify the concept clearly in ${langName}. Do not add external facts.`;

    let advice = `Re-read the section on ${topic} to reinforce fundamental principles.`;
    try {
      advice = await provider.generate(advicePrompt, { maxOutputTokens: 256, temperature: 0.3 });
    } catch {
      // Use fallback advice
    }

    recommendations.push({
      topic,
      advice: advice.trim(),
      excerpt: excerpt.trim(),
      pageReference: pageRef,
    });
  }

  return recommendations;
}

// ─── Targeted Follow-up Quiz ──────────────────────────────────────────────────

export async function createFollowUpQuiz(
  userId: string,
  documentId: string,
  language: QuizLanguage = 'en',
  difficulty: QuizDifficulty = 'medium',
  overrideProvider?: AIProvider
): Promise<QuizResult | { error: string }> {
  await ensureLearningPathTables();

  const pathRecord = await getLearningPath(userId, documentId);
  const weakTopics = pathRecord?.weakTopics || [];

  const doc = await get<any>(`SELECT extractedText FROM documents WHERE id = ?`, [documentId]);
  if (!doc || !doc.extractedText) {
    return { error: 'Document content is not available for follow-up quiz.' };
  }

  // Find relevant text focused on the weak topics
  let focusedContext = '';
  if (weakTopics.length > 0) {
    const chunkResults = await Promise.all(
      weakTopics.map((topic) => searchSimilarChunks(topic, 2, documentId))
    );
    const combined = chunkResults.flat().map((c) => c.chunkText).join('\n\n');
    focusedContext = combined.slice(0, 4000);
  }

  if (!focusedContext.trim()) {
    focusedContext = doc.extractedText.slice(0, 4000);
  }

  const quizResult = await generateQuiz(
    documentId,
    focusedContext,
    undefined,
    {
      questionCount: 5,
      difficulty,
      quizType: 'mcq',
      language,
    },
    overrideProvider
  );

  if ('quiz' in quizResult) {
    // Record followUpQuizId and advance step to 6 (Improve)
    await run(
      `UPDATE learning_paths SET followUpQuizId = ?, step = 6, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND documentId = ?`,
      [quizResult.quiz.quizId, userId, documentId]
    );
  }

  return quizResult;
}

// ─── All User Learning Paths ──────────────────────────────────────────────────

export async function listAllLearningPaths(userId: string): Promise<LearningPathRecord[]> {
  await ensureLearningPathTables();

  const rows = await query<any>(
    `SELECT lp.*, d.filename as documentTitle, d.fileType
     FROM learning_paths lp
     JOIN documents d ON lp.documentId = d.id
     WHERE lp.userId = ?
     ORDER BY lp.updatedAt DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    documentId: row.documentId,
    documentTitle: row.documentTitle,
    fileType: row.fileType,
    step: row.step,
    lastQuizId: row.lastQuizId,
    lastScore: row.lastScore,
    lastTotal: row.lastTotal,
    lastPercentage: row.lastPercentage,
    previousPercentage: row.previousPercentage,
    weakTopics: row.weakTopicsJson ? JSON.parse(row.weakTopicsJson) : [],
    strongTopics: row.strongTopicsJson ? JSON.parse(row.strongTopicsJson) : [],
    revisions: row.revisionsJson ? JSON.parse(row.revisionsJson) : [],
    followUpQuizId: row.followUpQuizId,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  }));
}
