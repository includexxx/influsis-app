import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, orderStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CategoryChip from '@/components/elements/CategoryChip';
import OrderCard from '@/components/elements/OrderCard';
import EmptyState from '@/components/elements/EmptyState';
import OrderIllustration from '@/components/elements/OrderIllustration';
import { orders } from '@/data/orders';
import { OrderTab } from '@/types';

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'campaign', label: 'Campaign' },
  { key: 'gig-order', label: 'Gig order' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

// "No Campaign Found"/"No Gig Found" copy verbatim from Figma (nodes
// 6366:6730/6574:6415); "Completed"/"Cancelled" have no captured Figma
// empty state so their titles extend the same "No <Tab> Found" pattern.
const EMPTY_STATE_TITLE: Record<OrderTab, string> = {
  campaign: 'No Campaign Found',
  'gig-order': 'No Gig Found',
  completed: 'No Completed Order Found',
  cancelled: 'No Cancelled Order Found',
};

// The Order tab's root screen (Figma "Order_Campaign" - nodes 6212:5540
// "Campaign", 6212:5843 "Gig order", 6212:6024 "Completed", 6403:5508
// "Cancelled", plus the 6366:6730/6574:6415 empty states), a creator's
// campaign and gig orders filtered by 4 chips. Registered as the `order`
// tab in app/(main)/_layout.tsx (bottom tab bar already built there - see
// docs/screen/main/README.md). Figma's header shows a back chevron +
// centered title exactly matching ScreenHeader's shape (unlike Home/
// Search's AppHeader wordmark+bell) - `onBack` returns to the Home tab
// since Order has no push-stack history of its own to go back to. Populated
// from data/orders.ts mock content - no backend exists yet (docs/PRD.md
// §2.2/§4.1) - see docs/screen/orders/README.md.
export default function Order() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<OrderTab>('campaign');

  const filteredOrders = useMemo(
    () => orders.filter(order => order.tab === activeTab),
    [activeTab],
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Order"
          onBack={() => router.push('/home')}
          style={orderStyle.headerGap}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={orderStyle.tabRow}>
            {TABS.map(tab => (
              <CategoryChip
                key={tab.key}
                label={tab.label}
                selected={activeTab === tab.key}
                onPress={() => setActiveTab(tab.key)}
                testID={`order-tab-${tab.key}`}
              />
            ))}
          </View>
        </ScrollView>

        {filteredOrders.length > 0 ? (
          <View style={orderStyle.listGap}>
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                image={order.image}
                title={order.title}
                orderedFrom={order.orderedFrom}
                price={order.price}
                status={order.status}
                statusColor={order.statusColor}
                statusTextColor={order.statusTextColor}
                dueDate={order.dueDate}
                orderedDate={order.orderedDate}
                onPress={() => router.push(`/order/${order.id}`)}
                testID={`order-card-${order.id}`}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            style={orderStyle.emptyState}
            illustration={<OrderIllustration />}
            title={EMPTY_STATE_TITLE[activeTab]}
            description="When we add collections. They'll be appear here"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
