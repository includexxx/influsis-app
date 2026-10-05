import { memo, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle, palette, radius } from '@/theme';
import type { ViewMode } from '@/components/elements/ViewModeToggle';
import { formatCategory, visibleCategories } from '@/utils/categories';
import { formatMemberSince } from '@/scenes/home/utils/earningsCard';
import { CreatorDirectoryItem } from '../types/creatorDirectory';
import { formatCreatorLocation } from '../utils/creatorLocation';
import CreatorAvatar from './CreatorAvatar';

export interface CreatorDirectoryCardProps {
  creator: CreatorDirectoryItem;
  variant?: ViewMode;
  onPress?: (userId: string) => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    ...getShadowStyle('sm'),
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  // --- Stack: a full-width row ---
  stack: { padding: 14, gap: 12 },
  stackTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stackBody: { flex: 1, gap: 3 },

  // --- Grid: a centered tile ---
  grid: { paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 6 },

  ring: { padding: 2, borderWidth: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flexShrink: 1, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  gridName: { textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { flexShrink: 1, fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.primary[25],
  },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: palette.primary[700] },
});

function locationOf(creator: CreatorDirectoryItem): string | null {
  return creator.city || creator.state || creator.country
    ? formatCreatorLocation(creator.city, creator.state, creator.country)
    : null;
}

// One creator in the Top Creators directory (scenes/creator/TopCreators.tsx),
// matching the Businesses directory's BusinessCard. `stack` (the default
// view) is a full-width row with "Creator since" and category chips; `grid`
// is a compact centered tile. Both show the avatar, name, verified mark and
// location, and the whole card is one labelled button.
function CreatorDirectoryCard({
  creator,
  variant = 'stack',
  onPress,
  style,
}: CreatorDirectoryCardProps) {
  const { colors } = useTheme();
  const isGrid = variant === 'grid';
  const verified = creator.verificationStatus === 'verified';
  const location = locationOf(creator);
  const avatarSize = isGrid ? 72 : 56;
  const ringStyle = {
    borderRadius: (avatarSize + 8) / 2,
    borderColor: verified ? palette.primary[200] : colors.border,
  };

  const avatar = (
    <View style={[styles.ring, ringStyle]}>
      <CreatorAvatar
        source={creator.avatarUrl ? { uri: creator.avatarUrl } : null}
        displayName={creator.displayName}
        size={avatarSize}
      />
    </View>
  );

  const name = (
    <View style={styles.nameRow}>
      <Text
        style={[styles.name, isGrid && styles.gridName, { color: colors.text.primary }]}
        numberOfLines={isGrid ? 2 : 1}>
        {creator.displayName}
      </Text>
      {verified ? (
        <View accessibilityLabel="Verified" testID="creator-card-verified">
          <Feather name="check-circle" size={15} color={palette.primary[500]} />
        </View>
      ) : null}
    </View>
  );

  const locationRow = location ? (
    <View style={styles.metaRow}>
      <Feather name="map-pin" size={12} color={colors.text.secondary} />
      <Text style={[styles.meta, { color: colors.text.secondary }]} numberOfLines={1}>
        {location}
      </Text>
    </View>
  ) : null;

  const label = [creator.displayName, verified ? 'verified' : null, location]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress ? () => onPress(creator.userId) : undefined}
      style={({ pressed }) => [
        styles.card,
        isGrid ? styles.grid : styles.stack,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
        pressed && styles.pressed,
      ]}
      testID={`creator-card-${creator.userId}`}>
      {isGrid ? (
        <>
          {avatar}
          {name}
          {locationRow}
          {creator.categories[0] ? (
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {formatCategory(creator.categories[0])}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <StackBody creator={creator} avatar={avatar} name={name} locationRow={locationRow} />
      )}
    </Pressable>
  );
}

function StackBody({
  creator,
  avatar,
  name,
  locationRow,
}: {
  creator: CreatorDirectoryItem;
  avatar: ReactNode;
  name: ReactNode;
  locationRow: ReactNode;
}) {
  const { colors } = useTheme();
  const { shown, extra } = visibleCategories(creator.categories, 3);
  const since = formatMemberSince(creator.createdAt);

  return (
    <>
      <View style={styles.stackTop}>
        {avatar}
        <View style={styles.stackBody}>
          {name}
          {locationRow}
          {since ? (
            <View style={styles.metaRow}>
              <Feather name="calendar" size={12} color={colors.text.secondary} />
              <Text style={[styles.meta, { color: colors.text.secondary }]}>{since}</Text>
            </View>
          ) : null}
        </View>
        <Feather name="chevron-right" size={20} color={colors.text.secondary} />
      </View>
      {shown.length ? (
        <View style={styles.chips}>
          {shown.map(category => (
            <View key={category} style={styles.chip}>
              <Text style={styles.chipText}>{category}</Text>
            </View>
          ))}
          {extra ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

export default memo(CreatorDirectoryCard);
