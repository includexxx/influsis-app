import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import StatusBadge from './StatusBadge';

describe('<StatusBadge />', () => {
  test('renders the label', () => {
    render(<StatusBadge label="Ongoing" />);
    expect(screen.getByText('Ongoing')).not.toBeNull();
  });

  test('renders a custom label for a different status', () => {
    render(<StatusBadge label="Completed" color="#D2D2D5" />);
    expect(screen.getByText('Completed')).not.toBeNull();
  });
});
