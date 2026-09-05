import { StyleSheet } from 'react-native';

// Shared fragments for the Brands scene (scenes/main/Brands.tsx).
export const brandsStyle = StyleSheet.create({
  // Gap between the header and the logo grid - confirmed from Figma's
  // pixel positions (title bottom at y=93, grid top at y=109).
  headerGap: {
    marginBottom: 16,
  },
  // Vertical gap between grid rows - confirmed from Figma's pixel positions
  // (rows 122-123px tall starting 24px apart → 24px row gap).
  gridRows: {
    gap: 24,
  },
  // One 4-column row - confirmed from Figma's pixel positions (94px circles
  // at x=0/102/204/306, ~8px column gap). Figma's own grid container is
  // 400px wide (x=15), 2px more than this project's standard 398px content
  // width (16px padding on a 430px screen) - `space-between` instead of a
  // fixed `columnGap` distributes the leftover space automatically so four
  // 94px circles always fit the row regardless of the exact container
  // width. Built as explicit rows of 4 rather than a `flexWrap: 'wrap'`
  // container - the latter needs a definite width from its parent to know
  // when to wrap, which a View inside a vertical ScrollView's content
  // container doesn't reliably get on web, collapsing every item onto its
  // own line instead of 4 per row.
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
