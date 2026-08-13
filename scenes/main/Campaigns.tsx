import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, campaignsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import { campaigns } from '@/data/campaigns';

// The Campaigns screen (Figma "All Campaigns", node 6010:17065), pushed
// from the Home tab's "Campaigns" section "See all" link
// (scenes/main/Home.tsx). Registered as a root-level route (app/
// campaigns.tsx, outside the (main) Tabs group) since Figma shows no tab bar
// on this screen, the same reasoning as /notifications and /live-campaign.
// Populated from data/campaigns.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/campaigns/README.md.
export default function Campaigns() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Campaigns"
          onBack={() => router.back()}
          style={campaignsStyle.headerGap}
        />

        <View style={campaignsStyle.listGap}>
          {campaigns.map(item => (
            <CampaignCard key={item.id} variant="list" {...item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
