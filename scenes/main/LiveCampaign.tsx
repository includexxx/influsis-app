import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, liveCampaignStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import { liveCampaigns } from '@/data/liveCampaigns';

// The Live Campaigns screen (Figma "Live campaigns", node 6111:6871), pushed
// from the Home tab's "Active Campaigns" section "See all" link
// (scenes/main/Home.tsx). Registered in the app/(details)/ route group
// (outside the (main) Tabs group) since Figma shows no tab bar on this
// screen, the same reasoning as /notifications (see
// docs/screen/notifications/README.md "Navigation"). Populated from
// data/liveCampaigns.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/live-campaign/README.md.
export default function LiveCampaign() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Live Campaigns"
          onBack={() => router.back()}
          style={liveCampaignStyle.headerGap}
        />

        <View style={liveCampaignStyle.listGap}>
          {liveCampaigns.map(item => (
            <CampaignCard
              key={item.id}
              variant="list"
              {...item}
              onPress={() => router.push(`/campaign/${item.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
