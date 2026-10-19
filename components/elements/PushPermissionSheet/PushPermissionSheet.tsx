import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import BottomSheet from '../BottomSheet';
import Button from '../Button';

export type PushPermissionSheetStatus = 'unavailable' | 'settings' | null;

export interface PushPermissionSheetProps {
  /** A follow-up line after "Turn on" didn't work out. */
  status?: PushPermissionSheetStatus;
  busy?: boolean;
  onTurnOn: () => void;
  onNotNow: () => void;
}

const STATUS_COPY: Record<Exclude<PushPermissionSheetStatus, null>, string> = {
  unavailable: 'Push unavailable on this device',
  settings: 'You can turn notifications on later in your phone settings',
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  primary: {
    height: 48,
    borderRadius: 24,
  },
  primaryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  secondary: {
    height: 44,
  },
  secondaryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

// The in-app explainer shown before the OS push permission prompt
// (build-plan 38e1; backend PUSH_NOTIFICATIONS §12.1). Never on first launch:
// components/layouts/PushPromptHost.tsx shows it after a moment that makes
// the value obvious. Presentational only.
function PushPermissionSheet({
  status = null,
  busy,
  onTurnOn,
  onNotNow,
}: PushPermissionSheetProps) {
  const { colors, palette } = useTheme();

  return (
    <BottomSheet isOpen initialOpen onClose={onNotNow}>
      <View
        style={[styles.content, { backgroundColor: colors.card }]}
        testID="push-permission-sheet">
        <View style={[styles.iconCircle, { backgroundColor: palette.primary[400] }]}>
          <Feather name="bell" size={26} color={palette.white} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text.primary }]}>
          Turn on notifications?
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Get a heads-up when a business invites you, replies to your request or accepts your offer,
          even when Influsis is closed.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Turn on"
            accessibilityRole="button"
            isLoading={busy}
            disabled={busy}
            onPress={onTurnOn}
            style={[styles.primary, { backgroundColor: palette.primary[400] }]}
            titleStyle={[styles.primaryTitle, { color: palette.white }]}
            testID="push-permission-turn-on"
          />
          <Button
            title="Not now"
            accessibilityRole="button"
            disabled={busy}
            onPress={onNotNow}
            style={styles.secondary}
            titleStyle={[styles.secondaryTitle, { color: colors.text.secondary }]}
            testID="push-permission-not-now"
          />
        </View>
        {status ? (
          <Text accessibilityRole="alert" style={[styles.status, { color: colors.text.secondary }]}>
            {STATUS_COPY[status]}
          </Text>
        ) : null}
      </View>
    </BottomSheet>
  );
}

export default PushPermissionSheet;
