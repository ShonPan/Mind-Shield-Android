import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {getRiskColor} from '../utils/riskLevel';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';
import {RiskLevel} from '../types/CallRecord';

interface RiskScoreBarProps {
  score: number;
  level: RiskLevel | null;
}

const RiskScoreBar: React.FC<RiskScoreBarProps> = ({score, level}) => {
  const fillColor = getRiskColor(level);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <View style={styles.container} accessibilityLabel={`Risk score: ${clampedScore} out of 100`}>
      <Text style={[styles.scoreText, {color: fillColor}]}>
        {clampedScore}
      </Text>
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${clampedScore}%`,
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: fonts.sizeHeader, // 24sp
    fontWeight: fonts.weightBold,
    minWidth: 48,
    textAlign: 'center',
    marginRight: spacing.md,
  },
  barContainer: {
    flex: 1,
  },
  barBackground: {
    height: 16,
    backgroundColor: colors.border, // light gray
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});

export default RiskScoreBar;
