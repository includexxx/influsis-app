import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import AuthTitleBlock from './AuthTitleBlock';

describe('<AuthTitleBlock />', () => {
  test('renders the title and description', () => {
    render(<AuthTitleBlock title="OTP Verification" description="Please check your email" />);
    expect(screen.getByText('OTP Verification')).not.toBeNull();
    expect(screen.getByText('Please check your email')).not.toBeNull();
  });
});
