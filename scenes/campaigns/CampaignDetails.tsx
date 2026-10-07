import { View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { spacing } from '@/theme';
import { resolveMediaUrl } from '@/utils/media';
import ScreenHeader from '@/components/elements/ScreenHeader';
import { campaignDetailsStyle as s } from './campaignDetails.style';
import { useGetFeedCampaignQuery } from './api/campaignFeedApi';
import { CampaignFeedDetail } from './types/campaignFeed';
import { CampaignDetailsSkeleton, CampaignsEmptyState } from './components';
import CampaignCover, { GlassBackButton } from './components/details/CampaignCover';
import { BudgetCard, BusinessRow, FactGrid, FactItem } from './components/details/CampaignSummary';
import {
  AudienceGroups,
  BriefSection,
  CheckList,
  DeliverableList,
  DetailSection,
  ExpandableText,
} from './components/details/CampaignSections';
import ApplyBar from './components/details/ApplyBar';
import { licensingPercent } from './utils/agreement';
import {
  formatCampaignDueDate,
  formatCampaignEngagementStatus,
  formatCampaignPrice,
} from './utils/mapCampaignFeedItem';
import {
  formatCampaignLocation,
  formatCategoryLabel,
  formatPostedDate,
  formatPreferredGender,
  getAudienceGroups,
  getBriefSections,
  getCampaignDetailsAvatarUrl,
  getDeadlineCountdown,
} from './utils/mapCampaignDetails';

// At most this many category pills on the cover, so they stay on one line.
const MAX_COVER_TAGS = 3;

// The Campaign Details screen (Figma "Campaign Details_Sample 1", node
// 6001:37641), pushed from any campaign card in the app. Registered as a
// dynamic route in app/(details) (app/(details)/campaign/[id].tsx) - no tab
// bar. Loads the campaign from CB2, GET /feed/campaigns/:id; a 404 (not live)
// sends the creator home.
//
// Layout: a full-bleed cover under the status bar (frosted back button,
// category pills, title, location), then a rounded content sheet overlapping
// it - the business, a budget card, key-date tiles, and one card per
// content block (about, deliverables, promoting, the business's brief,
// audience) - with the budget and Apply pinned in a bottom bar. See
// docs/screen/campaign-details.
export default function CampaignDetails() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: campaign,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetFeedCampaignQuery({ id: id ?? '' }, { skip: !id });

  if (!id || error?.code === 'NOT_FOUND') {
    return <Redirect href="/home" />;
  }

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
          <CampaignDetailsSkeleton />
        </ScrollView>
        <GlassBackButton onPress={() => router.back()} top={insets.top + 8} />
      </View>
    );
  }

  if (isError || !campaign) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={s.headerRow}>
          <ScreenHeader title="Campaign details" onBack={() => router.back()} />
        </View>
        <CampaignsEmptyState variant="error" onRetry={refetch} style={s.errorContent} />
      </SafeAreaView>
    );
  }

  return <CampaignDetailsContent campaign={campaign} />;
}

function CampaignDetailsContent({ campaign: item }: { campaign: CampaignFeedDetail }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const budget = formatCampaignPrice(item.budgetAmountMinor, item.currency);
  const applyBy = formatCampaignDueDate(item.applicationDeadline);
  const countdown = getDeadlineCountdown(item.applicationDeadline);
  const engagementStatus = formatCampaignEngagementStatus(item.myEngagement);
  const briefSections = getBriefSections(item.requirements);
  const audienceGroups = getAudienceGroups(item);

  // Already applied or invited: show where it stands instead of a second
  // Apply (the backend would 409 a duplicate). Past the deadline the
  // backend 409s too, so say so up front.
  const isClosed = countdown?.state === 'closed';
  const canApply = !engagementStatus && !isClosed;
  const applyLabel = engagementStatus ?? (isClosed ? 'Applications closed' : 'Apply Now');

  const facts: FactItem[] = [
    {
      icon: 'calendar',
      tone: 'primary',
      label: 'Apply by',
      value: applyBy,
      badge: countdown && !engagementStatus ? countdown : undefined,
    },
    {
      icon: 'upload-cloud',
      tone: 'navy',
      label: 'Content due',
      value: formatCampaignDueDate(item.contentDeadline),
    },
    ...(item.campaignEndDate
      ? [
          {
            icon: 'flag',
            tone: 'warning',
            label: 'Campaign ends',
            value: formatCampaignDueDate(item.campaignEndDate),
          } satisfies FactItem,
        ]
      : []),
    {
      icon: 'users',
      tone: 'success',
      label: 'Preferred gender',
      value: formatPreferredGender(item.preferredGender),
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
        showsVerticalScrollIndicator={false}>
        <View style={s.overscrollCap} />

        <CampaignCover
          title={item.title}
          coverUrl={resolveMediaUrl(item.coverUrl)}
          location={formatCampaignLocation(item)}
          tags={item.categories.slice(0, MAX_COVER_TAGS).map(formatCategoryLabel)}
          engagementStatus={engagementStatus}
          topInset={insets.top}
          onBack={() => router.back()}
        />

        <View style={[s.sheet, { backgroundColor: colors.background }]}>
          <BusinessRow
            name={item.business.businessName}
            avatarUrl={getCampaignDetailsAvatarUrl(item)}
            verified={item.business.verificationStatus === 'verified'}
            postedDate={formatPostedDate(item.publishedAt)}
            onPress={() => router.push(`/business/${item.businessId}`)}
          />

          <BudgetCard budget={budget} licensingPercent={licensingPercent(item.licensingTier)} />

          <FactGrid facts={facts} />

          {item.description ? (
            <DetailSection icon="info" tone="primary" title="About this campaign">
              <ExpandableText text={item.description} />
            </DetailSection>
          ) : null}

          {item.deliverables.length ? (
            <DetailSection
              icon="layers"
              tone="primary"
              title="What you'll create"
              count={item.deliverables.reduce((total, d) => total + d.count, 0)}
              testID="campaign-details-deliverables">
              <DeliverableList deliverables={item.deliverables} />
            </DetailSection>
          ) : null}

          {item.promoting.length ? (
            <DetailSection icon="zap" tone="warning" title="Promoting">
              <CheckList items={item.promoting} />
            </DetailSection>
          ) : null}

          {briefSections.map(section => (
            <BriefSection key={section.id} section={section} />
          ))}

          {audienceGroups.length ? (
            <DetailSection icon="target" tone="navy" title="Audience">
              <AudienceGroups groups={audienceGroups} />
            </DetailSection>
          ) : null}
        </View>
      </ScrollView>

      <ApplyBar
        budget={budget}
        caption={item.applicationDeadline && !isClosed ? `Apply by ${applyBy}` : 'Campaign budget'}
        label={applyLabel}
        disabled={!canApply}
        disabledIcon={isClosed && !engagementStatus ? 'lock' : 'check-circle'}
        bottomInset={insets.bottom}
        onPress={() => router.push(`/campaign/${item.id}/apply`)}
      />
    </View>
  );
}
