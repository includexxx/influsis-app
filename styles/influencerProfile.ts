import { StyleSheet } from 'react-native';

// Shared fragments for the Influencer Profile scene
// (scenes/main/InfluencerProfile.tsx). Like Gig Details, the banner photo
// is full-bleed (no horizontal padding) - see the scene file for how the
// content below it applies its own padding instead of reusing
// layoutStyle.scrollContent for the whole screen.
export const influencerProfileStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Banner + overlapping avatar composite - confirmed from Figma's pixel
  // positions (178px banner, 78px avatar overlapping its bottom-left
  // corner by 51px, so the composite's total height is 178 + (78-51) =
  // 205).
  bannerWrap: {
    height: 205,
  },
  banner: {
    width: '100%',
    height: 178,
  },
  avatar: {
    position: 'absolute',
    left: 16,
    top: 127,
    width: 78,
    height: 78,
    borderRadius: 8,
    borderWidth: 3,
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
    lineHeight: 30,
    fontWeight: '600',
  },
  verifiedIcon: {
    width: 13,
    height: 12.5,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  // Gap above each major section - confirmed from Figma's pixel positions
  // (name/bio block bottom at y=446, "Active Gigs" top at y=462; gig row
  // bottom at y=718, "Tags" top at y=742; tag pills bottom at y=808,
  // "Customer Review" top at y=824).
  activeGigsSection: {
    marginTop: 16,
  },
  tagsSection: {
    marginTop: 24,
  },
  reviewsHeaderSection: {
    marginTop: 16,
  },
  // Gap between a section title and its content below it - confirmed from
  // Figma's pixel positions (e.g. "Active Gigs" bottom at y=492, first gig
  // card top at y=500).
  sectionHeaderGap: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
  },
  gigsRowGap: {
    gap: 8,
  },
  gigCard: {
    width: 356,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    height: 28,
    borderRadius: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    fontSize: 14,
    lineHeight: 21,
  },
  reviewsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  // Vertical gap between stacked review cards - confirmed from Figma's
  // pixel positions (cards at y=866/1074/1282, each 192px tall).
  reviewsGap: {
    gap: 16,
  },
});
