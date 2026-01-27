import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {colors, fonts, spacing} from '../styles/theme';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({message}) => {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message || 'Loading'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
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
  message: {
    marginTop: spacing.md,
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
});

export default LoadingSpinner;
