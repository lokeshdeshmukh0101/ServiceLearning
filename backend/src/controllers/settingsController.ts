import { Request, Response, NextFunction } from 'express';
import { getLibraryStats } from '../services/documentService.js';

export async function getSettingsStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getLibraryStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
