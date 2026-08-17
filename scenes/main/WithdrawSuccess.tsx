import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { layoutStyle, withdrawSuccessStyle } from '@/styles';
import SuccessHero from '@/components/elements/SuccessHero';
import RecipientPill from '@/components/elements/RecipientPill';
import SummaryRow from '@/components/elements/SummaryRow';
import { withdrawReceipt } from '@/data/banks';

// The withdraw confirmation screen (Figma "Balance", node 6407:5772).
// Confetti hero, a receipt pill naming who was paid and how much, then the
// transaction id and timestamp.
//
// Figma gives this frame no header and no CTA, so neither is invented here;
// the hardware/gesture back is the only way out, matching the design. See
// docs/screen/withdraw-bank/README.md.
export default function WithdrawSuccess() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={withdrawSuccessStyle.content}
        showsVerticalScrollIndicator={false}>
        <SuccessHero
          title="Withdraw money successfully"
          description="Your withdraw has been processed"
          style={withdrawSuccessStyle.hero}
          testID="withdraw-success-hero"
        />

        <RecipientPill
          avatar={withdrawReceipt.avatar}
          name={withdrawReceipt.recipient}
          amount={withdrawReceipt.amount}
          style={withdrawSuccessStyle.receipt}
        />

        <View style={withdrawSuccessStyle.details}>
          <SummaryRow label="Transaction ID" value={withdrawReceipt.transactionId} />
          <SummaryRow label="Date & Time" value={withdrawReceipt.dateTime} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
