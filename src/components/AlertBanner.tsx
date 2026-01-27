import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, fonts, spacing, borderRadius, touchTarget} from '../styles/theme';

type AlertType = 'danger' | 'warning' | 'info';

interface AlertBannerProps {
  message: string;
  type: AlertType;
  onDismiss?: () => void;
}

function getAlertColors(type: AlertType): {background: string; text: string; border: string} {
  switch (type) {
    case 'danger':
      return {
        background: colors.alertBackground,
        text: colors.riskRed,
        border: colors.alertBorder,
      };
    case 'warning':
      return {
        background: colors.warningBackground,
        text: '#E65100', // dark orange for readability on yellow bg
        border: colors.warningBorder,
      };
    case 'info':
      return {
        background: '#E3F2FD', // light blue
        text: colors.primary,
        border: '#90CAF9', // blue border
      };
  }
}

const AlertBanner: React.FC<AlertBannerProps> = ({message, type, onDismiss}) => {
  const alertColors = getAlertColors(type);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: alertColors.background,
          borderColor: alertColors.border,
        },
      ]}
      accessibilityRole="alert">
      <Text style={[styles.message, {color: alertColors.text}]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert">
          <Text style={[styles.dismissText, {color: alertColors.text}]}>
            {'\u2715'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightBold,
    lineHeight: 26,
  },
  dismissButton: {
    minWidth: touchTarget.minWidth,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  dismissText: {
    fontSize: fonts.sizeLarge,
    fontWeight: fonts.weightBold,
  },
});

export default AlertBanner;
