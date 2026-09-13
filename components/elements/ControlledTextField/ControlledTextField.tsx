import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import TextField, { TextFieldProps } from '../TextField';

export interface ControlledTextFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> {
  control: Control<T>;
  name: Path<T>;
}

/** A react-hook-form `Controller` bound to the shared `TextField`. */
function ControlledTextField<T extends FieldValues>({
  control,
  name,
  ...textFieldProps
}: ControlledTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default ControlledTextField;
