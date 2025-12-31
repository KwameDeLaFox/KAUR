import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

let actualDataPath = process.env.DATA_PATH || process.cwd();

// Ensure data directory exists with build-time resilience
try {
  if (!fs.existsSync(actualDataPath)) {
    fs.mkdirSync(actualDataPath, { recursive: true });
  }
} catch (e) {
  console.warn(`[Build Warning] Could not create DATA_PATH at ${actualDataPath}. Falling back to local directory for build phase.`);
  actualDataPath = process.cwd();
}

const dbPath = path.join(actualDataPath, 'ura.db');
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
