import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PortfolioEntryCard, { PortfolioEntryCardProps } from './PortfolioEntryCard';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const baseEntry = { id: 'e1', url: 'instagram.com/p/abc', platform: 'instagram' as const };

function renderCard(props: Partial<PortfolioEntryCardProps> = {}) {
  const handlers = {
    onChangeUrl: jest.fn(),
    onChangePlatform: jest.fn(),
    onChangeThumbnail: jest.fn(),
    onDelete: jest.fn(),
  };
  render(<PortfolioEntryCard entry={baseEntry} index={0} testID="card" {...handlers} {...props} />);
  return handlers;
}

describe('<PortfolioEntryCard />', () => {
  test('renders the link value and the header title', () => {
    renderCard();
    expect(screen.getByTestId('card-url').props.value).toBe('instagram.com/p/abc');
    expect(screen.getByText('Sample 1')).toBeTruthy();
  });

  test('reflects the selected platform chip', () => {
    renderCard();
    expect(screen.getByTestId('card-platform-instagram').props.accessibilityState?.selected).toBe(
      true,
    );
    expect(screen.getByTestId('card-platform-youtube').props.accessibilityState?.selected).toBe(
      false,
    );
  });

  test('fires the edit callbacks', () => {
    const handlers = renderCard();
    fireEvent.changeText(screen.getByTestId('card-url'), 'youtu.be/x');
    expect(handlers.onChangeUrl).toHaveBeenCalledWith('youtu.be/x');

    fireEvent.press(screen.getByTestId('card-platform-tiktok'));
    expect(handlers.onChangePlatform).toHaveBeenCalledWith('tiktok');

    fireEvent.press(screen.getByTestId('card-delete'));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  test('shows the url error and duplicate warning only when their props are set', () => {
    const { rerender } = render(
      <PortfolioEntryCard
        entry={baseEntry}
        index={0}
        testID="card"
        onChangeUrl={jest.fn()}
        onChangePlatform={jest.fn()}
        onChangeThumbnail={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.queryByText("This link doesn't look valid")).toBeNull();
    expect(screen.queryByText("You've already added this link")).toBeNull();

    rerender(
      <PortfolioEntryCard
        entry={baseEntry}
        index={0}
        testID="card"
        urlError="This link doesn't look valid"
        duplicate
        onChangeUrl={jest.fn()}
        onChangePlatform={jest.fn()}
        onChangeThumbnail={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("This link doesn't look valid")).toBeTruthy();
    expect(screen.getByText("You've already added this link")).toBeTruthy();
  });
});
