import { StyleSheet } from 'react-native';

// Shared fragments for the Campaign Details scene
// (scenes/main/CampaignDetails.tsx). Like Business Details, the banner photo
// is full-bleed (no horizontal padding) - see the scene file for how the
// content below it applies its own padding instead of reusing
// layoutStyle.scrollContent for the whole screen.
export const campaignDetailsStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Banner + overlapping circular avatar composite - same geometry as
  // Business Details (173px banner, 62px avatar overlapping its bottom-left
  // corner by 30px, so the composite's total height is 173 + (62-30) = 205)
  // since Figma reuses the exact same banner/avatar photo pair.
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
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  businessName: {
    fontSize: 12,
    lineHeight: 18,
  },
  verifiedIcon: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    marginTop: 24,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  // Gap between a section title and its content below it (bullet list /
  // deliverable cards) - confirmed from Figma's pixel positions (e.g.
  // "Requirements" bottom at y=693, first bullet top at y=699).
  sectionHeaderGap: {
    marginTop: 8,
  },
  // Vertical gap between stacked deliverable cards - confirmed from
  // Figma's pixel positions (cards at y=900/994/1088, 84px tall → 10px
  // gap).
  deliverablesGap: {
    gap: 10,
  },
  footerActions: {
    alignItems: 'center',
    marginTop: 24,
  },
  visitWebsiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  websiteIcon: {
    width: 24,
    height: 24,
  },
  visitWebsiteLabel: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  calendarIcon: {
    width: 20,
    height: 20,
  },
  deadlineLabel: {
    fontSize: 14,
    lineHeight: 28,
  },
  applyButton: {
    marginTop: 16,
    width: '100%',
  },
});
