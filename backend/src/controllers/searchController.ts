import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/documentService.js';
import * as vectorSearchService from '../services/vectorSearchService.js';

export async function searchLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    const tag = req.query.tag as string;
    const type = req.query.type as string;

    if ((!q || q.trim() === '') && !tag && !type) {
      const documents = await documentService.getAllDocuments();
      res.json({ documents, matchedChunks: [] });
      return;
    }

    const documents = await documentService.getAllDocuments(q, tag, type);

    let matchedChunks: any[] = [];
    if (q && q.trim().length > 0) {
      matchedChunks = await vectorSearchService.searchSimilarChunks(q, 10);
    }

    res.json({
      query: q || '',
      totalResults: documents.length,
      documents,
      matchedChunks,
    });
  } catch (err) {
    next(err);
  }
}
