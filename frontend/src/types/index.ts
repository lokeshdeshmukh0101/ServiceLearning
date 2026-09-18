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
