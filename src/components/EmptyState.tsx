import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, fonts, spacing} from '../styles/theme';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = '\uD83D\uDCC2', // folder emoji default
}) => {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizeHeader, // 24sp
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
});

export default EmptyState;
