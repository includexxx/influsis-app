import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, topGigsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import GigCard from '@/components/elements/GigCard';
import { topGigs } from '@/data/topGigs';

// The Top Gigs screen (Figma "Top Gigs", node 6028:7350), pushed from the
// Home tab's "Top Gigs" section "See all" link (scenes/main/Home.tsx).
// Registered in the app/(details)/ route group (outside the (main) Tabs
// group) since Figma shows no tab bar on this screen, the same reasoning
// as /notifications, /live-campaign, /campaigns and /brands.
// Populated from data/topGigs.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/top-gigs/README.md.
export default function TopGigs() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Top Gigs"
          onBack={() => router.back()}
          style={topGigsStyle.headerGap}
        />

        <View style={topGigsStyle.listGap}>
          {topGigs.map(item => (
            <GigCard key={item.id} {...item} style={topGigsStyle.card} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
