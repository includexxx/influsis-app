import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import ProfileBanner from './ProfileBanner';

const banner = { uri: 'https://example.com/banner.jpg' };
const avatar = { uri: 'https://example.com/avatar.jpg' };

describe('<ProfileBanner />', () => {
  test('renders the banner image', () => {
    render(<ProfileBanner bannerImage={banner} testID="profile-banner" />);
    expect(screen.getByTestId('profile-banner')).not.toBeNull();
  });

  test('renders the avatar image when provided', () => {
    render(
      <ProfileBanner bannerImage={banner} avatarImage={avatar} testID="profile-banner-avatar" />,
    );
    expect(screen.getByTestId('profile-banner-avatar')).not.toBeNull();
  });
});
