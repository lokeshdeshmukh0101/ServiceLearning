/**
 * categoryRoutes.ts
 * CRUD endpoints for academic categories.
 */

import { Router, Request, Response } from 'express';
import { all, get, run } from '../database/db.js';

const router = Router();

// GET /api/categories — List all categories with materials count
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await all<any>(`
      SELECT c.*, 
        (SELECT COUNT(DISTINCT dt.documentId) 
         FROM tags t 
         JOIN document_tags dt ON t.id = dt.tagId 
         WHERE LOWER(t.name) = LOWER(c.name)) as count
      FROM categories c
      ORDER BY c.name ASC
    `);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// POST /api/categories — Create a category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const trimmedName = name.trim();
    const existing = await get<any>('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existing) {
      res.status(409).json({ error: 'Category with this name already exists' });
      return;
    }

    const id = `cat-${Date.now()}`;
    await run(
      'INSERT INTO categories (id, name, description, icon) VALUES (?, ?, ?, ?)',
      [id, trimmedName, description?.trim() || '', icon || '']
    );

    const created = await get<any>('SELECT *, 0 as count FROM categories WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id — Update category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await get<any>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const newName = name?.trim() || existing.name;
    const newDesc = description !== undefined ? description.trim() : existing.description;

    await run('UPDATE categories SET name = ?, description = ? WHERE id = ?', [newName, newDesc, id]);

    const updated = await get<any>(`
      SELECT c.*, 
        (SELECT COUNT(DISTINCT dt.documentId) 
         FROM tags t 
         JOIN document_tags dt ON t.id = dt.tagId 
         WHERE LOWER(t.name) = LOWER(c.name)) as count
      FROM categories c
      WHERE c.id = ?
    `, [id]);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id — Delete category (by id or name)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await get<any>(
      'SELECT id, name FROM categories WHERE id = ? OR LOWER(name) = LOWER(?)',
      [id, id]
    );
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await run('DELETE FROM categories WHERE id = ?', [existing.id]);
    res.json({ success: true, message: `Category "${existing.name}" deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

export default router;
