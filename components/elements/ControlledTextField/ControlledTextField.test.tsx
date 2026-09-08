import { useEffect } from 'react';
import { test, expect } from '@jest/globals';
import { useForm } from 'react-hook-form';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ControlledTextField from './ControlledTextField';

type Values = { email: string };

function Host({ initialError }: { initialError?: string }) {
  const { control, setError, watch } = useForm<Values>({ defaultValues: { email: '' } });
  useEffect(() => {
    if (initialError) setError('email', { message: initialError });
  }, [initialError, setError]);
  return (
    <>
      <ControlledTextField control={control} name="email" label="Email" testID="email" />
      <Text testID="current">{watch('email')}</Text>
    </>
  );
}

describe('<ControlledTextField />', () => {
  test('renders the label', () => {
    render(<Host />);
    expect(screen.getByText('Email')).not.toBeNull();
  });

  test('shows the field-state error message', () => {
    render(<Host initialError="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).not.toBeNull();
  });

  test('forwards typed text into the form value', () => {
    render(<Host />);
    fireEvent.changeText(screen.getByTestId('email'), 'a@b.co');
    expect(screen.getByTestId('current').props.children).toBe('a@b.co');
  });
});
