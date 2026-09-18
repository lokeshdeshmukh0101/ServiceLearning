import axios from 'axios';
import type { Document, SystemStatus } from '../types';

const API_BASE_URL = '/api';

export const api = {
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
    const res = await axios.put<{ document: Document }>(`${API_BASE_URL}/documents/${id}`, {
      description,
      tags,
    });
    return res.data.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${id}`);
  },

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  async getSettings(): Promise<SystemStatus> {
    const res = await axios.get<SystemStatus>(`${API_BASE_URL}/settings`);
    return res.data;
  },
};
