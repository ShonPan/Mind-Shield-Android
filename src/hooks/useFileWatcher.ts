import {useState, useCallback, useRef} from 'react';
import {FileWatcher} from '../services/fileWatcherBridge';
import {transcribeAudio} from '../services/transcription';
import {analyzeTranscript} from '../services/scamAnalysis';
import {sendScamAlert, sendKnownScammerAlert} from '../services/notificationService';
import {
  insertCallRecord,
  updateTranscription,
  updateAnalysis,
  getCallRecordByFilePath,
  getFlaggedNumber,
  flagNumber,
} from '../database/callRecordRepository';
import {useCallRecords} from './useCallRecords';
import uuid from 'react-native-uuid';

/**
 * Extract phone number from Samsung call recording filename.
 * Format: Call_555-0178_20260127_135555.m4a
 */
function extractPhoneNumber(fileName: string): string | null {
  const match = fileName.match(/^Call_([^_]+)_\d{8}_\d{6}\.m4a$/);
  return match ? match[1] : null;
}

export function useFileWatcher() {
  const [isWatching, setIsWatching] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const {loadRecords} = useCallRecords();

  const processFile = useCallback(
    async (filePath: string, fileName: string) => {
      const id = uuid.v4() as string;
      const now = new Date().toISOString();
      const phoneNumber = extractPhoneNumber(fileName);

      try {
        // Check if already processed
        const existing = await getCallRecordByFilePath(filePath);
        if (existing) {
          console.log('File already processed:', filePath);
          return;
        }

        // Check if this is a known scammer
        if (phoneNumber) {
          const flaggedInfo = await getFlaggedNumber(phoneNumber);
          if (flaggedInfo) {
            console.log('Known scammer detected:', phoneNumber);
            await sendKnownScammerAlert(
              phoneNumber,
              flaggedInfo.times_flagged,
              flaggedInfo.highest_risk_score,
            );
          }
        }

        // Step 1: Create pending record
        await insertCallRecord({
          id,
          file_path: filePath,
          file_name: fileName,
          detected_at: now,
          phone_number: phoneNumber,
          duration_sec: null,
          transcript: null,
          transcription_status: 'pending',
          risk_score: null,
          risk_level: null,
          scam_categories: null,
          scam_tactics: null,
          analysis_summary: null,
          user_dismissed: false,
        });
        await loadRecords();

        // Step 2: Transcribe
        await updateTranscription(id, '', 'processing');
        await loadRecords();

        const transcript = await transcribeAudio(filePath);

        await updateTranscription(id, transcript, 'completed');
        await loadRecords();

        // Step 3: Analyze
        const analysis = await analyzeTranscript(transcript);

        await updateAnalysis(
          id,
          analysis.risk_score,
          analysis.risk_level,
          analysis.scam_categories,
          analysis.scam_tactics,
          analysis.summary,
        );
        await loadRecords();

        // Step 4: Notify if high risk
        if (analysis.risk_score >= 70) {
          await sendScamAlert(id, analysis.summary, analysis.risk_score);

          // Auto-flag this number in the scam database
          if (phoneNumber) {
            await flagNumber(
              phoneNumber,
              analysis.risk_score,
              analysis.scam_categories,
            );
            console.log('Flagged scam number:', phoneNumber);
          }
        }
      } catch (error) {
        console.error('Error processing file:', filePath, error);
        try {
          await updateTranscription(id, '', 'failed');
          await loadRecords();
        } catch (updateError) {
          console.error('Failed to update status to failed:', updateError);
        }
      }
    },
    [loadRecords],
  );

  const startMonitoring = useCallback(async () => {
    try {
      await FileWatcher.startWatching();
      const unsub = FileWatcher.onNewRecording(event => {
        processFile(event.filePath, event.fileName);
      });
      unsubscribeRef.current = unsub;
      setIsWatching(true);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  }, [processFile]);

  const stopMonitoring = useCallback(async () => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      await FileWatcher.stopWatching();
      setIsWatching(false);
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  }, []);

  return {
    isWatching,
    startMonitoring,
    stopMonitoring,
    processFile,
  };
}
