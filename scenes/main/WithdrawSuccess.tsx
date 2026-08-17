import Button from '@/components/elements/Button';
import RecipientPill from '@/components/elements/RecipientPill';
import SuccessHero from '@/components/elements/SuccessHero';
import SummaryRow from '@/components/elements/SummaryRow';
import { withdrawReceipt } from '@/data/banks';
import { useTheme } from '@/hooks';
import { buttonStyle, layoutStyle, withdrawSuccessStyle } from '@/styles';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

        <View style={{ marginTop: 32 }}>
          <Button
            title="Profile"
            style={buttonStyle.primary}
            titleStyle={buttonStyle.primaryTitle}
            onPress={() => router.push('/profile')}
            testID="withdraw-method-continue"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
