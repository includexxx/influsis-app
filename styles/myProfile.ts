import { StyleSheet } from 'react-native';

// Extras for the My Profile scene (scenes/main/MyProfile.tsx) that
// `creatorProfileStyle` doesn't already cover — the banner/avatar/name/bio/
// tag-section primitives are shared with it directly.
export const myProfileStyle = StyleSheet.create({
  headerAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  handleText: {
    fontSize: 14,
    marginTop: 2,
  },
  // creatorProfileStyle.tagRow has no wrap — fine for a handful of fixed
  // creator-card categories, but a real creator's own categories/languages
  // can run to the DTO's cap (20), so this variant wraps.
  tagRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioTile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  portfolioPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  portfolioPlaceholderLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centeredText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
