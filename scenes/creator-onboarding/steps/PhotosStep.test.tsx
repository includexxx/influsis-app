import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import PhotosStep from './PhotosStep';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const asset = { uri: 'file:///profile.jpg', mimeType: 'image/jpeg', fileName: 'profile.jpg' };

beforeEach(() => {
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
    granted: true,
  } as ImagePicker.MediaLibraryPermissionResponse);
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [asset],
  } as ImagePicker.ImagePickerResult);
});

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(6));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<PhotosStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<PhotosStep />', () => {
  test('renders "6 of 8" with Next enabled (the step is optional)', () => {
    renderStep();
    expect(screen.getByText('6 of 8')).toBeTruthy();
    expect(nextDisabled()).toBe(false);
  });

  test('picking a profile photo shows its preview and a Remove button', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-profile-photo'));

    expect(await screen.findByTestId('onboarding-profile-photo-remove')).toBeTruthy();
    expect(screen.getByText('Change Image')).toBeTruthy();
  });

  test('Remove photo clears the picked image', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-profile-photo'));
    fireEvent.press(await screen.findByTestId('onboarding-profile-photo-remove'));

    await waitFor(() => expect(screen.queryByTestId('onboarding-profile-photo-remove')).toBeNull());
  });

  test('submitting with a picked photo stores the descriptor and advances to step 7', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByTestId('onboarding-profile-photo'));
    await screen.findByTestId('onboarding-profile-photo-remove');

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(7));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(6);
    expect(state.profilePhoto).toEqual(asset);
    expect(state.coverPhoto).toBeUndefined();
  });

  test('submitting with no photos still advances, leaving both undefined', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(7));
    const state = store.getState().creatorOnboarding;
    expect(state.profilePhoto).toBeUndefined();
    expect(state.coverPhoto).toBeUndefined();
  });

  test('the header Back returns to step 5', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(5));
  });
});
