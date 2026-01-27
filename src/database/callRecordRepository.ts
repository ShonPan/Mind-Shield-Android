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
