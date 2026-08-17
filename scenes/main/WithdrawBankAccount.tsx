import { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawBankStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import BankRow from '@/components/elements/BankRow';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import { banks } from '@/data/banks';

const accountUserIcon = require('@/assets/images/withdraw/account-user.png');
const hintBulbIcon = require('@/assets/images/withdraw/hint-bulb.png');

// The bank account-number step (Figma "Withdraw to Bank", node 6212:7801),
// pushed by tapping a bank in the directory. Shows the chosen bank back in
// the search field's slot, takes the account number, and explains where the
// OTP will land before "Continue" sends it.
//
// Looks the bank up by the `id` route param the directory passed - the same
// "find by id or redirect" pattern scenes/main/OrderDetails.tsx uses. See
// docs/screen/withdraw-bank/README.md.
export default function WithdrawBankAccount() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [accountNumber, setAccountNumber] = useState('');

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

        <Text style={withdrawBankStyle.fieldLabel}>Enter Bank name to search</Text>

        <BankRow
          logo={bank.logo}
          name={bank.name}
          onPress={() => router.back()}
          style={withdrawBankStyle.searchField}
          testID="withdraw-bank-account-selected"
        />

        <Text style={[withdrawBankStyle.fieldLabel, withdrawBankStyle.listLabel]}>
          Account Number
        </Text>

        <View style={withdrawBankStyle.accountField}>
          <Image
            source={accountUserIcon}
            style={withdrawBankStyle.accountFieldIcon}
            contentFit="contain"
          />
          <TextInput
            style={withdrawBankStyle.accountFieldInput}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter Bank Account Number"
            placeholderTextColor={palette.gray[300]}
            keyboardType="number-pad"
            testID="withdraw-bank-account-input"
          />
        </View>

        <View style={withdrawBankStyle.hintCard}>
          <Image source={hintBulbIcon} style={withdrawBankStyle.hintIcon} contentFit="contain" />
          <Text style={withdrawBankStyle.hintText}>
            OTP will be sent the mobile number that is registered to your Bank Account. If needed,
            please contact with bank to update the number.{'\n'}For more details, check
          </Text>
        </View>

        <Text style={withdrawBankStyle.footnote}>
          For details, please read{' '}
          <Text style={withdrawBankStyle.footnoteStrong}>Terms &amp; Conditions</Text>
        </Text>
      </ScrollView>

      <View style={withdrawBankStyle.footer}>
        <Button
          title="Continue"
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push(`/withdraw/bank/${bank.id}/verify`)}
          testID="withdraw-bank-account-continue"
        />
      </View>
    </SafeAreaView>
  );
}
