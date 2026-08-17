import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, balanceStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import BalanceCard from '@/components/elements/BalanceCard';
import EarningTile from '@/components/elements/EarningTile';
import BillingRow from '@/components/elements/BillingRow';
import { balanceSummary, paymentMethods } from '@/data/balance';

// The Balance screen (Figma "Balance", node 6402:5295), pushed from the
// Profile tab's "Ballance" row (scenes/main/Profile.tsx). Registered inside
// the `(main)` Tabs group with `href: null` - like `/search` - rather than
// in `(details)`, because Figma's frame keeps the tab bar mounted
// underneath (a "Tab Bar" instance sits at y=848).
//
// See docs/screen/balance/README.md.
export default function Balance() {
  const { colors } = useTheme();
  // Figma seeds the pink pressed state on the "Recent transaction" row
  // (node 6402:5348), but the rows ship unhighlighted at rest - the pink
  // fill is a press affordance, not a persisted default. `selectedId` is
  // tracked ready for whichever row should own it once these rows have
  // destinations to navigate to.
  const [selectedId, setSelectedId] = useState('recent-transaction');

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Balance" onBack={() => router.back()} style={balanceStyle.headerRow} />

        <BalanceCard
          total={balanceSummary.total}
          change={balanceSummary.change}
          changeDirection={balanceSummary.changeDirection}
          testID="balance-hero-card"
        />

        <View style={balanceStyle.earningRow}>
          <EarningTile value={balanceSummary.monthlyEarning} label="Monthly earning" />
          <EarningTile value={balanceSummary.totalEarning} label="Total earning" />
        </View>

        <Text style={balanceStyle.sectionTitle}>Payment Method</Text>

        <View style={balanceStyle.optionList}>
          {paymentMethods.map(method => (
            <BillingRow
              key={method.id}
              icon={method.icon}
              title={method.title}
              description={method.description}
              highlighted={false}
              onPress={() => setSelectedId(method.id)}
              testID={`balance-method-${method.id}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
