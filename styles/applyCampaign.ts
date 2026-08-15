import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Apply Campaign scene (scenes/main/ApplyCampaign.tsx).
// Unlike every other detail/wizard screen so far, its header (Figma "Frame
// 265", node 6393:7431) is a bare back chevron with no title next to it -
// the big "Make your application" heading sits separately in the scrollable
// content below, so this screen doesn't use `ScreenHeader` at all.
export const applyCampaignStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing['2xl'],
  },
  heading: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
  },
  // Vertical gap between the heading and its first field, or between
  // stacked recap fields / the dropzone and its file list - 16px per Figma.
  sectionBlock: {
    gap: spacing.lg,
  },
  recapField: {
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  recapText: {
    fontSize: 14,
    lineHeight: 21,
  },
  fileList: {
    gap: spacing.sm,
  },
  // Tighter gap between the two Portfolio Links fields - 8px per Figma,
  // matching styles/createGig.ts's `featureList`.
  linkList: {
    gap: spacing.sm,
  },
});
