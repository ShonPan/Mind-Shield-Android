import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DATABASE_NAME = 'mindshield.db';

let databaseInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  databaseInstance = await SQLite.openDatabase({
    name: DATABASE_NAME,
    location: 'default',
  });

  return databaseInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS call_records (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      phone_number TEXT,
      duration_sec INTEGER,
      transcript TEXT,
      transcription_status TEXT NOT NULL DEFAULT 'pending',
      risk_score INTEGER,
      risk_level TEXT,
      scam_categories TEXT,
      scam_tactics TEXT,
      analysis_summary TEXT,
      user_dismissed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Flagged scam numbers database
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS flagged_numbers (
      phone_number TEXT PRIMARY KEY,
      times_flagged INTEGER NOT NULL DEFAULT 1,
      highest_risk_score INTEGER NOT NULL,
      categories TEXT,
      first_flagged_at TEXT NOT NULL,
      last_flagged_at TEXT NOT NULL
    );
  `);
}
