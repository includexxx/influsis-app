import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, homeStyle } from '@/styles';
import AppHeader from '@/components/elements/AppHeader';
import {
  HomeSearchBar,
  ActiveCampaignsSection,
  BusinessLogosSection,
  PopularCampaignsSection,
  CampaignsListSection,
  TopGigsSection,
  TopRatedCreatorsSection,
} from '@/scenes/home/components';
import { businessLogos, popularCampaigns, gigs, topRatedCreators } from '@/data/home';

// The Home tab of the main app shell (Figma "Home", node 6121:6522).
// Sections are populated from data/home.ts mock content - no backend
// exists yet (docs/PRD.md §2.2/§4.1) - see docs/screen/home/README.md for
// the full scope notes.
export default function Home() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, homeStyle.sectionGap]}
        showsVerticalScrollIndicator={false}>
        <AppHeader onNotificationPress={() => router.push('/notifications')} />

        <HomeSearchBar onPress={() => router.push('/search')} style={{ marginTop: -16 }} />

        <ActiveCampaignsSection
          onSeeAllPress={() => router.push('/live-campaign')}
          onCampaignPress={id => router.push(`/campaign/${id}`)}
          style={{ marginTop: -16 }}
        />

        <BusinessLogosSection
          businesses={businessLogos}
          onSeeAllPress={() => router.push('/businesses')}
          onBusinessPress={id => router.push(`/business/${id}`)}
        />

        {/* <PopularCampaignsSection
          campaigns={popularCampaigns}
          onSeeAllPress={() => router.push('/campaigns')}
        /> */}

        <CampaignsListSection
          onSeeAllPress={() => router.push('/campaigns')}
          onCampaignPress={id => router.push(`/campaign/${id}`)}
        />

        {/* <TopGigsSection
          gigs={gigs}
          onSeeAllPress={() => router.push('/top-gigs')}
          onGigPress={id => router.push(`/gig/${id}`)}
        /> */}

        <TopRatedCreatorsSection
          creators={topRatedCreators}
          onSeeAllPress={() => router.push('/top-creators')}
          onCreatorPress={id => router.push(`/creator/${id}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
