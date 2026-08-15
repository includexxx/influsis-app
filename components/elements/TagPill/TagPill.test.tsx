import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import TagPill from './TagPill';

describe('<TagPill />', () => {
  test('renders the label', () => {
    render(<TagPill label="Male" />);
    expect(screen.getByText('Male')).not.toBeNull();
  });
});
