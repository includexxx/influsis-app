import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Gap between the two Grid-view columns (and between Grid rows).
export const GRID_GAP = 12;
// Gap between Stack-view cards.
const STACK_GAP = 12;

// Shared fragments for the Top Creators scene (scenes/creator/TopCreators.tsx),
// the same shapes as scenes/business/businesses.style.ts. The list is a
// virtualized FlatList rather than a ScrollView, so (unlike most other
// scenes) this module carries the horizontal padding too - there's no shared
// scrollContent contentContainerStyle to supply it.
export const topCreatorsStyle = StyleSheet.create({
  headerGap: {
    marginBottom: 8,
    paddingHorizontal: spacing.lg,
  },
  // The FlatList's contentContainerStyle (and the loading/error frame).
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // "All creators" + subtitle on the left, the Stack/Grid toggle on the
  // right. Rendered as the list header so it scrolls away with the list.
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  toolbarText: { flex: 1, gap: 2 },
  toolbarTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  toolbarSubtitle: { fontSize: 13, lineHeight: 18 },
  stackSeparator: { height: STACK_GAP },
  // Grid rows: FlatList applies this per row via `columnWrapperStyle`.
  columnWrapper: { gap: GRID_GAP, marginBottom: GRID_GAP },
  stackSkeletons: { gap: STACK_GAP },
  gridSkeletons: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  footer: { marginTop: STACK_GAP },
});
