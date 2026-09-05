import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import BulletList from './BulletList';

describe('<BulletList />', () => {
  test('renders one row per item', () => {
    render(<BulletList items={['First point', 'Second point']} />);
    expect(screen.getByText('First point')).not.toBeNull();
    expect(screen.getByText('Second point')).not.toBeNull();
  });
});
