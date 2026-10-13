import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// The Review screen (scenes/campaigns/ReviewBusinessScreen.tsx) and the
// review section it shares with the Offer and Deliverables screens
// (components/EngagementReviewCard.tsx). No Figma frame yet: the card,
// notice and button shapes follow the Offer screen's.
export const reviewBusinessStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: palette.primary[500],
  },
  heading: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
  },
  block: {
    gap: spacing.md,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    lineHeight: 21,
  },
  textarea: {
    height: 140,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  fieldError: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.error[600],
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primaryNavy[50],
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: palette.primaryNavy[800],
  },
  rootError: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: palette.error[600],
  },
  // One review: who wrote it, the stars, the message, the date.
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  hiddenNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hiddenText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.gray[500],
  },
  // The review section on the Offer / Deliverables screens.
  section: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: palette.primary[400],
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
});
