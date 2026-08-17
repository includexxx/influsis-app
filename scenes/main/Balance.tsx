import BalanceCard from '@/components/elements/BalanceCard';
import BillingRow from '@/components/elements/BillingRow';
import EarningTile from '@/components/elements/EarningTile';
import ScreenHeader from '@/components/elements/ScreenHeader';
import { balanceSummary, paymentMethods } from '@/data/balance';
import { useTheme } from '@/hooks';
import { balanceStyle, layoutStyle } from '@/styles';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The Balance screen (Figma "Balance", node 6402:5295), pushed from the
// Profile tab's "Ballance" row (scenes/main/Profile.tsx). Registered inside
// the `(main)` Tabs group with `href: null` - like `/search` - rather than
// in `(details)`, because Figma's frame keeps the tab bar mounted
// underneath (a "Tab Bar" instance sits at y=848).
//
// See docs/screen/balance/README.md.
export default function Balance() {
  const { colors } = useTheme();

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
              onPress={() => {
                if (method.href) router.push(method.href);
              }}
              testID={`balance-method-${method.id}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
