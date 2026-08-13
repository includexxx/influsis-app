import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import InfoCard from './InfoCard';

describe('<InfoCard />', () => {
  test('renders the title and description', () => {
    render(<InfoCard title="Instagram Post" description="1 carousel post (3-5 images)" />);
    expect(screen.getByText('Instagram Post')).not.toBeNull();
    expect(screen.getByText('1 carousel post (3-5 images)')).not.toBeNull();
  });
});
