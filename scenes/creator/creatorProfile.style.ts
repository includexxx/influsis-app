import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Extras for the Creator Profile scene (scenes/creator/CreatorProfile.tsx).
// The screen's layout itself - hero, avatar ring, identity block, sections -
// is My Profile's (scenes/profile/myProfile.style.ts), shared on purpose so
// a creator's public profile reads the same as their own view of it.
//
// `headerRow` is also used by My Profile's loading/error states.
export const creatorProfileStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Space between the hero and a full-screen error state below it.
  stateGap: {
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
