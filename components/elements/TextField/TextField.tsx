import { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const hideEyeIcon = require('@/assets/images/icons/hide-eye.png');
const alertErrorIcon = require('@/assets/images/icons/alert-error.png');

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  // Overrides the bordered row's own shape (radius/height/border color) -
  // added for the Order Deliver screen's link field (Figma node 6040:8590),
  // whose 8px radius and `rgba(0,0,0,0.2)` border don't match this
  // component's original 12px/`gray[100]` caller.
  inputRowStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.112,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  toggle: {
    marginLeft: 8,
  },
  toggleIcon: {
    width: 22,
    height: 18.7,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorIcon: {
    width: 16,
    height: 16,
  },
});

function TextField({
  label,
  labelStyle,
  error,
  containerStyle,
  inputStyle,
  inputRowStyle,
  style,
  leftAdornment,
  rightAdornment,
  secureTextEntry,
  ...others
}: TextFieldProps) {
  const { colors, palette } = useTheme();
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);

  const showToggle = !!secureTextEntry && !rightAdornment;

  return (
    <View style={[styles.root, containerStyle, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text.secondary }, labelStyle]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          { borderColor: error ? colors.error : palette.gray[100], backgroundColor: colors.card },
          inputRowStyle,
        ]}>
        {leftAdornment}
        <TextInput
          style={[styles.input, { color: colors.text.primary }, inputStyle]}
          placeholderTextColor={palette.gray[200]}
          secureTextEntry={showToggle ? isSecure : secureTextEntry}
          {...others}
        />
        {showToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            hitSlop={8}
            style={styles.toggle}
            onPress={() => setIsSecure(prev => !prev)}>
            <Image source={hideEyeIcon} style={styles.toggleIcon} contentFit="contain" />
          </Pressable>
        )}
        {rightAdornment}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Image source={alertErrorIcon} style={styles.errorIcon} contentFit="contain" />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default TextField;
