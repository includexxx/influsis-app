import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import Image from '../Image';

const chevronDownIcon = require('@/assets/images/create-gig/chevron-down.png');

export interface CustomSelectOption {
  label: string;
  value: string;
}

export interface CustomSelectFieldProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  placeholder: string;
  value?: string;
  options: CustomSelectOption[];
  onSelect: (value: string) => void;
  /** Heading shown at the top of the full-screen overlay. Falls back to `label`, then `placeholder`. */
  title?: string;
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
  // Trigger geometry matches SelectField's so the two are visually
  // interchangeable in a form - only the option-list presentation differs.
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
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 12,
  },
  chevron: {
    width: 24,
    height: 24,
  },
  // Full-screen overlay: the backdrop takes all the leftover space above the
  // panel, which pins the option list to the bottom section of the screen.
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  panelTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    marginRight: 12,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    width: '100%',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    borderBottomWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    marginRight: 12,
  },
});

// Single-select field whose option list opens as a full-screen overlay with
// the list anchored in the bottom section (Figma node 6399:5469). Distinct
// from the existing SelectField, which presents the same kind of option list
// in a content-hugging @gorhom/bottom-sheet; both are kept because the two
// presentations are used by different screens.
//
// This is the only place in the project that uses react-native's `Modal` -
// the shared BottomSheet wrapper is `enableDynamicSizing` + pan-to-close and
// is built to hug its content, so it can't produce a full-screen scrim with a
// fixed-height bottom panel without being contorted. `Modal` keeps this
// dependency-free and, unlike BottomSheet, needs no platform mock in tests.
function CustomSelectField({
  label,
  labelStyle,
  placeholder,
  value,
  options,
  onSelect,
  title,
  style,
  testID,
}: CustomSelectFieldProps) {
  const { colors, palette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find(option => option.value === value)?.label;

  function handleSelect(optionValue: string) {
    onSelect(optionValue);
    setIsOpen(false);
  }

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text.primary }, labelStyle]}>{label}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
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

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}>
        <View style={styles.overlayRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.backdrop, { backgroundColor: colors.overlay }]}
            onPress={() => setIsOpen(false)}
            testID={testID ? `${testID}-backdrop` : undefined}
          />

          <SafeAreaView edges={['bottom']} style={[styles.panel, { backgroundColor: colors.card }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.text.primary }]} numberOfLines={1}>
                {title ?? label ?? placeholder}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}>
                <Feather name="x" size={20} color={colors.text.primary} />
              </Pressable>
            </View>
            <View style={[styles.headerDivider, { backgroundColor: colors.divider }]} />

            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {options.map(option => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.option, { borderBottomColor: colors.divider }]}
                    onPress={() => handleSelect(option.value)}>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected ? palette.primary[400] : colors.text.primary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}>
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Feather name="check" size={20} color={palette.primary[400]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export default CustomSelectField;
