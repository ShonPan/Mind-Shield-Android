import {KeywordFilterResult} from '../types/ScamAnalysis';

interface ScamPattern {
  pattern: RegExp;
  category: string;
  weight: number;
}

const SCAM_PATTERNS: ScamPattern[] = [
  // Government Impersonation
  {pattern: /\bIRS\b/i, category: 'Government Impersonation', weight: 15},
  {pattern: /\bsocial\s+security\b/i, category: 'Government Impersonation', weight: 15},
  {pattern: /\barrest\s+warrant\b/i, category: 'Government Impersonation', weight: 20},
  {pattern: /\blaw\s+enforcement\b/i, category: 'Government Impersonation', weight: 12},
  {pattern: /\bfederal\s+agent\b/i, category: 'Government Impersonation', weight: 18},
  {pattern: /\bbadge\s+number\b/i, category: 'Government Impersonation', weight: 14},

  // Financial
  {pattern: /\bgift\s+card\b/i, category: 'Financial Fraud', weight: 18},
  {pattern: /\bwire\s+transfer\b/i, category: 'Financial Fraud', weight: 16},
  {pattern: /\bwestern\s+union\b/i, category: 'Financial Fraud', weight: 18},
  {pattern: /\bmoneygram\b/i, category: 'Financial Fraud', weight: 18},
  {pattern: /\bbitcoin\b/i, category: 'Financial Fraud', weight: 14},
  {pattern: /\bcryptocurrency\b/i, category: 'Financial Fraud', weight: 14},
  {pattern: /\bbank\s+account\s+number\b/i, category: 'Financial Fraud', weight: 16},

  // Urgency
  {pattern: /\bact\s+now\b/i, category: 'Urgency/Pressure', weight: 10},
  {pattern: /\blimited\s+time\b/i, category: 'Urgency/Pressure', weight: 10},
  {pattern: /\bimmediately\b/i, category: 'Urgency/Pressure', weight: 8},
  {pattern: /\bright\s+away\b/i, category: 'Urgency/Pressure', weight: 8},
  {pattern: /\burgent\b/i, category: 'Urgency/Pressure', weight: 10},
  {pattern: /\bdon'?t\s+hang\s+up\b/i, category: 'Urgency/Pressure', weight: 14},

  // Threats
  {pattern: /\barrest\b/i, category: 'Threats/Intimidation', weight: 12},
  {pattern: /\blawsuit\b/i, category: 'Threats/Intimidation', weight: 12},
  {pattern: /\bsuspended\b/i, category: 'Threats/Intimidation', weight: 10},
  {pattern: /\bdeported\b/i, category: 'Threats/Intimidation', weight: 14},
  {pattern: /\bwarrant\b/i, category: 'Threats/Intimidation', weight: 12},
  {pattern: /\bpolice\b/i, category: 'Threats/Intimidation', weight: 8},

  // Personal Info
  {pattern: /\bsocial\s+security\s+number\b/i, category: 'Identity Theft', weight: 20},
  {pattern: /\bSSN\b/, category: 'Identity Theft', weight: 20},
  {pattern: /\bdate\s+of\s+birth\b/i, category: 'Identity Theft', weight: 14},
  {pattern: /\bmother'?s\s+maiden\b/i, category: 'Identity Theft', weight: 18},
  {pattern: /\bPIN\b/, category: 'Identity Theft', weight: 14},
  {pattern: /\bpassword\b/i, category: 'Identity Theft', weight: 14},
  {pattern: /\bverify\s+your\s+identity\b/i, category: 'Identity Theft', weight: 12},

  // Prize/Lottery
  {pattern: /\byou'?ve\s+won\b/i, category: 'Prize/Lottery Scam', weight: 16},
  {pattern: /\bcongratulations\b/i, category: 'Prize/Lottery Scam', weight: 8},
  {pattern: /\bprize\b/i, category: 'Prize/Lottery Scam', weight: 10},
  {pattern: /\blottery\b/i, category: 'Prize/Lottery Scam', weight: 16},
  {pattern: /\bsweepstakes\b/i, category: 'Prize/Lottery Scam', weight: 16},
  {pattern: /\bclaim\s+your\b/i, category: 'Prize/Lottery Scam', weight: 12},

  // Tech Support
  {pattern: /\bcomputer\s+has\s+a\s+virus\b/i, category: 'Tech Support Scam', weight: 20},
  {pattern: /\bmicrosoft\s+support\b/i, category: 'Tech Support Scam', weight: 18},
  {pattern: /\bapple\s+support\b/i, category: 'Tech Support Scam', weight: 18},
  {pattern: /\bremote\s+access\b/i, category: 'Tech Support Scam', weight: 16},
  {pattern: /\bteamviewer\b/i, category: 'Tech Support Scam', weight: 18},
];

/**
 * Scaling factor applied to the sum of matched pattern weights.
 * Calibrated so that hitting a few high-weight patterns lands in
 * the "caution" band (~35-69) and multiple categories push into "danger".
 */
const SCORE_SCALING_FACTOR = 1.5;

/**
 * Runs keyword / regex based pre-filter on a transcript and returns
 * matched phrases, a preliminary risk score, and the scam categories found.
 */
export function runKeywordFilter(transcript: string): KeywordFilterResult {
  const matchedPhrases: string[] = [];
  const categories = new Set<string>();
  let rawScore = 0;

  for (const {pattern, category, weight} of SCAM_PATTERNS) {
    const match = transcript.match(pattern);
    if (match) {
      matchedPhrases.push(match[0]);
      categories.add(category);
      rawScore += weight;
    }
  }

  const preliminaryScore = Math.min(100, Math.round(rawScore * SCORE_SCALING_FACTOR));

  return {
    matched_phrases: matchedPhrases,
    preliminary_score: preliminaryScore,
    categories: Array.from(categories),
  };
}

export {SCAM_PATTERNS};
export type {ScamPattern};
