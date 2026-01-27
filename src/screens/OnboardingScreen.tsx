import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import BigButton from '../components/BigButton';
import {usePermissions} from '../hooks/usePermissions';
import {useAppContext} from '../context/AppContext';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

export function OnboardingScreen() {
  const {dispatch} = useAppContext();
  const {
    storageGranted,
    notificationGranted,
    checkPermissions,
    requestStoragePermission,
    requestNotificationPermission,
  } = usePermissions();

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const allGranted = storageGranted && notificationGranted;

  const handleStart = () => {
    dispatch({type: 'SET_ONBOARDING', payload: true});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.shield}>🛡️</Text>
        <Text style={styles.title}>Welcome to Mindshield</Text>
        <Text style={styles.subtitle}>
          Mindshield protects you from phone scams by automatically analyzing
          your call recordings. We'll alert you if a call looks suspicious.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Setup Steps</Text>

      {/* Step 1: Storage */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepTitle}>Storage Access</Text>
          {storageGranted && <Text style={styles.checkmark}>✅</Text>}
        </View>
        <Text style={styles.stepDescription}>
          We need access to your call recordings folder to detect and analyze
          new recordings.
        </Text>
        {!storageGranted && (
          <BigButton
            title="Grant Storage Access"
            onPress={async () => {
              await requestStoragePermission();
              await checkPermissions();
            }}
            variant="primary"
          />
        )}
      </View>

      {/* Step 2: Notifications */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepTitle}>Notifications</Text>
          {notificationGranted && <Text style={styles.checkmark}>✅</Text>}
        </View>
        <Text style={styles.stepDescription}>
          Allow notifications so we can warn you immediately when a scam is
          detected.
        </Text>
        {!notificationGranted && (
          <BigButton
            title="Allow Notifications"
            onPress={async () => {
              await requestNotificationPermission();
              await checkPermissions();
            }}
            variant="primary"
          />
        )}
      </View>

      <View style={styles.startContainer}>
        <BigButton
          title="Start Protection"
          onPress={handleStart}
          variant="primary"
          disabled={!allGranted}
        />
        {!allGranted && (
          <Text style={styles.hint}>
            Please complete all steps above to continue.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  shield: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.sizeTitle,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightBold,
    textAlign: 'center',
    lineHeight: 32,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  stepTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  checkmark: {
    fontSize: 24,
  },
  stepDescription: {
    fontSize: fonts.sizeBody,
    color: colors.textSecondary,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  startContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  hint: {
    fontSize: fonts.sizeSmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
