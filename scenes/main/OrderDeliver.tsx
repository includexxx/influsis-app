import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, orderDeliverStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import OrderActivityRow from '@/components/elements/OrderActivityRow';
import StatusBadge from '@/components/elements/StatusBadge';
import StepTracker from '@/components/elements/StepTracker';
import { orders } from '@/data/orders';
import { OrderActivityEvent } from '@/types';

const placeOrderIcon = require('@/assets/images/order-details/activity-place-order.png');
const orderStartedIcon = require('@/assets/images/order-details/activity-order-started.png');
const clipIcon = require('@/assets/images/order-details/clip.png');

const activityIcons: Record<OrderActivityEvent['icon'], ImageSourcePropType> = {
  'place-order': placeOrderIcon,
  'order-started': orderStartedIcon,
};

type DeliverTab = 'activity' | 'details';

// The Order Deliver screen (Figma "Order Deliver" - nodes 6040:8590/
// 6574:6219 "Order Activity" tab (empty/filled link field) and 6040:8664
// "Order Details" tab), pushed from Order Details' "Delivery" button
// (scenes/main/OrderDetails.tsx). Registered as a nested dynamic route
// (app/(details)/order/[id]/deliver.tsx), the same pattern
// app/(details)/campaign/[id]/apply.tsx already establishes for a "push a
// sibling screen under the same dynamic id" flow. The two tabs switch
// in-place via local state (not a navigation) - "Order Details" here shows
// a condensed summary + "Order Tracker" progress card, distinct from the
// full `/order/[id]` screen this same order navigated in from. Looks the
// order up by id in data/orders.ts - see
// docs/screen/order-deliver/README.md.
export default function OrderDeliver() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = orders.find(item => item.id === id);
  const [activeTab, setActiveTab] = useState<DeliverTab>('activity');
  const [deliveryLink, setDeliveryLink] = useState('');

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
          style={orderDeliverStyle.headerRow}
        />
        <View style={orderDeliverStyle.divider} />

        <View style={orderDeliverStyle.tabsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'activity' }}
            onPress={() => setActiveTab('activity')}
            style={[
              orderDeliverStyle.tabItem,
              activeTab === 'activity' && orderDeliverStyle.tabItemActive,
            ]}
            testID="order-deliver-tab-activity">
            <Text
              style={
                activeTab === 'activity'
                  ? orderDeliverStyle.tabActiveLabel
                  : orderDeliverStyle.tabInactiveLabel
              }>
              Order Activity
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'details' }}
            onPress={() => setActiveTab('details')}
            style={[
              orderDeliverStyle.tabItem,
              activeTab === 'details' && orderDeliverStyle.tabItemActive,
            ]}
            testID="order-deliver-tab-details">
            <Text
              style={
                activeTab === 'details'
                  ? orderDeliverStyle.tabActiveLabel
                  : orderDeliverStyle.tabInactiveLabel
              }>
              Order Details
            </Text>
          </Pressable>
        </View>

        {activeTab === 'activity' ? (
          <>
            {!!order.activity?.length && (
              <View style={orderDeliverStyle.activityList}>
                {order.activity.map((event, index) => (
                  <OrderActivityRow
                    key={index}
                    icon={activityIcons[event.icon]}
                    business={order.businessName ?? ''}
                    action={event.action}
                    timestamp={event.timestamp}
                    muted={event.muted}
                    testID={`order-activity-${index}`}
                  />
                ))}
              </View>
            )}

            <TextField
              placeholder="Deliver your file here"
              value={deliveryLink}
              onChangeText={setDeliveryLink}
              autoCapitalize="none"
              containerStyle={orderDeliverStyle.inputWrap}
              inputRowStyle={orderDeliverStyle.inputRow}
              rightAdornment={
                <Image source={clipIcon} style={orderDeliverStyle.clipIcon} contentFit="contain" />
              }
              testID="order-deliver-input"
            />

            <Button
              title="Delivery"
              style={orderDeliverStyle.deliveryButton}
              titleStyle={orderDeliverStyle.deliveryButtonTitle}
              onPress={() => router.push(`/order/${order.id}/delivered`)}
              testID="order-deliver-submit"
            />
          </>
        ) : (
          <>
            <Text style={orderDeliverStyle.sectionTitle}>Order Details</Text>

            <View style={orderDeliverStyle.summaryRow}>
              <Image
                source={order.image}
                style={orderDeliverStyle.summaryImage}
                contentFit="cover"
              />
              <View style={orderDeliverStyle.summaryTextCol}>
                <Text style={orderDeliverStyle.summaryTitle}>{order.title}</Text>
                <StatusBadge
                  label={order.status}
                  color={order.statusColor}
                  textColor={order.statusTextColor}
                />
              </View>
            </View>

            <View style={orderDeliverStyle.metaList}>
              <View style={orderDeliverStyle.metaRow}>
                <Text style={orderDeliverStyle.metaLabel}>Purchased by</Text>
                <Text style={orderDeliverStyle.metaValue}>{order.businessName}</Text>
              </View>
              {order.deliveryDate && (
                <View style={orderDeliverStyle.metaRow}>
                  <Text style={orderDeliverStyle.metaLabel}>Delivery due date</Text>
                  <Text style={orderDeliverStyle.metaValue}>{order.deliveryDate}</Text>
                </View>
              )}
              <View style={orderDeliverStyle.metaRow}>
                <Text style={orderDeliverStyle.metaLabel}>Price</Text>
                <Text style={orderDeliverStyle.metaValue}>{order.price}</Text>
              </View>
              {order.orderNumber && (
                <View style={orderDeliverStyle.metaRow}>
                  <Text style={orderDeliverStyle.metaLabel}>Order number</Text>
                  <Text style={orderDeliverStyle.metaValue}>{order.orderNumber}</Text>
                </View>
              )}
            </View>

            {!!order.tracker?.length && (
              <View style={orderDeliverStyle.trackerCard}>
                <Text style={orderDeliverStyle.trackerHeading}>Order Tracker</Text>
                <StepTracker steps={order.tracker} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
