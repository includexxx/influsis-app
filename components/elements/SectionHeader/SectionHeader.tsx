import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

export interface SectionHeaderProps {
  title: string;
  /** One short line under the title saying what the section holds. */
  subtitle?: string;
  /** "See all" shows only when there is somewhere to go. */
  onSeeAllPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingLeft: 8,
  },
  seeAllPressed: { opacity: 0.6 },
  seeAllText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});

// "Title" + optional subtitle + "See all" row at the top of every Home
// section (Active Campaigns, Business, Campaigns, Top Rated Creators - Figma
// node 6121:6539 and siblings with the same shape).
function SectionHeader({ title, subtitle, onSeeAllPress, style }: SectionHeaderProps) {
  const { colors, palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text.primary }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onSeeAllPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          onPress={onSeeAllPress}
          hitSlop={8}
          style={({ pressed }) => [styles.seeAll, pressed && styles.seeAllPressed]}>
          <Text style={[styles.seeAllText, { color: palette.primary[500] }]}>See all</Text>
          <Feather name="chevron-right" size={16} color={palette.primary[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default SectionHeader;
