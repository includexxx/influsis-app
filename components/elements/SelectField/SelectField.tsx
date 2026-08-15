import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';
import BottomSheet from '../BottomSheet';

const chevronDownIcon = require('@/assets/images/create-gig/chevron-down.png');

export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label?: string;
  placeholder: string;
  value?: string;
  options: SelectFieldOption[];
  onSelect: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  label: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
    marginBottom: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  fieldText: {
    fontSize: 16,
    lineHeight: 24,
  },
  chevron: {
    width: 24,
    height: 24,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  option: {
    height: 54,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});

// Single-select dropdown field (Figma "Category" field, node 6525:6068) -
// no dropdown/picker library exists in this project, so this opens the
// shared BottomSheet with a plain option list instead. Generic `options`
// prop makes it reusable for any future single-select field (this project's
// only other "pick one" UI, SelectableListItem, is multi-select and
// icon-based, so it doesn't fit this shape).
function SelectField({
  label,
  placeholder,
  value,
  options,
  onSelect,
  style,
  testID,
}: SelectFieldProps) {
  const { colors, palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find(option => option.value === value)?.label;

  return (
    <View style={[styles.root, style]}>
      {label ? <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        style={[styles.field, { borderColor: palette.gray[100], backgroundColor: colors.card }]}
        onPress={() => setIsOpen(true)}
        testID={testID}>
        <Text
          style={[
            styles.fieldText,
            { color: selectedLabel ? colors.text.primary : palette.gray[300] },
          ]}
          numberOfLines={1}>
          {selectedLabel ?? placeholder}
        </Text>
        <Image source={chevronDownIcon} style={styles.chevron} contentFit="contain" />
      </Pressable>

      {isOpen && (
        <BottomSheet isOpen initialOpen onClose={() => setIsOpen(false)}>
          <View style={[styles.sheetContent, { backgroundColor: colors.card }]}>
            {options.map(option => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                style={[styles.option, { borderBottomColor: colors.divider }]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: option.value === value ? palette.primary[400] : colors.text.primary,
                      fontWeight: option.value === value ? '600' : '400',
                    },
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

export default SelectField;
