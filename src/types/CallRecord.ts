export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RiskLevel = 'green' | 'yellow' | 'red';

export interface CallRecord {
  id: string;
  file_path: string;
  file_name: string;
  detected_at: string;
  phone_number: string | null;
  duration_sec: number | null;
  transcript: string | null;
  transcription_status: TranscriptionStatus;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  scam_categories: string[] | null;
  scam_tactics: string[] | null;
  analysis_summary: string | null;
  user_dismissed: boolean;
  created_at: string;
  updated_at: string;
}
