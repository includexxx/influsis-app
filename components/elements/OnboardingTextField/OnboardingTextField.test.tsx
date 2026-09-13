import { test, expect } from '@jest/globals';
import { useForm } from 'react-hook-form';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { palette } from '@/theme';
import OnboardingTextField from './OnboardingTextField';

interface FormValues {
  name: string;
}

function Harness({ error }: { error?: string } = {}) {
  const { control, setError } = useForm<FormValues>({ defaultValues: { name: '' } });
  if (error) setError('name', { type: 'manual', message: error });
  return (
    <OnboardingTextField control={control} name="name" label="Name" testID="onboarding-name" />
  );
}

function hasFocusBorder(): boolean {
  const style = screen.getByTestId('onboarding-name').parent?.parent?.props.style;
  return JSON.stringify(style).includes(palette.primary[400]);
}

describe('<OnboardingTextField />', () => {
  test('renders the label and forwards typed text', () => {
    render(<Harness />);
    expect(screen.getByText('Name')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('onboarding-name'), 'Ada');
    expect(screen.getByTestId('onboarding-name').props.value).toBe('Ada');
  });

  test('tints the input row on focus and clears it on blur', () => {
    render(<Harness />);
    const input = screen.getByTestId('onboarding-name');

    fireEvent(input, 'focus');
    expect(hasFocusBorder()).toBe(true);

    fireEvent(input, 'blur');
    expect(hasFocusBorder()).toBe(false);
  });

  test('an active field error wins over the focus tint', () => {
    render(<Harness error="Required" />);
    fireEvent(screen.getByTestId('onboarding-name'), 'focus');
    expect(hasFocusBorder()).toBe(false);
  });
});
