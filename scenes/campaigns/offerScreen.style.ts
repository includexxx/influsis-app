import { StyleSheet } from 'react-native';
import { palette, radius } from '@/theme';

// Offer screen (scenes/campaigns/OfferScreen.tsx). Content uses
// layoutStyle.scrollContent's 16px gutter; sections are separated by `gap`.
export const offerScreenStyle = StyleSheet.create({
  headerGap: {
    marginBottom: 16,
  },
  content: {
    gap: 20,
    paddingBottom: 32,
  },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  campaignTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: palette.primary[500],
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  thread: {
    gap: 8,
  },
  offerCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  offerCardInactive: {
    opacity: 0.55,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offerMeta: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  offerAmount: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  offerAmountStruck: {
    textDecorationLine: 'line-through',
  },
  offerNote: {
    fontSize: 14,
    lineHeight: 21,
  },
  offerDate: {
    fontSize: 12,
    lineHeight: 18,
  },
  roundsText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 14,
    lineHeight: 21,
  },
  summaryCard: {
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
    backgroundColor: palette.gray[25],
  },
  errorBanner: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.error[50],
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.error[700],
  },
  form: {
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: palette.primary[400],
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  secondaryButton: {
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.primary[400],
    backgroundColor: palette.white,
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary[500],
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.error[600],
  },
  dangerButton: {
    height: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.error[300],
    backgroundColor: palette.white,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
