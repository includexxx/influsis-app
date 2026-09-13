import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SavedMethodCard from './SavedMethodCard';

const icon = { uri: 'icon.png' };

describe('<SavedMethodCard />', () => {
  test('renders the account number and description', () => {
    render(<SavedMethodCard icon={icon} account="01521702480" description="Save by bkash" />);
    expect(screen.getByText('01521702480')).not.toBeNull();
    expect(screen.getByText('Save by bkash')).not.toBeNull();
  });

  test('exposes its selected state', () => {
    render(
      <SavedMethodCard
        icon={icon}
        account="01521702480"
        description="Save by bkash"
        selected
        testID="saved"
      />,
    );
    expect(screen.getByTestId('saved').props.accessibilityState.selected).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <SavedMethodCard
        icon={icon}
        account="01521702480"
        description="Save by bkash"
        onPress={onPress}
        testID="saved"
      />,
    );
    fireEvent.press(screen.getByTestId('saved'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
