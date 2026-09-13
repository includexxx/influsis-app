import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import Image from '../Image';

export interface ProfileHeroProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
  /** The profile's cover photo, shown full-bleed behind the gradient — a
   * darker overlay ramp is used in this case so the title/back/edit chrome
   * stays legible over an arbitrary photo. Omit (or leave unset) for the
   * flat dark ramp + orb used when there's no cover photo yet. */
  coverUri?: string;
  testID?: string;
}

// Fixed dark ramp regardless of light/dark theme — same reasoning as
// Profile.tsx's `heroTopColor`: a flat, single top color so it seams
// invisibly into the status-bar inset the caller paints behind it (pair
// this with a `SafeAreaView` whose own background is `PROFILE_HERO_TOP`,
// edges `['top', 'left', 'right']`, exactly as Profile.tsx does).
export const PROFILE_HERO_TOP = palette.gray[800];
const heroGradient = [PROFILE_HERO_TOP, palette.primaryNavy[800]] as const;
// Same ramp, translucent, laid over a cover photo instead of the flat color.
const heroCoverOverlay = ['rgba(7, 8, 11, 0.45)', 'rgba(23, 22, 58, 0.85)'] as const;

// A fixed warm off-white "paper" tone for the avatar ring that overlaps this
// hero's bottom boundary — deliberately not theme-adaptive, same reasoning
// as `PROFILE_HERO_TOP` above.
export const PROFILE_HERO_AVATAR_RING = '#FBF8F3';

const styles = StyleSheet.create({
  hero: {
    height: 220,
    overflow: 'hidden',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 46, 158, 0.22)',
  },
  row: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: palette.white,
  },
});

// The dark editorial hero band shared by the profile read view
// (scenes/main/MyProfile.tsx) and its edit form (scenes/main/EditProfile.tsx)
// — a fixed dark gradient with a soft brand-pink orb, replacing the plain
// `ScreenHeader` those screens used before. Deliberately just the band
// itself: each caller positions its own avatar overlapping the boundary
// below it, since a read-only avatar and an editable one need different
// wrapping.
function ProfileHero({ title, onBack, rightElement, coverUri, testID }: ProfileHeroProps) {
  return (
    <View style={styles.hero} testID={testID}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
      ) : null}
      <LinearGradient colors={coverUri ? heroCoverOverlay : heroGradient} style={styles.overlay} />
      {!coverUri ? <View style={styles.orb} /> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.side}
          onPress={onBack}>
          <Feather name="chevron-left" size={24} color={palette.white} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {rightElement ?? <View style={styles.side} />}
      </View>
    </View>
  );
}

export default ProfileHero;
