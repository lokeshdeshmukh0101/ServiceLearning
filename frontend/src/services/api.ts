import axios from 'axios';
import type { Document, SystemStatus } from '../types';

const API_BASE_URL = '/api';

// ─── Dev header helper (sends role header for dev-bypass auth) ───────────────
function getDevHeaders() {
  const role = (localStorage.getItem('kh_user_role') || 'VIEWER') as string;
  const profile = localStorage.getItem('kh_user_profile');
  let userId = role === 'ADMIN' ? 'admin-lokesh' : 'viewer-om';
  if (profile) { try { userId = JSON.parse(profile).id || userId; } catch {} }
  return { headers: { 'X-Dev-Role': role, 'X-Dev-User': userId } };
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface SearchResponse {
  query: string;
  totalResults: number;
  documents: Document[];
  matchedChunks: Array<{
    chunkText: string;
    pageNumber: number | null;
    chunkIndex: number;
    score: number;
    documentId: string;
    documentName: string;
  }>;
}

export interface SummaryResult {
  summary: string;
  cached: boolean;
  language: string;
  length: string;
  model: string;
  generatedAt: string;
}

export interface QuizOptions {
  questionCount: 5 | 10 | 15;
  difficulty: 'easy' | 'medium' | 'hard';
  quizType: 'mcq' | 'true_false' | 'mixed';
  language: 'en' | 'hi' | 'mr';
}

export interface MCQQuestion {
  id: string;
  type: 'mcq';
  question: string;
  options: [string, string, string, string];
}

export interface TFQuestion {
  id: string;
  type: 'true_false';
  question: string;
}

export type ClientQuestion = MCQQuestion | TFQuestion;

export interface QuizMeta {
  quizId: string;
  documentId: string;
  questionCount: number;
  difficulty: string;
  quizType: string;
  language: string;
  createdAt: string;
}

export interface QuizGenerateResponse {
  quiz: QuizMeta;
  questions: ClientQuestion[];
}

export interface AttemptAnswer {
  questionId: string;
  answer: number | boolean;
}

export interface ScoredQuestion {
  questionId: string;
  correct: boolean;
  correctAnswer: number | boolean;
  explanation: string;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  scoredQuestions: ScoredQuestion[];
  completedAt: string;
}

export interface FeedbackInput {
  title: string;
  description: string;
  category: string;
  rating?: number;
  relatedDocumentId?: string;
}

// ─── API Service ──────────────────────────────────────────────────────────────

export const api = {
  // ─── Documents ──────────────────────────────────────────────────────────────

  async getDocuments(query?: string, tag?: string, type?: string): Promise<Document[]> {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (tag) params.tag = tag;
    if (type) params.type = type;
    const res = await axios.get<{ documents: Document[] }>(`${API_BASE_URL}/documents`, { params });
    return res.data.documents;
  },

  async getDocumentById(id: string): Promise<Document> {
    const res = await axios.get<{ document: Document }>(`${API_BASE_URL}/documents/${id}`);
    return res.data.document;
  },

  async uploadDocuments(files: File[], description?: string, tags?: string[]): Promise<Document[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (description) formData.append('description', description);
    if (tags && tags.length > 0) formData.append('tags', tags.join(','));
    const res = await axios.post<{ documents: Document[] }>(`${API_BASE_URL}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.documents;
  },

  async updateDocument(id: string, description?: string, tags?: string[]): Promise<Document> {
    const res = await axios.put<{ document: Document }>(`${API_BASE_URL}/documents/${id}`, { description, tags });
    return res.data.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${id}`);
  },

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  // ─── Settings / Search ──────────────────────────────────────────────────────

  async getSettings(): Promise<SystemStatus> {
    const res = await axios.get<SystemStatus>(`${API_BASE_URL}/settings`);
    return res.data;
  },

  async searchLibrary(query: string, tag?: string, type?: string): Promise<SearchResponse> {
    const params: Record<string, string> = { q: query };
    if (tag) params.tag = tag;
    if (type) params.type = type;
    const res = await axios.get<SearchResponse>(`${API_BASE_URL}/search`, { params });
    return res.data;
  },

  // ─── AI Summary ─────────────────────────────────────────────────────────────

  async generateSummary(
    documentId: string,
    language: 'en' | 'hi' | 'mr' = 'en',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<SummaryResult> {
    const res = await axios.post<SummaryResult>(
      `${API_BASE_URL}/documents/${documentId}/summary`,
      { language, length },
      getDevHeaders()
    );
    return res.data;
  },

  // ─── Quiz ────────────────────────────────────────────────────────────────────

  async generateQuiz(documentId: string, opts: QuizOptions): Promise<QuizGenerateResponse> {
    const res = await axios.post<QuizGenerateResponse>(
      `${API_BASE_URL}/documents/${documentId}/quiz`,
      opts,
      getDevHeaders()
    );
    return res.data;
  },

  async getQuiz(quizId: string): Promise<QuizGenerateResponse> {
    const res = await axios.get<QuizGenerateResponse>(`${API_BASE_URL}/quiz/${quizId}`, getDevHeaders());
    return res.data;
  },

  async submitQuizAttempt(quizId: string, answers: AttemptAnswer[]): Promise<AttemptResult> {
    const res = await axios.post<AttemptResult>(
      `${API_BASE_URL}/quiz/${quizId}/attempt`,
      { answers },
      getDevHeaders()
    );
    return res.data;
  },

  async getQuizAttempts(quizId: string): Promise<{ attempts: any[] }> {
    const res = await axios.get(`${API_BASE_URL}/quiz/${quizId}/attempts`, getDevHeaders());
    return res.data;
  },

  // ─── Feedback ────────────────────────────────────────────────────────────────

  async submitFeedback(data: FeedbackInput, screenshot?: File): Promise<{ report: any }> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (screenshot) formData.append('screenshot', screenshot);
    const headers = { ...getDevHeaders().headers, 'Content-Type': 'multipart/form-data' };
    const res = await axios.post(`${API_BASE_URL}/feedback`, formData, { headers });
    return res.data;
  },

  async listFeedback(status?: string, category?: string): Promise<{ reports: any[] }> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (category) params.category = category;
    const res = await axios.get(`${API_BASE_URL}/feedback`, { ...getDevHeaders(), params });
    return res.data;
  },

  async updateFeedback(id: string, updates: { status?: string; adminNotes?: string }): Promise<{ report: any }> {
    const res = await axios.patch(`${API_BASE_URL}/feedback/${id}`, updates, getDevHeaders());
    return res.data;
  },

  getScreenshotUrl(feedbackId: string): string {
    return `${API_BASE_URL}/feedback/${feedbackId}/screenshot`;
  },
};
