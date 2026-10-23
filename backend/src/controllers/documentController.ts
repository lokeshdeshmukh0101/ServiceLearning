import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import * as documentService from '../services/documentService.js';
import { validateFileType } from '../services/textExtractorService.js';

export async function uploadDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    const singleFile = req.file as Express.Multer.File;
    const fileList = files && files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (fileList.length === 0) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const description = req.body.description;
    const tags = req.body.tags;

    const results = [];
    for (const file of fileList) {
      // Magic byte validation
      const header = Buffer.alloc(8);
      try {
        const fd = await fs.promises.open(file.path, 'r');
        await fd.read(header, 0, 8, 0);
        await fd.close();
      } catch {
        // Clean up and skip
        try { await fs.promises.unlink(file.path); } catch {}
        res.status(400).json({ error: 'Could not read uploaded file.' });
        return;
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const validErr = validateFileType(file.path, file.originalname, header);
      if (validErr) {
        try { await fs.promises.unlink(file.path); } catch {}
        res.status(400).json({ error: validErr });
        return;
      }

      const doc = await documentService.createDocument(file, description, tags);
      results.push(doc);
    }

    res.status(201).json({
      message: `${results.length} document(s) uploaded and processed successfully.`,
      documents: results,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const queryParam = req.query.q as string | undefined;
    const tag = req.query.tag as string | undefined;
    const type = req.query.type as string | undefined;
    const documents = await documentService.getAllDocuments(queryParam, tag, type);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const document = await documentService.getDocumentById(id);
    res.json({ document });
  } catch {
    res.status(404).json({ error: 'Document not found.' });
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const { description, tags } = req.body;
    const document = await documentService.updateDocument(id, { description, tags });
    res.json({ message: 'Document updated successfully.', document });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    await documentService.deleteDocument(id);
    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const document = await documentService.getDocumentById(id);

    if (!fs.existsSync(document.storedPath)) {
      res.status(404).json({ error: 'File not found on server.' });
      return;
    }

    res.download(document.storedPath, document.filename);
  } catch {
    res.status(404).json({ error: 'Document not found.' });
  }
}
