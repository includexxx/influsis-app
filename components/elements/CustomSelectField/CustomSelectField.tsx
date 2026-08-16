import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
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
  /** Opens the caller-owned option list (an `OptionSheet` rendered by the scene). */
  onPress: () => void;
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
        style={[styles.field, { borderColor: palette.gray[100], backgroundColor: colors.card }]}
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
    </View>
  );
}

export default CustomSelectField;
