import {API_ENDPOINTS, API_KEYS, ANALYSIS} from '../utils/constants';
import {
  SCAM_ANALYSIS_SYSTEM_PROMPT,
  SCAM_ANALYSIS_USER_PROMPT,
} from '../utils/scamDefinitions';
import {runKeywordFilter} from './keywordFilter';
import {getRiskLevel} from '../utils/riskLevel';
import {ScamAnalysisResult} from '../types/ScamAnalysis';

/**
 * Error thrown when scam analysis fails due to API or processing issues.
 */
export class ScamAnalysisError extends Error {
  public readonly statusCode: number | null;

  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = 'ScamAnalysisError';
    this.statusCode = statusCode;
  }
}

/** Shape of the JSON payload returned by Claude inside its message content. */
interface ClaudeAnalysisPayload {
  risk_score: number;
  scam_categories: string[];
  scam_tactics: string[];
  summary: string;
}

/** Weight given to the keyword pre-filter score (0-1). */
const KEYWORD_WEIGHT = 0.3;
/** Weight given to the Claude analysis score (0-1). */
const CLAUDE_WEIGHT = 0.7;

/**
 * Analyzes a phone-call transcript for scam indicators.
 *
 * The pipeline:
 *  1. Keyword pre-filter  -- fast, local regex scan.
 *  2. Claude analysis     -- deeper semantic understanding.
 *  3. Score blending      -- 30 % keyword, 70 % Claude.
 *  4. Risk level mapping  -- green / yellow / red via thresholds.
 *
 * If the Claude call fails the function degrades gracefully to keyword-only results.
 *
 * @param transcript - The full transcript text of the phone call.
 * @returns A {@link ScamAnalysisResult} with the combined risk assessment.
 */
export async function analyzeTranscript(
  transcript: string,
): Promise<ScamAnalysisResult> {
  // -----------------------------------------------------------
  // Step 1: Keyword pre-filter
  // -----------------------------------------------------------
  const keywordResult = runKeywordFilter(transcript);

  // -----------------------------------------------------------
  // Step 2: Call Anthropic Claude
  // -----------------------------------------------------------
  let claudePayload: ClaudeAnalysisPayload | null = null;

  try {
    claudePayload = await callClaudeAnalysis(transcript);
  } catch (error) {
    console.warn(
      '[MindShield] Claude analysis failed, falling back to keyword-only results:',
      error instanceof Error ? error.message : String(error),
    );
  }

  // -----------------------------------------------------------
  // Step 3 & 4: Combine scores and determine risk level
  // -----------------------------------------------------------
  if (claudePayload) {
    const combinedScore = Math.min(
      100,
      Math.round(
        keywordResult.preliminary_score * KEYWORD_WEIGHT +
          claudePayload.risk_score * CLAUDE_WEIGHT,
      ),
    );

    // Merge categories: union of keyword and Claude categories.
    const mergedCategories = Array.from(
      new Set([...keywordResult.categories, ...claudePayload.scam_categories]),
    );

    return {
      risk_score: combinedScore,
      risk_level: getRiskLevel(combinedScore),
      scam_categories: mergedCategories,
      scam_tactics: claudePayload.scam_tactics,
      summary: claudePayload.summary,
    };
  }

  // -----------------------------------------------------------
  // Fallback: keyword-only results (GPT unavailable)
  // -----------------------------------------------------------
  const fallbackScore = keywordResult.preliminary_score;

  return {
    risk_score: fallbackScore,
    risk_level: getRiskLevel(fallbackScore),
    scam_categories: keywordResult.categories,
    scam_tactics: keywordResult.matched_phrases,
    summary: buildFallbackSummary(keywordResult.categories, fallbackScore),
  };
}

// ---------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------

/**
 * Sends the transcript to Anthropic Claude and returns the parsed
 * analysis payload.
 */
async function callClaudeAnalysis(transcript: string): Promise<ClaudeAnalysisPayload> {
  const body = {
    model: ANALYSIS.MODEL,
    max_tokens: ANALYSIS.MAX_TOKENS,
    temperature: ANALYSIS.TEMPERATURE,
    system: SCAM_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {role: 'user', content: SCAM_ANALYSIS_USER_PROMPT(transcript)},
    ],
  };

  let response: Response;
  try {
    response = await fetch(API_ENDPOINTS.ANTHROPIC, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEYS.ANTHROPIC,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScamAnalysisError(`Network error calling Anthropic: ${message}`);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message ?? JSON.stringify(errorBody);
    } catch {
      // Response body could not be parsed -- use statusText.
    }
    throw new ScamAnalysisError(
      `Anthropic API error (HTTP ${response.status}): ${detail}`,
      response.status,
    );
  }

  const data = await response.json();
  const content: string | undefined = data?.content?.[0]?.text;

  if (!content) {
    throw new ScamAnalysisError(
      'Anthropic response did not contain message content',
    );
  }

  // Extract JSON from the response (Claude may wrap it in markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new ScamAnalysisError(
      'Failed to find JSON in Claude response',
    );
  }

  let parsed: ClaudeAnalysisPayload;
  try {
    parsed = JSON.parse(jsonMatch[0]) as ClaudeAnalysisPayload;
  } catch {
    throw new ScamAnalysisError(
      'Failed to parse Claude response as JSON',
    );
  }

  // Validate essential fields.
  if (
    typeof parsed.risk_score !== 'number' ||
    !Array.isArray(parsed.scam_categories) ||
    !Array.isArray(parsed.scam_tactics) ||
    typeof parsed.summary !== 'string'
  ) {
    throw new ScamAnalysisError(
      'Claude response JSON is missing required fields',
    );
  }

  // Clamp score to 0-100.
  parsed.risk_score = Math.max(0, Math.min(100, Math.round(parsed.risk_score)));

  return parsed;
}

/**
 * Produces a human-readable summary when GPT is unavailable and only
 * keyword analysis is available.
 */
function buildFallbackSummary(categories: string[], score: number): string {
  if (categories.length === 0) {
    return 'No scam indicators were detected in this call based on keyword analysis.';
  }

  const categoryList = categories.join(', ');

  if (score >= 70) {
    return (
      `This call shows strong scam indicators in the following areas: ${categoryList}. ` +
      'Exercise extreme caution -- do not share personal information or send money.'
    );
  }

  if (score >= 35) {
    return (
      `This call contains some suspicious language related to: ${categoryList}. ` +
      'Please review the details carefully before taking any action.'
    );
  }

  return (
    `Minor keyword matches were found related to: ${categoryList}. ` +
    'The call is likely safe, but stay alert.'
  );
}
