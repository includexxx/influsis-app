import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import ConfirmDialog from '@/components/elements/ConfirmDialog';
import { applicationsStyle as s } from './applications.style';
import {
  ApplicationCard,
  ApplicationsEmptyState,
  ApplicationsSkeleton,
  ApplicationsTabs,
  InvitationCard,
} from './components/applications';
import { ApplicationsEmptyVariant } from './components/applications/ApplicationsEmptyState';
import {
  UseCampaignsFeedResult,
  useCampaignRequests,
  useCompletedCampaigns,
  useMyApplications,
} from './hooks/useCampaignsFeed';
import { useDeclineMyEngagementMutation } from './api/campaignFeedApi';
import { mapApplicationToCard, mapInvitationToCard } from './utils/mapApplication';
import { MyEngagementItem } from './types/myEngagement';

type ApplicationsTab = 'applied' | 'invited' | 'completed';

const TABS: { key: ApplicationsTab; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'invited', label: 'Invited' },
  { key: 'completed', label: 'Completed' },
];

const INITIAL_SKELETON_COUNT = 3;

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

function browseCampaigns() {
  router.push('/campaigns');
}

function Separator() {
  return <View style={s.separator} />;
}

// "3", or "10+" while more pages exist; nothing while loading or empty.
function countLabel(feed: UseCampaignsFeedResult<MyEngagementItem>, count: number) {
  if (feed.isInitialLoading || count === 0) return undefined;
  return `${count}${feed.hasMore ? '+' : ''}`;
}

const renderApplication: ListRenderItem<MyEngagementItem> = ({ item }) => (
  <ApplicationCard
    {...mapApplicationToCard(item)}
    status={item.status}
    onPress={() => openOffer(item)}
    testID={
      item.status === 'completed' ? `completed-campaign-${item.id}` : `application-${item.id}`
    }
  />
);

// The Applications tab - the creator's campaign pipeline in one place.
//
// - Applied: every campaign they asked to join, in any status
//   (GET /me/engagements?origin=requested).
// - Invited: business invitations still `pending` or mid-negotiation
//   (`countered`) (origin=invited). A pending one gets quick Decline /
//   Accept: Accept opens the Offer screen with its Agreement sheet up
//   (`review=1`); Decline (CF5) asks for confirmation, then answers in place
//   and hides the row right away, since only the current page refetches on
//   invalidation. A countered one is answered on its Offer screen.
// - Completed: engagements the business signed off (engagementStatus=
//   completed), applied or invited alike.
//
// A fixed header (title, a shortcut to browse campaigns, and a segmented
// control with live counts) sits over the selected list, which pages in on
// scroll and refreshes on pull. Every card opens its Offer screen
// (/engagement/:id).
export default function Applications() {
  const { colors, palette, typography } = useTheme();
  const [activeTab, setActiveTab] = useState<ApplicationsTab>('applied');
  const [answeredIds, setAnsweredIds] = useState<ReadonlySet<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<MyEngagementItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const applied = useMyApplications();
  const invited = useCampaignRequests();
  const completed = useCompletedCampaigns();
  const [declineEngagement] = useDeclineMyEngagementMutation();

  const visibleInvitations = useMemo(
    () => invited.campaigns.filter(item => !answeredIds.has(item.id)),
    [invited.campaigns, answeredIds],
  );

  const decline = useCallback(
    async (item: MyEngagementItem) => {
      setConfirmDecline(null);
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

  const renderInvitation: ListRenderItem<MyEngagementItem> = useCallback(
    ({ item }) => (
      <InvitationCard
        {...mapInvitationToCard(item)}
        negotiating={item.status !== 'pending'}
        disabled={pendingId !== null}
        onAccept={() => openOffer(item, true)}
        onDecline={() => setConfirmDecline(item)}
        onPress={() => openOffer(item)}
        testID={`campaign-request-${item.id}`}
      />
    ),
    [pendingId],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([applied.refresh(), invited.refresh(), completed.refresh()]);
    } finally {
      setRefreshing(false);
    }
  }, [applied, invited, completed]);

  const isInvited = activeTab === 'invited';
  const feed = isInvited ? invited : activeTab === 'completed' ? completed : applied;
  const data = isInvited ? visibleInvitations : feed.campaigns;
  const skeletonVariant = isInvited ? 'invitation' : 'application';

  const tabs = TABS.map(tab => ({
    ...tab,
    count:
      tab.key === 'invited'
        ? countLabel(invited, visibleInvitations.length)
        : tab.key === 'completed'
          ? countLabel(completed, completed.campaigns.length)
          : countLabel(applied, applied.campaigns.length),
  }));

  const emptyVariant: ApplicationsEmptyVariant = feed.isInitialError ? 'error' : activeTab;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[s.screen, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={s.titleBlock}>
            <Text
              accessibilityRole="header"
              style={[typography.displayM, s.title, { color: colors.text.primary }]}>
              Applications
            </Text>
            <Text style={[s.subtitle, { color: colors.text.secondary }]}>
              Track your pitches and campaign invitations
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse campaigns"
            hitSlop={8}
            onPress={browseCampaigns}
            style={({ pressed }) => [
              s.headerAction,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && s.pressed,
            ]}
            testID="applications-browse">
            <Feather name="compass" size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        <ApplicationsTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </View>

      {feed.isInitialLoading ? (
        <View style={s.listContent}>
          {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
            <View key={index} style={index > 0 ? s.skeletonGap : undefined}>
              <ApplicationsSkeleton variant={skeletonVariant} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          // Remount per tab so scroll position and end-reached state don't
          // carry over between the lists.
          key={activeTab}
          data={data}
          keyExtractor={item => item.id}
          renderItem={isInvited ? renderInvitation : renderApplication}
          extraData={pendingId}
          ItemSeparatorComponent={Separator}
          style={s.screen}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={feed.hasMore ? feed.loadMore : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={palette.primary[400]}
              colors={[palette.primary[400]]}
            />
          }
          ListEmptyComponent={
            <ApplicationsEmptyState
              variant={emptyVariant}
              onAction={
                emptyVariant === 'error'
                  ? feed.retry
                  : emptyVariant === 'applied'
                    ? browseCampaigns
                    : undefined
              }
            />
          }
          ListFooterComponent={
            feed.isLoadingMore ? (
              <View style={s.footer}>
                <ApplicationsSkeleton variant={skeletonVariant} />
              </View>
            ) : feed.isLoadMoreError ? (
              <ApplicationsEmptyState variant="error" onAction={feed.retry} />
            ) : null
          }
        />
      )}

      {confirmDecline ? (
        <ConfirmDialog
          icon="x-circle"
          tone="danger"
          title="Decline this invitation?"
          message={`${confirmDecline.campaign?.title ?? 'This campaign'} will be removed from your invitations. This can't be undone.`}
          primaryLabel="Keep it"
          onPrimaryPress={() => setConfirmDecline(null)}
          secondaryLabel="Decline"
          onSecondaryPress={() => decline(confirmDecline)}
          onClose={() => setConfirmDecline(null)}
          testID="decline-confirm"
        />
      ) : null}
    </SafeAreaView>
  );
}
