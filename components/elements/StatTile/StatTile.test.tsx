import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import StatTile from './StatTile';

const icon = { uri: 'https://example.com/icon.png' };

describe('<StatTile />', () => {
  test('renders the label and value', () => {
    render(<StatTile icon={icon} label="Budget" value="500-1000" />);
    expect(screen.getByText('Budget')).not.toBeNull();
    expect(screen.getByText('500-1000')).not.toBeNull();
  });
});
