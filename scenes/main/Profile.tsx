import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { useAppSlice, signOut } from '@/slices';
import { getShadowStyle, palette } from '@/theme';
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

// A flat vertical ramp rather than a diagonal one, so the hero's top edge is
// a single color and seams invisibly into the status-bar inset painted
// behind it (the SafeAreaView below is filled with the same `heroTopColor`).
const heroTopColor = palette.primary[400];
const heroGradient = [heroTopColor, palette.primary[600]] as const;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});

// The Profile tab (Figma "Account", node 6001:38957 + 6027:8164's logout
// popup) - a settings menu, not a data display, superseding this screen's
// previous read-only field dump. See docs/screen/profile/account.md.
//
// Presentation only: the identity block became a full-bleed brand-gradient
// header and the menu rows are grouped into elevated cards with tinted icon
// chips. The rows themselves, their copy and their destinations are as
// specified.
export default function Profile() {
  const { colors, isDark } = useTheme();
  const { user, dispatch } = useAppSlice();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // The 50-step tints are mixed for white paper; on the dark theme's near
  // black cards the same accents have to come through as a low-alpha wash
  // instead.
  const accentChip = isDark ? 'rgba(244, 46, 158, 0.18)' : palette.primary[50];
  const dangerChip = isDark ? 'rgba(249, 112, 102, 0.18)' : palette.error[50];
  const cardStyle = [
    accountStyle.rowGroup,
    { backgroundColor: colors.card, borderColor: colors.border },
    getShadowStyle('sm'),
  ];
  const dividerStyle = [accountStyle.rowDivider, { backgroundColor: colors.divider }];

  function handleLogout() {
    setIsLogoutConfirmOpen(false);
    dispatch(signOut());
    router.replace('/auth/sign-in');
  }

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: heroTopColor }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={accountStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={heroGradient} style={accountStyle.hero}>
          <View style={accountStyle.heroGlowTop} />
          <View style={accountStyle.heroGlowBottom} />
          <View style={accountStyle.avatarRing}>
            <CircleAvatar source={avatarImage} size={84} />
          </View>
          <Text style={accountStyle.name}>{user?.name ?? 'Your Profile'}</Text>
          <Text style={accountStyle.email}>{user?.email ?? '-'}</Text>
        </LinearGradient>

        <View style={accountStyle.body}>
          <View style={accountStyle.section}>
            <Text style={[accountStyle.sectionLabel, { color: palette.gray[300] }]}>General</Text>
            <View style={cardStyle}>
              <SettingsRow
                icon={profileIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="Profile"
                style={accountStyle.row}
                onPress={() => router.push('/profile-edit')}
                testID="account-row-profile"
              />
              <View style={dividerStyle} />
              <SettingsRow
                icon={securityIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="Security"
                style={accountStyle.row}
                onPress={() => router.push('/security-settings')}
                testID="account-row-security"
              />
              <View style={dividerStyle} />
              <SettingsRow
                icon={billingIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="Ballance"
                style={accountStyle.row}
                testID="account-row-ballance"
                onPress={() => router.push('/ballance')}
              />
              <View style={dividerStyle} />
              <SettingsRow
                icon={applicationsIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="My Applications"
                style={accountStyle.row}
                onPress={() => router.push('/applications')}
                testID="account-row-applications"
              />
            </View>
          </View>

          <View style={accountStyle.section}>
            <Text style={[accountStyle.sectionLabel, { color: palette.gray[300] }]}>About</Text>
            <View style={cardStyle}>
              <SettingsRow
                icon={helpCenterIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="Help Center"
                style={accountStyle.row}
                onPress={() => router.push('/help-center')}
                testID="account-row-help-center"
              />
              <View style={dividerStyle} />
              <SettingsRow
                icon={privacyIcon}
                iconTint={colors.primary}
                iconBackground={accentChip}
                title="Privacy Policy"
                style={accountStyle.row}
                onPress={() => router.push('/privacy-policy')}
                testID="account-row-privacy-policy"
              />
            </View>
          </View>

          <View style={cardStyle}>
            <SettingsRow
              icon={logoutIcon}
              iconTint={colors.error}
              iconBackground={dangerChip}
              title="Logout"
              destructive
              showChevron={false}
              style={accountStyle.row}
              onPress={() => setIsLogoutConfirmOpen(true)}
              testID="account-row-logout"
            />
          </View>
        </View>
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
