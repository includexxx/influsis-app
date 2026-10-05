import AppHeader from '@/components/elements/AppHeader';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActiveCampaignsSection,
  BusinessLogosSection,
  CampaignsListSection,
  EarningsSection,
  HomeGreeting,
  QuickActions,
  TopRatedCreatorsSection,
} from './components';
import { QuickAction, QUICK_ACTION_TINTS } from './components/QuickActions';
import { useHomeRefresh } from './hooks/useHomeRefresh';
import { greetingName } from './utils/greeting';
import { homeStyle } from './home.style';
import { openDeliverables } from '@/scenes/campaigns/utils/openDeliverables';

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'applications',
    label: 'Applications',
    icon: 'send',
    tint: QUICK_ACTION_TINTS.primary,
    onPress: () => router.push('/applications'),
  },
  {
    key: 'work',
    label: 'My work',
    icon: 'briefcase',
    tint: QUICK_ACTION_TINTS.navy,
    onPress: () => router.push('/live-campaign'),
  },
  {
    key: 'transactions',
    label: 'Transactions',
    icon: 'bar-chart-2',
    tint: QUICK_ACTION_TINTS.green,
    onPress: () => router.push('/transactions'),
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: 'message-circle',
    tint: QUICK_ACTION_TINTS.amber,
    onPress: () => router.push('/message'),
  },
];

// The Home tab of the main app shell (Figma "Home", node 6121:6522): a
// personal greeting, the earnings card, quick actions, then the campaign,
// business and creator sections - each section loads, fails and retries on
// its own. Pull down to refresh everything (useHomeRefresh). See
// docs/screen/home/README.md for the full scope notes.
export default function Home() {
  const { colors } = useTheme();
  const { refreshing, refresh, profile } = useHomeRefresh();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, homeStyle.sectionGap]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={palette.primary[400]}
            colors={[palette.primary[400]]}
          />
        }>
        <View style={homeStyle.topGroup}>
          <AppHeader onNotificationPress={() => router.push('/notifications')} />

          {/* <HomeSearchBar onPress={() => router.push('/search')} /> */}

          <HomeGreeting name={greetingName(profile)} />

          <EarningsSection />

          <QuickActions actions={QUICK_ACTIONS} />
        </View>

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
