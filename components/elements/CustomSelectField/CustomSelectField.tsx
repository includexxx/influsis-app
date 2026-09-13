import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const chevronDownIcon = require('@/assets/images/create-gig/chevron-down.png');
const alertErrorIcon = require('@/assets/images/icons/alert-error.png');

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
  /** Opens the caller-owned option list (an `OptionSheet` rendered by the scene). */
  onPress: () => void;
  /** Dims the trigger and blocks the press (e.g. a locked or not-yet-ready field). */
  disabled?: boolean;
  /** Inline validation message, rendered below the trigger like `TextField`. */
  error?: string;
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
  // Matches TextField's error row so the two read the same in a form.
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorIcon: {
    width: 16,
    height: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Boxed single-select *trigger* (Figma node 6525:6068): it renders the label,
// the selected option (or the placeholder) and the chevron, and delegates the
// option list to whatever the caller opens from `onPress`. Same split Edit
// Profile uses for its Gender/Country/Date fields, where UnderlineField is the
// display row and the scene owns the `OptionSheet` - the sheet has to be a
// sibling of the scene's ScrollView, not a descendant of it, because
// @gorhom/bottom-sheet positions itself against its parent and this project
// mounts no portal provider.
//
// Kept separate from SelectField (identical box, but that one owns its own
// plain-row bottom sheet) because the two are used by different screens.
function CustomSelectField({
  label,
  labelStyle,
  placeholder,
  value,
  options,
  onPress,
  disabled,
  error,
  style,
  testID,
}: CustomSelectFieldProps) {
  const { colors, palette } = useTheme();

  const selectedLabel = options.find(option => option.value === value)?.label;

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text.primary }, labelStyle]}>{label}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        style={[
          styles.field,
          {
            borderColor: error ? colors.error : palette.gray[100],
            backgroundColor: colors.card,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={onPress}
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

      {error ? (
        <View style={styles.errorRow}>
          <Image source={alertErrorIcon} style={styles.errorIcon} contentFit="contain" />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default CustomSelectField;
