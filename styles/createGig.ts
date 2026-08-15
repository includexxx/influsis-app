import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the three Create Gig wizard scenes
// (scenes/main/CreateGigBasics.tsx, CreateGigPricing.tsx,
// CreateGigPreview.tsx) - the same "reused across a flow's scene files"
// role styles/profileStep.ts plays for profile-verification. Field-level
// look (TextField/SelectField/Checkbox/ImageUploader) lives with those
// components instead - this file only holds shapes the scene files
// themselves assemble.
export const createGigStyle = StyleSheet.create({
  // Thin rule under the ScreenHeader (Figma "Line 10", node 6525:6048) -
  // none of this project's other ScreenHeader-based screens have one, so
  // it's scoped to this flow rather than added to ScreenHeader itself.
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  // "Service Title" / "Category" / "Description" field labels on the basics
  // step (Figma node 6525:6061 and siblings) - 19px/500, distinct from
  // `sectionTitle` below (22px/600) despite both being section headings;
  // preserved as designed rather than normalized to one shared size.
  fieldLabel: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
    marginBottom: 10,
  },
  // "Pricing" / "What's Included" / "Requirements for buyers" headings on
  // the pricing step (Figma node 6301:8062 and siblings).
  sectionTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
  },
  // Vertical gap between stacked field blocks - matches layoutStyle's
  // 24px `fieldGroup`, confirmed from Figma's basics-step pixel positions
  // (e.g. Category bottom at y=587, Description top at y=611... spacing is
  // 24px between each field block).
  fieldGroup: {
    gap: spacing['2xl'],
  },
  textarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  // Vertical gap between "Pricing" / "What's Included" / "Requirements for
  // buyers" section blocks on the pricing step - 16px per Figma's pixel
  // positions, smaller than the basics step's 24px `fieldGroup`.
  sectionGroup: {
    gap: spacing.lg,
  },
  // Gap between a section's title and its first field, and between stacked
  // fields within one section (e.g. Price -> Delivery Time) - 12px/8px in
  // Figma respectively, close enough to treat as one shared value here.
  sectionBlock: {
    gap: spacing.md,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureInput: {
    flex: 1,
  },
  addItemButton: {
    marginTop: spacing.xs,
  },
  // Full-bleed cover image on the preview step - same size as
  // gigDetailsStyle.image (both are Figma's confirmed 178px-tall hero).
  editIcon: {
    width: 24,
    height: 24,
  },
});
