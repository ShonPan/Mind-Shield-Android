import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity} from 'react-native';
import {getCallRecordById, dismissCall} from '../database/callRecordRepository';
import RiskScoreBar from '../components/RiskScoreBar';
import TranscriptView from '../components/TranscriptView';
import BigButton from '../components/BigButton';
import LoadingSpinner from '../components/LoadingSpinner';
import {getRiskColor, getRiskLabel, getRiskDescription} from '../utils/riskLevel';
import type {CallDetailScreenProps} from '../types/Navigation';
import type {CallRecord} from '../types/CallRecord';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

const TROLL_RESPONSES = [
  {
    id: 'cartoon',
    title: 'Cartoon Voice',
    icon: '🎭',
    description: 'Respond in a high-pitched cartoon character voice',
    script:
      '"Oh BOY oh BOY! Is this really the IRS? I\'ve always wanted to talk to you guys! Can you hold on? I need to find my SPECIAL calculator... *makes silly noises* ...it\'s shaped like a duck!"',
  },
  {
    id: 'stutter',
    title: 'Slow Stutter',
    icon: '🐢',
    description: 'Speak very slowly with frequent pauses',
    script:
      '"H-h-hello? Yes... I... um... can you... wait, what was... the question? Oh the... the money? Let me... think... about... *long pause* ...what were we talking about again?"',
  },
  {
    id: 'prize',
    title: "You've Won a Prize",
    icon: '🎉',
    description: 'Turn the tables - tell them THEY won something',
    script:
      '"CONGRATULATIONS! You\'re actually our 1 millionth caller! YOU\'VE won a free cruise to the Bahamas! I just need YOUR social security number and credit card to process your prize. This is totally legitimate, I promise!"',
  },
  {
    id: 'grandma',
    title: 'Confused Grandma',
    icon: '👵',
    description: 'Pretend to be a confused elderly person',
    script:
      '"Is this my grandson? Bobby? No wait, Tommy? Oh the IRS? Is that the new pharmacy? I need to refill my prescription for my... what\'s it called... the blue pills. Can you help me find my cat? His name is Mr. Whiskers..."',
  },
  {
    id: 'hold',
    title: 'Endless Hold',
    icon: '⏳',
    description: 'Keep putting them on hold',
    script:
      '"Oh absolutely, let me get that information for you. Can you hold for just one moment?" *wait 2 minutes* "Sorry about that! Now what did you need? Oh right, hold please..." *repeat indefinitely*',
  },
];

export function CallDetailScreen({route, navigation}: CallDetailScreenProps) {
  const {callId} = route.params;
  const [record, setRecord] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [trollModalVisible, setTrollModalVisible] = useState(false);
  const [selectedTroll, setSelectedTroll] = useState<typeof TROLL_RESPONSES[0] | null>(null);

  useEffect(() => {
    const load = async () => {
      const r = await getCallRecordById(callId);
      setRecord(r);
      setLoading(false);
      if (r) {
        navigation.setOptions({title: r.file_name});
      }
    };
    load();
  }, [callId, navigation]);

  if (loading) {
    return <LoadingSpinner message="Loading call details..." />;
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Call record not found.</Text>
      </View>
    );
  }

  const isProcessing =
    record.transcription_status === 'pending' ||
    record.transcription_status === 'processing';
  const isFailed = record.transcription_status === 'failed';
  const riskColor = getRiskColor(record.risk_level);

  const getGuidance = () => {
    switch (record.risk_level) {
      case 'green':
        return 'This call appears safe. No action needed.';
      case 'yellow':
        return 'Be cautious. Do not share personal information or financial details with this caller. If unsure, hang up and call the organization directly using a number you trust.';
      case 'red':
        return 'DO NOT call this number back.\nDO NOT send money or gift cards.\nDO NOT share personal information.\n\nContact a family member or call the FTC at 1-877-382-4357 to report this call.';
      default:
        return '';
    }
  };

  const handleDismiss = async () => {
    await dismissCall(record.id);
    setRecord({...record, user_dismissed: true});
  };

  const handleSelectTroll = (troll: typeof TROLL_RESPONSES[0]) => {
    setSelectedTroll(troll);
  };

  const handleCloseTrollModal = () => {
    setTrollModalVisible(false);
    setSelectedTroll(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Risk Score Hero */}
      {record.risk_score !== null && record.risk_level !== null && (
        <View style={styles.heroSection}>
          <View style={[styles.scoreCircle, {borderColor: riskColor}]}>
            <Text style={[styles.scoreNumber, {color: riskColor}]}>
              {record.risk_score}
            </Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={[styles.riskLabel, {color: riskColor}]}>
            {getRiskLabel(record.risk_level)}
          </Text>
          <Text style={styles.riskDescription}>
            {getRiskDescription(record.risk_level)}
          </Text>
        </View>
      )}

      {/* Processing State */}
      {isProcessing && (
        <View style={styles.processingCard}>
          <LoadingSpinner message="Analyzing this call..." />
        </View>
      )}

      {isFailed && (
        <View style={styles.failedCard}>
          <Text style={styles.failedText}>
            Analysis failed. The recording may be corrupted or the service is
            unavailable.
          </Text>
        </View>
      )}

      {/* Score Bar */}
      {record.risk_score !== null && (
        <View style={styles.section}>
          <RiskScoreBar score={record.risk_score} level={record.risk_level} />
        </View>
      )}

      {/* Analysis Summary */}
      {record.analysis_summary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Analysis</Text>
          <Text style={styles.summaryText}>{record.analysis_summary}</Text>
        </View>
      )}

      {/* What to Do */}
      {record.risk_level && record.risk_level !== 'green' && (
        <View
          style={[
            styles.card,
            record.risk_level === 'red'
              ? styles.dangerCard
              : styles.warningCard,
          ]}>
          <Text style={styles.cardTitle}>What to Do</Text>
          <Text style={styles.guidanceText}>{getGuidance()}</Text>
          {record.risk_level === 'red' && (
            <View style={styles.trollButtonContainer}>
              <BigButton
                title="Fight Back - Troll Responses"
                onPress={() => setTrollModalVisible(true)}
                variant="primary"
              />
            </View>
          )}
        </View>
      )}

      {/* Troll Response Modal */}
      <Modal
        visible={trollModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseTrollModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTroll ? selectedTroll.title : 'Troll Responses'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseTrollModal}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            {!selectedTroll ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Waste their time instead of yours. Select a response style:
                </Text>
                <ScrollView style={styles.trollList}>
                  {TROLL_RESPONSES.map(troll => (
                    <TouchableOpacity
                      key={troll.id}
                      style={styles.trollOption}
                      onPress={() => handleSelectTroll(troll)}>
                      <Text style={styles.trollIcon}>{troll.icon}</Text>
                      <View style={styles.trollInfo}>
                        <Text style={styles.trollTitle}>{troll.title}</Text>
                        <Text style={styles.trollDescription}>
                          {troll.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.scriptContainer}>
                <Text style={styles.scriptIcon}>{selectedTroll.icon}</Text>
                <Text style={styles.scriptDescription}>
                  {selectedTroll.description}
                </Text>
                <View style={styles.scriptBox}>
                  <Text style={styles.scriptLabel}>Sample Script:</Text>
                  <Text style={styles.scriptText}>{selectedTroll.script}</Text>
                </View>
                <View style={styles.scriptActions}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedTroll(null)}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.useButton}>
                    <Text style={styles.useButtonText}>Auto-Respond</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.comingSoon}>
                  Auto-respond feature coming soon!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Scam Categories */}
      {record.scam_categories && record.scam_categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Categories</Text>
          <View style={styles.pillContainer}>
            {record.scam_categories.map((cat, i) => (
              <View key={i} style={[styles.pill, {backgroundColor: riskColor}]}>
                <Text style={styles.pillText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Scam Tactics */}
      {record.scam_tactics && record.scam_tactics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scam Tactics Used</Text>
          {record.scam_tactics.map((tactic, i) => (
            <View key={i} style={styles.tacticRow}>
              <Text style={styles.tacticBullet}>•</Text>
              <Text style={styles.tacticText}>{tactic}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Transcript */}
      {record.transcript && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Transcript</Text>
          <TranscriptView
            transcript={record.transcript}
            highlightPhrases={record.scam_tactics ?? undefined}
          />
        </View>
      )}

      {/* Call Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Call Information</Text>
        <Text style={styles.infoRow}>
          File: {record.file_name}
        </Text>
        <Text style={styles.infoRow}>
          Detected: {new Date(record.detected_at).toLocaleString()}
        </Text>
        {record.phone_number && (
          <Text style={styles.infoRow}>
            Phone: {record.phone_number}
          </Text>
        )}
        {record.duration_sec !== null && (
          <Text style={styles.infoRow}>
            Duration: {Math.floor(record.duration_sec / 60)}m{' '}
            {record.duration_sec % 60}s
          </Text>
        )}
      </View>

      {/* Dismiss */}
      {record.risk_level === 'red' && !record.user_dismissed && (
        <View style={styles.dismissSection}>
          <BigButton
            title="Dismiss Alert"
            onPress={handleDismiss}
            variant="secondary"
          />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  scoreNumber: {
    fontSize: fonts.sizeHero,
    fontWeight: fonts.weightBold,
  },
  scoreLabel: {
    fontSize: fonts.sizeSmall,
    color: colors.textMuted,
  },
  riskLabel: {
    fontSize: fonts.sizeHeader,
    fontWeight: fonts.weightBold,
    marginBottom: spacing.xs,
  },
  riskDescription: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  processingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  failedCard: {
    backgroundColor: colors.alertBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  failedText: {
    fontSize: fonts.sizeBody,
    color: colors.riskRed,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dangerCard: {
    backgroundColor: colors.alertBackground,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  warningCard: {
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  cardTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fonts.sizeBody,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  guidanceText: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  pillText: {
    fontSize: fonts.sizeSmall,
    fontWeight: fonts.weightMedium,
    color: colors.textOnDark,
  },
  tacticRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  tacticBullet: {
    fontSize: fonts.sizeBody,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  tacticText: {
    fontSize: fonts.sizeBody,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 26,
  },
  infoRow: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dismissSection: {
    marginTop: spacing.md,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
  errorText: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  trollButtonContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.alertBorder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: fonts.sizeHeader,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textSecondary,
  },
  modalSubtitle: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  trollList: {
    paddingHorizontal: spacing.md,
  },
  trollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  trollIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  trollInfo: {
    flex: 1,
  },
  trollTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  trollDescription: {
    fontSize: fonts.sizeSmall,
    color: colors.textSecondary,
  },
  scriptContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  scriptIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  scriptDescription: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scriptBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  scriptLabel: {
    fontSize: fonts.sizeSmall,
    fontWeight: fonts.weightBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  scriptText: {
    fontSize: fonts.sizeBody,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  scriptActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
  },
  useButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightBold,
    color: colors.textOnDark,
  },
  comingSoon: {
    fontSize: fonts.sizeSmall,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
