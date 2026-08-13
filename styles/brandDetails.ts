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
  // Banner + overlapping circular avatar composite - confirmed from Figma's
  // pixel positions (173px banner, 62px avatar overlapping its bottom-left
  // corner by 30px, so the composite's total height is 173 + (62-30) = 205).
  bannerWrap: {
    height: 205,
  },
  banner: {
    width: '100%',
    height: 173,
  },
  avatar: {
    position: 'absolute',
    left: 16,
    top: 143,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
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
  verifiedIcon: {
    width: 20,
    height: 20,
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
