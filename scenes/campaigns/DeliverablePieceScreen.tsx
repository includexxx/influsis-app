import { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import { pieceStyle as s } from './deliverablePiece.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import { useGetEngagementDeliverablesQuery } from './api/campaignFeedApi';
import { DeliverablePiece, DeliverableSubmission } from './types/deliverables';
import { formatOfferDate } from './utils/negotiation';
import {
  canSubmitPiece,
  isOverdue,
  latestChangeRequest,
  PIECE_STATUS_BADGE,
  pieceTitle,
  safeHttpUrl,
} from './utils/deliverables';
import { FeatherName, platformIcon } from './utils/platformIcon';

const HERO_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

// One deliverable piece, read-only (campaign API group CI1 row): its status,
// due date, the business's latest change request, and the submission history
// with the business's decision on each. Since backend 18r every piece is
// delivered together from the Submit delivery screen, so nothing is submitted
// here (CI2/CI4 are gone). Creator-provided text and the business's reasons
// render as plain Text; a link opens only when it is http(s). Nothing here
// says "paid" - there is no escrow yet (backend item 19).
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

  return <PieceContent piece={piece} header={header} />;
}

function PieceContent({ piece, header }: { piece: DeliverablePiece; header: ReactNode }) {
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

          {piece.status === 'cancelled' ? (
            <Notice tone="neutral" icon="slash" title="Cancelled">
              This deliverable was cancelled and takes no more submissions.
            </Notice>
          ) : null}

          {piece.status === 'approved' ? (
            <Notice tone="success" icon="check-circle" title="Approved" testID="piece-approved">
              {piece.approvedAt
                ? `The business approved this on ${formatOfferDate(piece.approvedAt)}.`
                : 'The business approved this.'}
            </Notice>
          ) : null}

          {submittable ? (
            <Notice
              tone="neutral"
              icon="info"
              title="Delivered together"
              testID="piece-submit-hint">
              Submit or update this piece from the Deliverables screen.
            </Notice>
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
          {submission.livePostUrl ? (
            <Text style={[s.tag, s.liveTag]} testID={`submission-${submission.revisionNo}-live`}>
              Live post
            </Text>
          ) : null}
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
