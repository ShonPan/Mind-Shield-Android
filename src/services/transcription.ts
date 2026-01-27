import RNFS from 'react-native-fs';
import {API_ENDPOINTS, API_KEYS, TRANSCRIPTION} from '../utils/constants';

/**
 * Error thrown when transcription fails due to API or processing issues.
 */
export class TranscriptionError extends Error {
  public readonly statusCode: number | null;
  public readonly apiMessage: string | null;

  constructor(message: string, statusCode: number | null = null, apiMessage: string | null = null) {
    super(message);
    this.name = 'TranscriptionError';
    this.statusCode = statusCode;
    this.apiMessage = apiMessage;
  }
}

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramResponse {
  results: {
    channels: DeepgramChannel[];
  };
}

/**
 * Transcribes an audio file using the Deepgram Nova-3 API.
 *
 * Reads the file from disk as base64, converts it for upload, and sends it
 * to Deepgram with smart formatting and speaker diarization enabled.
 *
 * @param filePath - Absolute path to the audio file on device storage.
 * @returns The full transcript text.
 * @throws {TranscriptionError} If the file cannot be read or the API request fails.
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  // --- 1. Read file from disk ---
  let base64Data: string;
  try {
    base64Data = await RNFS.readFile(filePath, 'base64');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TranscriptionError(
      `Failed to read audio file: ${message}`,
    );
  }

  // --- 2. Convert base64 to binary ArrayBuffer for upload ---
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // --- 3. Build query parameters ---
  const queryParams = new URLSearchParams({
    model: TRANSCRIPTION.MODEL,
    language: TRANSCRIPTION.LANGUAGE,
    smart_format: String(TRANSCRIPTION.SMART_FORMAT),
    diarize: String(TRANSCRIPTION.DIARIZE),
  });

  const url = `${API_ENDPOINTS.DEEPGRAM}?${queryParams.toString()}`;

  // --- 4. POST to Deepgram ---
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${API_KEYS.DEEPGRAM}`,
        'Content-Type': TRANSCRIPTION.MIME_TYPE,
      },
      body: bytes.buffer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TranscriptionError(
      `Network error during transcription: ${message}`,
    );
  }

  // --- 5. Handle non-OK responses ---
  if (!response.ok) {
    let apiMessage: string | null = null;
    try {
      const errorBody = await response.json();
      apiMessage = errorBody?.err_msg ?? errorBody?.message ?? JSON.stringify(errorBody);
    } catch {
      // Response body could not be parsed -- ignore.
    }

    throw new TranscriptionError(
      `Deepgram API error (HTTP ${response.status}): ${apiMessage ?? response.statusText}`,
      response.status,
      apiMessage,
    );
  }

  // --- 6. Parse response ---
  let data: DeepgramResponse;
  try {
    data = (await response.json()) as DeepgramResponse;
  } catch (error) {
    throw new TranscriptionError('Failed to parse Deepgram response as JSON');
  }

  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (typeof transcript !== 'string') {
    throw new TranscriptionError(
      'Deepgram response did not contain a transcript at the expected path',
    );
  }

  return transcript;
}
