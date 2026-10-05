import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Home scene (scenes/home/Home.tsx), reused
// directly the same way layoutStyle/profileStepStyle are reused by their
// own scenes. Component-internal look (CampaignCard, GigCard, ...) lives
// with those components instead - this file only holds shapes the scene
// file itself assembles sections out of.
export const homeStyle = StyleSheet.create({
  // Vertical gap between Home's sections (the top group, Active Campaigns,
  // Businesses, New Campaigns, Top Rated Creators).
  sectionGap: {
    gap: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  // Header, greeting, earnings card and quick actions sit closer together -
  // they read as one "you" block above the content sections.
  topGroup: {
    gap: spacing.lg,
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
  // Gap between the named avatar tiles in the Businesses / Top Rated
  // Creators rows (used as the horizontal ScrollView's content style).
  avatarListGap: {
    gap: 8,
  },
  // Vertical gap between stacked cards in the full-width "Campaigns" list.
  campaignListGap: {
    gap: 12,
  },
});
