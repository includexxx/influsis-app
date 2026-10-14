import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import FallbackImage from '@/components/elements/FallbackImage';
import { InvitationCardModel } from '../../utils/mapApplication';
import { statusToneColors } from './applicationStatus';

export interface InvitationCardProps extends InvitationCardModel {
  /**
   * `true` for an invitation already mid-negotiation (`countered`): it has
   * no quick Accept/Decline and is answered on its Offer screen instead.
   */
  negotiating: boolean;
  /** Dims and disables both actions, e.g. while a decline is being sent. */
  disabled?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 14,
  },
  pressed: {
    opacity: 0.96,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  eyebrowText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  facts: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 10,
  },
  fact: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 2,
  },
  factDivider: {
    width: StyleSheet.hairlineWidth,
  },
  factLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  factValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineAction: {
    borderWidth: 1,
  },
  actionPressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  continueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});

// A business's campaign invitation on the Applications screen's Invited tab:
// the campaign's avatar and title under a "New invitation" (or
// "Negotiating") eyebrow, a facts strip with the offer/budget and the
// application deadline, then the response. A fresh invitation gets a
// Decline / Accept pair - Accept opens the Offer screen with the agreement
// up, so accepting is never one tap. One mid-negotiation points to its
// Offer screen instead. The card body opens the Offer screen either way.
function InvitationCard({
  avatar,
  title,
  amountLabel,
  amount,
  deadline,
  time,
  negotiating,
  disabled = false,
  onAccept,
  onDecline,
  onPress,
  testID,
}: InvitationCardProps) {
  const { colors, palette, isDark } = useTheme();
  const eyebrowTone = statusToneColors(negotiating ? 'warning' : 'primary', isDark);
  const accent = isDark ? palette.primary[300] : palette.primary[500];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Invitation to ${title}, ${amountLabel} ${amount}`}
      accessibilityHint="Opens the offer details"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        getShadowStyle('sm'),
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.top}>
        <FallbackImage source={avatar} name={title} style={styles.avatar} />
        <View style={styles.identity}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrow, { backgroundColor: eyebrowTone.background }]}>
              <Feather
                name={negotiating ? 'repeat' : 'mail'}
                size={11}
                color={eyebrowTone.foreground}
              />
              <Text style={[styles.eyebrowText, { color: eyebrowTone.foreground }]}>
                {negotiating ? 'Negotiating' : 'New invitation'}
              </Text>
            </View>
            <Text style={[styles.time, { color: colors.text.secondary }]}>{time}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <View style={[styles.facts, { backgroundColor: colors.surface }]}>
        <View style={styles.fact}>
          <Text style={[styles.factLabel, { color: colors.text.secondary }]}>{amountLabel}</Text>
          <Text style={[styles.factValue, { color: accent }]} numberOfLines={1}>
            {amount}
          </Text>
        </View>
        <View style={[styles.factDivider, { backgroundColor: colors.border }]} />
        <View style={styles.fact}>
          <Text style={[styles.factLabel, { color: colors.text.secondary }]}>Apply by</Text>
          <Text style={[styles.factValue, { color: colors.text.primary }]} numberOfLines={1}>
            {deadline ?? 'Open'}
          </Text>
        </View>
      </View>

      {negotiating ? (
        <View style={[styles.continueRow, { backgroundColor: eyebrowTone.background }]}>
          <Text style={[styles.continueText, { color: eyebrowTone.foreground }]}>
            Continue the negotiation
          </Text>
          <Feather name="arrow-right" size={16} color={eyebrowTone.foreground} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decline the invitation to ${title}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onDecline}
            testID={testID ? `${testID}-decline` : undefined}
            style={({ pressed }) => [
              styles.action,
              styles.declineAction,
              { borderColor: colors.border, backgroundColor: colors.card },
              pressed && styles.actionPressed,
              disabled && styles.disabled,
            ]}>
            <Feather name="x" size={16} color={colors.text.primary} />
            <Text style={[styles.actionLabel, { color: colors.text.primary }]}>Decline</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Accept the invitation to ${title}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onAccept}
            testID={testID ? `${testID}-accept` : undefined}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
              disabled && styles.disabled,
            ]}>
            <LinearGradient
              colors={[palette.primary[400], palette.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check" size={16} color={palette.white} />
            <Text style={[styles.actionLabel, { color: palette.white }]}>Accept</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export default memo(InvitationCard);
