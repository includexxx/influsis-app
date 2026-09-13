import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, withdrawBankStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import BankRow from '@/components/elements/BankRow';
import { banks } from '@/data/banks';

// The bank directory (Figma "Withdraw to Bank", node 6212:7623), pushed
// from the Balance screen's "Bank transfer" row (scenes/main/Balance.tsx).
// A name filter over a bordered panel listing every supported bank; picking
// one carries its id to the account-number step.
//
// Registered in the `(details)` route group - Figma's frame has no Tab Bar
// instance, unlike the Balance frame. Figma shows no CTA here: the list
// itself is the action. See docs/screen/withdraw-bank/README.md.
export default function WithdrawBank() {
  const { colors, palette } = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return banks;
    return banks.filter(bank => bank.name.toLowerCase().includes(needle));
  }, [query]);

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

        <View style={withdrawBankStyle.searchField}>
          <TextInput
            style={withdrawBankStyle.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Enter Bank Name"
            placeholderTextColor={palette.gray[300]}
            autoCorrect={false}
            testID="withdraw-bank-search"
          />
        </View>

        <Text style={[withdrawBankStyle.fieldLabel, withdrawBankStyle.listLabel]}>All Banks</Text>

        <View style={withdrawBankStyle.listPanel}>
          {results.length ? (
            results.map(bank => (
              <BankRow
                key={bank.id}
                logo={bank.logo}
                name={bank.name}
                onPress={() => router.push(`/withdraw/bank/${bank.id}`)}
                testID={`withdraw-bank-${bank.id}`}
              />
            ))
          ) : (
            <Text style={withdrawBankStyle.emptyText}>No bank matches “{query.trim()}”.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
