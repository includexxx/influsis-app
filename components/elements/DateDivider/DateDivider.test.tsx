import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import DateDivider from './DateDivider';

describe('<DateDivider />', () => {
  test('renders the label', () => {
    render(<DateDivider label="Yesterday" />);
    expect(screen.getByText('Yesterday')).not.toBeNull();
  });
});
