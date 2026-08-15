import { StyleSheet } from 'react-native';

// Shared fragments for the Gig Details scene (scenes/main/GigDetails.tsx).
// Unlike every other detail screen so far, this one's hero image is
// full-bleed (no horizontal padding) - see the scene file for how the
// content below it applies its own padding instead of reusing
// layoutStyle.scrollContent for the whole screen.
export const gigDetailsStyle = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  image: {
    width: '100%',
    height: 178,
  },
  // Gap between the full-bleed image and the padded content below it -
  // confirmed from Figma's pixel positions (image bottom at y=283, price
  // row top at y=299).
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  description: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '600',
  },
  // Gap between a section title and its content below it - confirmed from
  // Figma's pixel positions (e.g. "What I will create" bottom at y=390,
  // first service card top at y=398).
  section: {
    gap: 8,
  },
  // Vertical gap between the three service InfoCards - confirmed from
  // Figma's pixel positions (cards at y=398/498/598, each 84px tall).
  servicesGap: {
    gap: 16,
  },
});
