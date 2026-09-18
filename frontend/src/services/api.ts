import axios from 'axios';
import type { Document, SystemStatus } from '../types';

const API_BASE_URL = '/api';

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

// Service module managing REST API communications with the Express backend server.
export const api = {
  // Fetch learning materials from the Express API with optional search, tag, or format filters.
  async getDocuments(query?: string, tag?: string, type?: string): Promise<Document[]> {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (tag) params.tag = tag;
    if (type) params.type = type;

    const res = await axios.get<{ documents: Document[] }>(`${API_BASE_URL}/documents`, { params });
    return res.data.documents;
  },

  // Retrieve single document details by unique ID.
  async getDocumentById(id: string): Promise<Document> {
    const res = await axios.get<{ document: Document }>(`${API_BASE_URL}/documents/${id}`);
    return res.data.document;
  },

  // Upload document files to backend with description and tags using Multipart FormData.
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

  // Update description and tag array for an existing document.
  async updateDocument(id: string, description?: string, tags?: string[]): Promise<Document> {
    const res = await axios.put<{ document: Document }>(`${API_BASE_URL}/documents/${id}`, {
      description,
      tags,
    });
    return res.data.document;
  },

  // Delete document record and associated physical file storage.
  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${id}`);
  },

  // Generate direct URL path for file download.
  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  // Fetch system health check and database storage metrics.
  async getSettings(): Promise<SystemStatus> {
    const res = await axios.get<SystemStatus>(`${API_BASE_URL}/settings`);
    return res.data;
  },

  // Execute full-text vector and keyword search across all stored document chunks.
  async searchLibrary(query: string, tag?: string, type?: string): Promise<SearchResponse> {
    const params: Record<string, string> = { q: query };
    if (tag) params.tag = tag;
    if (type) params.type = type;
    const res = await axios.get<SearchResponse>(`${API_BASE_URL}/search`, { params });
    return res.data;
  },
};
