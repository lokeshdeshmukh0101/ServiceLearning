export interface DocumentMetadata {
  id: string;
  filename: string;
  storedPath: string;
  fileType: string;
  fileSize: number;
  description?: string | null;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'failed';
  extractedText?: string | null;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pages?: ExtractedPage[];
  error?: string;
}

export interface ChunkItem {
  id?: string;
  documentId: string;
  chunkText: string;
  pageNumber?: number | null;
  chunkIndex: number;
  embedding?: number[];
}

export interface SearchResult {
  document: DocumentMetadata;
  matchedChunks?: {
    chunkText: string;
    pageNumber?: number | null;
    score?: number;
  }[];
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
