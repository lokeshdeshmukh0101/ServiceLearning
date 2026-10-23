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

export type StudyMode =
  | 'summary'
  | 'key_concepts'
  | 'simplified'
  | 'revision_points'
  | 'chapter_breakdown'
  | 'revision_questions';

export interface SummaryResult {
  summary: string;
  cached: boolean;
  language: string;
  length: string;
  mode: StudyMode;
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
  topic?: string;
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
  topicBreakdown?: TopicPerformance[];
  weakTopics?: string[];
  strongTopics?: string[];
  completedAt: string;
}

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
  step: number;
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

  // ─── AI Summary & Study Learning ───────────────────────────────────────────

  async generateSummary(
    documentId: string,
    language: 'en' | 'hi' | 'mr' = 'en',
    length: 'short' | 'medium' | 'long' = 'medium',
    mode: StudyMode = 'summary'
  ): Promise<SummaryResult> {
    const res = await axios.post<SummaryResult>(
      `${API_BASE_URL}/documents/${documentId}/summary`,
      { language, length, mode },
      getDevHeaders()
    );
    return res.data;
  },

  // ─── Smart Learning Path ───────────────────────────────────────────────────

  async getLearningPath(documentId: string): Promise<LearningPathRecord> {
    const res = await axios.get<{ path: LearningPathRecord }>(
      `${API_BASE_URL}/learning-path/${documentId}`,
      getDevHeaders()
    );
    return res.data.path;
  },

  async listLearningPaths(): Promise<LearningPathRecord[]> {
    const res = await axios.get<{ paths: LearningPathRecord[] }>(
      `${API_BASE_URL}/learning-path`,
      getDevHeaders()
    );
    return res.data.paths;
  },

  async updateLearningPathProgress(documentId: string, step: number): Promise<LearningPathRecord> {
    const res = await axios.post<{ path: LearningPathRecord }>(
      `${API_BASE_URL}/learning-path/${documentId}/progress`,
      { step },
      getDevHeaders()
    );
    return res.data.path;
  },

  async syncQuizToLearningPath(
    documentId: string,
    quizId: string,
    score: number,
    total: number,
    weakTopics: string[],
    strongTopics: string[],
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<LearningPathRecord> {
    const res = await axios.post<{ path: LearningPathRecord }>(
      `${API_BASE_URL}/learning-path/${documentId}/sync-quiz`,
      { quizId, score, total, weakTopics, strongTopics, language },
      getDevHeaders()
    );
    return res.data.path;
  },

  async generateFollowUpQuiz(
    documentId: string,
    language: 'en' | 'hi' | 'mr' = 'en',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<QuizGenerateResponse> {
    const res = await axios.post<QuizGenerateResponse>(
      `${API_BASE_URL}/learning-path/${documentId}/follow-up-quiz`,
      { language, difficulty },
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

  // ─── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    const res = await axios.get<Category[]>(`${API_BASE_URL}/categories`, getDevHeaders());
    return res.data;
  },

  async createCategory(name: string, description?: string, icon?: string): Promise<Category> {
    const res = await axios.post<Category>(`${API_BASE_URL}/categories`, { name, description, icon }, getDevHeaders());
    return res.data;
  },

  async updateCategory(id: string, updates: { name?: string; description?: string }): Promise<Category> {
    const res = await axios.put<Category>(`${API_BASE_URL}/categories/${id}`, updates, getDevHeaders());
    return res.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await axios.delete<{ success: boolean }>(`${API_BASE_URL}/categories/${id}`, getDevHeaders());
    return res.data;
  },

  // ─── Users & Roles ──────────────────────────────────────────────────────────

  async getUsers(): Promise<ManagedUser[]> {
    const res = await axios.get<ManagedUser[]>(`${API_BASE_URL}/users`, getDevHeaders());
    return res.data;
  },

  async createUser(data: { name: string; email: string; role?: 'ADMIN' | 'VIEWER'; department?: string; quotaMB?: number }): Promise<ManagedUser> {
    const res = await axios.post<ManagedUser>(`${API_BASE_URL}/users`, data, getDevHeaders());
    return res.data;
  },

  async updateUser(id: string, updates: Partial<ManagedUser>): Promise<ManagedUser> {
    const res = await axios.put<ManagedUser>(`${API_BASE_URL}/users/${id}`, updates, getDevHeaders());
    return res.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await axios.delete<{ success: boolean }>(`${API_BASE_URL}/users/${id}`, getDevHeaders());
    return res.data;
  },
};

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  status: 'Active' | 'Deactivated';
  department: string;
  quotaMB: number;
  usedMB: number;
}

