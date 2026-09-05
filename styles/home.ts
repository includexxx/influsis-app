import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Home scene (scenes/main/Home.tsx), reused
// directly the same way layoutStyle/profileStepStyle are reused by their
// own scenes. Component-internal look (CampaignCard, GigCard, ...) lives
// with those components instead - this file only holds shapes the scene
// file itself assembles sections out of.
export const homeStyle = StyleSheet.create({
  // Vertical gap between the six Home sections (Active Campaigns, Brand,
  // Popular Campaigns, Campaigns, Top Gigs, Top Rated Influencer).
  sectionGap: {
    gap: spacing['3xl'],
  },
  // Gap between a section's SectionHeader and its content list.
  sectionHeaderGap: {
    marginBottom: spacing.lg,
  },
  // Horizontal gap confirmed from Figma across the Active Campaigns
  // carousel, Popular Campaigns row, and Top Gigs row (398/356/127-wide
  // cards all use the same 8px gap).
  horizontalListGap: {
    gap: 8,
  },
  // Gap between circular avatars in the Brand logo / Top Rated Influencer
  // rows - Figma's own spacing here is inconsistent (14-16px between
  // instances), normalized to 12.
  avatarListGap: {
    gap: 12,
  },
  // Vertical gap between stacked cards in the full-width "Campaigns" list.
  campaignListGap: {
    gap: 12,
  },
});
