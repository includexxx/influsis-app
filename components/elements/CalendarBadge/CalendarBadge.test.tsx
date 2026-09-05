import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import CalendarBadge from './CalendarBadge';

describe('<CalendarBadge />', () => {
  test('renders the date text', () => {
    render(<CalendarBadge date="21 Oct 2022" />);
    expect(screen.getByText('21 Oct 2022')).not.toBeNull();
  });
});
