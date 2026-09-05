import { test, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import TabBarIcon from './TabBarIcon';

describe('<TabBarIcon />', () => {
  test('renders the inactive home icon when not focused', () => {
    const { toJSON } = render(<TabBarIcon name="home" focused={false} />);
    expect(toJSON()).not.toBeNull();
  });

  test('renders the composited active order icon when focused', () => {
    const { toJSON } = render(<TabBarIcon name="order" focused />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('order-active-base');
    expect(tree).toContain('order-active-accent1');
    expect(tree).toContain('order-active-accent2');
  });

  test('renders the create-gig icon the same regardless of focus', () => {
    const focused = JSON.stringify(render(<TabBarIcon name="create-gig" focused />).toJSON());
    const unfocused = JSON.stringify(
      render(<TabBarIcon name="create-gig" focused={false} />).toJSON(),
    );
    expect(focused).toEqual(unfocused);
  });
});
