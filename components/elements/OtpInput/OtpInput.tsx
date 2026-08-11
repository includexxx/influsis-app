import { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '@/hooks';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 86,
    height: 75,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '600',
  },
});

function OtpInput({ length = 4, value, onChange, error, style }: OtpInputProps) {
  const { colors, palette } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function handleChangeText(text: string, index: number) {
    const nextDigit = text.slice(-1);
    const nextValue = digits.map((d, i) => (i === index ? nextDigit : d)).join('');
    onChange(nextValue);

    if (nextDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={[styles.root, style]}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.box,
            {
              borderColor: error ? colors.error : palette.gray[200],
              color: colors.text.primary,
              backgroundColor: colors.card,
            },
          ]}
          value={digit}
          onChangeText={text => handleChangeText(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textContentType="oneTimeCode"
          testID={`otp-digit-${index}`}
        />
      ))}
    </View>
  );
}

export default OtpInput;
