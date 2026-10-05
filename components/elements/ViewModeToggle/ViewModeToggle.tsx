import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle, palette, radius } from '@/theme';

export type ViewMode = 'stack' | 'grid';

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  /** testID prefix; each option gets `${testIDPrefix}-${mode}`. */
  testIDPrefix?: string;
}

const OPTIONS = [
  { value: 'stack', icon: 'list', label: 'Stack view' },
  { value: 'grid', icon: 'grid', label: 'Grid view' },
] as const;

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.full, padding: 3, gap: 2 },
  option: {
    width: 40,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: palette.white, ...getShadowStyle('xs') },
});

// Stack / Grid switch for directory screens (Businesses, Top Creators): two
// icon buttons in a pill track, announced as a radio group with labelled
// options.
function ViewModeToggle({ value, onChange, testIDPrefix = 'view-mode' }: ViewModeToggleProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.track, { backgroundColor: colors.surface }]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Layout">
      {OPTIONS.map(option => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(option.value)}
            hitSlop={4}
            style={[styles.option, active && styles.active]}
            testID={`${testIDPrefix}-${option.value}`}>
            <Feather
              name={option.icon}
              size={17}
              color={active ? palette.primary[500] : colors.text.secondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default ViewModeToggle;
