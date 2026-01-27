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

/** Shape of the JSON payload returned by GPT inside its message content. */
interface GptAnalysisPayload {
  risk_score: number;
  scam_categories: string[];
  scam_tactics: string[];
  summary: string;
}

/** Weight given to the keyword pre-filter score (0-1). */
const KEYWORD_WEIGHT = 0.3;
/** Weight given to the GPT analysis score (0-1). */
const GPT_WEIGHT = 0.7;

/**
 * Analyzes a phone-call transcript for scam indicators.
 *
 * The pipeline:
 *  1. Keyword pre-filter  -- fast, local regex scan.
 *  2. GPT-4o-mini analysis -- deeper semantic understanding.
 *  3. Score blending       -- 30 % keyword, 70 % GPT.
 *  4. Risk level mapping   -- green / yellow / red via thresholds.
 *
 * If the GPT call fails the function degrades gracefully to keyword-only results.
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
  // Step 2: Call OpenAI GPT-4o-mini
  // -----------------------------------------------------------
  let gptPayload: GptAnalysisPayload | null = null;

  try {
    gptPayload = await callGptAnalysis(transcript);
  } catch (error) {
    console.warn(
      '[MindShield] GPT analysis failed, falling back to keyword-only results:',
      error instanceof Error ? error.message : String(error),
    );
  }

  // -----------------------------------------------------------
  // Step 3 & 4: Combine scores and determine risk level
  // -----------------------------------------------------------
  if (gptPayload) {
    const combinedScore = Math.min(
      100,
      Math.round(
        keywordResult.preliminary_score * KEYWORD_WEIGHT +
          gptPayload.risk_score * GPT_WEIGHT,
      ),
    );

    // Merge categories: union of keyword and GPT categories.
    const mergedCategories = Array.from(
      new Set([...keywordResult.categories, ...gptPayload.scam_categories]),
    );

    return {
      risk_score: combinedScore,
      risk_level: getRiskLevel(combinedScore),
      scam_categories: mergedCategories,
      scam_tactics: gptPayload.scam_tactics,
      summary: gptPayload.summary,
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
 * Sends the transcript to OpenAI GPT-4o-mini and returns the parsed
 * analysis payload.
 */
async function callGptAnalysis(transcript: string): Promise<GptAnalysisPayload> {
  const body = {
    model: ANALYSIS.MODEL,
    max_tokens: ANALYSIS.MAX_TOKENS,
    temperature: ANALYSIS.TEMPERATURE,
    response_format: {type: 'json_object'},
    messages: [
      {role: 'system', content: SCAM_ANALYSIS_SYSTEM_PROMPT},
      {role: 'user', content: SCAM_ANALYSIS_USER_PROMPT(transcript)},
    ],
  };

  let response: Response;
  try {
    response = await fetch(API_ENDPOINTS.OPENAI, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEYS.OPENAI}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScamAnalysisError(`Network error calling OpenAI: ${message}`);
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
      `OpenAI API error (HTTP ${response.status}): ${detail}`,
      response.status,
    );
  }

  const data = await response.json();
  const content: string | undefined =
    data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new ScamAnalysisError(
      'OpenAI response did not contain message content',
    );
  }

  let parsed: GptAnalysisPayload;
  try {
    parsed = JSON.parse(content) as GptAnalysisPayload;
  } catch {
    throw new ScamAnalysisError(
      'Failed to parse GPT response as JSON',
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
      'GPT response JSON is missing required fields',
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
