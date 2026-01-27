import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {CallRecord} from '../types/CallRecord';
import RiskBadge from './RiskBadge';
import {colors, fonts, spacing, touchTarget, borderRadius} from '../styles/theme';

interface CallListItemProps {
  record: CallRecord;
  onPress: (id: string) => void;
}

/**
 * Returns a simple relative time string such as "2 min ago", "3 hours ago",
 * or "5 days ago". Falls back to a short date string for very old dates.
 */
function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();

  if (isNaN(then)) {
    return dateString;
  }

  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'just now';
  }
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  // Fallback to a readable date
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

const CallListItem: React.FC<CallListItemProps> = ({record, onPress}) => {
  const isPending = record.transcription_status !== 'completed';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(record.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Call ${record.file_name}, ${formatRelativeTime(record.detected_at)}${
        record.risk_level ? `, risk level ${record.risk_level}` : ''
      }`}>
      <View style={styles.badgeColumn}>
        <RiskBadge level={record.risk_level} size={20} />
      </View>

      <View style={styles.contentColumn}>
        <Text style={styles.fileName} numberOfLines={1}>
          {record.file_name}
        </Text>
        <Text style={styles.dateText}>
          {formatRelativeTime(record.detected_at)}
        </Text>
        {isPending && (
          <Text style={styles.statusText}>
            {record.transcription_status === 'pending'
              ? 'Waiting to process...'
              : record.transcription_status === 'processing'
              ? 'Processing...'
              : 'Transcription failed'}
          </Text>
        )}
      </View>

      <View style={styles.chevronColumn}>
        <Text style={styles.chevron}>{'\u203A'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  badgeColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  fileName: {
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightMedium,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: fonts.sizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: fonts.sizeSmall,
    color: colors.accent,
    fontWeight: fonts.weightMedium,
    marginTop: 2,
  },
  chevronColumn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: fonts.sizeHeader,
    color: colors.textMuted,
    fontWeight: fonts.weightBold,
  },
});

export default CallListItem;
