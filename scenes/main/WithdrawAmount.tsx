import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';

// The withdraw amount step (Figma "Payment", node 6212:7543), where the
// mobile-wallet and bank branches converge. A single "Withdraw amount"
// field over a pinned "Next" CTA - Figma draws the field completely empty,
// with no placeholder or currency prefix, so none is added.
//
// The amount is carried to the review step as a route param rather than
// through Redux: it is a one-hop handoff inside a single flow, which
// docs/PRD.md §6's "local state only when not shared" convention covers.
// See docs/screen/mobile-banking/README.md.
export default function WithdrawAmount() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Payment" onBack={() => router.back()} style={withdrawStyle.headerRow} />

        <Text style={withdrawStyle.sectionTitle}>Withdraw amount</Text>

        <TextField
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          containerStyle={withdrawStyle.amountFieldWrap}
          inputRowStyle={withdrawStyle.amountFieldRow}
          inputStyle={withdrawStyle.amountFieldInput}
          testID="withdraw-amount-input"
        />
      </ScrollView>

      <View style={withdrawStyle.footer}>
        <Button
          title="Next"
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push(`/withdraw/review?amount=${encodeURIComponent(amount)}`)}
          testID="withdraw-amount-next"
        />
      </View>
    </SafeAreaView>
  );
}
