import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import { ApiError } from '@/services/http';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import SummaryRow from '@/components/elements/SummaryRow';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import ConfirmDialog from '@/components/elements/ConfirmDialog';
import { offerScreenStyle as s } from './offerScreen.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import {
  useAcceptOfferMutation,
  useDeclineMyEngagementMutation,
  useGetMyEngagementQuery,
  useSendCounterOfferMutation,
  useWithdrawMyEngagementMutation,
  useWithdrawOfferMutation,
} from './api/campaignFeedApi';
import {
  EngagementOffer,
  EngagementOfferStatus,
  EngagementStatus,
  MyEngagementDetail,
} from './types/myEngagement';
import { formatCampaignPrice } from './utils/mapCampaignFeedItem';
import {
  formatOfferDate,
  getOfferScreenState,
  NEGOTIATION_TEXT_MAX_LENGTH,
  parseCounterAmount,
  sortOffers,
  validateOptionalText,
} from './utils/negotiation';

type Action = 'accept' | 'counter' | 'withdrawOffer' | 'decline' | 'withdrawApplication';
type Form = 'counter' | 'decline' | 'withdrawApplication' | null;
type Confirm = 'accept' | 'withdrawOffer' | 'decline' | 'withdrawApplication' | null;

const GENERIC_ERROR = "Couldn't update the offer. Please try again.";

const STATUS_BADGE: Record<EngagementStatus, { label: string; color: string; text: string }> = {
  pending: { label: 'Negotiating', color: palette.warning[50], text: palette.warning[700] },
  countered: { label: 'Negotiating', color: palette.warning[50], text: palette.warning[700] },
  accepted: { label: 'Accepted', color: palette.success[50], text: palette.success[700] },
  completed: { label: 'Completed', color: palette.success[50], text: palette.success[700] },
  declined: { label: 'Declined', color: palette.error[50], text: palette.error[700] },
  withdrawn: { label: 'Withdrawn', color: palette.error[50], text: palette.error[700] },
  expired: { label: 'Expired', color: palette.error[50], text: palette.error[700] },
  cancelled: { label: 'Cancelled', color: palette.error[50], text: palette.error[700] },
};

const OFFER_STATUS_LABEL: Record<EngagementOfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  superseded: 'Countered',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

const INACTIVE: EngagementOfferStatus[] = ['superseded', 'withdrawn', 'expired'];

// The Offer screen - the creator's side of a price negotiation for one
// engagement (an application they sent or an invitation they received),
// opened from either Applications tab. Loads the engagement with its whole
// offer thread (campaign API group CF3, GET /me/engagements/:id) and runs
// Accept (CF4), Counter (CG2), Withdraw my offer (CG3), Decline (CF5, for
// invitations) and Withdraw application (CF6, for the creator's own
// requests). Which actions show comes from getOfferScreenState, which mirrors
// the backend rules; a 409 means this view was stale, so the server's message
// is shown and the engagement refetched. Registered at
// app/(details)/engagement/[id].tsx; `title` is passed by the list because
// CF3 carries no campaign summary.
export default function OfferScreen() {
  const { colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const engagementId = id ?? '';

  const { data, isLoading, isError, refetch } = useGetMyEngagementQuery(
    { engagementId },
    { skip: !engagementId },
  );
  const [acceptOffer] = useAcceptOfferMutation();
  const [sendCounter] = useSendCounterOfferMutation();
  const [withdrawOffer] = useWithdrawOfferMutation();
  const [decline] = useDeclineMyEngagementMutation();
  const [withdrawApplication] = useWithdrawMyEngagementMutation();

  const [busy, setBusy] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [form, setForm] = useState<Form>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function closeForm() {
    setForm(null);
    setAmount('');
    setNote('');
    setReason('');
    setFormError(null);
    setFieldErrors(null);
  }

  async function run(action: Action, call: () => Promise<unknown>) {
    setConfirm(null);
    setBusy(action);
    setActionError(null);
    setFieldErrors(null);
    try {
      await call();
      closeForm();
    } catch (err) {
      const error = err instanceof ApiError ? err : null;
      if (error?.statusCode === 409) {
        setActionError(error.message);
        refetch();
      } else if (error?.statusCode === 422) {
        setActionError(error.message);
        setFieldErrors(error.errors);
      } else {
        setActionError(GENERIC_ERROR);
      }
    } finally {
      setBusy(null);
    }
  }

  const header = <ScreenHeader title="Offer" onBack={() => router.back()} style={s.headerGap} />;

  if (isLoading) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent} testID="offer-loading">
          {header}
          <CampaignRequestCardSkeleton />
          <CampaignRequestCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          <CampaignsEmptyState variant="error" onRetry={refetch} />
        </View>
      </SafeAreaView>
    );
  }

  const state = getOfferScreenState(data);
  const offers = sortOffers(data.offers);
  const badge = STATUS_BADGE[data.status];
  const pending = state.pendingOffer;
  const disabled = busy !== null;

  function submitCounter() {
    const parsed = parseCounterAmount(amount);
    if (!parsed.ok) return setFormError(parsed.error);
    const noteError = validateOptionalText(note);
    if (noteError) return setFormError(noteError);
    setFormError(null);
    const trimmed = note.trim();
    void run('counter', () =>
      sendCounter({
        engagementId,
        amountMinor: parsed.amountMinor,
        ...(trimmed ? { note: trimmed } : {}),
      }).unwrap(),
    );
  }

  function submitReason(next: 'decline' | 'withdrawApplication') {
    const error = validateOptionalText(reason);
    if (error) return setFormError(error);
    setFormError(null);
    setConfirm(next);
  }

  function runConfirmed() {
    const trimmedReason = reason.trim();
    if (confirm === 'accept' && pending) {
      void run('accept', () => acceptOffer({ engagementId, offerId: pending.id }).unwrap());
    } else if (confirm === 'withdrawOffer' && pending) {
      void run('withdrawOffer', () =>
        withdrawOffer({ engagementId, offerId: pending.id }).unwrap(),
      );
    } else if (confirm === 'decline') {
      void run('decline', () => decline({ engagementId, reason: trimmedReason }).unwrap());
    } else if (confirm === 'withdrawApplication') {
      void run('withdrawApplication', () =>
        withdrawApplication({ engagementId, reason: trimmedReason }).unwrap(),
      );
    }
  }

  const confirmCopy: Record<Exclude<Confirm, null>, { title: string; primary: string }> = {
    accept: {
      title: `Accept ${pending ? formatCampaignPrice(pending.amountMinor, pending.currency) : 'this offer'}? This locks the price for the campaign.`,
      primary: 'Accept',
    },
    withdrawOffer: {
      title: 'Withdraw your offer? The round it used stays used.',
      primary: 'Withdraw',
    },
    decline: { title: 'Decline this invitation?', primary: 'Decline' },
    withdrawApplication: { title: 'Withdraw your application?', primary: 'Withdraw' },
  };

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {header}

        <View style={s.content}>
          <View style={s.campaignRow}>
            <Text style={[s.campaignTitle, { color: colors.text.primary }]} numberOfLines={2}>
              {title || 'Campaign'}
            </Text>
            <StatusBadge
              label={badge.label}
              color={badge.color}
              textColor={badge.text}
              testID="offer-status"
            />
          </View>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="View campaign"
            onPress={() => router.push(`/campaign/${data.campaignId}`)}
            testID="offer-view-campaign">
            <Text style={s.linkText}>View campaign</Text>
          </Pressable>

          <View style={s.thread}>
            <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Offers</Text>
            {offers.length === 0 ? (
              <Text style={[s.hintText, { color: colors.text.secondary }]}>No offers yet.</Text>
            ) : (
              offers.map(offer => <OfferRow key={offer.id} offer={offer} border={colors.border} />)
            )}
          </View>

          {state.isNegotiable ? (
            <View>
              <Text
                style={[s.roundsText, { color: colors.text.primary }]}
                testID="offer-rounds-left">
                Rounds left: {state.roundsRemaining}
              </Text>
              {state.pendingIsMine ? (
                <Text style={[s.hintText, { color: colors.text.secondary }]}>
                  Waiting for the business to respond.
                </Text>
              ) : null}
              {state.isFinalOffer ? (
                <Text style={[s.hintText, { color: colors.text.secondary }]}>
                  This is the final offer — accept or decline.
                </Text>
              ) : null}
            </View>
          ) : null}

          {data.status === 'accepted' && data.agreedAmountMinor !== null ? (
            <AcceptedSummary detail={data} />
          ) : null}

          {!state.isNegotiable && data.closeReason ? (
            <Text style={[s.hintText, { color: colors.text.secondary }]}>
              Reason: {data.closeReason}
            </Text>
          ) : null}

          {actionError ? (
            <View
              style={s.errorBanner}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              testID="offer-error">
              <Text style={s.errorText}>{actionError}</Text>
            </View>
          ) : null}

          {form === 'counter' ? (
            <View style={[s.form, { borderColor: colors.border }]}>
              <TextField
                label="Your counter-offer (BDT)"
                keyboardType="decimal-pad"
                placeholder="e.g. 25,000"
                value={amount}
                onChangeText={setAmount}
                error={formError ?? fieldErrors?.amountMinor}
                accessibilityLabel="Counter-offer amount in BDT"
                testID="offer-counter-amount"
              />
              <TextField
                label="Note (optional)"
                multiline
                maxLength={NEGOTIATION_TEXT_MAX_LENGTH}
                value={note}
                onChangeText={setNote}
                error={fieldErrors?.note}
                inputStyle={s.multiline}
                accessibilityLabel="Note to the business"
                testID="offer-counter-note"
              />
              <Button
                title="Send counter-offer"
                style={s.primaryButton}
                titleStyle={s.primaryTitle}
                onPress={submitCounter}
                isLoading={busy === 'counter'}
                disabled={disabled}
                accessibilityLabel="Send counter-offer"
                testID="offer-counter-submit"
              />
              <Button
                title="Cancel"
                style={s.secondaryButton}
                titleStyle={s.secondaryTitle}
                onPress={closeForm}
                disabled={disabled}
              />
            </View>
          ) : null}

          {form === 'decline' || form === 'withdrawApplication' ? (
            <View style={[s.form, { borderColor: colors.border }]}>
              <TextField
                label="Reason (optional)"
                multiline
                maxLength={NEGOTIATION_TEXT_MAX_LENGTH}
                value={reason}
                onChangeText={setReason}
                error={formError ?? fieldErrors?.reason}
                inputStyle={s.multiline}
                accessibilityLabel="Reason"
                testID="offer-reason"
              />
              <Button
                title={form === 'decline' ? 'Decline invitation' : 'Withdraw application'}
                style={s.dangerButton}
                titleStyle={s.dangerTitle}
                onPress={() => submitReason(form)}
                isLoading={busy === form}
                loaderColor={palette.error[600]}
                disabled={disabled}
                testID="offer-reason-submit"
              />
              <Button
                title="Cancel"
                style={s.secondaryButton}
                titleStyle={s.secondaryTitle}
                onPress={closeForm}
                disabled={disabled}
              />
            </View>
          ) : null}

          {form === null && state.isNegotiable ? (
            <View style={s.actions}>
              {state.canAccept ? (
                <Button
                  title="Accept"
                  style={s.primaryButton}
                  titleStyle={s.primaryTitle}
                  onPress={() => setConfirm('accept')}
                  isLoading={busy === 'accept'}
                  disabled={disabled}
                  testID="offer-accept"
                />
              ) : null}
              {state.canCounter ? (
                <Button
                  title="Counter"
                  style={s.secondaryButton}
                  titleStyle={s.secondaryTitle}
                  onPress={() => setForm('counter')}
                  disabled={disabled}
                  testID="offer-counter"
                />
              ) : null}
              {state.canWithdrawOffer ? (
                <Button
                  title="Withdraw my offer"
                  style={s.secondaryButton}
                  titleStyle={s.secondaryTitle}
                  onPress={() => setConfirm('withdrawOffer')}
                  isLoading={busy === 'withdrawOffer'}
                  loaderColor={palette.primary[500]}
                  disabled={disabled}
                  testID="offer-withdraw-offer"
                />
              ) : null}
              {state.canDecline ? (
                <Button
                  title="Decline"
                  style={s.dangerButton}
                  titleStyle={s.dangerTitle}
                  onPress={() => setForm('decline')}
                  disabled={disabled}
                  testID="offer-decline"
                />
              ) : null}
              {state.canWithdrawApplication ? (
                <Button
                  title="Withdraw application"
                  style={s.dangerButton}
                  titleStyle={s.dangerTitle}
                  onPress={() => setForm('withdrawApplication')}
                  disabled={disabled}
                  testID="offer-withdraw-application"
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {confirm ? (
        <ConfirmDialog
          title={confirmCopy[confirm].title}
          primaryLabel={confirmCopy[confirm].primary}
          onPrimaryPress={runConfirmed}
          secondaryLabel="Cancel"
          onSecondaryPress={() => setConfirm(null)}
          onClose={() => setConfirm(null)}
          testID="offer-confirm"
        />
      ) : null}
    </SafeAreaView>
  );
}

function OfferRow({ offer, border }: { offer: EngagementOffer; border: string }) {
  const { colors } = useTheme();
  const inactive = INACTIVE.includes(offer.status);

  return (
    <View
      style={[s.offerCard, { borderColor: border }, inactive && s.offerCardInactive]}
      testID={`offer-round-${offer.roundNo}`}>
      <View style={s.offerHeader}>
        <Text style={[s.offerMeta, { color: colors.text.secondary }]}>
          Round {offer.roundNo} · {offer.senderType === 'creator' ? 'You' : 'Business'}
        </Text>
        <Text style={[s.offerMeta, { color: colors.text.secondary }]}>
          {OFFER_STATUS_LABEL[offer.status]}
        </Text>
      </View>
      <Text
        style={[s.offerAmount, { color: colors.text.primary }, inactive && s.offerAmountStruck]}>
        {formatCampaignPrice(offer.amountMinor, offer.currency)}
      </Text>
      {offer.note ? (
        <Text style={[s.offerNote, { color: colors.text.secondary }]}>{offer.note}</Text>
      ) : null}
      <Text style={[s.offerDate, { color: colors.text.secondary }]}>
        {formatOfferDate(offer.createdAt)}
      </Text>
    </View>
  );
}

// The creator's pay is the agreed price. The licensing markup is the
// business's cost on top, so it isn't shown here.
function AcceptedSummary({ detail }: { detail: MyEngagementDetail }) {
  const { colors } = useTheme();
  return (
    <View style={s.summaryCard} testID="offer-accepted-summary">
      <SummaryRow
        label="Agreed price"
        value={formatCampaignPrice(detail.agreedAmountMinor, detail.currency)}
      />
      {detail.nextAction === 'fund_escrow' && detail.escrowFundingDeadline ? (
        <Text style={[s.hintText, { color: colors.text.secondary }]}>
          The business has until {formatOfferDate(detail.escrowFundingDeadline)} to fund escrow.
        </Text>
      ) : null}
    </View>
  );
}
