import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {
  getAllFlaggedNumbers,
  FlaggedNumber,
  getAllCallRecords,
} from '../database/callRecordRepository';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import type {ScamDatabaseScreenProps} from '../types/Navigation';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

// Simulated community data
const COMMUNITY_USERS = 1000;
const AVG_SCAM_LOSS_BY_CATEGORY: Record<string, number> = {
  'Government Impersonation': 3500,
  'Tax Scam': 4200,
  'Tech Support Scam': 1200,
  'Remote Access Fraud': 2800,
  'Banking Scam': 5500,
  'Prize/Lottery Scam': 1800,
  'Romance Scam': 9000,
  'Investment Scam': 12000,
  default: 2000,
};

export function ScamDatabaseScreen({}: ScamDatabaseScreenProps) {
  const [flaggedNumbers, setFlaggedNumbers] = useState<FlaggedNumber[]>([]);
  const [userScamCount, setUserScamCount] = useState(0);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [numbers, records] = await Promise.all([
        getAllFlaggedNumbers(),
        getAllCallRecords(),
      ]);
      setFlaggedNumbers(numbers);

      // Count user's detected scams and categories
      const scamRecords = records.filter(r => r.risk_level === 'red');
      setUserScamCount(scamRecords.length);

      const categories = scamRecords
        .flatMap(r => r.scam_categories || [])
        .filter((v, i, a) => a.indexOf(v) === i);
      setUserCategories(categories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Calculate estimated money saved for this user
  const moneySaved = useMemo(() => {
    if (userCategories.length === 0) return userScamCount * 2000;
    let total = 0;
    for (const cat of userCategories) {
      total += AVG_SCAM_LOSS_BY_CATEGORY[cat] || AVG_SCAM_LOSS_BY_CATEGORY.default;
    }
    return total;
  }, [userCategories, userScamCount]);

  // Calculate community impact (simulated)
  const communityImpact = useMemo(() => {
    const totalReports = flaggedNumbers.reduce((sum, n) => sum + n.times_flagged, 0);
    // Simulate that each flagged number warned ~12-25 other users
    const usersWarned = flaggedNumbers.length * Math.floor(12 + Math.random() * 13);
    // Estimate money saved for community based on warnings
    const communitySaved = usersWarned * 850;
    return {totalReports, usersWarned, communitySaved};
  }, [flaggedNumbers]);

  const formatCurrency = (amount: number) => {
    return '$' + amount.toLocaleString();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderHeader = () => (
    <>
      {/* Community Banner */}
      <View style={styles.communityBanner}>
        <Text style={styles.communityText}>
          You're protected alongside <Text style={styles.communityHighlight}>{COMMUNITY_USERS} other users</Text>
        </Text>
      </View>

      {/* Your Impact */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Protection</Text>
      </View>
      <View style={styles.impactCard}>
        <View style={styles.impactRow}>
          <View style={styles.impactItem}>
            <Text style={styles.impactValue}>{userScamCount}</Text>
            <Text style={styles.impactLabel}>Scams Blocked</Text>
          </View>
          <View style={styles.impactDivider} />
          <View style={styles.impactItem}>
            <Text style={[styles.impactValue, styles.moneyValue]}>
              {formatCurrency(moneySaved)}
            </Text>
            <Text style={styles.impactLabel}>Estimated Saved</Text>
          </View>
        </View>
        {userScamCount > 0 && (
          <Text style={styles.impactNote}>
            Based on average losses from {userCategories.slice(0, 2).join(', ')}
            {userCategories.length > 2 ? ` +${userCategories.length - 2} more` : ''} scams
          </Text>
        )}
      </View>

      {/* Community Impact */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Community Impact</Text>
      </View>
      <View style={styles.communityCard}>
        <View style={styles.communityStats}>
          <View style={styles.communityStat}>
            <Text style={styles.communityStatValue}>
              {flaggedNumbers.length}
            </Text>
            <Text style={styles.communityStatLabel}>Numbers Flagged</Text>
          </View>
          <View style={styles.communityStat}>
            <Text style={styles.communityStatValue}>
              {communityImpact.usersWarned}
            </Text>
            <Text style={styles.communityStatLabel}>Users Warned</Text>
          </View>
          <View style={styles.communityStat}>
            <Text style={[styles.communityStatValue, styles.moneyValue]}>
              {formatCurrency(communityImpact.communitySaved)}
            </Text>
            <Text style={styles.communityStatLabel}>Community Saved</Text>
          </View>
        </View>
        <Text style={styles.communityNote}>
          Your reports help protect others. When you flag a scam number, other Mindshield users are automatically warned.
        </Text>
      </View>

      {/* Flagged Numbers Header */}
      {flaggedNumbers.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flagged Numbers</Text>
          <Text style={styles.sectionSubtitle}>
            {flaggedNumbers.length} known scam {flaggedNumbers.length === 1 ? 'number' : 'numbers'}
          </Text>
        </View>
      )}
    </>
  );

  const renderItem = useCallback(
    ({item}: {item: FlaggedNumber}) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.phoneNumber}>{item.phone_number}</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskScore}>{item.highest_risk_score}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.times_flagged}</Text>
            <Text style={styles.statLabel}>
              {item.times_flagged === 1 ? 'Report' : 'Reports'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatDate(item.first_flagged_at)}
            </Text>
            <Text style={styles.statLabel}>First Seen</Text>
          </View>
        </View>

        {item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: FlaggedNumber) => item.phone_number,
    [],
  );

  if (loading) {
    return <LoadingSpinner message="Loading scam database..." />;
  }

  return (
    <View style={styles.container}>
      {flaggedNumbers.length === 0 ? (
        <>
          {renderHeader()}
          <EmptyState
            title="No Flagged Numbers Yet"
            message="When scam calls are detected, their numbers will be added to this database to help protect the community."
            icon="shield"
          />
        </>
      ) : (
        <FlatList
          data={flaggedNumbers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
  list: {
    paddingBottom: spacing.xl,
  },
  communityBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.safeBackground,
    borderWidth: 1,
    borderColor: colors.safeBorder,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  communityText: {
    fontSize: fonts.sizeBody,
    color: colors.textPrimary,
  },
  communityHighlight: {
    fontWeight: fonts.weightBold,
    color: colors.riskGreen,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: fonts.sizeSmall,
    color: colors.textSecondary,
  },
  impactCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.textOnDark,
    opacity: 0.3,
  },
  impactValue: {
    fontSize: fonts.sizeTitle,
    fontWeight: fonts.weightBold,
    color: colors.textOnDark,
  },
  moneyValue: {
    color: '#4CAF50',
  },
  impactLabel: {
    fontSize: fonts.sizeSmall,
    color: colors.textOnDark,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  impactNote: {
    fontSize: 14,
    color: colors.textOnDark,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  communityCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  communityStat: {
    alignItems: 'center',
  },
  communityStatValue: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
  },
  communityStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  communityNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  phoneNumber: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  riskBadge: {
    backgroundColor: colors.riskRed,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  riskScore: {
    fontSize: fonts.sizeSmall,
    fontWeight: fonts.weightBold,
    color: colors.textOnDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  categoryTag: {
    backgroundColor: colors.alertBackground,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    color: colors.riskRed,
    fontWeight: fonts.weightMedium,
  },
});
