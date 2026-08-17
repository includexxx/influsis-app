import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawBankStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import OtpInput from '@/components/elements/OtpInput';
import Button from '@/components/elements/Button';
import { banks } from '@/data/banks';

const OTP_LENGTH = 4;

// The bank OTP step (Figma "Withdraw to Bank", node 6212:7849), the last
// screen before the money moves. Reuses the existing `OtpInput` element -
// its 86x75 boxes and 12px radius already match this frame exactly, the
// same shape the auth flow's verify-otp screen uses.
//
// "Continue" stays disabled until all four digits are entered; Figma draws
// only the empty state, but shipping an always-enabled CTA on an OTP form
// would let a half-typed code through. See
// docs/screen/withdraw-bank/README.md.
export default function WithdrawBankVerify() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [code, setCode] = useState('');

  const bank = banks.find(item => item.id === id);

  if (!bank) {
    return <Redirect href="/withdraw/bank" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Withdraw to Bank"
          onBack={() => router.back()}
          style={withdrawBankStyle.headerRow}
        />

        <View style={withdrawBankStyle.verifyBankRow}>
          <Image source={bank.logo} style={withdrawBankStyle.verifyBankLogo} contentFit="contain" />
          <Text style={withdrawBankStyle.verifyBankName}>{bank.name}</Text>
        </View>

        <OtpInput
          length={OTP_LENGTH}
          value={code}
          onChange={setCode}
          style={withdrawBankStyle.otpInput}
        />

        <Text style={withdrawBankStyle.resendText}>
          Don’t Receive the verification code?{' '}
          <Text style={withdrawBankStyle.resendLink} testID="withdraw-bank-verify-resend">
            Resend Code
          </Text>
        </Text>
      </ScrollView>

      <View style={withdrawBankStyle.footer}>
        <Button
          title="Continue"
          disabled={code.length < OTP_LENGTH}
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push('/withdraw/success')}
          testID="withdraw-bank-verify-continue"
        />
      </View>
    </SafeAreaView>
  );
}
