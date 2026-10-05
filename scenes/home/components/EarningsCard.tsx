import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getShadowStyle, palette, radius, spacing } from '@/theme';

export interface EarningsCardProps {
  /** Formatted amount, e.g. "BDT 6,000". `null` while it's loading. */
  totalEarned: string | null;
  /** "@handle", or the creator's name when no handle is set. */
  displayName: string;
  /** e.g. "Creator since Sep 2026". */
  memberSince?: string | null;
  badgeLabel: string;
  badgeVerified?: boolean;
  ctaLabel?: string;
  onCtaPress?: () => void;
  onWithdrawPress?: () => void;
  onHelpPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// The same dark ramp as ProfileHero, so the card reads as part of the
// creator's own space rather than another campaign card.
const heroGradient = [palette.gray[800], palette.primaryNavy[800]] as const;

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl + 4,
    overflow: 'hidden',
    backgroundColor: palette.primaryNavy[800],
    ...getShadowStyle('lg'),
  },
  hero: {
    padding: spacing.lg + 2,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  // Decorative magenta glows (the reference design's light streak, in the
  // app's brand color).
  glow: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(244, 46, 158, 0.3)',
  },
  glowSmall: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(244, 46, 158, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.full,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  helpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  helpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.white,
  },
  amountBlock: { gap: 4 },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  amount: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: palette.white,
  },
  amountPlaceholder: {
    width: 160,
    height: 36,
    borderRadius: radius.md,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: palette.white,
  },
  memberSince: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cta: {
    flexDirection: 'row',
    gap: 8,
    height: 50,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  pressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.gray[500],
  },
  withdraw: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: 14,
    backgroundColor: palette.secondary[400],
  },
  withdrawIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  withdrawText: { flex: 1 },
  withdrawLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: palette.gray[800],
  },
  withdrawHint: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.secondary[900],
  },
});

// The creator's earnings summary at the top of Home: verification badge and
// help shortcut, total earned, who they are (handle, member since), a call to
// action to go find paid work, and a shortcut into the withdraw flow. A
// wallet-style card in the app's palette: the dark ProfileHero ramp with a
// magenta glow, a white CTA, and a brand-green withdraw bar.
function EarningsCard({
  totalEarned,
  displayName,
  memberSince,
  badgeLabel,
  badgeVerified = false,
  ctaLabel = 'Find campaigns to earn',
  onCtaPress,
  onWithdrawPress,
  onHelpPress,
  style,
  testID,
}: EarningsCardProps) {
  return (
    <View style={[styles.root, style]} testID={testID}>
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.glow} />
        <View style={styles.glowSmall} />

        <View style={styles.topRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeVerified ? palette.primary[400] : 'rgba(255, 255, 255, 0.14)',
              },
            ]}>
            <Feather
              name={badgeVerified ? 'check-circle' : 'shield'}
              size={13}
              color={badgeVerified ? palette.white : palette.gray[100]}
            />
            <Text
              style={[
                styles.badgeLabel,
                { color: badgeVerified ? palette.white : palette.gray[100] },
              ]}>
              {badgeLabel}
            </Text>
          </View>

          {onHelpPress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Need help?"
              onPress={onHelpPress}
              hitSlop={8}
              style={({ pressed }) => [styles.helpPill, pressed && styles.pressed]}>
              <Feather name="help-circle" size={14} color={palette.white} />
              <Text style={styles.helpLabel}>Need help?</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.label}>Total earned</Text>
          {totalEarned === null ? (
            <View style={styles.amountPlaceholder} testID="earnings-card-amount-loading" />
          ) : (
            <Text
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityLabel={`Total earned ${totalEarned}`}>
              {totalEarned}
            </Text>
          )}
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {memberSince ? (
              <>
                <View style={styles.identityDot} />
                <Text style={styles.memberSince} numberOfLines={1}>
                  {memberSince}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {onCtaPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onCtaPress}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Feather name="search" size={17} color={palette.gray[500]} />
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
        )}
      </LinearGradient>

      {onWithdrawPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Withdraw now"
          onPress={onWithdrawPress}
          style={({ pressed }) => [styles.withdraw, pressed && styles.pressed]}>
          <View style={styles.withdrawIcon}>
            <Feather name="arrow-up-right" size={18} color={palette.gray[800]} />
          </View>
          <View style={styles.withdrawText}>
            <Text style={styles.withdrawLabel}>Withdraw now</Text>
            <Text style={styles.withdrawHint}>Move your earnings to bKash or your bank</Text>
          </View>
          <Feather name="chevron-right" size={20} color={palette.gray[800]} />
        </Pressable>
      )}
    </View>
  );
}

export default EarningsCard;
