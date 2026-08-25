import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, topCreatorsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CreatorCard from '@/components/elements/CreatorCard';
import { topCreators } from '@/data/topCreators';

// The Top Creators screen (Figma "Top Creator", node 6028:7456),
// pushed from the Home tab's "Top Rated Creator" section "See all" link
// (scenes/main/Home.tsx). Registered in the app/(details)/ route group
// (outside the (main) Tabs group), the same reasoning as /notifications,
// /live-campaign, /campaigns, /businesses and /top-gigs -
// Figma's own bottom bar on this frame is a mismatched "Campaigns/Order/
// Message/Profile" set that doesn't match this app's real tab bar (Home/
// Order/Create Gig/Message/Profile) and sits outside the frame's normal
// viewport bounds, so it's treated as a stray Figma artifact rather than
// built. Populated from data/topCreators.ts mock content - no backend
// exists yet (docs/PRD.md §2.2/§4.1) - see docs/screen/top-creators/README.md.
export default function TopCreators() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Top Creators"
          onBack={() => router.back()}
          style={topCreatorsStyle.headerGap}
        />

        <View style={topCreatorsStyle.listGap}>
          {topCreators.map(item => (
            <CreatorCard
              key={item.id}
              {...item}
              onPress={() => router.push(`/creator/${item.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
