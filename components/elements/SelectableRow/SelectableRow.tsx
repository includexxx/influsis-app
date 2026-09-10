import { Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import Checkbox from '../Checkbox';

export interface SelectableRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

// A toggleable option row for the onboarding multi-selects (Languages,
// Deliverables - build-plan 20d): label on the left, a reused `Checkbox` on
// the right, brand-pink border when selected (the same selected treatment
// `SelectableListItem` used on the retired profile-verification screens). The
// whole row is the press target; the checkbox is decorative.
function SelectableRow({ label, selected, onPress, style, testID }: SelectableRowProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.root,
        {
          backgroundColor: selected ? palette.primary[50] : colors.card,
          borderColor: selected ? palette.primary[400] : palette.gray[100],
        },
        style,
      ]}>
      <Text
        style={[
          styles.label,
          { color: colors.text.primary, textAlign: 'center', fontWeight: 600, fontSize: 16 },
        ]}>
        {label}
      </Text>
      {/* <Checkbox checked={selected} pointerEvents="none" /> */}
    </Pressable>
  );
}

export default SelectableRow;
