import React, {useEffect, useCallback, useState, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useAppContext} from '../context/AppContext';
import {useCallRecords} from '../hooks/useCallRecords';
import {useFileWatcher} from '../hooks/useFileWatcher';
import CallListItem from '../components/CallListItem';
import AlertBanner from '../components/AlertBanner';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import type {HomeScreenProps} from '../types/Navigation';
import type {CallRecord} from '../types/CallRecord';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

export function HomeScreen({navigation}: HomeScreenProps) {
  const {state} = useAppContext();
  const {records, isLoading, loadRecords} = useCallRecords();
  const {isWatching, startMonitoring} = useFileWatcher();

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!isWatching) {
      startMonitoring();
    }
  }, [isWatching, startMonitoring]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
          accessibilityLabel="Settings">
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [filterSuspicious, setFilterSuspicious] = useState(false);

  const highRiskCalls = records.filter(
    r => r.risk_level === 'red' && !r.user_dismissed,
  );

  const displayedRecords = useMemo(
    () =>
      filterSuspicious
        ? records.filter(r => r.risk_level === 'red' || r.risk_level === 'yellow')
        : records,
    [records, filterSuspicious],
  );

  const handleCallPress = useCallback(
    (callId: string) => {
      navigation.navigate('CallDetail', {callId});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: CallRecord}) => (
      <CallListItem record={item} onPress={handleCallPress} />
    ),
    [handleCallPress],
  );

  const keyExtractor = useCallback((item: CallRecord) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          isWatching ? styles.statusActive : styles.statusInactive,
        ]}>
        <Text style={styles.statusDot}>{isWatching ? '🟢' : '🔴'}</Text>
        <Text style={styles.statusText}>
          {isWatching ? 'Protected — Monitoring Calls' : 'Not Monitoring'}
        </Text>
      </View>

      {/* High Risk Alert */}
      {highRiskCalls.length > 0 && (
        <AlertBanner
          message={
            filterSuspicious
              ? `Showing ${displayedRecords.length} suspicious call${displayedRecords.length !== 1 ? 's' : ''}. Tap to show all.`
              : `${highRiskCalls.length} suspicious call${highRiskCalls.length > 1 ? 's' : ''} detected! Tap to filter.`
          }
          type="danger"
          onPress={() => setFilterSuspicious(prev => !prev)}
        />
      )}

      {/* Call List */}
      {isLoading && records.length === 0 ? (
        <LoadingSpinner message="Loading call records..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Calls Yet"
          message="Mindshield is monitoring for new call recordings. They'll appear here automatically."
          icon="📱"
        />
      ) : (
        <FlatList
          data={displayedRecords}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          onRefresh={loadRecords}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusActive: {
    backgroundColor: colors.safeBackground,
    borderWidth: 1,
    borderColor: colors.safeBorder,
  },
  statusInactive: {
    backgroundColor: colors.alertBackground,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  statusDot: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  settingsButton: {
    padding: spacing.sm,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
});
