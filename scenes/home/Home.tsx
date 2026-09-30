import AppHeader from '@/components/elements/AppHeader';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActiveCampaignsSection,
  BusinessLogosSection,
  CampaignsListSection,
  EarningsSection,
  HomeSearchBar,
  TopRatedCreatorsSection,
} from './components';
import { homeStyle } from './home.style';
import { openDeliverables } from '@/scenes/campaigns/utils/openDeliverables';

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

        {/* <HomeSearchBar onPress={() => router.push('/search')} style={{ marginTop: -16 }} /> */}

        <EarningsSection style={{ marginTop: -16 }} />

        <ActiveCampaignsSection
          onSeeAllPress={() => router.push('/live-campaign')}
          onCampaignPress={engagement =>
            openDeliverables({ id: engagement.id, title: engagement.campaign?.title })
          }
        />

        <BusinessLogosSection
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
          onSeeAllPress={() => router.push('/top-creators')}
          onCreatorPress={id => router.push(`/creator/${id}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
