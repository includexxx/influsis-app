import { ReactNode } from 'react';
import { Animated, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { palette } from '@/theme';
import { useSkeletonPulse } from '@/scenes/campaigns/hooks/useSkeletonPulse';

export const AVATAR_TILE_SIZE = 64;
const TILE_WIDTH = 78;

export interface AvatarTileProps {
  /** The avatar itself (BusinessAvatar / CreatorAvatar at AVATAR_TILE_SIZE). */
  avatar: ReactNode;
  name: string;
  verified?: boolean;
  onPress?: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  tile: { width: TILE_WIDTH, alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.7 },
  ring: {
    padding: 3,
    borderRadius: (AVATAR_TILE_SIZE + 10) / 2,
    borderWidth: 2,
  },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary[500],
  },
  name: { width: TILE_WIDTH, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
  skeletonCircle: {
    width: AVATAR_TILE_SIZE + 10,
    height: AVATAR_TILE_SIZE + 10,
    borderRadius: (AVATAR_TILE_SIZE + 10) / 2,
  },
  skeletonLabel: { width: 52, height: 12, borderRadius: 6 },
});

// Home's Business and Top Rated Creator rows: an avatar in a brand ring with
// the name underneath (a logo alone doesn't say who it is), and a check
// badge for verified accounts. The whole tile is one labelled button.
function AvatarTile({ avatar, name, verified, onPress, testID }: AvatarTileProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={verified ? `${name}, verified` : name}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      testID={testID}>
      <View style={[styles.ring, { borderColor: verified ? palette.primary[200] : colors.border }]}>
        {avatar}
        {verified ? (
          <View style={[styles.verified, { borderColor: colors.background }]}>
            <Feather name="check" size={11} color={palette.white} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

// Loading placeholder with the same footprint as AvatarTile.
export function AvatarTileSkeleton() {
  const opacity = useSkeletonPulse();
  return (
    <View style={styles.tile} testID="avatar-tile-skeleton">
      <Animated.View
        style={[styles.skeletonCircle, { backgroundColor: palette.gray[50], opacity }]}
      />
      <Animated.View
        style={[styles.skeletonLabel, { backgroundColor: palette.gray[50], opacity }]}
      />
    </View>
  );
}

export default AvatarTile;
