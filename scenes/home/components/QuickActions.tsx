import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle, palette, radius } from '@/theme';
import { FeatherName } from '@/scenes/campaigns/utils/platformIcon';

export interface QuickAction {
  key: string;
  label: string;
  icon: FeatherName;
  /** Tile tint: [icon background, icon color]. */
  tint: readonly [string, string];
  onPress: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...getShadowStyle('xs'),
  },
  tilePressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
});

// One row of shortcut tiles under the earnings card - the places a creator
// goes most from Home, one tap away. Each tile is a 44pt+ target with an
// icon and a visible label (no icon-only buttons).
function QuickActions({ actions, style }: QuickActionsProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      {actions.map(action => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.tilePressed,
          ]}
          testID={`home-quick-${action.key}`}>
          <View style={[styles.icon, { backgroundColor: action.tint[0] }]}>
            <Feather name={action.icon} size={19} color={action.tint[1]} />
          </View>
          <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Brand-tinted tile colors, one per tile so the row scans quickly.
export const QUICK_ACTION_TINTS = {
  primary: [palette.primary[50], palette.primary[600]],
  navy: [palette.primaryNavy[50], palette.primaryNavy[800]],
  green: [palette.secondary[50], palette.secondary[700]],
  amber: [palette.warning[50], palette.warning[700]],
} as const;

export default QuickActions;
