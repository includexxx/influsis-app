import { StyleSheet } from 'react-native';
import { palette, radius } from '@/theme';

// The Submit delivery screen (SubmitDeliveryScreen.tsx). Cards, the source
// segmented control, image preview, dropzone, notices and buttons come from
// the piece screen's deliverablePiece.style.ts; these are the extras a slot
// needs.
export const submitDeliveryStyle = StyleSheet.create({
  slotHeader: { gap: 2 },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.warning[50],
  },
  commentText: { flex: 1, fontSize: 14, lineHeight: 21, color: palette.warning[700] },
  metaStrong: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 19 },
});
