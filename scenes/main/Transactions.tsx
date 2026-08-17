import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, transactionsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import TransactionRow from '@/components/elements/TransactionRow';
import { transactions } from '@/data/transactions';

// The Transaction history (Figma "Transaction", node 6212:7410), pushed
// from the Balance screen's "Recent transaction" row
// (scenes/main/Balance.tsx). Registered in the `(details)` route group
// rather than `(main)`: unlike the Balance frame, this one has no Tab Bar
// instance, so it pushes onto the root Stack with no tab bar underneath -
// the same reasoning every other `(details)` screen follows.
//
// A flat 16px-gutter list; Figma has no card, divider, section heading,
// filter or empty state on this frame. See
// docs/screen/transactions/README.md.
export default function Transactions() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Transaction"
          onBack={() => router.back()}
          style={transactionsStyle.headerRow}
        />

        <View style={transactionsStyle.list}>
          {transactions.map(transaction => (
            <TransactionRow
              key={transaction.id}
              icon={transaction.icon}
              iconSize={transaction.iconSize}
              title={transaction.title}
              date={transaction.date}
              amount={transaction.amount}
              testID={`transaction-${transaction.id}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
