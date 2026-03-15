import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function initDatabase(): void {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'visits.db');
  fs.mkdirSync(userDataPath, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Integrity check
  const integrity = db.pragma('integrity_check');
  if (integrity[0]?.integrity_check !== 'ok') {
    const backupPath = dbPath + '.corrupt.' + Date.now();
    db.close();
    fs.renameSync(dbPath, backupPath);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id            TEXT PRIMARY KEY,
      patient_label TEXT,
      is_draft      INTEGER DEFAULT 0,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      height_feet   INTEGER,
      height_inches REAL,
      weight_lbs    REAL,
      bmi           REAL,
      responses     TEXT NOT NULL DEFAULT '[]',
      assessment    TEXT,
      elapsed_time  INTEGER,
      notes         TEXT,
      current_question_index INTEGER DEFAULT 0
    )
  `);
}

export function getDatabase(): Database.Database {
  return db;
}

export function closeDatabase(): void {
  if (db) db.close();
}
