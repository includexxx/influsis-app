import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, changePasswordStyle, buttonStyle as sharedButton } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import SuccessSheet from '@/components/elements/SuccessSheet';

const MIN_PASSWORD_LENGTH = 6;

// The Change Password screen (Figma "Change Password", node 6027:8414),
// opened from Security Settings' added "Change Password" row (see
// docs/screen/profile/security-settings.md "Scope notes"). Field labels
// are corrected from Figma's own content - the 2nd and 3rd fields are both
// literally labeled "Confirm Password" there (a copy-paste mistake; the
// subtitle "must be different from the current password" only makes sense
// with a first "Current Password" field, which is what's implemented here)
// - see docs/screen/profile/change-password.md "Scope notes".
//
// Unlike the auth flow's Create New Password screen (docs/screen/auth/
// reset-password.md, a different Figma node reused verbatim there), this
// is an in-app settings change for an already-signed-in user, so its
// success popup doesn't force a re-login - "Done" just returns to Security
// Settings.
export default function ChangePassword() {
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string>();
  const [newPasswordError, setNewPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  function handleSubmit() {
    const isCurrentValid = currentPassword.length > 0;
    const isNewValid = newPassword.length >= MIN_PASSWORD_LENGTH;
    const doPasswordsMatch = newPassword === confirmPassword;

    setCurrentPasswordError(isCurrentValid ? undefined : 'Enter your current password');
    setNewPasswordError(
      isNewValid ? undefined : `Must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    setConfirmPasswordError(doPasswordsMatch ? undefined : 'Passwords do not match');

    if (!isCurrentValid || !isNewValid || !doPasswordsMatch) return;

    setIsSuccessOpen(true);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Change Password"
          onBack={() => router.back()}
          style={changePasswordStyle.headerGap}
        />

        <Text style={[changePasswordStyle.description, { color: colors.text.primary }]}>
          The new password must be different from the current password
        </Text>

        <View style={changePasswordStyle.fieldGroup}>
          <TextField
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={text => {
              setCurrentPassword(text);
              if (currentPasswordError) setCurrentPasswordError(undefined);
            }}
            error={currentPasswordError}
            secureTextEntry
            testID="change-password-current"
          />
          <TextField
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={text => {
              setNewPassword(text);
              if (newPasswordError) setNewPasswordError(undefined);
            }}
            error={newPasswordError}
            secureTextEntry
            testID="change-password-new"
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(undefined);
            }}
            error={confirmPasswordError}
            secureTextEntry
            testID="change-password-confirm"
          />
        </View>

        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit}
          testID="change-password-submit"
        />
      </ScrollView>

      {isSuccessOpen && (
        <SuccessSheet
          title="Password Changed"
          description="Your password has been updated successfully."
          buttonLabel="Done"
          onButtonPress={() => {
            setIsSuccessOpen(false);
            router.back();
          }}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
