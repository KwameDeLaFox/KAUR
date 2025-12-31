import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_PATH = process.env.DATA_PATH || process.cwd();
const dbPath = path.join(DATA_PATH, 'ura.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Init schema
// We run this synchronously on imported (singleton)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    is_generated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

// Migration: Add is_generated column if it doesn't exist
try {
  db.exec(`ALTER TABLE files ADD COLUMN is_generated INTEGER DEFAULT 0;`);
} catch (e) {
  // Column already exists, ignore error
}


export default db;
