import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import RecipientPill from './RecipientPill';

const avatar = { uri: 'avatar.png' };

describe('<RecipientPill />', () => {
  test('renders the recipient name and amount', () => {
    render(<RecipientPill avatar={avatar} name="Aliya Leon" amount="$750" />);
    expect(screen.getByText('Aliya Leon')).not.toBeNull();
    expect(screen.getByText('$750')).not.toBeNull();
  });
});
