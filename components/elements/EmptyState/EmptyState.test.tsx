import { test, expect } from '@jest/globals';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import EmptyState from './EmptyState';

describe('<EmptyState />', () => {
  test('renders the illustration, title and description', () => {
    render(
      <EmptyState
        illustration={<Text>Illustration</Text>}
        title="No campaign Found"
        description="When we add collections. They'll be appear here"
      />,
    );
    expect(screen.getByText('Illustration')).not.toBeNull();
    expect(screen.getByText('No campaign Found')).not.toBeNull();
    expect(screen.getByText("When we add collections. They'll be appear here")).not.toBeNull();
  });
});
