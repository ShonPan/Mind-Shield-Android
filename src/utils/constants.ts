export const RECORDING_DIR = '/storage/emulated/0/Recordings/Call';

export const API_ENDPOINTS = {
  DEEPGRAM: 'https://api.deepgram.com/v1/listen',
  OPENAI: 'https://api.openai.com/v1/chat/completions',
};

// Replace with your actual API keys
export const API_KEYS = {
  DEEPGRAM: 'YOUR_DEEPGRAM_API_KEY',
  OPENAI: 'YOUR_OPENAI_API_KEY',
};

export const RISK_THRESHOLDS = {
  GREEN_MAX: 34,
  YELLOW_MAX: 69,
  // RED: 70-100
};

export const NOTIFICATION_CHANNEL = {
  ID: 'mindshield-alerts',
  NAME: 'Scam Alerts',
  DESCRIPTION: 'Alerts for potentially dangerous phone calls',
};

export const FILE_WATCHER = {
  SERVICE_CHANNEL_ID: 'mindshield-service',
  SERVICE_CHANNEL_NAME: 'Mindshield Active',
};

export const TRANSCRIPTION = {
  MODEL: 'nova-3',
  LANGUAGE: 'en',
  SMART_FORMAT: true,
  DIARIZE: true,
  MIME_TYPE: 'audio/mp4',
};

export const ANALYSIS = {
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.2,
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  MONITORING_ENABLED: 'monitoring_enabled',
  SENSITIVITY: 'sensitivity',
  RECORDING_PATH: 'recording_path',
};
