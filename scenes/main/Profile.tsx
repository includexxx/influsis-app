import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, useDataPersist, DataPersistKeys } from '@/hooks';
import { useAppSlice } from '@/slices';
import { layoutStyle, accountStyle } from '@/styles';
import CircleAvatar from '@/components/elements/CircleAvatar';
import SettingsRow from '@/components/elements/SettingsRow';
import ConfirmDialog from '@/components/elements/ConfirmDialog';

const avatarImage = require('@/assets/images/account/avatar.png');
const profileIcon = require('@/assets/images/account/profile.png');
const securityIcon = require('@/assets/images/account/security.png');
const billingIcon = require('@/assets/images/account/billing.png');
const helpCenterIcon = require('@/assets/images/account/help-center.png');
const privacyIcon = require('@/assets/images/account/privacy-lock.png');
const logoutIcon = require('@/assets/images/account/logout.png');
// Not a Figma-provided row (see docs/screen/profile/account.md "Scope
// notes") - reuses the existing calendar glyph already extracted for
// profile-verification rather than exporting a new "applications" icon.
const applicationsIcon = require('@/assets/images/profile-verification/calendar-today.png');

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
  },
});

// The Profile tab (Figma "Account", node 6001:38957 + 6027:8164's logout
// popup) - a settings menu, not a data display, superseding this screen's
// previous read-only field dump. See docs/screen/profile/account.md.
export default function Profile() {
  const { colors, palette } = useTheme();
  const { user, dispatch, setLoggedIn, setUser } = useAppSlice();
  const { removePersistData } = useDataPersist();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  function handleLogout() {
    setIsLogoutConfirmOpen(false);
    removePersistData(DataPersistKeys.USER);
    dispatch(setUser(undefined));
    dispatch(setLoggedIn(false));
    router.replace('/auth/sign-in');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, styles.scrollContent]}
        showsVerticalScrollIndicator={false}>
        <View style={accountStyle.profileRow}>
          <CircleAvatar source={avatarImage} size={80} />
          <View>
            <Text style={[accountStyle.name, { color: colors.text.primary }]}>
              {user?.name ?? 'Your Profile'}
            </Text>
            <Text style={[accountStyle.email, { color: palette.gray[300] }]}>
              {user?.email ?? '-'}
            </Text>
          </View>
        </View>

        <View style={accountStyle.section}>
          <View style={accountStyle.sectionDivider}>
            <Text style={[accountStyle.sectionLabel, { color: colors.text.primary }]}>General</Text>
            <View style={[accountStyle.dividerLine, { backgroundColor: colors.divider }]} />
          </View>
          <View style={accountStyle.rowGroup}>
            <SettingsRow
              icon={profileIcon}
              title="Profile"
              onPress={() => router.push('/profile-edit')}
              testID="account-row-profile"
            />
            <SettingsRow
              icon={securityIcon}
              title="Security"
              onPress={() => router.push('/security-settings')}
              testID="account-row-security"
            />
            <SettingsRow
              icon={billingIcon}
              title="Ballance"
              testID="account-row-ballance"
              onPress={() => router.push('/ballance')}
            />
            <SettingsRow
              icon={applicationsIcon}
              title="My Applications"
              onPress={() => router.push('/applications')}
              testID="account-row-applications"
            />
          </View>
        </View>

        <View style={accountStyle.section}>
          <View style={accountStyle.sectionDivider}>
            <Text style={[accountStyle.sectionLabel, { color: colors.text.primary }]}>About</Text>
            <View style={[accountStyle.dividerLine, { backgroundColor: colors.divider }]} />
          </View>
          <View style={accountStyle.rowGroup}>
            <SettingsRow
              icon={helpCenterIcon}
              title="Help Center"
              onPress={() => router.push('/help-center')}
              testID="account-row-help-center"
            />
            <SettingsRow
              icon={privacyIcon}
              title="Privacy Policy"
              onPress={() => router.push('/privacy-policy')}
              testID="account-row-privacy-policy"
            />
          </View>
        </View>

        <SettingsRow
          icon={logoutIcon}
          iconTint={colors.error}
          title="Logout"
          destructive
          showChevron={false}
          onPress={() => setIsLogoutConfirmOpen(true)}
          testID="account-row-logout"
        />
      </ScrollView>

      {isLogoutConfirmOpen && (
        <ConfirmDialog
          title="Are you sure you want to logout?"
          primaryLabel="Cancel"
          onPrimaryPress={() => setIsLogoutConfirmOpen(false)}
          secondaryLabel="Log Out"
          onSecondaryPress={handleLogout}
          onClose={() => setIsLogoutConfirmOpen(false)}
          testID="logout-confirm"
        />
      )}
    </SafeAreaView>
  );
}
