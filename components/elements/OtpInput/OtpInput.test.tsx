import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import OtpInput from './OtpInput';

describe('<OtpInput />', () => {
  test('renders one box per digit', () => {
    render(<OtpInput length={4} value="" onChange={() => {}} />);
    expect(screen.getByTestId('otp-digit-0')).not.toBeNull();
    expect(screen.getByTestId('otp-digit-3')).not.toBeNull();
  });

  test('calls onChange with the updated value when a digit is entered', () => {
    const onChange = jest.fn();
    render(<OtpInput length={4} value="12" onChange={onChange} />);
    fireEvent.changeText(screen.getByTestId('otp-digit-2'), '7');
    expect(onChange).toHaveBeenCalledWith('127');
  });
});
