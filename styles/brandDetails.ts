import { StyleSheet } from 'react-native';

// Shared fragments for the Brand Details scene (scenes/main/BrandDetails.tsx).
// Like Gig Details and Influencer Profile, the banner photo is full-bleed
// (no horizontal padding) - see the scene file for how the content below it
// applies its own padding instead of reusing layoutStyle.scrollContent for
// the whole screen.
export const brandDetailsStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Banner + overlapping circular avatar composite now lives in the shared
  // `ProfileBanner` component (components/elements/ProfileBanner).
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  globeIcon: {
    width: 16,
    height: 16,
  },
  website: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 30,
    fontWeight: '600',
    marginTop: 16,
  },
  // Gap between the "Ongoing Campaign" title and the first card below it -
  // confirmed from Figma's pixel positions (title bottom at y=496, first
  // card top at y=504).
  campaignListGap: {
    marginTop: 8,
    gap: 16,
  },
});
