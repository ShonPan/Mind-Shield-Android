export interface ScamAnalysisResult {
  risk_score: number;
  risk_level: 'green' | 'yellow' | 'red';
  scam_categories: string[];
  scam_tactics: string[];
  summary: string;
}

export interface KeywordFilterResult {
  matched_phrases: string[];
  preliminary_score: number;
  categories: string[];
}
