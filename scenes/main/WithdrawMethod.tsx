import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import WithdrawMethodRow from '@/components/elements/WithdrawMethodRow';
import Button from '@/components/elements/Button';
import { withdrawMethods } from '@/data/withdrawMethods';

// The Withdraw Method picker (Figma "Withdraw Method", node 6212:7700),
// pushed from the Balance screen's "Mobile banking" row. Five rows - three
// mobile wallets shown as bare logos, then Bank Account and Visa Debit Card
// as icon + label - over a pinned "Continue" CTA.
//
// Figma seeds the pink selected border on the bKash row. Tapping a row only
// selects it; "Continue" is what advances, which is why each option carries
// its own `href` and the CTA reads it from the selected row rather than the
// row's own press. See docs/screen/mobile-banking/README.md.
export default function WithdrawMethod() {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState(withdrawMethods[0].id);

  const selected = withdrawMethods.find(method => method.id === selectedId) ?? withdrawMethods[0];

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Withdraw Method"
          onBack={() => router.back()}
          style={withdrawStyle.headerRow}
        />

        <View style={withdrawStyle.methodList}>
          {withdrawMethods.map(method => (
            <WithdrawMethodRow
              key={method.id}
              logo={method.logo}
              logoWidth={method.logoWidth}
              logoHeight={method.logoHeight}
              icon={method.icon}
              iconSize={method.iconSize}
              label={method.label}
              selected={selectedId === method.id}
              onPress={() => setSelectedId(method.id)}
              testID={`withdraw-method-${method.id}`}
            />
          ))}
        </View>
      </ScrollView>

      <View style={withdrawStyle.footer}>
        <Button
          title="Continue"
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push(selected.href)}
          testID="withdraw-method-continue"
        />
      </View>
    </SafeAreaView>
  );
}
