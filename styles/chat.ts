import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the chat detail scene (scenes/main/ChatDetails.tsx).
export const chatStyle = StyleSheet.create({
  // Header row padding + the full-bleed divider under it (Figma "Line 9",
  // node 6279:8222).
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
  },
  // The scrolling transcript between the header and the composer.
  transcript: {
    flex: 1,
  },
  transcriptContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // Vertical gap between consecutive message bubbles - confirmed from
  // Figma's pixel positions (bubble groups at y=197/299/388/490/..., each
  // 90 or 77 tall -> ~12px gap).
  messageGap: {
    gap: 12,
  },
  // Gap below the "Yesterday" date pill before the first bubble.
  dateDividerGap: {
    marginBottom: spacing.xl,
  },
});
