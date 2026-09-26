import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';

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
const withdrawGradient = [palette.secondary[300], palette.secondary[400]] as const;

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  // Behind the hero's rounded bottom corners, so they read as sitting on the
  // withdraw strip.
  rootWithWithdraw: {
    backgroundColor: palette.secondary[400],
  },
  hero: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  // Decorative magenta glow in the top-right corner (the reference design's
  // light streak, in the app's brand color).
  glow: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 46, 158, 0.28)',
  },
  glowSmall: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(244, 46, 158, 0.12)',
  },
  helpPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: palette.white,
  },
  helpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.gray[500],
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[100],
  },
  amount: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: palette.white,
    marginTop: 2,
  },
  amountPlaceholder: {
    width: 140,
    height: 36,
    borderRadius: radius.md,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  cta: {
    height: 48,
    marginTop: spacing.xl,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.gray[500],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: palette.white,
  },
  memberSince: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.gray[100],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: radius.full,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  withdraw: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  withdrawLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.gray[800],
  },
});

// The creator's earnings summary at the top of Home: total earned, a call to
// action to go find paid work, who they are (handle, member since,
// verification badge), and a shortcut into the withdraw flow. Adapted from
// a wallet-style hero card to the app's palette: the dark ProfileHero ramp
// with a magenta glow, a white CTA, and a brand-green withdraw strip that
// the dark hero overlaps.
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
    <View style={[styles.root, onWithdrawPress && styles.rootWithWithdraw, style]} testID={testID}>
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.glow} />
        <View style={styles.glowSmall} />

        {onHelpPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Need help?"
            onPress={onHelpPress}
            hitSlop={6}
            style={styles.helpPill}>
            <Feather name="help-circle" size={16} color={palette.primary[400]} />
            <Text style={styles.helpLabel}>Need help?</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Total earned</Text>
        {totalEarned === null ? (
          <View style={styles.amountPlaceholder} testID="earnings-card-amount-loading" />
        ) : (
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
            {totalEarned}
          </Text>
        )}

        {onCtaPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onCtaPress}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {memberSince ? <Text style={styles.memberSince}>{memberSince}</Text> : null}
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeVerified ? palette.primary[400] : 'rgba(255, 255, 255, 0.14)',
              },
            ]}>
            {badgeVerified && <Feather name="check-circle" size={14} color={palette.white} />}
            <Text
              style={[
                styles.badgeLabel,
                { color: badgeVerified ? palette.white : palette.gray[100] },
              ]}>
              {badgeLabel}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {onWithdrawPress && (
        <Pressable accessibilityRole="button" onPress={onWithdrawPress}>
          <LinearGradient
            colors={withdrawGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.withdraw}>
            <Text style={styles.withdrawLabel}>Withdraw now</Text>
            <Feather name="chevron-right" size={22} color={palette.gray[800]} />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

export default EarningsCard;
