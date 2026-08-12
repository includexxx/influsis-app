import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import TabBarLabel from './TabBarLabel';

describe('<TabBarLabel />', () => {
  test('renders the label text', () => {
    render(<TabBarLabel label="Home" focused={false} />);
    expect(screen.getByText('Home')).not.toBeNull();
  });

  test('renders bolder when focused', () => {
    render(<TabBarLabel label="Home" focused />);
    const el = screen.getByText('Home');
    const flatStyle = ([] as object[]).concat(el.props.style);
    expect(flatStyle.some(s => 'fontWeight' in s && s.fontWeight === '700')).toBe(true);
  });
});
