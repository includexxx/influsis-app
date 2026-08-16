import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, securitySettingsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import SettingsRow from '@/components/elements/SettingsRow';
import Toggle from '@/components/elements/Toggle';

const keyIcon = require('@/assets/images/account/security-key.png');
const emailIcon = require('@/assets/images/account/email-notification.png');
const faceIdIcon = require('@/assets/images/account/faceid.png');
const accountRecoveryIcon = require('@/assets/images/account/account-recovery.png');
const passwordIcon = require('@/assets/images/account/privacy-lock.png');

// The Security Settings screen (Figma "Security Settings", node 6398:5198)
// - 4 toggle rows, opened from the Account screen's "Security" row. Toggles
// are local UI state only (no backend - docs/PRD.md §2.2/§4.1), seeded from
// Figma's own on/off states rather than all defaulting to off.
//
// A "Change Password" entry was added below the toggles - Figma provided a
// separate Change Password screen (node 6027:8414) but no visible link to
// it from anywhere in this screen or the Account menu, so this is the most
// direct, lowest-risk entry point (same reasoning Profile's "My
// Applications" link used) - see docs/screen/profile/security-settings.md
// "Scope notes".
export default function SecuritySettings() {
  const { colors } = useTheme();
  const [smsAuthenticator, setSmsAuthenticator] = useState(false);
  const [emailNotification, setEmailNotification] = useState(true);
  const [useFaceId, setUseFaceId] = useState(false);
  const [accountRecovery, setAccountRecovery] = useState(true);

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Security Settings"
          onBack={() => router.back()}
          style={securitySettingsStyle.headerGap}
        />

        <View style={securitySettingsStyle.rowList}>
          <SettingsRow
            icon={keyIcon}
            title="SMS Authenticator"
            description="Shake your phone to randomize your acocunt balances."
            variant="card"
            trailing={
              <Toggle value={smsAuthenticator} onPress={() => setSmsAuthenticator(v => !v)} />
            }
            testID="security-sms-authenticator"
          />
          <SettingsRow
            icon={emailIcon}
            title="Email notification"
            variant="card"
            trailing={
              <Toggle value={emailNotification} onPress={() => setEmailNotification(v => !v)} />
            }
            testID="security-email-notification"
          />
          <SettingsRow
            icon={faceIdIcon}
            title="Use FaceID"
            variant="card"
            trailing={<Toggle value={useFaceId} onPress={() => setUseFaceId(v => !v)} />}
            testID="security-use-faceid"
          />
          <SettingsRow
            icon={accountRecoveryIcon}
            title="Account Recovery"
            variant="card"
            trailing={
              <Toggle value={accountRecovery} onPress={() => setAccountRecovery(v => !v)} />
            }
            testID="security-account-recovery"
          />
        </View>

        <SettingsRow
          icon={passwordIcon}
          title="Change Password"
          onPress={() => router.push('/change-password')}
          style={securitySettingsStyle.changePasswordGap}
          testID="security-change-password"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
