import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Switch, ScrollView, Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {useFileWatcher} from '../hooks/useFileWatcher';
import {useCallRecords} from '../hooks/useCallRecords';
import BigButton from '../components/BigButton';
import {RECORDING_DIR} from '../utils/constants';
import {seedTestData} from '../utils/seedTestData';
import type {SettingsScreenProps} from '../types/Navigation';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

export function SettingsScreen({navigation}: SettingsScreenProps) {
  const {isWatching, startMonitoring, stopMonitoring, processFile} =
    useFileWatcher();
  const {loadRecords, clearAllRecords} = useCallRecords();
  const [scanning, setScanning] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(isWatching);

  useEffect(() => {
    setMonitoringEnabled(isWatching);
  }, [isWatching]);

  const handleToggleMonitoring = async (value: boolean) => {
    setMonitoringEnabled(value);
    if (value) {
      await startMonitoring();
    } else {
      await stopMonitoring();
    }
  };

  const handleScanAll = async () => {
    try {
      setScanning(true);
      const exists = await RNFS.exists(RECORDING_DIR);
      if (!exists) {
        Alert.alert(
          'Folder Not Found',
          `The recordings folder was not found at:\n${RECORDING_DIR}\n\nMake sure you have call recordings on this device.`,
        );
        return;
      }

      const files = await RNFS.readDir(RECORDING_DIR);
      const m4aFiles = files.filter(f => f.name.endsWith('.m4a') && f.isFile());

      if (m4aFiles.length === 0) {
        Alert.alert(
          'No Recordings',
          'No .m4a call recordings found in the recordings folder.',
        );
        return;
      }

      Alert.alert(
        'Scan Recordings',
        `Found ${m4aFiles.length} recording(s). This will analyze all of them. Continue?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Scan All',
            onPress: async () => {
              for (const file of m4aFiles) {
                await processFile(file.path, file.name);
              }
              await loadRecords();
              Alert.alert('Done', 'All recordings have been queued for analysis.');
            },
          },
        ],
      );
    } catch (error) {
      console.error('Scan all failed:', error);
      Alert.alert('Error', 'Failed to scan recordings folder.');
    } finally {
      setScanning(false);
    }
  };

  const handleSeedTestData = async () => {
    try {
      setSeeding(true);
      const count = await seedTestData();
      await loadRecords();
      Alert.alert('Done', `Added ${count} test call records (2 scams, 2 normal).`);
    } catch (error) {
      console.error('Seed failed:', error);
      Alert.alert('Error', 'Failed to seed test data.');
    } finally {
      setSeeding(false);
    }
  };

  const handleWipeRecordings = () => {
    Alert.alert(
      'Wipe All Recordings',
      'This will permanently delete all call record data from the app. The actual audio files will not be deleted. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Wipe All',
          style: 'destructive',
          onPress: async () => {
            try {
              setWiping(true);
              await clearAllRecords();
              Alert.alert('Done', 'All recording data has been wiped.');
            } catch (error) {
              console.error('Wipe failed:', error);
              Alert.alert('Error', 'Failed to wipe recordings.');
            } finally {
              setWiping(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Monitoring Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Call Monitoring</Text>
            <Text style={styles.sublabel}>
              Automatically detect and analyze new call recordings
            </Text>
          </View>
          <Switch
            value={monitoringEnabled}
            onValueChange={handleToggleMonitoring}
            trackColor={{false: colors.disabled, true: colors.riskGreen}}
            thumbColor={colors.background}
          />
        </View>
      </View>

      {/* Recording Path */}
      <View style={styles.card}>
        <Text style={styles.label}>Recordings Folder</Text>
        <Text style={styles.pathText}>{RECORDING_DIR}</Text>
        <Text style={styles.sublabel}>
          Samsung devices save call recordings here by default
        </Text>
      </View>

      {/* Scam Database */}
      <View style={styles.card}>
        <Text style={styles.label}>Scam Database</Text>
        <Text style={styles.sublabel}>
          View flagged phone numbers reported as scams. Your reports help protect other users.
        </Text>
        <View style={styles.buttonContainer}>
          <BigButton
            title="View Scam Database"
            onPress={() => navigation.navigate('ScamDatabase')}
            variant="secondary"
          />
        </View>
      </View>

      {/* Scan All */}
      <View style={styles.card}>
        <Text style={styles.label}>Bulk Scan</Text>
        <Text style={styles.sublabel}>
          Analyze all existing call recordings in the folder
        </Text>
        <View style={styles.buttonContainer}>
          <BigButton
            title="Scan All Recordings"
            onPress={handleScanAll}
            variant="primary"
            loading={scanning}
          />
        </View>
      </View>

      {/* Wipe Recordings */}
      <View style={styles.card}>
        <Text style={styles.label}>Reset Data</Text>
        <Text style={styles.sublabel}>
          Delete all call record data from the app (audio files are kept)
        </Text>
        <View style={styles.buttonContainer}>
          <BigButton
            title="Wipe All Recordings"
            onPress={handleWipeRecordings}
            variant="danger"
            loading={wiping}
          />
        </View>
      </View>

      {/* Dev Tools */}
      <View style={styles.card}>
        <Text style={styles.label}>Developer Tools</Text>
        <Text style={styles.sublabel}>
          Load sample call data for testing (2 scam calls, 2 normal calls)
        </Text>
        <View style={styles.buttonContainer}>
          <BigButton
            title="Load Test Data"
            onPress={handleSeedTestData}
            variant="secondary"
            loading={seeding}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Mindshield v1.0.0</Text>
        <Text style={styles.footerText}>
          Protecting you from phone scams
        </Text>
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
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sublabel: {
    fontSize: fonts.sizeSmall,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  pathText: {
    fontSize: fonts.sizeSmall,
    color: colors.primary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: fonts.sizeSmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
