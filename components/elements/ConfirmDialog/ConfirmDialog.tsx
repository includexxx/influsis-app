import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { buttonStyle as sharedButton } from '@/styles';
import { getShadowStyle, radius, spacing } from '@/theme';
import Button from '../Button';

export type ConfirmDialogTone = 'default' | 'danger';

export interface ConfirmDialogProps {
  title: string;
  /** Optional supporting line under the title. */
  message?: string;
  /** Optional glyph shown in a tinted circle above the title. */
  icon?: React.ComponentProps<typeof Feather>['name'];
  /** `danger` tints the icon circle and the secondary action red - use it
   * when the secondary slot holds the destructive action (e.g. Log Out). */
  tone?: ConfirmDialogTone;
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
    maxWidth: 328,
    borderRadius: 24,
    paddingTop: spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    gap: spacing['2xl'],
    ...getShadowStyle('lg'),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.sm,
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
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  primaryButton: {
    width: '100%',
    borderRadius: radius.md,
  },
  // A full-width text button so the quieter action still gets a 44px tap
  // target.
  secondaryButton: {
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
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
// a delete/confirm polarity. `icon`, `message` and `tone` are optional
// additions (the Profile tab's logout uses all three); leaving them unset
// keeps the plain title-and-actions popup.
function ConfirmDialog({
  title,
  message,
  icon,
  tone = 'default',
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  onClose,
  testID,
}: ConfirmDialogProps) {
  const { colors, palette, isDark } = useTheme();
  const isDanger = tone === 'danger';
  const accent = isDanger ? colors.error : colors.primary;
  const accentWash = isDanger
    ? isDark
      ? 'rgba(249, 112, 102, 0.16)'
      : palette.error[50]
    : isDark
      ? 'rgba(244, 46, 158, 0.18)'
      : palette.primary[50];
  // gray/25 vanishes into the dark theme's card, so the close chip becomes
  // a faint white wash there.
  const closeChip = isDark ? 'rgba(255, 255, 255, 0.08)' : palette.gray[25];

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
            style={[styles.closeButton, { backgroundColor: closeChip }]}
            onPress={onClose}>
            <Feather name="x" size={16} color={palette.gray[300]} />
          </Pressable>

          {icon ? (
            <View style={[styles.iconCircle, { backgroundColor: accentWash }]}>
              <Feather name={icon} size={28} color={accent} />
            </View>
          ) : null}

          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: palette.gray[300] }]}>{message}</Text>
            ) : null}
          </View>

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
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]}
              testID={testID ? `${testID}-secondary` : undefined}>
              <Text
                style={[
                  styles.secondaryText,
                  { color: isDanger ? colors.error : palette.gray[300] },
                ]}>
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
