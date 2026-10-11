import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import Button from '@/components/elements/Button';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import { deliverablesStyle as s } from './deliverables.style';
import { AgreementSheet, CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import {
  useGetEngagementDeliveryQuery,
  useGetFeedCampaignQuery,
  useGetMyEngagementQuery,
} from './api/campaignFeedApi';
import { DeliveryPiece } from './types/delivery';
import { buildCreatorAgreement } from './utils/agreement';
import { formatCampaignDueDate } from './utils/mapCampaignFeedItem';
import { formatOfferDate } from './utils/negotiation';
import { canSubmitPiece, isOverdue, PIECE_STATUS_BADGE, pieceTitle } from './utils/deliverables';
import { deliveryStatusView, DeliveryTone, latestRound } from './utils/delivery';
import { FeatherName, platformIcon } from './utils/platformIcon';

const HERO_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

const STATUS_TONE: Record<
  Exclude<DeliveryTone, 'neutral'>,
  { background: string; border: string; text: string; icon: FeatherName }
> = {
  info: {
    background: palette.primary[25],
    border: palette.primary[100],
    text: palette.primary[700],
    icon: 'clock',
  },
  warning: {
    background: palette.warning[50],
    border: palette.warning[200],
    text: palette.warning[700],
    icon: 'message-square',
  },
  success: {
    background: palette.success[50],
    border: palette.success[200],
    text: palette.success[700],
    icon: 'check-circle',
  },
  error: {
    background: palette.error[50],
    border: palette.error[200],
    text: palette.error[700],
    icon: 'alert-octagon',
  },
};

// The Deliverables screen - the creator's work on one accepted engagement,
// read from the delivery rounds (backend 18r, GET /engagements/:id/delivery):
// a status card for the delivery's stage (what happened, revisions left, and
// the next action), then one row per piece with its status and due date.
// Every piece is delivered together: "Submit delivery" opens the Submit
// delivery screen; tapping a row opens that piece's read-only history.
// Reached from the Offer screen's "Deliver work" and from Live Campaigns /
// Home's Active Campaigns rows; `title` rides along because the delivery read
// and CF3 carry no campaign summary. Approving is the business's side.
// Nothing here says "paid": there is no escrow yet (backend item 19). "View
// agreement" reopens the accepted terms read-only (the Agreement sheet's
// confirmed mode).
export default function DeliverablesScreen() {
  const { colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const engagementId = id ?? '';

  const engagement = useGetMyEngagementQuery({ engagementId }, { skip: !engagementId });
  const delivery = useGetEngagementDeliveryQuery({ engagementId }, { skip: !engagementId });
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

  if (!engagementId || delivery.error?.code === 'NOT_FOUND') {
    return <Redirect href="/live-campaign" />;
  }

  if (delivery.isLoading || engagement.isLoading) {
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

  if (delivery.isError || !delivery.data) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          <CampaignsEmptyState
            variant="error"
            onRetry={() => {
              delivery.refetch();
              engagement.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const list = delivery.data.pieces;
  const view = deliveryStatusView(delivery.data);
  const completed = delivery.data.stage === 'delivered';
  const submittedAt = view?.inReview ? latestRound(delivery.data)?.submittedAt : null;
  const now = new Date();
  const agreement = engagement.data
    ? buildCreatorAgreement(engagement.data, campaign.data ?? null, 'confirmed', title)
    : null;

  // Progress counts only pieces still part of the deal.
  const active = list.filter(piece => piece.status !== 'cancelled');
  const approved = active.filter(piece => piece.status === 'approved').length;
  const progress = active.length ? approved / active.length : 0;

  function openPiece(piece: DeliveryPiece) {
    router.push({
      pathname: '/engagement/[id]/deliverables/[pieceId]',
      params: { id: engagementId, pieceId: piece.id, title: title ?? '' },
    });
  }

  function openSubmit() {
    router.push({
      pathname: '/engagement/[id]/submit-delivery',
      params: { id: engagementId, title: title ?? '' },
    });
  }

  const tone = view && view.tone !== 'neutral' ? STATUS_TONE[view.tone] : null;

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
                <Text style={s.heroStatusText}>{view?.statusLabel ?? 'In progress'}</Text>
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

          {view ? (
            <View
              style={[
                s.statusCard,
                tone
                  ? { backgroundColor: tone.background, borderColor: tone.border }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              accessibilityRole={view.tone === 'error' ? 'alert' : undefined}
              testID="deliverables-status">
              <View style={s.statusHead}>
                <Feather
                  name={tone?.icon ?? 'package'}
                  size={18}
                  color={tone?.text ?? palette.primary[500]}
                />
                <Text style={[s.statusTitle, { color: tone?.text ?? colors.text.primary }]}>
                  {view.title}
                </Text>
              </View>
              {view.body ? (
                <Text
                  style={[s.statusBody, { color: tone?.text ?? colors.text.secondary }]}
                  testID="deliverables-status-body">
                  {view.body}
                </Text>
              ) : null}
              {submittedAt ? (
                <Text style={[s.statusMeta, { color: tone?.text ?? colors.text.secondary }]}>
                  Submitted {formatOfferDate(submittedAt)}
                </Text>
              ) : null}
              {view.revisionsLeft ? (
                <Text
                  style={[s.statusMeta, { color: tone?.text ?? colors.text.secondary }]}
                  testID="deliverables-revisions-left">
                  {view.revisionsLeft}
                </Text>
              ) : null}
              {view.cta ? (
                <Button
                  title={view.cta}
                  style={s.primaryButton}
                  titleStyle={s.primaryTitle}
                  onPress={openSubmit}
                  accessibilityLabel={view.cta}
                  testID="deliverables-submit"
                />
              ) : null}
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
