import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import { StatusTone, statusToneColors } from './applicationStatus';

export type ApplicationsEmptyVariant = 'applied' | 'invited' | 'completed' | 'error';

export interface ApplicationsEmptyStateProps {
  variant: ApplicationsEmptyVariant;
  /** The button under the copy: "Try again" on error, "Browse campaigns" on Applied. */
  onAction?: () => void;
}

const COPY: Record<
  ApplicationsEmptyVariant,
  {
    icon: ComponentProps<typeof Feather>['name'];
    tone: StatusTone;
    title: string;
    description: string;
    action?: string;
  }
> = {
  applied: {
    icon: 'send',
    tone: 'primary',
    title: "You haven't applied to any campaigns",
    description: 'Find a campaign that fits your audience and send your first pitch.',
    action: 'Browse campaigns',
  },
  invited: {
    icon: 'inbox',
    tone: 'navy',
    title: 'No invitations yet',
    description: 'When a business invites you to a campaign, it lands here for you to answer.',
  },
  completed: {
    icon: 'award',
    tone: 'success',
    title: 'No completed campaigns yet',
    description: 'Campaigns show up here once the business approves your final delivery.',
  },
  error: {
    icon: 'wifi-off',
    tone: 'error',
    title: 'Something went wrong',
    description: "We couldn't load your campaigns. Check your connection and try again.",
    action: 'Try again',
  },
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  halo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  action: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
});

// Empty / error state for one Applications tab: a tinted icon on a raised
// disc inside a soft halo, a title and description, and - when the tab has a next step - a
// button ("Browse campaigns" on Applied, "Try again" on error).
export default function ApplicationsEmptyState({ variant, onAction }: ApplicationsEmptyStateProps) {
  const { colors, palette, isDark } = useTheme();
  const copy = COPY[variant];
  const tone = statusToneColors(copy.tone, isDark);

  return (
    <View style={styles.root} testID={`applications-empty-${variant}`}>
      <View style={[styles.halo, { backgroundColor: tone.background }]}>
        <View style={[styles.iconCircle, getShadowStyle('sm'), { backgroundColor: colors.card }]}>
          <Feather name={copy.icon} size={30} color={tone.foreground} />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>{copy.title}</Text>
      <Text style={[styles.description, { color: colors.text.secondary }]}>{copy.description}</Text>
      {copy.action && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: isDark ? palette.primary[400] : palette.primary[500] },
            pressed && styles.pressed,
          ]}>
          <Feather
            name={variant === 'error' ? 'refresh-cw' : 'compass'}
            size={16}
            color={palette.white}
          />
          <Text style={[styles.actionLabel, { color: palette.white }]}>{copy.action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
