import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { ApiError } from '@/services/http';
import { Dispatch } from '@/utils/store';
import { PickedImageAsset } from '@/utils/onboardingSchemas';
import Image from '@/components/elements/Image';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import { deliverablesStyle as s } from './deliverables.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import { useGetEngagementDeliverablesQuery, useRecordPostedMutation } from './api/campaignFeedApi';
import { invalidateAfterSubmit, submitDeliverable } from './api/submitDeliverable';
import { DeliverablePiece, DeliverableSubmission } from './types/deliverables';
import { formatOfferDate } from './utils/negotiation';
import {
  CAPTION_MAX_LENGTH,
  canSubmitPiece,
  isOverdue,
  latestChangeRequest,
  PIECE_STATUS_BADGE,
  pieceTitle,
  safeHttpUrl,
  SubmissionField,
  validateLivePostUrl,
  validateSubmission,
} from './utils/deliverables';

const GENERIC_SUBMIT_ERROR = "Couldn't submit. Please try again.";
const GENERIC_POSTED_ERROR = "Couldn't save the link. Please try again.";

// One deliverable piece (campaign API group CI1 row): its status, the
// business's latest change request, the submission form (CI2 - an image or a
// link, plus a caption), and once approved the live post link (CI4). The
// submission history lists every revision with the business's decision.
// Creator-provided text and the business's reasons render as plain Text; a
// link opens only when it is http(s). Nothing here says "paid" - there is no
// escrow yet (backend item 19).
export default function DeliverablePieceScreen() {
  const { colors } = useTheme();
  const { id, pieceId } = useLocalSearchParams<{ id: string; pieceId: string }>();
  const engagementId = id ?? '';
  const { data, isLoading, isError, refetch } = useGetEngagementDeliverablesQuery(
    { engagementId },
    { skip: !engagementId },
  );

  const header = (
    <ScreenHeader title="Deliverable" onBack={() => router.back()} style={s.headerGap} />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent} testID="piece-loading">
          {header}
          <CampaignRequestCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const piece = data?.find(item => item.id === pieceId);

  if (isError || !data || !piece) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          {isError ? (
            <CampaignsEmptyState variant="error" onRetry={refetch} />
          ) : (
            <Text style={[s.hintText, { color: colors.text.secondary }]} testID="piece-not-found">
              This deliverable isn&apos;t available.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PieceContent piece={piece} engagementId={engagementId} header={header} onRefetch={refetch} />
  );
}

function PieceContent({
  piece,
  engagementId,
  header,
  onRefetch,
}: {
  piece: DeliverablePiece;
  engagementId: string;
  header: React.ReactNode;
  onRefetch: () => void;
}) {
  const { colors } = useTheme();
  const badge = PIECE_STATUS_BADGE[piece.status];
  const changeRequest = piece.status === 'changes_requested' ? latestChangeRequest(piece) : null;
  const history = [...piece.submissions].sort((a, b) => b.revisionNo - a.revisionNo);
  const submittable = canSubmitPiece(piece.status);
  const overdue = submittable && isOverdue(piece.dueDate, new Date());

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {header}
        <View style={s.content}>
          <View style={s.titleRow}>
            <Text style={[s.title, { color: colors.text.primary }]}>{pieceTitle(piece)}</Text>
            <StatusBadge
              label={badge.label}
              color={badge.color}
              textColor={badge.text}
              testID="piece-status"
            />
          </View>
          <Text style={[s.meta, { color: colors.text.secondary }]}>
            {piece.dueDate ? `Due ${formatOfferDate(piece.dueDate)}` : 'No due date'}
            {overdue ? <Text style={s.overdue}> · Overdue</Text> : null}
            {submittable ? ` · ${piece.revisionsRemaining} revisions left` : ''}
          </Text>

          {changeRequest ? (
            <View style={[s.banner, s.warningBanner]} testID="piece-change-request">
              <Text style={[s.warningText, { fontWeight: '600' }]}>
                The business asked for changes:
              </Text>
              <Text style={s.warningText}>{changeRequest}</Text>
            </View>
          ) : null}

          {piece.status === 'escalated' ? (
            <View style={[s.banner, s.errorBanner]} testID="piece-escalated">
              <Text style={s.errorText}>
                In dispute — the business requested changes three times. Disputes aren&apos;t
                available yet.
              </Text>
            </View>
          ) : null}

          {piece.status === 'cancelled' ? (
            <Text style={[s.hintText, { color: colors.text.secondary }]}>Cancelled.</Text>
          ) : null}

          {piece.status === 'approved' ? (
            <>
              <View style={[s.banner, s.successBanner]} testID="piece-approved">
                <Text style={s.successText}>
                  Approved{piece.approvedAt ? ` on ${formatOfferDate(piece.approvedAt)}` : ''}.
                </Text>
              </View>
              <LivePostForm piece={piece} engagementId={engagementId} />
            </>
          ) : null}

          {submittable ? (
            <SubmitForm
              engagementId={engagementId}
              pieceId={piece.id}
              isResubmit={piece.submissions.length > 0}
              onRefetch={onRefetch}
            />
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Submissions</Text>
            {history.length === 0 ? (
              <Text style={[s.hintText, { color: colors.text.secondary }]}>
                Nothing submitted yet.
              </Text>
            ) : (
              history.map(submission => (
                <SubmissionItem key={submission.id} submission={submission} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SubmitForm({
  engagementId,
  pieceId,
  isResubmit,
  onRefetch,
}: {
  engagementId: string;
  pieceId: string;
  isResubmit: boolean;
  onRefetch: () => void;
}) {
  const { colors } = useTheme();
  const dispatch = useDispatch<Dispatch>();
  const [kind, setKind] = useState<'image' | 'link'>('link');
  const [externalUrl, setExternalUrl] = useState('');
  const [image, setImage] = useState<PickedImageAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [errors, setErrors] = useState<Partial<Record<SubmissionField, string>>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    const asset = !result.canceled ? result.assets[0] : undefined;
    if (asset) {
      setImage({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName ?? undefined });
      setErrors(current => ({ ...current, image: undefined }));
    }
  }

  async function submit() {
    const found = validateSubmission({ kind, externalUrl, image, caption });
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await submitDeliverable(
        kind === 'link'
          ? { engagementId, pieceId, kind, externalUrl, caption }
          : { engagementId, pieceId, kind, image: image as PickedImageAsset, caption },
      );
      invalidateAfterSubmit(dispatch, engagementId);
      setExternalUrl('');
      setImage(null);
      setCaption('');
      setMessage({ tone: 'success', text: 'Submitted for review.' });
    } catch (err) {
      const error = err instanceof ApiError ? err : null;
      if (error?.statusCode === 409) {
        setMessage({ tone: 'error', text: error.message });
        onRefetch();
      } else if (error?.statusCode === 422 && error.errors) {
        setErrors({
          externalUrl: error.errors.externalUrl,
          caption: error.errors.caption,
          image: error.errors.file ? "That image type isn't supported." : undefined,
        });
        setMessage({ tone: 'error', text: error.message });
      } else {
        setMessage({ tone: 'error', text: GENERIC_SUBMIT_ERROR });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[s.form, { borderColor: colors.border }]} testID="piece-submit-form">
      <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
        {isResubmit ? 'Submit a new revision' : 'Submit your work'}
      </Text>
      <View style={s.toggle} accessibilityRole="radiogroup">
        {(['image', 'link'] as const).map(option => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: kind === option }}
            onPress={() => setKind(option)}
            style={[
              s.toggleOption,
              { borderColor: colors.border },
              kind === option && s.toggleOptionActive,
            ]}
            testID={`piece-kind-${option}`}>
            <Text style={[s.toggleText, { color: colors.text.primary }]}>
              {option === 'image' ? 'Upload image' : 'Share link'}
            </Text>
          </Pressable>
        ))}
      </View>

      {kind === 'link' ? (
        <TextField
          label="Link to your content"
          placeholder="https://"
          autoCapitalize="none"
          keyboardType="url"
          value={externalUrl}
          onChangeText={setExternalUrl}
          error={errors.externalUrl}
          accessibilityLabel="Link to your content"
          testID="piece-url"
        />
      ) : (
        <View style={{ gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={image ? 'Change image' : 'Choose image'}
            onPress={pickImage}
            style={[s.pickButton, { borderColor: colors.border }]}
            testID="piece-pick-image">
            {image ? <Image source={{ uri: image.uri }} style={s.thumbnail} /> : null}
            <Text style={s.linkText}>{image ? 'Change image' : 'Choose an image'}</Text>
          </Pressable>
          {errors.image ? <Text style={s.fieldError}>{errors.image}</Text> : null}
          <Text style={[s.meta, { color: colors.text.secondary }]}>
            Images only (JPEG, PNG, GIF, WebP). Share videos as a link.
          </Text>
        </View>
      )}

      <TextField
        label="Caption (optional)"
        multiline
        maxLength={CAPTION_MAX_LENGTH}
        value={caption}
        onChangeText={setCaption}
        error={errors.caption}
        inputStyle={s.multiline}
        accessibilityLabel="Caption"
        testID="piece-caption"
      />

      {message ? (
        <View
          style={[s.banner, message.tone === 'success' ? s.successBanner : s.errorBanner]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID="piece-submit-message">
          <Text style={message.tone === 'success' ? s.successText : s.errorText}>
            {message.text}
          </Text>
        </View>
      ) : null}

      <Button
        title={isResubmit ? 'Resubmit' : 'Submit'}
        style={s.primaryButton}
        titleStyle={s.primaryTitle}
        onPress={submit}
        isLoading={busy}
        disabled={busy}
        testID="piece-submit"
      />
    </View>
  );
}

function LivePostForm({ piece, engagementId }: { piece: DeliverablePiece; engagementId: string }) {
  const { colors } = useTheme();
  const approved = piece.submissions.find(submission => submission.status === 'approved');
  const [url, setUrl] = useState(approved?.livePostUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [recordPosted, { isLoading }] = useRecordPostedMutation();

  async function save() {
    const invalid = validateLivePostUrl(url);
    setError(invalid);
    setMessage(null);
    if (invalid) return;
    try {
      await recordPosted({ engagementId, pieceId: piece.id, livePostUrl: url.trim() }).unwrap();
      setMessage({ tone: 'success', text: 'Live post saved.' });
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 422 && apiError.errors?.livePostUrl) {
        setError(apiError.errors.livePostUrl);
      } else {
        setMessage({
          tone: 'error',
          text: apiError?.statusCode === 409 ? apiError.message : GENERIC_POSTED_ERROR,
        });
      }
    }
  }

  return (
    <View style={[s.form, { borderColor: colors.border }]} testID="piece-live-post">
      <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Live post link</Text>
      <Text style={[s.meta, { color: colors.text.secondary }]}>
        Where the approved content was published.
      </Text>
      <TextField
        label="Live post URL"
        placeholder="https://"
        autoCapitalize="none"
        keyboardType="url"
        value={url}
        onChangeText={setUrl}
        error={error ?? undefined}
        accessibilityLabel="Live post URL"
        testID="piece-live-post-url"
      />
      {message ? (
        <View
          style={[s.banner, message.tone === 'success' ? s.successBanner : s.errorBanner]}
          accessibilityRole="alert"
          testID="piece-live-post-message">
          <Text style={message.tone === 'success' ? s.successText : s.errorText}>
            {message.text}
          </Text>
        </View>
      ) : null}
      <Button
        title="Save link"
        style={s.primaryButton}
        titleStyle={s.primaryTitle}
        onPress={save}
        isLoading={isLoading}
        disabled={isLoading}
        testID="piece-live-post-save"
      />
    </View>
  );
}

const SUBMISSION_STATUS_LABEL: Record<DeliverableSubmission['status'], string> = {
  submitted: 'Awaiting review',
  approved: 'Approved',
  changes_requested: 'Changes requested',
  superseded: 'Superseded',
  withdrawn: 'Withdrawn',
};

function SubmissionItem({ submission }: { submission: DeliverableSubmission }) {
  const { colors } = useTheme();
  const link = safeHttpUrl(submission.externalUrl);

  return (
    <View
      style={[s.historyItem, { borderColor: colors.border }]}
      testID={`submission-${submission.revisionNo}`}>
      <View style={s.rowHeader}>
        <Text style={[s.meta, { color: colors.text.secondary, fontWeight: '600' }]}>
          Revision {submission.revisionNo} · {SUBMISSION_STATUS_LABEL[submission.status]}
        </Text>
        <Text style={[s.meta, { color: colors.text.secondary }]}>
          {formatOfferDate(submission.submittedAt)}
        </Text>
      </View>
      {submission.isLate ? <Text style={s.lateTag}>Late</Text> : null}
      {submission.externalUrl ? (
        link ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(link)}
            testID={`submission-${submission.revisionNo}-link`}>
            <Text style={s.linkText} numberOfLines={2}>
              {link}
            </Text>
          </Pressable>
        ) : (
          <Text style={[s.hintText, { color: colors.text.primary }]}>{submission.externalUrl}</Text>
        )
      ) : submission.mediaId ? (
        <Text style={[s.hintText, { color: colors.text.secondary }]}>Uploaded image</Text>
      ) : null}
      {submission.caption ? (
        <Text style={[s.hintText, { color: colors.text.primary }]}>{submission.caption}</Text>
      ) : null}
      {submission.reviewDecision ? (
        <View style={s.reviewBox}>
          <Text style={[s.hintText, { color: colors.text.primary }]}>
            {submission.reviewDecision === 'approved'
              ? 'The business approved this.'
              : 'The business requested changes.'}
            {submission.reviewReason ? ` ${submission.reviewReason}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
