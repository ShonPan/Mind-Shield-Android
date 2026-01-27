import {StyleSheet} from 'react-native';
import {colors, fonts, spacing} from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: {
    fontSize: fonts.sizeHeader,
    fontWeight: fonts.weightBold,
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: fonts.sizeBody,
    fontWeight: fonts.weightRegular,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  mutedText: {
    fontSize: fonts.sizeSmall,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
});
