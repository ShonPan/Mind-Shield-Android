import React from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

function getButtonStyle(variant: ButtonVariant): ViewStyle {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: colors.primary,
        borderWidth: 0,
      };
    case 'secondary':
      return {
        backgroundColor: colors.background,
        borderWidth: 2,
        borderColor: colors.primary,
      };
    case 'danger':
      return {
        backgroundColor: colors.riskRed,
        borderWidth: 0,
      };
  }
}

function getTextStyle(variant: ButtonVariant): TextStyle {
  switch (variant) {
    case 'primary':
      return {color: colors.textOnDark};
    case 'secondary':
      return {color: colors.primary};
    case 'danger':
      return {color: colors.textOnDark};
  }
}

function getLoaderColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return colors.textOnDark;
    case 'secondary':
      return colors.primary;
    case 'danger':
      return colors.textOnDark;
  }
}

const BigButton: React.FC<BigButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  const buttonStyle = getButtonStyle(variant);
  const textStyle = getTextStyle(variant);
  const loaderColor = getLoaderColor(variant);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: disabled || loading, busy: loading}}>
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
  },
  buttonText: {
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightBold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default BigButton;
