import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import * as schema from './schema.js';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function initDatabase(): ReturnType<typeof drizzle> {
  if (dbInstance) return dbInstance;

  const userDataPath = app.getPath('userData');
  const dbDir = join(userDataPath, 'writing-app');
  const dbPath = join(dbDir, 'app.db');

  mkdirSync(dbDir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Create all tables via raw SQL to avoid migration complexity for MVP
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      embedding_model TEXT DEFAULT 'text-embedding-3-small',
      document_count INTEGER DEFAULT 0,
      storage_size INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      knowledge_base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      chunk_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      knowledge_base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      lance_row_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      writing_type TEXT NOT NULL,
      target_words INTEGER DEFAULT 2000,
      style TEXT DEFAULT 'formal',
      knowledge_base_id TEXT,
      status TEXT DEFAULT 'draft',
      plan TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES writing_projects(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER DEFAULT 0,
      change_summary TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const documentColumns = sqlite.prepare('PRAGMA table_info(documents)').all() as {
    name: string;
  }[];
  if (!documentColumns.some((column) => column.name === 'error_message')) {
    sqlite.exec('ALTER TABLE documents ADD COLUMN error_message TEXT;');
  }

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) throw new Error('Database not initialized. Call initDatabase() first.');
  return dbInstance;
}
