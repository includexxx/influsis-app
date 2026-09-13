import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import OrderActivityRow from './OrderActivityRow';

const icon = { uri: 'icon.png' };

describe('<OrderActivityRow />', () => {
  test('renders business, action and timestamp', () => {
    render(
      <OrderActivityRow
        icon={icon}
        business="Bkash Ltd."
        action="place the order"
        timestamp="April 24, 12:20 PM"
      />,
    );
    expect(screen.getByText('Bkash Ltd.')).not.toBeNull();
    expect(screen.getByText('place the order')).not.toBeNull();
    expect(screen.getByText('April 24, 12:20 PM')).not.toBeNull();
  });
});
