import { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTheme } from '@/hooks';
import TextField, { TextFieldProps } from '../TextField';

export interface OnboardingTextFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> {
  control: Control<T>;
  name: Path<T>;
}

// A focused-border variant of the shared `TextField` for the onboarding
// wizard's RHF-controlled fields (build-plan 22). Tints the input row
// `palette.primary[400]` while focused; an error border still wins. Wraps
// `Controller` directly rather than `ControlledTextField` (which pins
// `onBlur` to RHF's `field.onBlur`) so it can also clear focus state on
// blur. Does not change `TextField`'s own default look - onboarding is the
// only caller of this wrapper.
function OnboardingTextField<T extends FieldValues>({
  control,
  name,
  onFocus,
  inputRowStyle,
  ...textFieldProps
}: OnboardingTextFieldProps<T>) {
  const { palette } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          value={field.value}
          onChangeText={field.onChange}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={() => {
            setIsFocused(false);
            field.onBlur();
          }}
          error={fieldState.error?.message}
          inputRowStyle={[
            isFocused && !fieldState.error ? { borderColor: palette.primary[400] } : null,
            inputRowStyle,
          ]}
        />
      )}
    />
  );
}

export default OnboardingTextField;
