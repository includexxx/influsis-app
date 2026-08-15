import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import NotificationCard from '@/components/elements/NotificationCard';
import { notificationsStyle } from './notifications.styles';
import { recentNotifications, last24HoursNotifications } from './notifications.data';

// The Notifications screen (Figma "Notification", node 6346:5575), pushed
// from the Home tab's AppHeader bell icon (components/elements/AppHeader).
// Populated from data/notifications.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/notifications/README.md.
export default function Notifications() {
  const { colors, palette } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Notification"
          onBack={() => router.back()}
          style={notificationsStyle.headerGap}
        />

        <View style={notificationsStyle.listGap}>
          {recentNotifications.map(item => (
            <NotificationCard key={item.id} {...item} />
          ))}
        </View>

        <Text
          style={[
            notificationsStyle.sectionLabel,
            notificationsStyle.sectionLabelGap,
            { color: palette.gray[300] },
          ]}>
          Last 24 Hours
        </Text>

        <View style={notificationsStyle.listGap}>
          {last24HoursNotifications.map(item => (
            <NotificationCard key={item.id} {...item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
