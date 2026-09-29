import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import { deliverablesStyle as s } from './deliverables.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import { useGetEngagementDeliverablesQuery, useGetMyEngagementQuery } from './api/campaignFeedApi';
import { DeliverablePiece } from './types/deliverables';
import { formatOfferDate } from './utils/negotiation';
import { canSubmitPiece, isOverdue, PIECE_STATUS_BADGE, pieceTitle } from './utils/deliverables';

// The Deliverables screen - the creator's work on one accepted engagement
// (campaign API group CI1, GET /engagements/:id/deliverables): one row per
// piece the negotiated scope expanded into, with its status, due date and
// revisions left. Tapping a row opens that piece to submit, resubmit, or
// record the live post. Reached from the Offer screen's "Deliver work" and
// from Live Campaigns / Home's Active Campaigns rows; `title` rides along
// because CI1/CF3 carry no campaign summary. Approving is the business's
// side - once every piece is approved the engagement completes. Nothing here
// says "paid": there is no escrow yet (backend item 19).
export default function DeliverablesScreen() {
  const { colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const engagementId = id ?? '';

  const engagement = useGetMyEngagementQuery({ engagementId }, { skip: !engagementId });
  const pieces = useGetEngagementDeliverablesQuery({ engagementId }, { skip: !engagementId });

  const header = (
    <ScreenHeader title="Deliverables" onBack={() => router.back()} style={s.headerGap} />
  );

  if (!engagementId || pieces.error?.code === 'NOT_FOUND') {
    return <Redirect href="/live-campaign" />;
  }

  if (pieces.isLoading || engagement.isLoading) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent} testID="deliverables-loading">
          {header}
          <CampaignRequestCardSkeleton />
          <CampaignRequestCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (pieces.isError || !pieces.data) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          <CampaignsEmptyState
            variant="error"
            onRetry={() => {
              pieces.refetch();
              engagement.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const list = pieces.data;
  const completed = engagement.data?.status === 'completed';
  const now = new Date();

  function openPiece(piece: DeliverablePiece) {
    router.push({
      pathname: '/engagement/[id]/deliverables/[pieceId]',
      params: { id: engagementId, pieceId: piece.id, title: title ?? '' },
    });
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        {header}
        <View style={s.content}>
          <Text style={[s.title, { color: colors.text.primary }]} numberOfLines={2}>
            {title || 'Campaign'}
          </Text>
          {engagement.data ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="View campaign"
              onPress={() => router.push(`/campaign/${engagement.data?.campaignId}`)}
              testID="deliverables-view-campaign">
              <Text style={s.linkText}>View campaign</Text>
            </Pressable>
          ) : null}

          {completed ? (
            <View style={[s.banner, s.successBanner]} testID="deliverables-completed">
              <Text style={s.successText}>
                All deliverables approved. This campaign is complete.
              </Text>
            </View>
          ) : null}

          {list.length === 0 ? (
            <Text style={[s.hintText, { color: colors.text.secondary }]}>
              No deliverables yet. They appear once the offer is accepted.
            </Text>
          ) : (
            list.map(piece => {
              const badge = PIECE_STATUS_BADGE[piece.status];
              const overdue = canSubmitPiece(piece.status) && isOverdue(piece.dueDate, now);
              return (
                <Pressable
                  key={piece.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${pieceTitle(piece)}, ${badge.label}`}
                  onPress={() => openPiece(piece)}
                  style={[s.row, { borderColor: colors.border }]}
                  testID={`deliverable-${piece.id}`}>
                  <View style={s.rowHeader}>
                    <Text style={[s.rowTitle, { color: colors.text.primary }]}>
                      {pieceTitle(piece)}
                    </Text>
                    <StatusBadge label={badge.label} color={badge.color} textColor={badge.text} />
                  </View>
                  {piece.dueDate ? (
                    <Text style={[s.meta, { color: colors.text.secondary }]}>
                      Due {formatOfferDate(piece.dueDate)}
                      {overdue ? <Text style={s.overdue}> · Overdue</Text> : null}
                    </Text>
                  ) : null}
                  {canSubmitPiece(piece.status) ? (
                    <Text style={[s.meta, { color: colors.text.secondary }]}>
                      {piece.revisionsRemaining} revisions left
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
