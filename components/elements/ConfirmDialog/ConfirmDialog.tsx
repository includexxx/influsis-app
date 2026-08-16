import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { buttonStyle as sharedButton } from '@/styles';
import { radius, spacing } from '@/theme';
import Image from '../Image';
import Button from '../Button';

const closeIcon = require('@/assets/images/account/close.png');

export interface ConfirmDialogProps {
  title: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel: string;
  onSecondaryPress: () => void;
  onClose: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 312,
    borderRadius: radius.xl,
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    borderRadius: radius.md,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Centered confirmation popup (Figma "Pop Up", node 6027:8251's "Are you
// sure you want to logout?" dialog) - a different shape than `SuccessSheet`
// (a bottom-anchored, non-dismissable-by-backdrop sheet), so it's a new
// component. Uses `Modal` the same way `CustomSelectField` already does in
// this project (see its own header comment) rather than `BottomSheet`,
// since this popup floats centered over a dimmed backdrop instead of
// anchoring to the bottom edge. Caller mounts it only while open, matching
// `SuccessSheet`/`CalendarPicker`'s convention.
//
// Generic beyond just logout: `primaryLabel`/`secondaryLabel` aren't
// hardcoded to "Cancel"/"Log Out" - Figma's own choice to make the
// non-destructive action ("Cancel") the prominent pink button and the
// destructive one ("Log Out") a plain text link is preserved by the caller
// choosing which label goes in which slot, not by this component assuming
// a delete/confirm polarity.
function ConfirmDialog({
  title,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  onClose,
  testID,
}: ConfirmDialogProps) {
  const { colors, palette } = useTheme();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} testID={testID}>
      <View style={styles.overlayRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          testID={testID ? `${testID}-backdrop` : undefined}
        />

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={[styles.closeButton, { backgroundColor: palette.gray[25] }]}
            onPress={onClose}>
            <Image source={closeIcon} style={styles.closeIcon} contentFit="contain" />
          </Pressable>

          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>

          <View style={styles.actions}>
            <Button
              title={primaryLabel}
              titleStyle={sharedButton.primaryTitle}
              style={[sharedButton.primary, styles.primaryButton]}
              onPress={onPrimaryPress}
              testID={testID ? `${testID}-primary` : undefined}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onSecondaryPress}
              testID={testID ? `${testID}-secondary` : undefined}>
              <Text style={[styles.secondaryText, { color: palette.gray[300] }]}>
                {secondaryLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmDialog;
