import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, ListRenderItem, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { applicationsStyle } from './applications.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CategoryChip from '@/components/elements/CategoryChip';
import CampaignCard from '@/components/elements/CampaignCard';
import CampaignRequestCard from '@/components/elements/CampaignRequestCard';
import {
  CampaignCardSkeleton,
  CampaignRequestCardSkeleton,
  CampaignsEmptyState,
} from './components';
import { CampaignsStatusVariant } from './components/CampaignsEmptyState';
import {
  useCampaignRequests,
  useCompletedCampaigns,
  useMyApplications,
} from './hooks/useCampaignsFeed';
import { useDeclineMyEngagementMutation } from './api/campaignFeedApi';
import { mapApplicationToCard, mapCampaignRequestToRow } from './utils/mapApplication';
import { MyEngagementItem } from './types/myEngagement';

type ApplicationsTab = 'applied' | 'request' | 'completed';

const TABS: { key: ApplicationsTab; label: string; empty: CampaignsStatusVariant }[] = [
  { key: 'applied', label: 'Applied', empty: 'noApplications' },
  { key: 'request', label: 'Invited', empty: 'noRequests' },
  { key: 'completed', label: 'Ended', empty: 'noCompleted' },
];

const INITIAL_SKELETON_COUNT = 4;

// Module-level so FlatList rows get a stable `renderItem`/`onPress`. Opens the
// Offer screen for the engagement; the campaign title rides along because the
// engagement endpoint (CF3) carries no campaign summary. `review` opens the
// Agreement sheet on arrival - the quick Accept goes through it, so accepting
// is never one tap and keeps a single accept path.
function openOffer(item: MyEngagementItem, review?: boolean) {
  router.push({
    pathname: '/engagement/[id]',
    params: { id: item.id, title: item.campaign?.title ?? '', ...(review ? { review: '1' } : {}) },
  });
}

function AppliedSeparator() {
  return <View style={applicationsStyle.appliedSeparator} />;
}

function RequestSeparator() {
  return <View style={applicationsStyle.requestSeparator} />;
}

const renderAppliedItem: ListRenderItem<MyEngagementItem> = ({ item }) => (
  <CampaignCard
    variant="applied"
    {...mapApplicationToCard(item)}
    onPress={() => openOffer(item)}
    testID={`application-${item.id}`}
  />
);

const renderCompletedItem: ListRenderItem<MyEngagementItem> = ({ item }) => (
  <CampaignCard
    variant="applied"
    {...mapApplicationToCard(item)}
    onPress={() => openOffer(item)}
    testID={`completed-campaign-${item.id}`}
  />
);

// The Applications screen (Figma "List", node 6015:7090 "Applied" tab +
// 6475:6394 "Request" tab) - a creator's sent applications and the
// invitations they've received, opened from Profile's "My Applications"
// link (scenes/profile/Profile.tsx). Registered in the app/(details)/ route
// group (no tab bar), the same reasoning as every other (details) screen -
// see docs/screen/apply-campaign/campaign-list.md.
//
// Both tabs read campaign API group CF2 (GET /me/engagements): "Applied" is
// `origin=requested` in any status, "Request" is `origin=invited` still
// `pending` or `countered` (mid-negotiation). Tapping either row opens its
// Offer screen (/engagement/:id), where the creator negotiates. Quick
// Accept/Decline show only on `pending` invitations - a `countered` one is
// answered on its Offer screen. Accept opens the Offer screen with its
// Agreement sheet up (`review=1`); Decline (CF5) answers in place, and the
// declined invitation is hidden right away since only the current page
// refetches on invalidation.
//
// "Completed Campaigns" is CF2 with `engagementStatus=completed`, applied or
// invited alike - the campaigns the creator finished (the business approved
// the final delivery). Its rows use the Applied card and open the same Offer
// screen, which shows the closed agreement. A finished campaign can't be
// applied to again (see useCompletedCampaignIds).
export default function Applications() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ApplicationsTab>('applied');
  const [answeredIds, setAnsweredIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const applied = useMyApplications();
  const requests = useCampaignRequests();
  const completed = useCompletedCampaigns();
  const [declineEngagement] = useDeclineMyEngagementMutation();

  const visibleRequests = useMemo(
    () => requests.campaigns.filter(item => !answeredIds.has(item.id)),
    [requests.campaigns, answeredIds],
  );

  const decline = useCallback(
    async (item: MyEngagementItem) => {
      setPendingId(item.id);
      try {
        await declineEngagement({ engagementId: item.id }).unwrap();
        setAnsweredIds(prev => new Set(prev).add(item.id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Please try again.';
        Alert.alert("Couldn't decline invitation", message);
      } finally {
        setPendingId(null);
      }
    },
    [declineEngagement],
  );

  const renderRequestItem: ListRenderItem<MyEngagementItem> = useCallback(
    ({ item }) => {
      const row = mapCampaignRequestToRow(item);
      return (
        <CampaignRequestCard
          avatar={row.avatar}
          businessName={row.name}
          message={row.message}
          time={row.time}
          disabled={pendingId !== null}
          showActions={item.status === 'pending'}
          onAccept={() => openOffer(item, true)}
          onDecline={() => decline(item)}
          onPress={() => openOffer(item)}
          testID={`campaign-request-${item.id}`}
        />
      );
    },
    [pendingId, decline],
  );

  // Applied and Completed share the card layout; Request has its own rows.
  const isRequest = activeTab === 'request';
  const feed = isRequest ? requests : activeTab === 'completed' ? completed : applied;
  const Skeleton = isRequest ? CampaignRequestCardSkeleton : AppliedSkeleton;
  const renderItem = isRequest
    ? renderRequestItem
    : activeTab === 'completed'
      ? renderCompletedItem
      : renderAppliedItem;
  const emptyVariant = TABS.find(tab => tab.key === activeTab)?.empty ?? 'empty';

  const header = (
    <>
      <ScreenHeader
        title="Campaign Applications"
        // A tab now, with no stack history of its own - back returns Home,
        // like the Order screen did.
        onBack={() => router.push('/home')}
        style={applicationsStyle.headerGap}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={applicationsStyle.tabScroll}
        contentContainerStyle={applicationsStyle.tabRow}>
        {TABS.map(tab => (
          <CategoryChip
            key={tab.key}
            label={tab.label}
            selected={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
            testID={`applications-tab-${tab.key}`}
          />
        ))}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      {feed.isInitialLoading ? (
        <View style={[layoutStyle.screen, layoutStyle.scrollContent]}>
          {header}
          <View
            style={isRequest ? applicationsStyle.requestListGap : applicationsStyle.appliedListGap}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
              <Skeleton key={index} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          // Remount per tab so scroll position and end-reached state don't
          // carry over between the lists.
          key={activeTab}
          data={isRequest ? visibleRequests : feed.campaigns}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={pendingId}
          ItemSeparatorComponent={isRequest ? RequestSeparator : AppliedSeparator}
          ListHeaderComponent={header}
          style={layoutStyle.screen}
          contentContainerStyle={layoutStyle.scrollContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={feed.hasMore ? feed.loadMore : undefined}
          ListEmptyComponent={
            feed.isInitialError ? (
              <CampaignsEmptyState variant="error" onRetry={feed.retry} />
            ) : (
              <CampaignsEmptyState variant={emptyVariant} />
            )
          }
          ListFooterComponent={
            feed.isLoadingMore ? (
              <View style={applicationsStyle.footer}>
                <Skeleton />
              </View>
            ) : feed.isLoadMoreError ? (
              <CampaignsEmptyState variant="error" onRetry={feed.retry} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function AppliedSkeleton() {
  return <CampaignCardSkeleton variant="applied" />;
}
