import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
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
import { useEmailPreferences } from './hooks/useEmailPreferences';

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

// Notification settings (build-plan 38c), from the Profile tab's
// "Notifications" row and the "manage" link in notification emails (38d).
// In-app is always on; one Email toggle per NT5 category, saved with NT6
// (hooks/useEmailPreferences.ts: optimistic, serialized, reverted on error).
// A creator without a verified email gets nothing by email, so they see why
// instead of toggles. Push toggles arrive with 38e.
export default function NotificationSettings() {
  const { colors, palette } = useTheme();
  const { account } = useAuthSlice();
  const hasVerifiedEmail = account?.emailVerified === true;
  const email = useEmailPreferences({ skip: !hasVerifiedEmail });

  let body;
  if (!hasVerifiedEmail) {
    body = (
      <Text
        accessibilityRole="text"
        style={[s.note, { color: colors.text.secondary }]}
        testID="notification-settings-no-email">
        Add an email to get important updates when the app is closed.
      </Text>
    );
  } else if (email.isLoading) {
    body = (
      <View style={s.status} testID="notification-settings-loading">
        <ActivityIndicator color={palette.primary[500]} />
      </View>
    );
  } else if (email.isError) {
    body = (
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
    );
  } else if (email.toggles.length === 0) {
    body = (
      <Text style={[s.note, { color: colors.text.secondary }]}>
        There are no email settings for your account.
      </Text>
    );
  } else {
    body = (
      <View style={s.rowList}>
        {email.toggles.map(toggle => {
          const { label, description } = categoryCopy(toggle.category);
          const lines = [description, toggle.hasLocked ? LOCKED_NOTE : undefined].filter(Boolean);
          return (
            <SettingsRow
              key={toggle.category}
              icon={emailIcon}
              title={label}
              description={lines.length ? lines.join('. ') : undefined}
              variant="card"
              onPress={() => email.toggle(toggle.category)}
              trailing={
                <Toggle
                  value={toggle.enabled}
                  accessibilityLabel={`Email for ${label}`}
                  onPress={() => email.toggle(toggle.category)}
                  testID={`email-toggle-${toggle.category}`}
                />
              }
              testID={`email-row-${toggle.category}`}
            />
          );
        })}
      </View>
    );
  }

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

        <View style={[s.section, s.sectionGap]}>
          <Text style={[s.sectionLabel, { color: colors.text.primary }]}>Email</Text>
          {body}
          {email.saveError ? (
            <Text accessibilityRole="alert" style={[s.alert, { color: palette.error[700] }]}>
              {email.saveError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
