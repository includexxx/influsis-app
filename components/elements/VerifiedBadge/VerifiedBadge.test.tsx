import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import VerifiedBadge from './VerifiedBadge';

describe('<VerifiedBadge />', () => {
  test('renders the badge variant by default', () => {
    render(<VerifiedBadge testID="verified-badge" />);
    expect(screen.getByTestId('verified-badge')).not.toBeNull();
  });

  test('renders the check variant', () => {
    render(<VerifiedBadge variant="check" testID="verified-check" />);
    expect(screen.getByTestId('verified-check')).not.toBeNull();
  });
});
