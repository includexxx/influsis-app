import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, withdrawStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import { bkashPayer } from '@/data/withdrawMethods';

const bkashCheckoutImage = require('@/assets/images/withdraw/bkash-checkout.png');

// The bKash hand-off screen (Figma "Withdraw Method", node 6212:7767),
// pushed when a mobile wallet is chosen on the Withdraw Method picker.
//
// The provider's checkout card - its wordmark, the pink account-number
// panel, the Cancel/Confirm pair and the 16247 footer - is a single
// flattened 300x513 bitmap in Figma (node 6212:7796), not a component tree,
// so it is rendered as the image it is rather than rebuilt from primitives
// whose vector source we don't have. Only the payer row Figma layers on top
// (node 6212:7797) is real markup; the "৳20" beside it is part of the
// bitmap. Wiring the bKash SDK is out of scope for this UI pass -
// "Continue" advances to the amount step. See
// docs/screen/mobile-banking/README.md.
export default function WithdrawBkash() {
  const { colors } = useTheme();

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

        <View style={withdrawStyle.bkashCard}>
          <Image
            source={bkashCheckoutImage}
            style={withdrawStyle.bkashCardImage}
            contentFit="contain"
          />
          <View style={withdrawStyle.bkashPayerRow}>
            <Image
              source={bkashPayer.avatar}
              style={withdrawStyle.bkashPayerAvatar}
              contentFit="cover"
            />
            <Text style={withdrawStyle.bkashPayerName}>{bkashPayer.name}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={withdrawStyle.footer}>
        <Button
          title="Continue"
          style={buttonStyle.primary}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.push('/withdraw/amount')}
          testID="withdraw-bkash-continue"
        />
      </View>
    </SafeAreaView>
  );
}
