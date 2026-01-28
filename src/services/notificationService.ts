import notifee, {
  AndroidImportance,
  AndroidColor,
} from '@notifee/react-native';
import {NOTIFICATION_CHANNEL} from '../utils/constants';

/**
 * Creates the Android notification channel used for scam alerts.
 *
 * Must be called once during app initialisation (e.g. in the root component
 * or background service setup). Calling it multiple times is safe -- Notifee
 * will update the existing channel rather than duplicate it.
 */
export async function setupNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL.ID,
    name: NOTIFICATION_CHANNEL.NAME,
    description: NOTIFICATION_CHANNEL.DESCRIPTION,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

/**
 * Displays a high-importance local notification alerting the user that
 * a phone call has been flagged as a potential scam.
 *
 * @param callId    - Unique identifier of the analysed call record.
 * @param summary   - Human-readable summary of why the call is suspicious.
 * @param riskScore - Combined risk score (0-100) from the analysis pipeline.
 */
export async function sendScamAlert(
  callId: string,
  summary: string,
  riskScore: number,
): Promise<void> {
  await notifee.displayNotification({
    title: '\u26A0\uFE0F Scam Alert!',
    body: summary,
    data: {
      callId,
      riskScore: String(riskScore),
    },
    android: {
      channelId: NOTIFICATION_CHANNEL.ID,
      color: AndroidColor.RED,
      importance: AndroidImportance.HIGH,
      autoCancel: true,
      pressAction: {
        id: 'view-call',
        launchActivity: 'default',
      },
      smallIcon: 'ic_launcher',
    },
  });
}

/**
 * Displays an immediate alert when a call is detected from a
 * phone number that has been previously flagged as a scam.
 */
export async function sendKnownScammerAlert(
  phoneNumber: string,
  timesFlagged: number,
  highestRiskScore: number,
): Promise<void> {
  const body =
    timesFlagged === 1
      ? `This number was previously flagged as a scam (risk score: ${highestRiskScore}).`
      : `This number has been flagged ${timesFlagged} times as a scam (highest risk: ${highestRiskScore}).`;

  await notifee.displayNotification({
    title: '\u{1F6A8} Known Scammer: ' + phoneNumber,
    body,
    data: {
      phoneNumber,
      timesFlagged: String(timesFlagged),
    },
    android: {
      channelId: NOTIFICATION_CHANNEL.ID,
      color: AndroidColor.RED,
      importance: AndroidImportance.HIGH,
      autoCancel: true,
      pressAction: {
        id: 'view-flagged',
        launchActivity: 'default',
      },
      smallIcon: 'ic_launcher',
    },
  });
}
