import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'dev.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to local database dev.db');
  }
});

// Promisified query helper
export function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}
export const all = query;

// Promisified get helper
export function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

// Promisified run helper
export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function initDb(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      storedPath TEXT NOT NULL,
      fileType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      description TEXT,
      uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'processing',
      extractedText TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS document_tags (
      documentId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (documentId, tagId),
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      chunkText TEXT NOT NULL,
      pageNumber INTEGER,
      chunkIndex INTEGER NOT NULL,
      embedding TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      status TEXT NOT NULL DEFAULT 'Active',
      department TEXT,
      quotaMB INTEGER DEFAULT 100,
      usedMB INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed initial categories if none exist
  const existingCategories = await all<any>('SELECT COUNT(*) as count FROM categories');
  if (existingCategories[0]?.count === 0) {
    const defaultCategories = [
      { id: 'cat-1', name: 'Programming', description: 'Python, C++, Java & syntax guides' },
      { id: 'cat-2', name: 'Artificial Intelligence', description: 'AI foundations & neural networks' },
      { id: 'cat-3', name: 'Machine Learning', description: 'Algorithms & predictive modeling' },
      { id: 'cat-4', name: 'Excel', description: 'Data analysis & formulas' },
      { id: 'cat-5', name: 'Web Development', description: 'HTML, CSS, React & full-stack development' },
      { id: 'cat-6', name: 'Computer Networks', description: 'Protocols, TCP/IP & network architecture' },
      { id: 'cat-7', name: 'Data Structures', description: 'Arrays, Trees, Graphs & Algorithms' },
      { id: 'cat-8', name: 'Prompt Engineering', description: 'LLM techniques & instruction design' },
    ];
    for (const cat of defaultCategories) {
      await run('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [cat.id, cat.name, cat.description]);
    }
  }

  // Seed initial users if none exist
  const existingUsers = await all<any>('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0]?.count === 0) {
    const defaultUsers = [
      { id: 'u-1', name: 'Lokesh', email: 'lokesh.admin@knowledgehub.edu', role: 'ADMIN', status: 'Active', department: 'Computer Science & Service Learning', quotaMB: 500, usedMB: 212 },
      { id: 'u-2', name: 'Om', email: 'om.student@knowledgehub.edu', role: 'VIEWER', status: 'Active', department: 'Software Engineering', quotaMB: 100, usedMB: 64 },
      { id: 'u-3', name: 'Vedant', email: 'vedant.student@knowledgehub.edu', role: 'VIEWER', status: 'Active', department: 'Computer Science', quotaMB: 100, usedMB: 31 },
      { id: 'u-4', name: 'Omkar', email: 'omkar.student@knowledgehub.edu', role: 'VIEWER', status: 'Active', department: 'Data Science', quotaMB: 150, usedMB: 98 },
      { id: 'u-5', name: 'Aarav', email: 'aarav.student@knowledgehub.edu', role: 'VIEWER', status: 'Active', department: 'Information Technology', quotaMB: 100, usedMB: 7 },
      { id: 'u-6', name: 'Priya', email: 'priya.student@knowledgehub.edu', role: 'VIEWER', status: 'Deactivated', department: 'Artificial Intelligence', quotaMB: 100, usedMB: 55 },
    ];
    for (const u of defaultUsers) {
      await run(
        'INSERT INTO users (id, name, email, role, status, department, quotaMB, usedMB) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, u.role, u.status, u.department, u.quotaMB, u.usedMB]
      );
    }
  }
}
