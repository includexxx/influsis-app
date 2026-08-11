import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import Divider from './Divider';

describe('<Divider />', () => {
  test('renders the default "Or" label', () => {
    render(<Divider />);
    expect(screen.getByText('Or')).not.toBeNull();
  });

  test('renders a custom label', () => {
    render(<Divider label="And" />);
    expect(screen.getByText('And')).not.toBeNull();
  });
});
