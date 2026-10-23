/**
 * userRoutes.ts
 * Endpoints for managing users, roles, account statuses, and storage quotas.
 */

import { Router, Request, Response } from 'express';
import { all, get, run } from '../database/db.js';

const router = Router();

// GET /api/users — List all managed users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await all<any>('SELECT * FROM users ORDER BY createdAt ASC');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// POST /api/users — Create or invite a user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, role, department, quotaMB } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await get<any>('SELECT id FROM users WHERE LOWER(email) = ?', [trimmedEmail]);
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const id = `u-${Date.now()}`;
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'VIEWER';
    const userQuota = Number(quotaMB) || 100;

    await run(
      'INSERT INTO users (id, name, email, role, status, department, quotaMB, usedMB) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), trimmedEmail, userRole, 'Active', department?.trim() || 'General Studies', userQuota, 0]
    );

    const created = await get<any>('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// PUT /api/users/:id — Update user role, status, quota, department
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, department, quotaMB } = req.body;

    const existing = await get<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedName = name?.trim() || existing.name;
    const updatedEmail = email?.trim().toLowerCase() || existing.email;
    const updatedRole = role === 'ADMIN' || role === 'VIEWER' ? role : existing.role;
    const updatedStatus = status === 'Active' || status === 'Deactivated' ? status : existing.status;
    const updatedDept = department !== undefined ? department.trim() : existing.department;
    const updatedQuota = quotaMB !== undefined ? Number(quotaMB) : existing.quotaMB;

    await run(
      `UPDATE users 
       SET name = ?, email = ?, role = ?, status = ?, department = ?, quotaMB = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [updatedName, updatedEmail, updatedRole, updatedStatus, updatedDept, updatedQuota, id]
    );

    const updated = await get<any>('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

// DELETE /api/users/:id — Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await get<any>('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

export default router;
