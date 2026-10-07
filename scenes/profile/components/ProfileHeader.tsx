import { useState } from 'react';
import { View, Text, Pressable, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { palette } from '@/theme';
import CircleAvatar from '@/components/elements/CircleAvatar';
import Image from '@/components/elements/Image';
import { accountStyle, STATS_OVERLAP } from '../account.style';
import { VerificationTone } from '../utils/profileCompletion';

const fallbackAvatar = require('@/assets/images/account/avatar.png');

// The header's top color. Profile.tsx paints the same color behind the
// status bar and above the content, so the header reads as one surface.
export const PROFILE_HEADER_TOP = palette.primary[400];
const headerGradient = [PROFILE_HEADER_TOP, palette.primary[600], palette.primary[800]] as const;
// Laid over a cover photo instead of the flat ramp: the brand tint stays,
// but darker at the bottom so the white type holds up over any photo.
const coverOverlay = ['rgba(244, 46, 158, 0.55)', 'rgba(84, 3, 41, 0.9)'] as const;

const VERIFICATION_ICONS: Record<VerificationTone, React.ComponentProps<typeof Feather>['name']> = {
  verified: 'check-circle',
  pending: 'clock',
  unverified: 'shield-off',
};

export interface ProfileHeaderProps {
  name: string;
  subtitle: string;
  location?: string;
  avatarUri?: string | null;
  coverUri?: string | null;
  /** Omitted while the profile is loading or for a non-creator account. */
  verification?: { tone: VerificationTone; label: string };
  /** Top safe-area inset; the header paints under the status bar. */
  topInset: number;
  /** Reserve room under the header for the overlapping stats card. */
  withStatsOverlap: boolean;
  onEditPress: () => void;
  onViewProfilePress: () => void;
}

// Brand-gradient identity header for the Profile tab: screen title + edit
// shortcut, avatar (with a verified tick), name, handle/email, location,
// the verification pill and a "View profile" shortcut. The cover photo,
// when the creator has one, shows through a tinted overlay.
export default function ProfileHeader({
  name,
  subtitle,
  location,
  avatarUri,
  coverUri,
  verification,
  topInset,
  withStatsOverlap,
  onEditPress,
  onViewProfilePress,
}: ProfileHeaderProps) {
  // A broken avatar URL falls back to the placeholder photo rather than an
  // empty circle.
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarSource: ImageSourcePropType =
    avatarUri && !avatarFailed ? { uri: avatarUri } : fallbackAvatar;

  return (
    <View
      style={[
        accountStyle.header,
        {
          paddingTop: topInset + 8,
          paddingBottom: withStatsOverlap ? STATS_OVERLAP + 28 : 28,
        },
      ]}
      testID="profile-header">
      {coverUri ? (
        <>
          <Image source={{ uri: coverUri }} style={accountStyle.headerFill} contentFit="cover" />
          <LinearGradient colors={coverOverlay} style={accountStyle.headerFill} />
        </>
      ) : (
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={accountStyle.headerFill}
        />
      )}
      <View style={accountStyle.glowTop} />
      <View style={accountStyle.glowBottom} />

      <View style={accountStyle.topBar}>
        <Text style={accountStyle.screenTitle} accessibilityRole="header">
          Profile
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          hitSlop={8}
          onPress={onEditPress}
          style={({ pressed }) => [accountStyle.glassButton, pressed && accountStyle.pressed]}
          testID="profile-header-edit">
          <Feather name="edit-2" size={18} color={palette.white} />
        </Pressable>
      </View>

      <View style={accountStyle.identity}>
        <View>
          <View style={accountStyle.avatarRing}>
            <CircleAvatar
              source={avatarSource}
              size={76}
              onError={() => setAvatarFailed(true)}
              testID="profile-header-avatar"
            />
          </View>
          {verification?.tone === 'verified' ? (
            <View style={accountStyle.verifiedDot} accessibilityLabel="Verified">
              <Feather name="check" size={13} color={palette.white} />
            </View>
          ) : null}
        </View>

        <View style={accountStyle.identityText}>
          <Text style={accountStyle.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={accountStyle.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          {location ? (
            <View style={accountStyle.metaRow}>
              <Feather name="map-pin" size={12} color="rgba(255, 255, 255, 0.75)" />
              <Text style={accountStyle.metaText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={accountStyle.pillRow}>
        {verification ? (
          <View style={accountStyle.glassPill} testID="profile-header-verification">
            <Feather name={VERIFICATION_ICONS[verification.tone]} size={13} color={palette.white} />
            <Text style={accountStyle.glassPillText}>{verification.label}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onViewProfilePress}
          style={({ pressed }) => [
            accountStyle.glassPill,
            accountStyle.viewProfilePill,
            pressed && accountStyle.pressed,
          ]}
          testID="profile-header-view">
          <Text style={[accountStyle.glassPillText, accountStyle.viewProfileText]}>
            View profile
          </Text>
          <Feather name="arrow-right" size={13} color={palette.primary[600]} />
        </Pressable>
      </View>
    </View>
  );
}
