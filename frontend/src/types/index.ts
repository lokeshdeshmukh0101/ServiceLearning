export interface Document {
  id: string;
  filename: string;
  storedPath: string;
  fileType: string;
  fileSize: number;
  description?: string | null;
  uploadDate: string;
  status: 'processing' | 'ready' | 'failed';
  extractedText?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatus {
  totalDocuments: number;
  totalStorageBytes: number;
  pdfCount: number;
  docxCount: number;
  txtCount: number;
  aiProvider: string;
  aiConfigured: boolean;
  model: string;
}

export type UserRole = 'ADMIN' | 'VIEWER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  count?: number;
}

export interface DownloadItem {
  id: string;
  documentId: string;
  filename: string;
  category: string;
  fileType: string;
  fileSize: number;
  downloadedAt: string;
}
