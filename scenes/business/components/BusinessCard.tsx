import { memo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle, palette, radius } from '@/theme';
import type { ViewMode } from '@/components/elements/ViewModeToggle';
import { formatCategory, visibleCategories } from '@/utils/categories';
import { BusinessDirectoryItem } from '../types/businessDirectory';
import { formatBusinessLocation } from '../utils/businessCard';
import BusinessAvatar from './BusinessAvatar';

export type BusinessCardVariant = ViewMode;

export interface BusinessCardProps {
  business: BusinessDirectoryItem;
  variant?: BusinessCardVariant;
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
  description: { fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.primary[25],
  },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: palette.primary[700] },
});

function VerifiedMark() {
  return (
    <View accessibilityLabel="Verified" testID="business-card-verified">
      <Feather name="check-circle" size={15} color={palette.primary[500]} />
    </View>
  );
}

// One business in the Businesses directory (scenes/business/Businesses.tsx).
// `stack` (the default view) is a full-width row with the description and
// category chips; `grid` is a compact centered tile for scanning many
// businesses at once. Both show the logo, name, verified mark and location,
// and the whole card is one labelled button.
function BusinessCard({ business, variant = 'stack', onPress, style }: BusinessCardProps) {
  const { colors } = useTheme();
  const isGrid = variant === 'grid';
  const verified = business.verificationStatus === 'verified';
  const location = formatBusinessLocation(business);
  const avatarSize = isGrid ? 64 : 52;
  const ringStyle = {
    borderRadius: (avatarSize + 8) / 2,
    borderColor: verified ? palette.primary[200] : colors.border,
  };

  const avatar = (
    <View style={[styles.ring, ringStyle]}>
      <BusinessAvatar
        source={business.avatarUrl ? { uri: business.avatarUrl } : null}
        businessName={business.businessName}
        size={avatarSize}
      />
    </View>
  );

  const name = (
    <View style={styles.nameRow}>
      <Text
        style={[styles.name, isGrid && styles.gridName, { color: colors.text.primary }]}
        numberOfLines={isGrid ? 2 : 1}>
        {business.businessName}
      </Text>
      {verified ? <VerifiedMark /> : null}
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

  const label = [business.businessName, verified ? 'verified' : null, location]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress ? () => onPress(business.userId) : undefined}
      style={({ pressed }) => [
        styles.card,
        isGrid ? styles.grid : styles.stack,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
        pressed && styles.pressed,
      ]}
      testID={`business-card-${business.userId}`}>
      {isGrid ? (
        <>
          {avatar}
          {name}
          {locationRow}
          {business.categories[0] ? (
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {formatCategory(business.categories[0])}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <StackBody business={business} avatar={avatar} name={name} locationRow={locationRow} />
      )}
    </Pressable>
  );
}

function StackBody({
  business,
  avatar,
  name,
  locationRow,
}: {
  business: BusinessDirectoryItem;
  avatar: React.ReactNode;
  name: React.ReactNode;
  locationRow: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { shown, extra } = visibleCategories(business.categories, 2);
  const description = business.description?.trim();

  return (
    <>
      <View style={styles.stackTop}>
        {avatar}
        <View style={styles.stackBody}>
          {name}
          {locationRow}
        </View>
        <Feather name="chevron-right" size={20} color={colors.text.secondary} />
      </View>
      {description ? (
        <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
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

export default memo(BusinessCard);
