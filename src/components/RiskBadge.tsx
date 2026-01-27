import React from 'react';
import {View, StyleSheet} from 'react-native';
import {getRiskColor} from '../utils/riskLevel';
import {RiskLevel} from '../types/CallRecord';

interface RiskBadgeProps {
  level: RiskLevel | null;
  size?: number;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({level, size = 20}) => {
  const color = getRiskColor(level);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        level ? `Risk level: ${level}` : 'Risk level: pending'
      }
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    // Base styles; dimensions and color applied inline
  },
});

export default RiskBadge;
