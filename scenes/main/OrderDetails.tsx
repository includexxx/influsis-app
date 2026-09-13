import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle, orderDetailsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import BulletList from '@/components/elements/BulletList';
import { orders } from '@/data/orders';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const checkCircleIcon = require('@/assets/images/order-details/check-circle.png');

// The Order Details screen (Figma "Order details", node 6040:8515), pushed
// from any order card's tap on the Order tab - every OrderCard (all 4
// filter tabs) navigates here (scenes/main/Order.tsx). Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/order/[id].tsx), the same "no tab bar" reasoning as every
// other screen in that group - Figma's frame has no tab bar instance.
// Looks the tapped order up by id in data/orders.ts's canonical `orders`
// array - see docs/screen/order-details/README.md.
export default function OrderDetails() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = orders.find(item => item.id === id);

  if (!order) {
    return <Redirect href="/order" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Order details"
          onBack={() => router.back()}
          style={orderDetailsStyle.headerRow}
        />

        <Image source={order.image} style={orderDetailsStyle.image} contentFit="cover" />

        <View style={orderDetailsStyle.titleRow}>
          <Text style={[orderDetailsStyle.title, { color: colors.text.primary }]}>
            {order.title}
          </Text>
          <View style={orderDetailsStyle.priceCol}>
            <Text style={[orderDetailsStyle.priceLabel, { color: palette.gray[500] }]}>
              Total Price
            </Text>
            <Text style={orderDetailsStyle.priceValue}>{order.price}</Text>
          </View>
        </View>

        <View style={orderDetailsStyle.metaRow}>
          <View style={orderDetailsStyle.metaGroup}>
            <Text style={[orderDetailsStyle.metaLabel, { color: palette.gray[300] }]}>Order:</Text>
            <View style={orderDetailsStyle.metaBrandGroup}>
              <Text style={[orderDetailsStyle.metaBrandValue, { color: palette.primary[400] }]}>
                {order.brandName}
              </Text>
              {order.brandVerified && (
                <Image
                  source={verifiedBadge}
                  style={orderDetailsStyle.verifiedIcon}
                  contentFit="contain"
                />
              )}
            </View>
          </View>

          {order.deliveryDate && (
            <>
              <View style={orderDetailsStyle.metaDivider} />
              <View style={orderDetailsStyle.metaGroup}>
                <Text style={[orderDetailsStyle.metaLabel, { color: palette.gray[300] }]}>
                  Delivery:
                </Text>
                <Text style={[orderDetailsStyle.metaDeliveryValue, { color: palette.gray[900] }]}>
                  {order.deliveryDate}
                </Text>
              </View>
            </>
          )}
        </View>

        {!!order.deliverables?.length && (
          <View style={orderDetailsStyle.card}>
            <Text style={orderDetailsStyle.cardHeading}>Deliverable</Text>
            <View style={orderDetailsStyle.deliverableList}>
              {order.deliverables.map((deliverable, index) => (
                <View key={index} style={orderDetailsStyle.deliverableRow}>
                  <Image
                    source={checkCircleIcon}
                    style={orderDetailsStyle.deliverableIcon}
                    contentFit="contain"
                  />
                  <View style={orderDetailsStyle.deliverableTextCol}>
                    <Text style={orderDetailsStyle.deliverableTitle}>{deliverable.title}</Text>
                    <Text style={orderDetailsStyle.deliverableDescription}>
                      {deliverable.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!!order.requirements?.length && (
          <>
            <Text style={[orderDetailsStyle.requirementsTitle, { color: colors.text.primary }]}>
              Requirements
            </Text>
            <BulletList
              items={order.requirements}
              color={palette.gray[300]}
              style={orderDetailsStyle.requirementsListGap}
            />
          </>
        )}

        <View style={orderDetailsStyle.buttonsWrap}>
          <Button
            title="Delivery"
            style={buttonStyle.primary}
            titleStyle={buttonStyle.primaryTitle}
            onPress={() => router.push(`/order/${order.id}/deliver`)}
            testID="order-details-delivery-button"
          />
          <Button
            title="Message"
            style={orderDetailsStyle.messageButton}
            titleStyle={orderDetailsStyle.messageButtonTitle}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
