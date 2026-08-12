import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';
import SuccessSheet from '@/components/elements/SuccessSheet';

const MIN_PASSWORD_LENGTH = 6;

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
});

export default function ResetPassword() {
  const { colors } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  function handleSubmit() {
    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
    const doPasswordsMatch = password === confirmPassword;

    setPasswordError(
      isPasswordValid ? undefined : `Must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    setConfirmPasswordError(doPasswordsMatch ? undefined : 'Passwords do not match');

    if (!isPasswordValid || !doPasswordsMatch) return;

    setIsSuccessOpen(true);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.scrollContent}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <AuthTitleBlock
          title="Create New Password"
          description="Your new password must be different from your previously used password."
        />
        <View style={layoutStyle.fieldGroup}>
          <TextField
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            error={passwordError}
            secureTextEntry
            testID="reset-password-new"
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
            testID="reset-password-confirm"
          />
          <Button
            title="Reset Password"
            titleStyle={sharedButton.primaryTitle}
            style={sharedButton.primary}
            onPress={handleSubmit}
          />
        </View>
      </View>

      {isSuccessOpen && (
        <SuccessSheet
          title="Reset Succesfully"
          description="Please re-login to get started"
          buttonLabel="Log in"
          onButtonPress={() => router.replace('/auth/sign-in')}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
