import { ReactNode, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import { Dispatch } from '@/utils/store';
import Image from '@/components/elements/Image';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import { pieceStyle as s } from './deliverablePiece.style';
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
} from './utils/deliverables';
import {
  applyLivePostError,
  applySubmissionError,
  LivePostValues,
  livePostSchema,
  submissionDefaultValues,
  SubmissionValues,
  submissionSchema,
} from './utils/deliverableSchemas';
import { FeatherName, platformIcon } from './utils/platformIcon';

const HERO_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

// One deliverable piece (campaign API group CI1 row): its status, the
// business's latest change request, the submission form (CI2 - an image or a
// link, plus a caption), and once approved the live post link (CI4). The
// submission history lists every revision with the business's decision.
// Both forms use react-hook-form + zod (utils/deliverableSchemas.ts, which
// wraps the backend-mirroring rules in utils/deliverables.ts): errors show
// once a field is touched or on submit, and backend 409/422s land on the form
// or its fields. Creator-provided text and the business's reasons render as
// plain Text; a link opens only when it is http(s). Nothing here says "paid" -
// there is no escrow yet (backend item 19).
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
  header: ReactNode;
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
          <LinearGradient
            colors={HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}>
            <View style={s.heroGlow} />
            <View style={s.heroGlowSmall} />
            <View style={s.heroTopRow}>
              <View style={s.heroIcon}>
                <Feather name={platformIcon(piece.platform)} size={22} color={palette.white} />
              </View>
              <View style={s.heroTitleBlock}>
                <Text style={s.heroEyebrow}>DELIVERABLE</Text>
                <Text style={s.heroTitle} numberOfLines={2}>
                  {pieceTitle(piece)}
                </Text>
              </View>
              <StatusBadge
                label={badge.label}
                color={badge.color}
                textColor={badge.text}
                testID="piece-status"
              />
            </View>
            <View style={s.heroChips}>
              <HeroChip icon="calendar">
                {piece.dueDate ? `Due ${formatOfferDate(piece.dueDate)}` : 'No due date'}
              </HeroChip>
              {overdue ? (
                <HeroChip icon="alert-circle" danger testID="piece-overdue">
                  Overdue
                </HeroChip>
              ) : null}
              {submittable ? (
                <HeroChip icon="refresh-cw">{`${piece.revisionsRemaining} revisions left`}</HeroChip>
              ) : null}
            </View>
          </LinearGradient>

          {changeRequest ? (
            <Notice
              tone="warning"
              icon="message-square"
              title="The business asked for changes"
              testID="piece-change-request">
              {changeRequest}
            </Notice>
          ) : null}

          {piece.status === 'escalated' ? (
            <Notice tone="error" icon="alert-octagon" title="In dispute" testID="piece-escalated">
              The business requested changes three times. Disputes aren&apos;t available yet.
            </Notice>
          ) : null}

          {piece.status === 'cancelled' ? (
            <Notice tone="neutral" icon="slash" title="Cancelled">
              This deliverable was cancelled and takes no more submissions.
            </Notice>
          ) : null}

          {piece.status === 'approved' ? (
            <>
              <Notice tone="success" icon="check-circle" title="Approved" testID="piece-approved">
                {piece.approvedAt
                  ? `The business approved this on ${formatOfferDate(piece.approvedAt)}.`
                  : 'The business approved this.'}
              </Notice>
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

          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Submissions</Text>
            {history.length ? (
              <View style={s.countChip}>
                <Text style={s.countChipText}>{history.length}</Text>
              </View>
            ) : null}
          </View>
          {history.length === 0 ? (
            <View
              style={[
                s.emptyCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}>
              <View style={s.emptyIcon}>
                <Feather name="inbox" size={20} color={palette.primary[500]} />
              </View>
              <Text style={[s.hintText, { color: colors.text.secondary }]}>
                Nothing submitted yet.
              </Text>
            </View>
          ) : (
            <View style={s.timeline}>
              {history.map((submission, index) => (
                <SubmissionItem
                  key={submission.id}
                  submission={submission}
                  isLast={index === history.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroChip({
  icon,
  danger,
  testID,
  children,
}: {
  icon: FeatherName;
  danger?: boolean;
  testID?: string;
  children: ReactNode;
}) {
  return (
    <View style={[s.heroChip, danger && s.heroChipDanger]} testID={testID}>
      <Feather name={icon} size={13} color={palette.white} />
      <Text style={s.heroChipText}>{children}</Text>
    </View>
  );
}

const NOTICE_TONE = {
  warning: { box: s.warningNotice, icon: s.warningIcon, text: s.warningText },
  error: { box: s.errorNotice, icon: s.errorIcon, text: s.errorText },
  success: { box: s.successNotice, icon: s.successIcon, text: s.successText },
  neutral: { box: s.neutralNotice, icon: s.neutralIcon, text: s.neutralText },
} as const;

function Notice({
  tone,
  icon,
  title,
  testID,
  children,
}: {
  tone: keyof typeof NOTICE_TONE;
  icon: FeatherName;
  title: string;
  testID?: string;
  children: ReactNode;
}) {
  const t = NOTICE_TONE[tone];
  return (
    <View style={[s.notice, t.box]} testID={testID}>
      <View style={[s.noticeIcon, t.icon]}>
        <Feather name={icon} size={16} color={t.text.color} />
      </View>
      <View style={s.noticeBody}>
        <Text style={[s.noticeTitle, t.text]}>{title}</Text>
        <Text style={[s.noticeText, t.text]}>{children}</Text>
      </View>
    </View>
  );
}

function FormBanner({
  tone,
  message,
  testID,
}: {
  tone: 'success' | 'error';
  message: string;
  testID: string;
}) {
  const t = NOTICE_TONE[tone];
  return (
    <View
      style={[s.formBanner, t.box]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={testID}>
      <Feather
        name={tone === 'success' ? 'check-circle' : 'alert-circle'}
        size={16}
        color={t.text.color}
      />
      <Text style={[s.formBannerText, t.text]}>{message}</Text>
    </View>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: FeatherName;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.cardHeader}>
      <View style={s.cardIcon}>
        <Feather name={icon} size={18} color={palette.primary[500]} />
      </View>
      <View style={s.cardHeaderText}>
        <Text style={[s.cardTitle, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[s.cardSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const KIND_OPTIONS: { value: SubmissionValues['kind']; label: string; icon: FeatherName }[] = [
  { value: 'link', label: 'Share link', icon: 'link' },
  { value: 'image', label: 'Upload image', icon: 'image' },
];

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
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: submissionDefaultValues(),
    mode: 'onTouched',
  });
  const kind = useWatch({ control, name: 'kind' });
  const image = useWatch({ control, name: 'image' });
  const caption = useWatch({ control, name: 'caption' }) ?? '';

  function changeKind(next: SubmissionValues['kind']) {
    if (next === kind) return;
    setValue('kind', next);
    clearErrors(['externalUrl', 'image']);
    clearErrors('root');
    setSubmitted(false);
  }

  async function pickImage() {
    clearErrors('image');
    clearErrors('root');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('image', { message: 'Allow photo access in Settings to upload an image.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      const asset = !result.canceled ? result.assets[0] : undefined;
      if (asset) {
        setValue(
          'image',
          { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName ?? undefined },
          { shouldValidate: true, shouldDirty: true },
        );
        setSubmitted(false);
      }
    } catch {
      setError('image', { message: "Couldn't open your photos. Please try again." });
    }
  }

  function removeImage() {
    setValue('image', null, { shouldDirty: true });
    clearErrors('image');
  }

  async function onSubmit(values: SubmissionValues) {
    setSubmitted(false);
    try {
      await submitDeliverable(
        values.kind === 'link' || !values.image
          ? {
              engagementId,
              pieceId,
              kind: 'link',
              externalUrl: values.externalUrl,
              caption: values.caption,
            }
          : { engagementId, pieceId, kind: 'image', image: values.image, caption: values.caption },
      );
      invalidateAfterSubmit(dispatch, engagementId);
      reset(submissionDefaultValues(values.kind));
      setSubmitted(true);
    } catch (err) {
      if (applySubmissionError(err, setError)) onRefetch();
    }
  }

  return (
    <View
      style={[s.card, { borderColor: colors.border, backgroundColor: colors.card }]}
      testID="piece-submit-form">
      <CardHeader
        icon="upload-cloud"
        title={isResubmit ? 'Submit a new revision' : 'Submit your work'}
        subtitle="Share a link to your content or upload an image."
      />

      <View
        style={[s.segmented, { backgroundColor: colors.surface }]}
        accessibilityRole="radiogroup">
        {KIND_OPTIONS.map(option => {
          const active = kind === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => changeKind(option.value)}
              disabled={isSubmitting}
              style={[s.segment, active && s.segmentActive]}
              testID={`piece-kind-${option.value}`}>
              <Feather
                name={option.icon}
                size={15}
                color={active ? palette.primary[500] : colors.text.secondary}
              />
              <Text
                style={[
                  s.segmentText,
                  { color: colors.text.secondary },
                  active && s.segmentTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'link' ? (
        <ControlledTextField
          control={control}
          name="externalUrl"
          label="Link to your content"
          placeholder="https://"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!isSubmitting}
          leftAdornment={<Feather name="link" size={16} color={colors.text.secondary} />}
          accessibilityLabel="Link to your content"
          testID="piece-url"
        />
      ) : image ? (
        <View style={{ gap: 6 }}>
          <View style={s.preview}>
            <Image source={{ uri: image.uri }} style={s.previewImage} contentFit="cover" />
            <View style={s.previewActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change image"
                onPress={pickImage}
                disabled={isSubmitting}
                style={s.previewAction}
                testID="piece-pick-image">
                <Feather name="refresh-cw" size={12} color={palette.white} />
                <Text style={s.previewActionText}>Change</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                onPress={removeImage}
                disabled={isSubmitting}
                style={s.previewAction}
                testID="piece-remove-image">
                <Feather name="x" size={12} color={palette.white} />
                <Text style={s.previewActionText}>Remove</Text>
              </Pressable>
            </View>
          </View>
          {errors.image?.message ? (
            <Text style={s.fieldError} accessibilityRole="alert">
              {errors.image.message}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose image"
            onPress={pickImage}
            disabled={isSubmitting}
            style={[
              s.dropzone,
              { borderColor: colors.border, backgroundColor: colors.surface },
              errors.image && s.dropzoneError,
            ]}
            testID="piece-pick-image">
            <View style={s.dropzoneIcon}>
              <Feather name="image" size={22} color={palette.primary[500]} />
            </View>
            <Text style={[s.dropzoneTitle, { color: colors.text.primary }]}>Choose an image</Text>
            <Text style={[s.dropzoneHint, { color: colors.text.secondary }]}>
              JPEG, PNG, GIF or WebP. Share videos as a link.
            </Text>
          </Pressable>
          {errors.image?.message ? (
            <Text style={s.fieldError} accessibilityRole="alert">
              {errors.image.message}
            </Text>
          ) : null}
        </View>
      )}

      <ControlledTextField
        control={control}
        name="caption"
        label="Caption (optional)"
        placeholder="Anything the business should know"
        multiline
        maxLength={CAPTION_MAX_LENGTH}
        editable={!isSubmitting}
        inputStyle={s.multiline}
        accessibilityLabel="Caption"
        testID="piece-caption"
      />
      <Text
        style={[
          s.counter,
          { color: colors.text.secondary },
          caption.length >= CAPTION_MAX_LENGTH && s.counterOver,
        ]}>
        {caption.length}/{CAPTION_MAX_LENGTH}
      </Text>

      {errors.root?.message ? (
        <FormBanner tone="error" message={errors.root.message} testID="piece-submit-message" />
      ) : submitted ? (
        <FormBanner tone="success" message="Submitted for review." testID="piece-submit-message" />
      ) : null}

      <Button
        title={isResubmit ? 'Resubmit' : 'Submit'}
        style={s.primaryButton}
        titleStyle={s.primaryTitle}
        onPress={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        disabled={isSubmitting}
        testID="piece-submit"
      />
    </View>
  );
}

function LivePostForm({ piece, engagementId }: { piece: DeliverablePiece; engagementId: string }) {
  const { colors } = useTheme();
  const approved = piece.submissions.find(submission => submission.status === 'approved');
  const [saved, setSaved] = useState(false);
  const [recordPosted] = useRecordPostedMutation();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LivePostValues>({
    resolver: zodResolver(livePostSchema),
    defaultValues: { livePostUrl: approved?.livePostUrl ?? '' },
    mode: 'onTouched',
  });

  async function onSave(values: LivePostValues) {
    setSaved(false);
    try {
      await recordPosted({
        engagementId,
        pieceId: piece.id,
        livePostUrl: values.livePostUrl.trim(),
      }).unwrap();
      setSaved(true);
    } catch (err) {
      applyLivePostError(err, setError);
    }
  }

  return (
    <View
      style={[s.card, { borderColor: colors.border, backgroundColor: colors.card }]}
      testID="piece-live-post">
      <CardHeader
        icon="globe"
        title="Live post link"
        subtitle="Where the approved content was published."
      />
      <ControlledTextField
        control={control}
        name="livePostUrl"
        label="Live post URL"
        placeholder="https://"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!isSubmitting}
        leftAdornment={<Feather name="link" size={16} color={colors.text.secondary} />}
        accessibilityLabel="Live post URL"
        testID="piece-live-post-url"
      />
      {errors.root?.message ? (
        <FormBanner tone="error" message={errors.root.message} testID="piece-live-post-message" />
      ) : saved ? (
        <FormBanner tone="success" message="Live post saved." testID="piece-live-post-message" />
      ) : null}
      <Button
        title="Save link"
        style={s.primaryButton}
        titleStyle={s.primaryTitle}
        onPress={handleSubmit(onSave)}
        isLoading={isSubmitting}
        disabled={isSubmitting}
        testID="piece-live-post-save"
      />
    </View>
  );
}

const SUBMISSION_STATUS: Record<
  DeliverableSubmission['status'],
  { label: string; dot: string; tag: { color: string; backgroundColor: string } }
> = {
  submitted: {
    label: 'Awaiting review',
    dot: palette.primary[400],
    tag: { color: palette.warning[700], backgroundColor: palette.warning[50] },
  },
  approved: {
    label: 'Approved',
    dot: palette.success[500],
    tag: { color: palette.success[700], backgroundColor: palette.success[50] },
  },
  changes_requested: {
    label: 'Changes requested',
    dot: palette.warning[500],
    tag: { color: palette.warning[700], backgroundColor: palette.warning[50] },
  },
  superseded: {
    label: 'Superseded',
    dot: palette.gray[200],
    tag: { color: palette.gray[500], backgroundColor: palette.gray[25] },
  },
  withdrawn: {
    label: 'Withdrawn',
    dot: palette.gray[200],
    tag: { color: palette.gray[500], backgroundColor: palette.gray[25] },
  },
};

function SubmissionItem({
  submission,
  isLast,
}: {
  submission: DeliverableSubmission;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const link = safeHttpUrl(submission.externalUrl);
  const status = SUBMISSION_STATUS[submission.status];

  return (
    <View style={s.timelineItem}>
      <View style={s.timelineRail}>
        <View style={[s.timelineDot, { borderColor: status.dot, backgroundColor: colors.card }]} />
        {!isLast ? <View style={[s.timelineLine, { backgroundColor: colors.border }]} /> : null}
      </View>
      <View
        style={[s.historyCard, { borderColor: colors.border, backgroundColor: colors.card }]}
        testID={`submission-${submission.revisionNo}`}>
        <View style={s.historyHeader}>
          <Text style={[s.historyTitle, { color: colors.text.primary }]}>
            Revision {submission.revisionNo}
          </Text>
          <Text style={[s.historyDate, { color: colors.text.secondary }]}>
            {formatOfferDate(submission.submittedAt)}
          </Text>
        </View>
        <View style={s.historyTags}>
          <Text style={[s.tag, status.tag]}>{status.label}</Text>
          {submission.isLate ? <Text style={[s.tag, s.lateTag]}>Late</Text> : null}
        </View>

        {submission.externalUrl ? (
          <View style={s.attachment}>
            <Feather name="link" size={14} color={colors.text.secondary} />
            {link ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(link)}
                style={{ flex: 1 }}
                testID={`submission-${submission.revisionNo}-link`}>
                <Text style={[s.attachmentText, s.linkText]} numberOfLines={2}>
                  {link}
                </Text>
              </Pressable>
            ) : (
              <Text style={[s.attachmentText, { color: colors.text.primary }]}>
                {submission.externalUrl}
              </Text>
            )}
          </View>
        ) : submission.mediaId ? (
          <View style={s.attachment}>
            <Feather name="image" size={14} color={colors.text.secondary} />
            <Text style={[s.attachmentText, { color: colors.text.secondary }]}>Uploaded image</Text>
          </View>
        ) : null}

        {submission.caption ? (
          <Text style={[s.hintText, { color: colors.text.primary }]}>{submission.caption}</Text>
        ) : null}

        {submission.reviewDecision ? (
          <View
            style={[
              s.reviewBox,
              submission.reviewDecision === 'approved' ? s.reviewApproved : s.reviewChanges,
            ]}>
            <Text style={[s.reviewTitle, { color: colors.text.primary }]}>
              {submission.reviewDecision === 'approved'
                ? 'The business approved this.'
                : 'The business requested changes.'}
            </Text>
            {submission.reviewReason ? (
              <Text style={[s.hintText, { color: colors.text.primary }]}>
                {submission.reviewReason}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
