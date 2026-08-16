import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, orderDeliveredStyle } from '@/styles';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import { orders } from '@/data/orders';

const successCheckIcon = require('@/assets/images/icons/success-check.png');

// The Order Delivered confirmation screen (Figma "Balance", node
// 6574:6294), shown after submitting the Order Deliver screen's "Delivery"
// button. Registered as a nested dynamic route
// (app/(details)/order/[id]/delivered.tsx) alongside `/order/[id]/deliver`.
//
// Figma's frame is a static centered page with no button at all - unlike
// this app's other post-submit confirmations (`SuccessSheet`, used by
// e.g. Apply Campaign's "Successful!" popup), which are all bottom sheets
// with an explicit CTA. This screen reuses `SuccessSheet`'s exact badge
// treatment (91px green circle, the same `success-check.png` icon and
// shadow) since the glyph itself is identical, but as a plain full-page
// layout rather than a `BottomSheet` - Figma's card is vertically centered
// on a blank page, not anchored to the bottom edge, so wrapping it in
// `BottomSheet` would visibly misplace it. A "Back to Order" button was
// added despite Figma showing none, so the flow doesn't strand the user
// with zero navigation - see docs/screen/order-deliver/README.md "Scope
// notes".
export default function OrderDelivered() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = orders.find(item => item.id === id);

  if (!order) {
    return <Redirect href="/order" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={orderDeliveredStyle.root}>
        <View style={orderDeliveredStyle.badge}>
          <Image source={successCheckIcon} style={orderDeliveredStyle.icon} contentFit="contain" />
        </View>
        <Text style={orderDeliveredStyle.title}>
          {'Congratulation!\nYou have delivered the project'}
        </Text>
        <Text style={orderDeliveredStyle.description}>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        </Text>
        <Button
          title="Back to Order"
          style={[buttonStyle.primary, orderDeliveredStyle.button]}
          titleStyle={buttonStyle.primaryTitle}
          onPress={() => router.replace('/order')}
          testID="order-delivered-back"
        />
      </View>
    </SafeAreaView>
  );
}
