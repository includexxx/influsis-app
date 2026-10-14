import { ComponentProps, ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

export interface AuthTextFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'style'
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** Leading glyph; ignored when `leftAdornment` is given. */
  icon?: ComponentProps<typeof Feather>['name'];
  /** Replaces the icon, e.g. the phone field's country-code picker. */
  leftAdornment?: ReactNode;
  /** Rendered under the input (above any error), e.g. a strength meter. */
  children?: ReactNode;
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});

// Form field for the auth screens, bound to react-hook-form: a label over a
// filled, rounded input with a leading icon. The row lifts to the brand
// color while focused and turns red with a message on error; a password
// field gets a show/hide toggle. `ref` is wired so `setFocus` can chain
// fields with the keyboard's "next" key.
export default function AuthTextField<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  leftAdornment,
  children,
  secureTextEntry,
  testID,
  onFocus,
  ...inputProps
}: AuthTextFieldProps<T>) {
  const { colors, palette, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const accent = error
          ? colors.error
          : focused
            ? palette.primary[400]
            : colors.text.secondary;
        const borderColor = error
          ? colors.error
          : focused
            ? palette.primary[400]
            : isDark
              ? palette.gray[700]
              : palette.gray[25];
        const backgroundColor = focused
          ? isDark
            ? 'rgba(244, 46, 158, 0.08)'
            : palette.white
          : isDark
            ? palette.gray[800]
            : palette.gray[25];

        return (
          <View style={styles.root}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
            <View style={[styles.row, { borderColor, backgroundColor }]}>
              {leftAdornment ?? (icon ? <Feather name={icon} size={18} color={accent} /> : null)}
              <TextInput
                ref={field.ref}
                value={field.value}
                onChangeText={field.onChange}
                onFocus={event => {
                  setFocused(true);
                  onFocus?.(event);
                }}
                onBlur={() => {
                  setFocused(false);
                  field.onBlur();
                }}
                secureTextEntry={secureTextEntry ? hidden : false}
                placeholderTextColor={isDark ? palette.gray[400] : palette.gray[200]}
                selectionColor={palette.primary[400]}
                accessibilityLabel={label}
                style={[styles.input, { color: colors.text.primary }]}
                testID={testID}
                {...inputProps}
              />
              {secureTextEntry ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
                  hitSlop={10}
                  onPress={() => setHidden(prev => !prev)}
                  testID={testID ? `${testID}-toggle` : undefined}>
                  <Feather
                    name={hidden ? 'eye' : 'eye-off'}
                    size={18}
                    color={colors.text.secondary}
                  />
                </Pressable>
              ) : null}
            </View>
            {children}
            {error?.message ? (
              <View style={styles.errorRow} accessibilityLiveRegion="polite">
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error.message}</Text>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}
