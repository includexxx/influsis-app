import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { useAuthSlice } from '@/slices';
import ScreenHeader from '@/components/elements/ScreenHeader';
import SettingsRow from '@/components/elements/SettingsRow';
import Toggle from '@/components/elements/Toggle';
import Button from '@/components/elements/Button';
import { notificationSettingsStyle as s } from './notificationSettings.style';
import { useChannelPreferences, UseChannelPreferencesResult } from './hooks/useChannelPreferences';
import { usePushDeviceSwitch } from './hooks/usePushDeviceSwitch';
import { PreferenceChannel } from './utils/channelPreferences';

const emailIcon = require('@/assets/images/account/email-notification.png');

export const LOCKED_NOTE = 'Always sent: final decisions and deadlines';

// Labels are the app's own copy, never server strings. Each description is
// the category's optional creator events (backend EVENT_CATALOG §2) - the
// ones the toggle controls.
const CATEGORY_COPY: Record<string, { label: string; description: string }> = {
  engagement: {
    label: 'Invitations and requests',
    description: 'New invitations and declined requests',
  },
  offer: { label: 'Offers', description: 'Counter-offers' },
  delivery: { label: 'Deliveries', description: 'Draft approvals' },
  review: { label: 'Reviews', description: 'Reviews published about you' },
  account: { label: 'Account', description: 'Verification approvals' },
};

function categoryCopy(category: string): { label: string; description?: string } {
  return (
    CATEGORY_COPY[category] ?? {
      label: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
    }
  );
}

const CHANNEL_LABEL: Record<PreferenceChannel, string> = { email: 'Email', push: 'Push' };

// Notification settings (build-plan 38c, 38e3), from the Profile tab's
// "Notifications" row and the "manage" link in notification emails (38d).
// In-app is always on. Email and Push each get one toggle per NT5 category,
// saved with NT6 (hooks/useChannelPreferences.ts: optimistic, serialized,
// reverted on error). Push also has the "Push on this device" switch - the
// device (NT7/NT8), not the account-wide toggles below it. A creator without
// a verified email sees why instead of the Email toggles.
export default function NotificationSettings() {
  const { colors, palette } = useTheme();
  const { account } = useAuthSlice();
  const hasVerifiedEmail = account?.emailVerified === true;
  const email = useChannelPreferences({ channel: 'email', skip: false });
  const push = useChannelPreferences({ channel: 'push', skip: false });
  const device = usePushDeviceSwitch();

  // Both channels read the same NT5 request: its loading/error state shows
  // once, above both sections, and their toggle lists wait for it.
  const loadState = email.isLoading ? (
    <View style={s.status} testID="notification-settings-loading">
      <ActivityIndicator color={palette.primary[500]} />
    </View>
  ) : email.isError ? (
    <View style={s.status} testID="notification-settings-error">
      <Text style={[s.statusText, { color: colors.text.primary }]}>
        Couldn&apos;t load your settings
      </Text>
      <Button
        title="Try again"
        accessibilityRole="button"
        onPress={email.retry}
        style={[s.retryButton, { backgroundColor: palette.primary[400] }]}
        titleStyle={[s.retryTitle, { color: palette.white }]}
      />
    </View>
  ) : null;

  const toggleList = (channel: PreferenceChannel, prefs: UseChannelPreferencesResult) => {
    if (loadState) return null;
    if (prefs.toggles.length === 0) {
      return (
        <Text style={[s.note, { color: colors.text.secondary }]}>
          There are no {channel} settings for your account.
        </Text>
      );
    }
    return (
      <View style={s.rowList}>
        {prefs.toggles.map(toggle => {
          const { label, description } = categoryCopy(toggle.category);
          const lines = [description, toggle.hasLocked ? LOCKED_NOTE : undefined].filter(Boolean);
          return (
            <SettingsRow
              key={toggle.category}
              icon={emailIcon}
              title={label}
              description={lines.length ? lines.join('. ') : undefined}
              variant="card"
              onPress={() => prefs.toggle(toggle.category)}
              trailing={
                <Toggle
                  value={toggle.enabled}
                  accessibilityLabel={`${CHANNEL_LABEL[channel]} for ${label}`}
                  onPress={() => prefs.toggle(toggle.category)}
                  testID={`${channel}-toggle-${toggle.category}`}
                />
              }
              testID={`${channel}-row-${toggle.category}`}
            />
          );
        })}
      </View>
    );
  };

  const saveAlert = (prefs: UseChannelPreferencesResult) =>
    prefs.saveError ? (
      <Text accessibilityRole="alert" style={[s.alert, { color: palette.error[700] }]}>
        {prefs.saveError}
      </Text>
    ) : null;

  const deviceOn = device.state === 'on';
  const deviceLocked = device.state === 'blocked' || device.state === 'unavailable';

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Notification settings"
          onBack={() => router.back()}
          style={s.headerGap}
        />

        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.text.primary }]}>In-app</Text>
          <Text style={[s.note, { color: colors.text.secondary }]}>
            In-app notifications are always on.
          </Text>
        </View>

        {loadState ? <View style={s.sectionGap}>{loadState}</View> : null}

        <View style={[s.section, s.sectionGap]}>
          <Text style={[s.sectionLabel, { color: colors.text.primary }]}>Email</Text>
          {hasVerifiedEmail ? (
            toggleList('email', email)
          ) : (
            <Text
              accessibilityRole="text"
              style={[s.note, { color: colors.text.secondary }]}
              testID="notification-settings-no-email">
              Add an email to get important updates when the app is closed.
            </Text>
          )}
          {saveAlert(email)}
        </View>

        <View style={[s.section, s.sectionGap]}>
          <Text style={[s.sectionLabel, { color: colors.text.primary }]}>Push</Text>
          <SettingsRow
            icon={emailIcon}
            title="Push on this device"
            description="Alerts on this phone, even when Influsis is closed"
            variant="card"
            onPress={deviceLocked ? undefined : device.toggle}
            trailing={
              <Toggle
                value={deviceOn}
                disabled={device.busy || deviceLocked}
                accessibilityLabel="Push on this device"
                accessibilityState={{ checked: deviceOn, disabled: device.busy || deviceLocked }}
                onPress={device.toggle}
                testID="push-device-toggle"
              />
            }
            testID="push-device-row"
          />
          {device.state === 'blocked' ? (
            <View style={s.deviceNote} testID="push-device-blocked">
              <Text style={[s.note, { color: colors.text.secondary }]}>
                Turned off in your phone settings
              </Text>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={device.openSettings}>
                <Text style={[s.link, { color: palette.primary[500] }]}>Open settings</Text>
              </Pressable>
            </View>
          ) : null}
          {device.state === 'unavailable' ? (
            <Text
              style={[s.note, { color: colors.text.secondary }]}
              testID="push-device-unavailable">
              Push unavailable on this device
            </Text>
          ) : null}
          {toggleList('push', push)}
          {saveAlert(push)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
