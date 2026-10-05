import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import { ApiError } from '@/services/http';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import ConfirmDialog from '@/components/elements/ConfirmDialog';
import DeliverablesEditor from '@/components/elements/DeliverablesEditor';
import OptionSheet from '@/components/elements/OptionSheet';
import { offerScreenStyle as s } from './offerScreen.style';
import { AgreementSheet, CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import {
  useAcceptOfferMutation,
  useDeclineMyEngagementMutation,
  useGetFeedCampaignQuery,
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
  ScopeItem,
} from './types/myEngagement';
import { AgreementMode, buildCreatorAgreement, CreatorAgreement } from './utils/agreement';
import { formatCampaignPrice } from './utils/mapCampaignFeedItem';
import {
  formatOfferDate,
  getOfferScreenState,
  NEGOTIATION_TEXT_MAX_LENGTH,
  parseCounterAmount,
  sortOffers,
  validateOptionalText,
} from './utils/negotiation';
import {
  addableScopeOptions,
  addScopeItem,
  isSameScope,
  SCOPE_MAX_ITEMS,
  scopeErrorsFromApi,
  scopeFromList,
  scopeItemLabel,
  scopeListErrorFromApi,
  scopePairKey,
  validateScope,
} from './utils/scope';
import { openDeliverables } from './utils/openDeliverables';
import { FeatherName } from './utils/platformIcon';

type Action = 'accept' | 'counter' | 'withdrawOffer' | 'decline' | 'withdrawApplication';
type Form = 'counter' | 'decline' | 'withdrawApplication' | null;
type Confirm = 'withdrawOffer' | 'decline' | 'withdrawApplication' | null;

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

// Text/background of each round's status label in the thread.
const OFFER_STATUS_TONE: Record<EngagementOfferStatus, { color: string; backgroundColor: string }> =
  {
    pending: { color: palette.warning[700], backgroundColor: palette.warning[50] },
    accepted: { color: palette.success[700], backgroundColor: palette.success[50] },
    declined: { color: palette.error[700], backgroundColor: palette.error[50] },
    superseded: { color: palette.gray[500], backgroundColor: palette.gray[25] },
    withdrawn: { color: palette.gray[500], backgroundColor: palette.gray[25] },
    expired: { color: palette.gray[500], backgroundColor: palette.gray[25] },
  };

const HERO_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

// The Offer screen - the creator's side of a price negotiation for one
// engagement (an application they sent or an invitation they received),
// opened from either Applications tab. Loads the engagement with its whole
// offer thread (campaign API group CF3, GET /me/engagements/:id) and runs
// Accept (CF4, always through the Agreement sheet), Counter (CG2), Withdraw
// my offer (CG3), Decline (CF5, for invitations) and Withdraw application
// (CF6, for the creator's own requests). Which actions show comes from getOfferScreenState, which mirrors
// the backend rules; a 409 means this view was stale, so the server's message
// is shown and the engagement refetched. Backend 18l: the engagement's own
// deliverables list (`scope`) is shown, rounds that changed it are tagged, and
// a counter can change it with or instead of the price - `scope` is sent only
// when the list actually changed. Registered at
// app/(details)/engagement/[id].tsx; `title` is passed by the list because
// CF3 carries no campaign summary. `review=1` (the Request tab's quick Accept)
// opens the Agreement sheet once on load, so accepting is never one tap.
// Layout: a brand-gradient header card (campaign, status, rounds progress),
// notices, the accepted summary, deliverable chips, the counter / reason
// forms, then the thread as chat bubbles (business left, creator right);
// the negotiation actions sit in a bar pinned to the bottom.
export default function OfferScreen() {
  const { colors } = useTheme();
  const { id, title, review } = useLocalSearchParams<{
    id: string;
    title?: string;
    review?: string;
  }>();
  const engagementId = id ?? '';

  const { data, isLoading, isError, isFetching, refetch } = useGetMyEngagementQuery(
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
  // null = keep the current deliverables (editor closed).
  const [scopeRows, setScopeRows] = useState<ScopeItem[] | null>(null);
  const [scopeRowErrors, setScopeRowErrors] = useState<Record<number, string>>({});
  const [scopeListError, setScopeListError] = useState<string | null>(null);
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [sheet, setSheet] = useState<AgreementMode | null>(null);
  // The agreement the creator pressed Accept on. If a refetch (after a 409)
  // no longer has that offer pending, the sheet keeps showing these terms
  // with Accept disabled rather than swapping in new ones.
  const [reviewed, setReviewed] = useState<CreatorAgreement | null>(null);
  const autoReviewed = useRef(false);

  // CB2 - the confirm mode's pay depends on the campaign's licensing tier.
  // Fetched only while the sheet is open; 404 for a campaign that isn't live.
  const campaign = useGetFeedCampaignQuery(
    { id: data?.campaignId ?? '' },
    { skip: !data?.campaignId || !sheet },
  );
  const liveAgreement = useMemo(
    () => (data && sheet ? buildCreatorAgreement(data, campaign.data ?? null, sheet, title) : null),
    [data, campaign.data, sheet, title],
  );

  // The Request tab's quick Accept lands here with review=1: open the sheet
  // once per mount, so a refetch or coming back doesn't reopen it.
  useEffect(() => {
    if (review !== '1' || autoReviewed.current || !data) return;
    autoReviewed.current = true;
    if (getOfferScreenState(data).canAccept) setSheet('confirm');
  }, [review, data]);

  function closeForm() {
    setForm(null);
    setAmount('');
    setNote('');
    setReason('');
    setFormError(null);
    setFieldErrors(null);
    setScopeRows(null);
    setScopeRowErrors({});
    setScopeListError(null);
    setScopeSheetOpen(false);
  }

  function changeScope(next: ScopeItem[] | null) {
    setScopeRows(next);
    setScopeRowErrors({});
    setScopeListError(null);
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

  const currentScope = scopeFromList(data.scope ?? []);

  // Pre-fill with the latest offer's amount so a deliverables-only counter
  // needs no retyping (CG2 always carries an amount).
  function openCounter() {
    const latest = offers[offers.length - 1];
    setAmount(latest ? String(latest.amountMinor / 100) : '');
    setForm('counter');
  }

  function submitCounter() {
    const parsed = parseCounterAmount(amount);
    if (!parsed.ok) return setFormError(parsed.error);
    const noteError = validateOptionalText(note);
    if (noteError) return setFormError(noteError);
    let scope: ScopeItem[] | undefined;
    if (scopeRows) {
      const checked = validateScope(scopeRows);
      if (!checked.ok) {
        setScopeRowErrors(checked.rowErrors);
        setScopeListError(checked.error);
        return;
      }
      if (!isSameScope(checked.scope, currentScope)) scope = checked.scope;
    }
    setFormError(null);
    const trimmed = note.trim();
    void run('counter', () =>
      sendCounter({
        engagementId,
        amountMinor: parsed.amountMinor,
        ...(trimmed ? { note: trimmed } : {}),
        ...(scope ? { scope } : {}),
      }).unwrap(),
    );
  }

  // Local validation wins; otherwise a backend 422's scope keys.
  const shownScopeRowErrors = Object.keys(scopeRowErrors).length
    ? scopeRowErrors
    : scopeErrorsFromApi(fieldErrors);
  const shownScopeListError = scopeListError ?? scopeListErrorFromApi(fieldErrors);

  function submitReason(next: 'decline' | 'withdrawApplication') {
    const error = validateOptionalText(reason);
    if (error) return setFormError(error);
    setFormError(null);
    setConfirm(next);
  }

  function openAgreement(mode: AgreementMode) {
    setActionError(null);
    setReviewed(null);
    setSheet(mode);
  }

  function closeAgreement() {
    setSheet(null);
    setReviewed(null);
  }

  // Accepts exactly the offer the sheet shows; on success the sheet turns
  // into the confirmed agreement, built from the refetched CF3.
  function acceptReviewed(offerId: string) {
    setReviewed(liveAgreement);
    void run('accept', async () => {
      await acceptOffer({ engagementId, offerId }).unwrap();
      setReviewed(null);
      setSheet('confirmed');
    });
  }

  // Stale: the offer the creator pressed Accept on is no longer the one
  // pending (the business countered or withdrew meanwhile).
  const isStale =
    sheet === 'confirm' && reviewed !== null && liveAgreement?.offerId !== reviewed.offerId;
  const shownAgreement = isStale ? reviewed : liveAgreement;
  const campaignLoading = campaign.isLoading || (campaign.isFetching && !campaign.data);
  const agreementLoading =
    !shownAgreement &&
    (campaignLoading || (sheet === 'confirmed' && (isFetching || busy === 'accept')));
  const agreementLoadError = sheet === 'confirm' && !shownAgreement && campaign.isError;
  const agreementMessage =
    actionError ??
    (sheet === 'confirm' && !shownAgreement && !agreementLoading && !agreementLoadError
      ? 'This offer is no longer available.'
      : null);

  function runConfirmed() {
    const trimmedReason = reason.trim();
    if (confirm === 'withdrawOffer' && pending) {
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
    withdrawOffer: {
      title: 'Withdraw your offer? The round it used stays used.',
      primary: 'Withdraw',
    },
    decline: { title: 'Decline this invitation?', primary: 'Decline' },
    withdrawApplication: { title: 'Withdraw your application?', primary: 'Withdraw' },
  };

  const roundsUsed = Math.min(data.negotiationRoundCount, data.negotiationRoundLimit);
  const roundsProgress = data.negotiationRoundLimit ? roundsUsed / data.negotiationRoundLimit : 0;
  const showActionBar = form === null && state.isNegotiable;

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: colors.background }]}
      edges={showActionBar ? ['top', 'left', 'right'] : undefined}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              <Text style={s.heroEyebrow}>
                {data.origin === 'invited' ? 'INVITATION' : 'APPLICATION'}
              </Text>
              <StatusBadge
                label={badge.label}
                color={badge.color}
                textColor={badge.text}
                testID="offer-status"
              />
            </View>
            <Text style={s.heroTitle} numberOfLines={2}>
              {title || 'Campaign'}
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="View campaign"
              onPress={() => router.push(`/campaign/${data.campaignId}`)}
              hitSlop={6}
              style={({ pressed }) => [s.heroLink, pressed && s.pressed]}
              testID="offer-view-campaign">
              <Feather name="external-link" size={13} color={palette.white} />
              <Text style={s.heroLinkText}>View campaign</Text>
            </Pressable>

            {state.isNegotiable ? (
              <View style={s.rounds}>
                <View style={s.roundsLabels}>
                  <Text style={s.roundsText} testID="offer-rounds-left">
                    Rounds left: {state.roundsRemaining}
                  </Text>
                  <Text style={s.roundsMeta}>
                    {roundsUsed} of {data.negotiationRoundLimit} used
                  </Text>
                </View>
                <View
                  style={s.roundsTrack}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: data.negotiationRoundLimit,
                    now: roundsUsed,
                  }}>
                  <View style={[s.roundsFill, { width: `${Math.round(roundsProgress * 100)}%` }]} />
                </View>
              </View>
            ) : null}
          </LinearGradient>

          {state.isNegotiable && state.pendingIsMine ? (
            <Notice tone="info" icon="clock">
              Waiting for the business to respond.
            </Notice>
          ) : null}
          {state.isNegotiable && state.isFinalOffer ? (
            <Notice tone="warning" icon="alert-triangle">
              This is the final offer — accept or decline.
            </Notice>
          ) : null}
          {!state.isNegotiable && data.closeReason ? (
            <Notice tone="neutral" icon="info">
              Reason: {data.closeReason}
            </Notice>
          ) : null}

          {data.status === 'accepted' && data.agreedAmountMinor !== null ? (
            <AcceptedSummary detail={data} onViewAgreement={() => openAgreement('confirmed')} />
          ) : null}

          {data.status === 'accepted' || data.status === 'completed' ? (
            <Button
              title="Deliver work"
              style={s.primaryButton}
              titleStyle={s.primaryTitle}
              onPress={() => openDeliverables({ id: engagementId, title })}
              accessibilityLabel="Deliver work"
              testID="offer-deliver-work"
            />
          ) : null}

          {actionError ? (
            <View
              style={s.errorBanner}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              testID="offer-error">
              <Feather name="alert-circle" size={16} color={palette.error[700]} />
              <Text style={s.errorText}>{actionError}</Text>
            </View>
          ) : null}

          {data.scope?.length ? (
            <View
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              testID="offer-deliverables">
              <SectionTitle icon="package" title="Deliverables" count={data.scope.length} />
              <View style={s.scopeChips}>
                {data.scope.map(item => (
                  <View key={scopePairKey(item)} style={s.scopeChip}>
                    <Text style={s.scopeChipText}>
                      {item.count} × {scopeItemLabel(item)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {form === 'counter' ? (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionTitle icon="repeat" title="Your counter-offer" />
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
              {scopeRows ? (
                <View style={s.scopeEditor}>
                  <View style={s.scopeEditorHeader}>
                    <Text style={[s.subTitle, { color: colors.text.primary }]}>Deliverables</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => changeScope(null)}
                      disabled={disabled}
                      hitSlop={6}
                      testID="offer-keep-deliverables">
                      <Text style={s.linkText}>Keep current deliverables</Text>
                    </Pressable>
                  </View>
                  <DeliverablesEditor
                    items={scopeRows.map(row => ({
                      key: scopePairKey(row),
                      label: scopeItemLabel(row),
                      count: row.count,
                    }))}
                    onCountChange={(index, count) =>
                      changeScope(
                        scopeRows.map((row, i) => (i === index ? { ...row, count } : row)),
                      )
                    }
                    onRemove={index => changeScope(scopeRows.filter((_, i) => i !== index))}
                    onAddPress={() => setScopeSheetOpen(true)}
                    addDisabled={
                      scopeRows.length >= SCOPE_MAX_ITEMS ||
                      addableScopeOptions(scopeRows).length === 0
                    }
                    rowErrors={shownScopeRowErrors}
                    error={shownScopeListError}
                    disabled={disabled}
                    testID="offer-scope-editor"
                  />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => changeScope(currentScope)}
                  disabled={disabled}
                  style={[s.inlineAction, { borderColor: colors.border }]}
                  testID="offer-change-deliverables">
                  <Feather name="edit-3" size={15} color={palette.primary[500]} />
                  <Text style={s.linkText}>Change deliverables</Text>
                </Pressable>
              )}
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
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionTitle
                icon="x-circle"
                title={form === 'decline' ? 'Decline invitation' : 'Withdraw application'}
                danger
              />
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
                loaderColor={palette.white}
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

          <View style={s.thread}>
            <SectionTitle icon="message-square" title="Negotiation" count={offers.length} />
            {offers.length === 0 ? (
              <Text style={[s.hintText, { color: colors.text.secondary }]}>No offers yet.</Text>
            ) : (
              offers.map(offer => <OfferRow key={offer.id} offer={offer} />)
            )}
          </View>
        </View>
      </ScrollView>

      {showActionBar ? (
        <SafeAreaView
          edges={['bottom']}
          style={[s.actionBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          testID="offer-action-bar">
          {state.canAccept || state.canCounter ? (
            <View style={s.actionRow}>
              {state.canCounter ? (
                <Button
                  title="Counter"
                  style={[s.secondaryButton, s.actionFlex]}
                  titleStyle={s.secondaryTitle}
                  onPress={openCounter}
                  disabled={disabled}
                  testID="offer-counter"
                />
              ) : null}
              {state.canAccept ? (
                <Button
                  title="Accept"
                  style={[s.primaryButton, s.actionFlex]}
                  titleStyle={s.primaryTitle}
                  onPress={() => openAgreement('confirm')}
                  isLoading={busy === 'accept'}
                  disabled={disabled}
                  testID="offer-accept"
                />
              ) : null}
            </View>
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
              style={s.textButton}
              titleStyle={s.textDangerTitle}
              onPress={() => setForm('decline')}
              disabled={disabled}
              testID="offer-decline"
            />
          ) : null}
          {state.canWithdrawApplication ? (
            <Button
              title="Withdraw application"
              style={s.textButton}
              titleStyle={s.textDangerTitle}
              onPress={() => setForm('withdrawApplication')}
              disabled={disabled}
              testID="offer-withdraw-application"
            />
          ) : null}
        </SafeAreaView>
      ) : null}

      {scopeSheetOpen && scopeRows ? (
        <OptionSheet
          options={addableScopeOptions(scopeRows)}
          onSelect={value => {
            changeScope(addScopeItem(scopeRows, value));
            setScopeSheetOpen(false);
          }}
          onClose={() => setScopeSheetOpen(false)}
        />
      ) : null}

      {sheet ? (
        <AgreementSheet
          agreement={shownAgreement}
          isLoading={agreementLoading}
          loadError={agreementLoadError}
          onRetry={campaign.refetch}
          isAccepting={busy === 'accept'}
          isStale={isStale}
          message={agreementMessage}
          onConfirm={acceptReviewed}
          onClose={closeAgreement}
        />
      ) : null}

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

// One round of the thread as a chat bubble: the business's offers on the
// left, the creator's on the right. Rounds no longer in play (countered,
// withdrawn, expired) are dimmed with the amount struck through.
function OfferRow({ offer }: { offer: EngagementOffer }) {
  const { colors } = useTheme();
  const inactive = INACTIVE.includes(offer.status);
  const mine = offer.senderType === 'creator';
  const statusTone = OFFER_STATUS_TONE[offer.status];

  return (
    <View style={[s.bubbleRow, mine ? s.bubbleRowMine : s.bubbleRowTheirs]}>
      {!mine ? (
        <View style={[s.bubbleAvatar, { backgroundColor: palette.primaryNavy[50] }]}>
          <Feather name="briefcase" size={14} color={palette.primaryNavy[800]} />
        </View>
      ) : null}
      <View
        style={[
          s.bubble,
          mine ? s.bubbleMine : { backgroundColor: colors.card, borderColor: colors.border },
          inactive && s.bubbleInactive,
        ]}
        testID={`offer-round-${offer.roundNo}`}>
        <View style={s.bubbleHeader}>
          <Text style={[s.bubbleMeta, { color: colors.text.secondary }]}>
            Round {offer.roundNo} · {offer.senderType === 'creator' ? 'You' : 'Business'}
          </Text>
          <Text style={[s.bubbleStatus, statusTone]}>{OFFER_STATUS_LABEL[offer.status]}</Text>
        </View>
        <Text style={[s.bubbleAmount, { color: colors.text.primary }, inactive && s.amountStruck]}>
          {formatCampaignPrice(offer.amountMinor, offer.currency)}
        </Text>
        {offer.scopeChanged ? (
          <Text style={s.scopeTag} testID={`offer-round-${offer.roundNo}-scope-changed`}>
            Changed deliverables
          </Text>
        ) : null}
        {offer.note ? (
          <Text style={[s.bubbleNote, { color: colors.text.primary }]}>{offer.note}</Text>
        ) : null}
        <Text style={[s.bubbleDate, { color: colors.text.secondary }]}>
          {formatOfferDate(offer.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// The creator's pay is the whole deal: the agreed price plus the licensing
// markup (F-2/F-6), from the server's numbers.
function AcceptedSummary({
  detail,
  onViewAgreement,
}: {
  detail: MyEngagementDetail;
  onViewAgreement: () => void;
}) {
  const agreement = buildCreatorAgreement(detail, null, 'confirmed');
  return (
    <View style={s.summaryCard} testID="offer-accepted-summary">
      <View style={s.summaryIcon}>
        <Feather name="check-circle" size={20} color={palette.success[600]} />
      </View>
      <View style={s.summaryBody}>
        <Text style={s.summaryLabel}>You&apos;ll receive</Text>
        <Text style={s.summaryAmount}>
          {formatCampaignPrice(agreement?.youReceiveMinor ?? null, detail.currency)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onViewAgreement}
        hitSlop={6}
        style={({ pressed }) => [s.summaryButton, pressed && s.pressed]}
        testID="offer-view-agreement">
        <Feather name="file-text" size={14} color={palette.success[700]} />
        <Text style={s.summaryButtonText}>View agreement</Text>
      </Pressable>
    </View>
  );
}

const NOTICE_TONE = {
  info: { box: s.noticeInfo, color: palette.primaryNavy[800] },
  warning: { box: s.noticeWarning, color: palette.warning[700] },
  neutral: { box: s.noticeNeutral, color: palette.gray[500] },
} as const;

function Notice({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof NOTICE_TONE;
  icon: FeatherName;
  children: ReactNode;
}) {
  const t = NOTICE_TONE[tone];
  return (
    <View style={[s.notice, t.box]}>
      <Feather name={icon} size={16} color={t.color} />
      <Text style={[s.noticeText, { color: t.color }]}>{children}</Text>
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  count,
  danger,
}: {
  icon: FeatherName;
  title: string;
  count?: number;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, danger && s.sectionIconDanger]}>
        <Feather name={icon} size={15} color={danger ? palette.error[600] : palette.primary[500]} />
      </View>
      <Text style={[s.sectionTitle, { color: colors.text.primary }]}>{title}</Text>
      {count ? (
        <View style={s.countChip}>
          <Text style={s.countChipText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}
