import { getDatabase } from './database';
import {
  CallRecord,
  RiskLevel,
  TranscriptionStatus,
} from '../types/CallRecord';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToCallRecord(row: Record<string, unknown>): CallRecord {
  return {
    id: row.id as string,
    file_path: row.file_path as string,
    file_name: row.file_name as string,
    detected_at: row.detected_at as string,
    phone_number: (row.phone_number as string) ?? null,
    duration_sec: row.duration_sec != null ? Number(row.duration_sec) : null,
    transcript: (row.transcript as string) ?? null,
    transcription_status: row.transcription_status as TranscriptionStatus,
    risk_score: row.risk_score != null ? Number(row.risk_score) : null,
    risk_level: (row.risk_level as RiskLevel) ?? null,
    scam_categories: row.scam_categories
      ? (JSON.parse(row.scam_categories as string) as string[])
      : null,
    scam_tactics: row.scam_tactics
      ? (JSON.parse(row.scam_tactics as string) as string[])
      : null,
    analysis_summary: (row.analysis_summary as string) ?? null,
    user_dismissed: row.user_dismissed === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function extractRows(results: [{ rows: { length: number; item: (i: number) => Record<string, unknown> } }]): Record<string, unknown>[] {
  const resultSet = results[0];
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < resultSet.rows.length; i++) {
    rows.push(resultSet.rows.item(i));
  }
  return rows;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function getAllCallRecords(): Promise<CallRecord[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM call_records ORDER BY detected_at DESC;',
  );
  return extractRows(results).map(rowToCallRecord);
}

export async function getCallRecordById(
  id: string,
): Promise<CallRecord | null> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM call_records WHERE id = ? LIMIT 1;',
    [id],
  );
  const rows = extractRows(results);
  return rows.length > 0 ? rowToCallRecord(rows[0]) : null;
}

export async function getCallRecordByFilePath(
  filePath: string,
): Promise<CallRecord | null> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM call_records WHERE file_path = ? LIMIT 1;',
    [filePath],
  );
  const rows = extractRows(results);
  return rows.length > 0 ? rowToCallRecord(rows[0]) : null;
}

export async function insertCallRecord(
  record: Omit<CallRecord, 'created_at' | 'updated_at'>,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.executeSql(
    `INSERT INTO call_records (
      id,
      file_path,
      file_name,
      detected_at,
      phone_number,
      duration_sec,
      transcript,
      transcription_status,
      risk_score,
      risk_level,
      scam_categories,
      scam_tactics,
      analysis_summary,
      user_dismissed,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.file_path,
      record.file_name,
      record.detected_at,
      record.phone_number ?? null,
      record.duration_sec ?? null,
      record.transcript ?? null,
      record.transcription_status,
      record.risk_score ?? null,
      record.risk_level ?? null,
      record.scam_categories ? JSON.stringify(record.scam_categories) : null,
      record.scam_tactics ? JSON.stringify(record.scam_tactics) : null,
      record.analysis_summary ?? null,
      record.user_dismissed ? 1 : 0,
      now,
      now,
    ],
  );
}

export async function updateTranscription(
  id: string,
  transcript: string,
  status: TranscriptionStatus,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.executeSql(
    `UPDATE call_records
        SET transcript = ?,
            transcription_status = ?,
            updated_at = ?
      WHERE id = ?;`,
    [transcript, status, now, id],
  );
}

export async function updateAnalysis(
  id: string,
  riskScore: number,
  riskLevel: RiskLevel,
  categories: string[],
  tactics: string[],
  summary: string,
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.executeSql(
    `UPDATE call_records
        SET risk_score = ?,
            risk_level = ?,
            scam_categories = ?,
            scam_tactics = ?,
            analysis_summary = ?,
            updated_at = ?
      WHERE id = ?;`,
    [
      riskScore,
      riskLevel,
      JSON.stringify(categories),
      JSON.stringify(tactics),
      summary,
      now,
      id,
    ],
  );
}

export async function dismissCall(id: string): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.executeSql(
    `UPDATE call_records
        SET user_dismissed = 1,
            updated_at = ?
      WHERE id = ?;`,
    [now, id],
  );
}

export async function getUndismissedHighRiskCalls(): Promise<CallRecord[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    `SELECT * FROM call_records
      WHERE risk_level = 'red'
        AND user_dismissed = 0
      ORDER BY detected_at DESC;`,
  );
  return extractRows(results).map(rowToCallRecord);
}

export async function getPendingCalls(): Promise<CallRecord[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    `SELECT * FROM call_records
      WHERE transcription_status = 'pending'
      ORDER BY detected_at ASC;`,
  );
  return extractRows(results).map(rowToCallRecord);
}

// ---------------------------------------------------------------------------
// Flagged Numbers (Scam Database)
// ---------------------------------------------------------------------------

export interface FlaggedNumber {
  phone_number: string;
  times_flagged: number;
  highest_risk_score: number;
  categories: string[];
  first_flagged_at: string;
  last_flagged_at: string;
}

function rowToFlaggedNumber(row: Record<string, unknown>): FlaggedNumber {
  return {
    phone_number: row.phone_number as string,
    times_flagged: Number(row.times_flagged),
    highest_risk_score: Number(row.highest_risk_score),
    categories: row.categories
      ? (JSON.parse(row.categories as string) as string[])
      : [],
    first_flagged_at: row.first_flagged_at as string,
    last_flagged_at: row.last_flagged_at as string,
  };
}

/**
 * Check if a phone number is already flagged as a scam.
 */
export async function getFlaggedNumber(
  phoneNumber: string,
): Promise<FlaggedNumber | null> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM flagged_numbers WHERE phone_number = ? LIMIT 1;',
    [phoneNumber],
  );
  const rows = extractRows(results);
  return rows.length > 0 ? rowToFlaggedNumber(rows[0]) : null;
}

/**
 * Flag a phone number as a scam or update existing flag.
 */
export async function flagNumber(
  phoneNumber: string,
  riskScore: number,
  categories: string[],
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  const existing = await getFlaggedNumber(phoneNumber);

  if (existing) {
    // Update existing record
    const mergedCategories = Array.from(
      new Set([...existing.categories, ...categories]),
    );
    const newHighestScore = Math.max(existing.highest_risk_score, riskScore);

    await db.executeSql(
      `UPDATE flagged_numbers
          SET times_flagged = times_flagged + 1,
              highest_risk_score = ?,
              categories = ?,
              last_flagged_at = ?
        WHERE phone_number = ?;`,
      [newHighestScore, JSON.stringify(mergedCategories), now, phoneNumber],
    );
  } else {
    // Insert new record
    await db.executeSql(
      `INSERT INTO flagged_numbers (
        phone_number,
        times_flagged,
        highest_risk_score,
        categories,
        first_flagged_at,
        last_flagged_at
      ) VALUES (?, 1, ?, ?, ?, ?);`,
      [phoneNumber, riskScore, JSON.stringify(categories), now, now],
    );
  }
}

/**
 * Get all flagged numbers, sorted by highest risk score.
 */
export async function getAllFlaggedNumbers(): Promise<FlaggedNumber[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM flagged_numbers ORDER BY highest_risk_score DESC;',
  );
  return extractRows(results).map(rowToFlaggedNumber);
}

/**
 * Remove a number from the flagged list (e.g., if user marks as safe).
 */
export async function unflagNumber(phoneNumber: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'DELETE FROM flagged_numbers WHERE phone_number = ?;',
    [phoneNumber],
  );
}
