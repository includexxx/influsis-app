import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import { deliverablesStyle as s } from './deliverables.style';
import { AgreementSheet, CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import {
  useGetEngagementDeliverablesQuery,
  useGetFeedCampaignQuery,
  useGetMyEngagementQuery,
} from './api/campaignFeedApi';
import { DeliverablePiece } from './types/deliverables';
import { buildCreatorAgreement } from './utils/agreement';
import { formatCampaignDueDate } from './utils/mapCampaignFeedItem';
import { formatOfferDate } from './utils/negotiation';
import { canSubmitPiece, isOverdue, PIECE_STATUS_BADGE, pieceTitle } from './utils/deliverables';
import { platformIcon } from './utils/platformIcon';

const HERO_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

// The Deliverables screen - the creator's work on one accepted engagement
// (campaign API group CI1, GET /engagements/:id/deliverables): one row per
// piece the negotiated scope expanded into, with its status, due date and
// revisions left. Tapping a row opens that piece to submit, resubmit, or
// record the live post. Reached from the Offer screen's "Deliver work" and
// from Live Campaigns / Home's Active Campaigns rows; `title` rides along
// because CI1/CF3 carry no campaign summary. Approving is the business's
// side - once every piece is approved the engagement completes. Nothing here
// says "paid": there is no escrow yet (backend item 19). "View agreement"
// reopens the accepted terms read-only (the Agreement sheet's confirmed
// mode).
export default function DeliverablesScreen() {
  const { colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const engagementId = id ?? '';

  const engagement = useGetMyEngagementQuery({ engagementId }, { skip: !engagementId });
  const pieces = useGetEngagementDeliverablesQuery({ engagementId }, { skip: !engagementId });
  const [agreementOpen, setAgreementOpen] = useState(false);
  // CB2 only adds the business, title and content deadline; the money is the
  // server's agreed numbers, so a failure (404 once not live) just falls back
  // and the deadline line is left out.
  const campaign = useGetFeedCampaignQuery(
    { id: engagement.data?.campaignId ?? '' },
    { skip: !engagement.data?.campaignId },
  );

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
  const agreement = engagement.data
    ? buildCreatorAgreement(engagement.data, campaign.data ?? null, 'confirmed', title)
    : null;

  // Progress counts only pieces still part of the deal.
  const active = list.filter(piece => piece.status !== 'cancelled');
  const approved = active.filter(piece => piece.status === 'approved').length;
  const progress = active.length ? approved / active.length : 0;

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
          <LinearGradient
            colors={HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}>
            <View style={s.heroGlow} />
            <View style={s.heroGlowSmall} />

            <View style={s.heroTopRow}>
              <Text style={s.heroEyebrow}>CAMPAIGN</Text>
              <View style={s.heroStatus}>
                <View style={[s.heroStatusDot, completed && s.heroStatusDotDone]} />
                <Text style={s.heroStatusText}>{completed ? 'Completed' : 'In progress'}</Text>
              </View>
            </View>

            <Text style={s.heroTitle} numberOfLines={2}>
              {title || 'Campaign'}
            </Text>

            {campaign.data ? (
              <View style={s.heroMetaRow}>
                <Feather name="calendar" size={14} color={palette.primary[50]} />
                <Text style={s.heroMeta} testID="deliverables-deadline">
                  {campaign.data.contentDeadline
                    ? `Content deadline · ${formatCampaignDueDate(campaign.data.contentDeadline)}`
                    : 'No deadline set'}
                </Text>
              </View>
            ) : null}

            {active.length ? (
              <View style={s.progressBlock}>
                <View style={s.progressLabels}>
                  <Text style={s.progressLabel}>Approval progress</Text>
                  <Text style={s.progressValue} testID="deliverables-progress">
                    {approved} of {active.length} approved
                  </Text>
                </View>
                <View
                  style={s.progressTrack}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: active.length, now: approved }}>
                  <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
              </View>
            ) : null}
          </LinearGradient>

          <View style={s.pillRow}>
            {engagement.data ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="View campaign"
                onPress={() => router.push(`/campaign/${engagement.data?.campaignId}`)}
                style={({ pressed }) => [
                  s.pillButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && s.pillButtonPressed,
                ]}
                testID="deliverables-view-campaign">
                <Feather name="external-link" size={16} color={palette.primary[500]} />
                <Text style={s.pillText} numberOfLines={1}>
                  View campaign
                </Text>
              </Pressable>
            ) : null}
            {agreement ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View agreement"
                onPress={() => setAgreementOpen(true)}
                style={({ pressed }) => [
                  s.pillButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && s.pillButtonPressed,
                ]}
                testID="deliverables-view-agreement">
                <Feather name="file-text" size={16} color={palette.primary[500]} />
                <Text style={s.pillText} numberOfLines={1}>
                  View agreement
                </Text>
              </Pressable>
            ) : null}
          </View>

          {completed ? (
            <View style={[s.banner, s.successBanner, s.bannerRow]} testID="deliverables-completed">
              <Feather name="check-circle" size={18} color={palette.success[700]} />
              <Text style={[s.successText, s.bannerText]}>
                All deliverables approved. This campaign is complete.
              </Text>
            </View>
          ) : null}

          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Your deliverables</Text>
            {list.length ? (
              <View style={s.countChip}>
                <Text style={s.countChipText}>{list.length}</Text>
              </View>
            ) : null}
          </View>

          {list.length === 0 ? (
            <View
              style={[
                s.emptyCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}>
              <View style={s.emptyIcon}>
                <Feather name="inbox" size={22} color={palette.primary[500]} />
              </View>
              <Text style={[s.hintText, s.emptyText, { color: colors.text.secondary }]}>
                No deliverables yet. They appear once the offer is accepted.
              </Text>
            </View>
          ) : (
            list.map(piece => {
              const badge = PIECE_STATUS_BADGE[piece.status];
              const submittable = canSubmitPiece(piece.status);
              const overdue = submittable && isOverdue(piece.dueDate, now);
              return (
                <Pressable
                  key={piece.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${pieceTitle(piece)}, ${badge.label}`}
                  onPress={() => openPiece(piece)}
                  style={({ pressed }) => [
                    s.pieceCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    overdue && s.pieceCardOverdue,
                    pressed && s.pieceCardPressed,
                  ]}
                  testID={`deliverable-${piece.id}`}>
                  <View style={s.platformIcon}>
                    <Feather
                      name={platformIcon(piece.platform)}
                      size={20}
                      color={palette.primary[500]}
                    />
                  </View>

                  <View style={s.pieceBody}>
                    <Text style={[s.pieceTitle, { color: colors.text.primary }]} numberOfLines={1}>
                      {pieceTitle(piece)}
                    </Text>
                    {piece.dueDate ? (
                      <View style={s.pieceMetaRow}>
                        <Feather
                          name="calendar"
                          size={13}
                          color={overdue ? palette.error[600] : colors.text.secondary}
                        />
                        <Text style={[s.meta, { color: colors.text.secondary }]}>
                          Due {formatOfferDate(piece.dueDate)}
                          {overdue ? <Text style={s.overdue}> · Overdue</Text> : null}
                        </Text>
                      </View>
                    ) : null}
                    {submittable ? (
                      <View style={s.pieceMetaRow}>
                        <Feather name="refresh-cw" size={13} color={colors.text.secondary} />
                        <Text style={[s.meta, { color: colors.text.secondary }]}>
                          {piece.revisionsRemaining} revisions left
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={s.pieceAside}>
                    <StatusBadge label={badge.label} color={badge.color} textColor={badge.text} />
                    <Feather name="chevron-right" size={18} color={colors.text.secondary} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {agreementOpen ? (
        <AgreementSheet
          agreement={campaign.isLoading ? null : agreement}
          isLoading={campaign.isLoading}
          onClose={() => setAgreementOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
