import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import SavedMethodCard from '@/components/elements/SavedMethodCard';
import SummaryRow from '@/components/elements/SummaryRow';
import Button from '@/components/elements/Button';
import { savedPaymentMethod } from '@/data/withdrawMethods';

// The withdraw review step (Figma "Payment", node 6212:7574), pushed from
// the amount step. Confirms which saved wallet the money is going to, plays
// back the amount, and states the terms the "Continue" press accepts.
//
// `amount` arrives as a route param from scenes/main/WithdrawAmount.tsx;
// Figma's own frame shows "$750", which is the fallback when the screen is
// deep-linked without one. See docs/screen/mobile-banking/README.md.
export default function WithdrawReview() {
  const { colors } = useTheme();
  const { amount } = useLocalSearchParams<{ amount?: string }>();

  const displayAmount = amount ? `$${amount.replace(/^\$/, '')}` : '$750';

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Payment" onBack={() => router.back()} style={withdrawStyle.headerRow} />

        <Text style={withdrawStyle.sectionTitle}>Payment method</Text>

        <SavedMethodCard
          icon={savedPaymentMethod.icon}
          iconSize={savedPaymentMethod.iconSize}
          account={savedPaymentMethod.account}
          description={savedPaymentMethod.description}
          selected
          style={withdrawStyle.savedMethodCard}
          testID="withdraw-review-saved-method"
        />

        <Text
          style={withdrawStyle.changeMethodLink}
          onPress={() => router.push('/withdraw/method')}
          testID="withdraw-review-change-method">
          Change withdraw methode
        </Text>

        <Text style={[withdrawStyle.sectionTitle, withdrawStyle.reviewTitle]}>Review</Text>

        <SummaryRow
          label="Withdraw amount"
          value={displayAmount}
          variant="filled"
          style={withdrawStyle.reviewRow}
          testID="withdraw-review-amount"
        />

        <Text style={withdrawStyle.termsText}>
          By pressing “Confirm” you agree to the{' '}
          <Text style={withdrawStyle.termsLink}>Terms and Conditions</Text>
        </Text>
      </ScrollView>

      <View style={withdrawStyle.footer}>
        <Button
          title="Continue"
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push('/withdraw/success')}
          testID="withdraw-review-continue"
        />
      </View>
    </SafeAreaView>
  );
}
