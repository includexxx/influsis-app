import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, ListRenderItem, View } from 'react-native';
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
import { useCampaignRequests, useMyApplications } from './hooks/useCampaignsFeed';
import {
  useAcceptMyEngagementMutation,
  useDeclineMyEngagementMutation,
} from './api/campaignFeedApi';
import { mapApplicationToCard, mapCampaignRequestToRow } from './utils/mapApplication';
import { MyEngagementItem } from './types/myEngagement';

type ApplicationsTab = 'applied' | 'request';

const INITIAL_SKELETON_COUNT = 4;

// Module-level so FlatList rows get a stable `renderItem`/`onPress`.
function openCampaign(campaignId: string) {
  router.push(`/campaign/${campaignId}`);
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
    onPress={() => openCampaign(item.campaignId)}
    testID={`application-${item.id}`}
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
// `pending`. Accept/Decline call CF4/CF5; an answered invitation is hidden
// right away since only the current page refetches on invalidation.
export default function Applications() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ApplicationsTab>('applied');
  const [answeredIds, setAnsweredIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const applied = useMyApplications();
  const requests = useCampaignRequests();
  const [acceptEngagement] = useAcceptMyEngagementMutation();
  const [declineEngagement] = useDeclineMyEngagementMutation();

  const visibleRequests = useMemo(
    () => requests.campaigns.filter(item => !answeredIds.has(item.id)),
    [requests.campaigns, answeredIds],
  );

  const respond = useCallback(
    async (item: MyEngagementItem, action: 'accept' | 'decline') => {
      setPendingId(item.id);
      try {
        if (action === 'accept') {
          await acceptEngagement({ engagementId: item.id }).unwrap();
        } else {
          await declineEngagement({ engagementId: item.id }).unwrap();
        }
        setAnsweredIds(prev => new Set(prev).add(item.id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Please try again.';
        Alert.alert(
          action === 'accept' ? "Couldn't accept invitation" : "Couldn't decline invitation",
          message,
        );
      } finally {
        setPendingId(null);
      }
    },
    [acceptEngagement, declineEngagement],
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
          onAccept={() => respond(item, 'accept')}
          onDecline={() => respond(item, 'decline')}
          testID={`campaign-request-${item.id}`}
        />
      );
    },
    [pendingId, respond],
  );

  const isApplied = activeTab === 'applied';
  const feed = isApplied ? applied : requests;
  const Skeleton = isApplied ? AppliedSkeleton : CampaignRequestCardSkeleton;

  const header = (
    <>
      <ScreenHeader title="List" onBack={() => router.back()} style={applicationsStyle.headerGap} />

      <View style={applicationsStyle.tabRow}>
        <CategoryChip
          label="Applied"
          selected={isApplied}
          onPress={() => setActiveTab('applied')}
          testID="applications-tab-applied"
        />
        <CategoryChip
          label="Request"
          selected={!isApplied}
          onPress={() => setActiveTab('request')}
          testID="applications-tab-request"
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      {feed.isInitialLoading ? (
        <View style={[layoutStyle.screen, layoutStyle.scrollContent]}>
          {header}
          <View
            style={isApplied ? applicationsStyle.appliedListGap : applicationsStyle.requestListGap}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
              <Skeleton key={index} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          // Remount per tab so scroll position and end-reached state don't
          // carry over between the two lists.
          key={activeTab}
          data={isApplied ? applied.campaigns : visibleRequests}
          keyExtractor={item => item.id}
          renderItem={isApplied ? renderAppliedItem : renderRequestItem}
          extraData={pendingId}
          ItemSeparatorComponent={isApplied ? AppliedSeparator : RequestSeparator}
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
              <CampaignsEmptyState variant={isApplied ? 'noApplications' : 'noRequests'} />
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
