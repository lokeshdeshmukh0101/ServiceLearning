/**
 * quizService.ts
 * Generates quizzes from document text, persists attempts, and scores server-side.
 * Correct answers and explanations are NEVER sent to the client before submission.
 */

import crypto, { randomUUID } from 'crypto';
import { run, get, query } from '../database/db.js';
import {
  AIProviderError,
  getAIProvider,
  mapAIProviderError,
  type AIProvider,
  type AIProviderErrorCode,
} from './aiProvider.js';
import { createChunks } from './chunkingService.js';
import type { ExtractedPage } from '../types/index.js';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizType = 'mcq' | 'true_false' | 'mixed';
export type QuizLanguage = 'en' | 'hi' | 'mr';
export type QuizQuestionCount = 5 | 10 | 15;

export interface QuizOptions {
  questionCount: QuizQuestionCount;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  language: QuizLanguage;
}

export interface MCQQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: [string, string, string, string]; // exactly 4
  topic?: string;
  sourceReference?: string;
}

export interface TFQuestion {
  id: string;
  type: 'true_false';
  question: string;
  topic?: string;
  sourceReference?: string;
}

export type ClientQuestion = MCQQuestion | TFQuestion;

export interface QuizMeta {
  quizId: string;
  documentId: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  language: QuizLanguage;
  createdAt: string;
}

export interface QuizResult {
  quiz: QuizMeta;
  questions: ClientQuestion[];
}

export interface AttemptAnswer {
  questionId: string;
  answer: number | boolean; // index for MCQ, boolean for TF
}

export interface ScoredQuestion {
  questionId: string;
  correct: boolean;
  correctAnswer: number | boolean;
  explanation: string;
  topic: string;
  sourceReference?: string;
}

export interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  scoredQuestions: ScoredQuestion[];
  topicBreakdown: TopicPerformance[];
  weakTopics: string[];
  strongTopics: string[];
  completedAt: string;
}

// ─── Zod schema for AI output validation ─────────────────────────────────────

const MCQItemSchema = z.object({
  type: z.literal('mcq'),
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
  topic: z.string().default('General Topic'),
  sourceReference: z.string().optional(),
});

const TFItemSchema = z.object({
  type: z.literal('true_false'),
  question: z.string().min(5),
  correctAnswer: z.boolean(),
  explanation: z.string().min(5),
  topic: z.string().default('General Topic'),
  sourceReference: z.string().optional(),
});

const QuizOutputSchema = z.array(z.discriminatedUnion('type', [MCQItemSchema, TFItemSchema]));

// ─── DB Init ──────────────────────────────────────────────────────────────────

export async function ensureQuizTables(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      questionCount INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      quizType TEXT NOT NULL,
      language TEXT NOT NULL,
      questionsJson TEXT NOT NULL,
      answersJson TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      userId TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      answersJson TEXT NOT NULL,
      scoredJson TEXT NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `);
}

// ─── Quiz Generation ──────────────────────────────────────────────────────────

const MIN_TEXT_FOR_QUIZ = 200;

export async function generateQuiz(
  documentId: string,
  text: string,
  pages: ExtractedPage[] | undefined,
  opts: QuizOptions,
  overrideProvider?: AIProvider
): Promise<QuizResult | { error: string; code?: AIProviderErrorCode; status?: number }> {
  await ensureQuizTables();

  if (text.trim().length < MIN_TEXT_FOR_QUIZ) {
    return { error: 'Document does not contain enough text to generate a quiz.' };
  }

  const provider = overrideProvider || getAIProvider();

  // Take a representative slice of text
  const chunks = createChunks('_quiz', text, pages);
  const contextText = chunks
    .slice(0, 6)
    .map((c) => c.chunkText)
    .join('\n\n')
    .slice(0, 6000);

  const prompt = buildQuizPrompt(contextText, opts);

  let raw: string;
  try {
    raw = await provider.generate(prompt, { maxOutputTokens: 2048, temperature: 0.4 });
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

  let rawItems: any[];
  try {
    rawItems = parseAIJson(raw);
  } catch {
    let retryRaw: string;
    try {
      retryRaw = await provider.generate(prompt, { maxOutputTokens: 2048, temperature: 0.5 });
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

    try {
      rawItems = parseAIJson(retryRaw);
    } catch {
      return {
        error: 'AI response did not match the expected quiz format. Please try again.',
        code: 'AI_MALFORMED_RESPONSE',
      };
    }
  }

  // Validate schema
  const parsed = QuizOutputSchema.safeParse(rawItems);
  if (!parsed.success) {
    return {
      error: 'AI response did not match the expected quiz format. Please try again.',
      code: 'AI_MALFORMED_RESPONSE',
    };
  }

  const items = parsed.data.slice(0, opts.questionCount);
  if (items.length === 0) {
    return { error: 'AI returned no valid quiz questions.' };
  }

  // Split into client-safe questions and server-side answers
  const clientQuestions: ClientQuestion[] = [];
  const answers: Array<{
    questionId: string;
    correctAnswer: number | boolean;
    explanation: string;
    topic: string;
    sourceReference?: string;
  }> = [];

  for (const item of items) {
    const qId = randomUUID();
    const topic = item.topic?.trim() || 'General Concept';
    const sourceReference = item.sourceReference?.trim();
    if (item.type === 'mcq') {
      clientQuestions.push({
        id: qId,
        type: 'mcq',
        question: item.question,
        options: item.options,
        topic,
        sourceReference,
      });
      answers.push({
        questionId: qId,
        correctAnswer: item.correctIndex,
        explanation: item.explanation,
        topic,
        sourceReference,
      });
    } else {
      clientQuestions.push({
        id: qId,
        type: 'true_false',
        question: item.question,
        topic,
        sourceReference,
      });
      answers.push({
        questionId: qId,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        topic,
        sourceReference,
      });
    }
  }

  const quizId = randomUUID();
  const meta: QuizMeta = {
    quizId,
    documentId,
    questionCount: clientQuestions.length,
    difficulty: opts.difficulty,
    quizType: opts.quizType,
    language: opts.language,
    createdAt: new Date().toISOString(),
  };

  await run(
    `INSERT INTO quizzes (id, documentId, questionCount, difficulty, quizType, language, questionsJson, answersJson) VALUES (?,?,?,?,?,?,?,?)`,
    [
      quizId,
      documentId,
      meta.questionCount,
      opts.difficulty,
      opts.quizType,
      opts.language,
      JSON.stringify(clientQuestions),
      JSON.stringify(answers),
    ]
  );

  return { quiz: meta, questions: clientQuestions };
}

// ─── Quiz Attempt / Scoring ───────────────────────────────────────────────────

export async function submitAttempt(
  quizId: string,
  userId: string,
  userAnswers: AttemptAnswer[]
): Promise<AttemptResult | { error: string }> {
  await ensureQuizTables();

  const quizRow = await get<any>(`SELECT * FROM quizzes WHERE id = ?`, [quizId]);
  if (!quizRow) return { error: 'Quiz not found.' };

  const serverAnswers: Array<{
    questionId: string;
    correctAnswer: number | boolean;
    explanation: string;
    topic?: string;
    sourceReference?: string;
  }> = JSON.parse(quizRow.answersJson);

  const answerMap = new Map(serverAnswers.map((a) => [a.questionId, a]));

  let score = 0;
  const scoredQuestions: ScoredQuestion[] = [];
  const topicMap = new Map<string, { total: number; correct: number }>();

  for (const ua of userAnswers) {
    const server = answerMap.get(ua.questionId);
    if (!server) continue;
    const correct = ua.answer === server.correctAnswer;
    if (correct) score++;
    const topic = server.topic || 'General Concept';
    scoredQuestions.push({
      questionId: ua.questionId,
      correct,
      correctAnswer: server.correctAnswer,
      explanation: server.explanation,
      topic,
      sourceReference: server.sourceReference,
    });

    const perf = topicMap.get(topic) || { total: 0, correct: 0 };
    perf.total += 1;
    if (correct) perf.correct += 1;
    topicMap.set(topic, perf);
  }

  const topicBreakdown: TopicPerformance[] = [];
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];

  for (const [topic, stats] of topicMap.entries()) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    topicBreakdown.push({
      topic,
      total: stats.total,
      correct: stats.correct,
      percentage: pct,
    });
    if (pct < 70) {
      weakTopics.push(topic);
    } else {
      strongTopics.push(topic);
    }
  }

  const total = serverAnswers.length;
  const attemptId = randomUUID();
  const completedAt = new Date().toISOString();

  await run(
    `INSERT INTO quiz_attempts (id, quizId, userId, score, total, answersJson, scoredJson, completedAt) VALUES (?,?,?,?,?,?,?,?)`,
    [
      attemptId,
      quizId,
      userId,
      score,
      total,
      JSON.stringify(userAnswers),
      JSON.stringify(scoredQuestions),
      completedAt,
    ]
  );

  return {
    attemptId,
    quizId,
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    scoredQuestions,
    topicBreakdown,
    weakTopics,
    strongTopics,
    completedAt,
  };
}

export async function getQuizById(quizId: string): Promise<{ quiz: QuizMeta; questions: ClientQuestion[] } | null> {
  await ensureQuizTables();
  const row = await get<any>(`SELECT * FROM quizzes WHERE id = ?`, [quizId]);
  if (!row) return null;
  const questions: ClientQuestion[] = JSON.parse(row.questionsJson);
  return {
    quiz: {
      quizId: row.id,
      documentId: row.documentId,
      questionCount: row.questionCount,
      difficulty: row.difficulty,
      quizType: row.quizType,
      language: row.language,
      createdAt: row.createdAt,
    },
    questions,
  };
}

export async function getAttemptsByQuiz(quizId: string): Promise<any[]> {
  await ensureQuizTables();
  return query<any>(`SELECT * FROM quiz_attempts WHERE quizId = ? ORDER BY completedAt DESC`, [quizId]);
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildQuizPrompt(text: string, opts: QuizOptions): string {
  const typeInstruction =
    opts.quizType === 'mcq'
      ? 'Generate only multiple-choice questions (type: "mcq").'
      : opts.quizType === 'true_false'
      ? 'Generate only true/false questions (type: "true_false").'
      : `Generate a mix: roughly half "mcq" and half "true_false" questions.`;

  const langMap: Record<QuizLanguage, string> = {
    en: 'English',
    hi: 'Hindi (use Devanagari script)',
    mr: 'Marathi (use Devanagari script)',
  };

  return `You are an educational quiz generator.
Generate exactly ${opts.questionCount} quiz questions from the document content below.
Difficulty: ${opts.difficulty}. ${typeInstruction}
Language: Write ALL questions, options, and explanations in ${langMap[opts.language]}.

STRICT RULES:
- Every question must be grounded in the provided document text.
- MCQ: exactly 4 options, exactly 1 correct answer (correctIndex = 0-3).
- Every question must have a short explanation (1-2 sentences from the document).
- Every question must include a "topic" field (2-4 words identifying the exact concept or subject tested, e.g. "Elasticity of Demand", "Routing Tables").
- Return ONLY a valid JSON array. No markdown, no code fences, no commentary.

OUTPUT FORMAT (JSON array):
[
  {"type":"mcq","question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","topic":"Concept Name"},
  {"type":"true_false","question":"...","correctAnswer":true,"explanation":"...","topic":"Concept Name"}
]

DOCUMENT CONTENT:
${text}`;
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

function parseAIJson(raw: string): any[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
  }
  // Find the first [ and last ]
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in AI response');
  return JSON.parse(cleaned.slice(start, end + 1));
}
