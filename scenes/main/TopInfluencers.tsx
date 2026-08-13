import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, topInfluencersStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import InfluencerCard from '@/components/elements/InfluencerCard';
import { topInfluencers } from '@/data/topInfluencers';

// The Top Influencers screen (Figma "Top Influencer", node 6028:7456),
// pushed from the Home tab's "Top Rated Influencer" section "See all" link
// (scenes/main/Home.tsx). Registered as a root-level route (app/
// top-influencers.tsx, outside the (main) Tabs group), the same reasoning
// as /notifications, /live-campaign, /campaigns, /brands and /top-gigs -
// Figma's own bottom bar on this frame is a mismatched "Campaigns/Order/
// Message/Profile" set that doesn't match this app's real tab bar (Home/
// Order/Create Gig/Message/Profile) and sits outside the frame's normal
// viewport bounds, so it's treated as a stray Figma artifact rather than
// built. Populated from data/topInfluencers.ts mock content - no backend
// exists yet (docs/PRD.md §2.2/§4.1) - see docs/screen/top-influencers/README.md.
export default function TopInfluencers() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Top Influencers"
          onBack={() => router.back()}
          style={topInfluencersStyle.headerGap}
        />

        <View style={topInfluencersStyle.listGap}>
          {topInfluencers.map(item => (
            <InfluencerCard key={item.id} {...item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
