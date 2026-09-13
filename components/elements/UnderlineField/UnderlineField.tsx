import { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';

export interface UnderlineFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  editable?: boolean;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leadingAdornment?: ReactNode;
  trailingAdornment?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    padding: 0,
  },
  value: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
});

// Label-above / bold-value-below field with a hairline underline divider
// (Figma "State=Filled, Component=Input 2", node 6001:39064 and its 5
// siblings on the Edit Profile screen) - visually distinct from `TextField`
// (a bordered box) and `SelectField`/`DateField` (also bordered boxes), so
// none of those fit this screen's underline shape. Doubles as a typable
// field (Full Name, Email, Phone - `editable` + `onChangeText`) or a
// pressable one that opens a picker instead of a keyboard (Gender, Country,
// Date of Birth - `onPress`, `editable={false}`), via `leadingAdornment`/
// `trailingAdornment` slots for the phone flag and the gender/country
// chevron or date-of-birth calendar glyph.
function UnderlineField({
  label,
  value,
  placeholder,
  editable = true,
  onChangeText,
  onPress,
  keyboardType,
  autoCapitalize,
  leadingAdornment,
  trailingAdornment,
  style,
  testID,
}: UnderlineFieldProps) {
  const { colors, palette } = useTheme();

  const content = (
    <View style={[styles.row, { borderBottomColor: colors.divider }]}>
      {leadingAdornment}
      {editable ? (
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={palette.gray[200]}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          testID={testID}
        />
      ) : (
        <Text
          style={[styles.value, { color: value ? colors.text.primary : palette.gray[200] }]}
          numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      )}
      {trailingAdornment}
    </View>
  );

  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.label, { color: palette.gray[300] }]}>{label}</Text>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          testID={testID}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

export default UnderlineField;
