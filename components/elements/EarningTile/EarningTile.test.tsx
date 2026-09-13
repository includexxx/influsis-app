import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import EarningTile from './EarningTile';

describe('<EarningTile />', () => {
  test('renders the value and label', () => {
    render(<EarningTile value="$150.00" label="Monthly earning" />);
    expect(screen.getByText('$150.00')).not.toBeNull();
    expect(screen.getByText('Monthly earning')).not.toBeNull();
  });
});
