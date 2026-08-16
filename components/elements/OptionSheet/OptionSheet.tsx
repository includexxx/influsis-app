import { View, Text, Pressable, StyleSheet, ImageSourcePropType } from 'react-native';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import BottomSheet from '../BottomSheet';
import Image from '../Image';

export interface OptionSheetOption {
  label: string;
  value: string;
  /** Optional leading image (e.g. a country flag) rendered before the label. */
  icon?: ImageSourcePropType;
}

export interface OptionSheetProps {
  options: OptionSheetOption[];
  value?: string;
  onSelect: (value: string) => void;
  onClose?: () => void;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  option: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  optionIcon: {
    width: 24,
    height: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

// Short single-select list in a BottomSheet with rounded pill rows (Figma
// "Bottom sheet", node 6399:5570's Gender picker: a drag-handle divider bar
// over 2 stacked "Male"/"Female" pills) - a different shape than
// `SelectField`'s own sheet (plain underlined text rows), so this is a new
// component rather than a `SelectField` variant. Generic `options` prop
// makes it reusable for any pick-one list (used by Edit Profile's Gender
// and Country fields), with an optional per-option `icon` for lists whose
// rows carry a leading image (Country shows each country's flag).
function OptionSheet({ options, value, onSelect, onClose }: OptionSheetProps) {
  const { colors, palette } = useTheme();

  return (
    <BottomSheet isOpen initialOpen onClose={onClose}>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        {options.map(option => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.option,
                { backgroundColor: isSelected ? palette.primary[25] : palette.gray[25] },
              ]}
              onPress={() => onSelect(option.value)}>
              {!!option.icon && (
                <Image
                  source={option.icon}
                  style={styles.optionIcon}
                  contentFit="contain"
                  testID={`option-icon-${option.value}`}
                />
              )}
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? palette.primary[400] : colors.text.primary },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

export default OptionSheet;
