import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle } from '@/styles';
import { resolveMediaUrl } from '@/utils/media';
import { campaignDetailsStyle } from './campaignDetails.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import FallbackImage from '@/components/elements/FallbackImage';
import Button from '@/components/elements/Button';
import StatTile from '@/components/elements/StatTile';
import BulletList from '@/components/elements/BulletList';
import InfoCard from '@/components/elements/InfoCard';
import { useGetFeedCampaignQuery } from './api/campaignFeedApi';
import { CampaignFeedDetail } from './types/campaignFeed';
import { CampaignDetailsSkeleton, CampaignsEmptyState } from './components';
import {
  formatCampaignDueDate,
  formatCampaignEngagementStatus,
  formatCampaignPrice,
} from './utils/mapCampaignFeedItem';
import {
  formatCampaignLocation,
  formatDeliverable,
  formatPreferredGender,
  getBriefSections,
  getCampaignDetailsAvatarUrl,
} from './utils/mapCampaignDetails';

const defaultCover = require('@/assets/images/home/hero-campaign.jpg');
const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const budgetIcon = require('@/assets/images/campaign-details/budget.png');
const durationIcon = require('@/assets/images/campaign-details/duration.png');
const followersIcon = require('@/assets/images/campaign-details/followers.png');
const calendarIcon = require('@/assets/images/campaign-details/calendar.png');

// The Campaign Details screen (Figma "Campaign Details_Sample 1", node
// 6001:37641), pushed from any campaign's tap - every feed card in the app
// (Home's "Active Campaigns" and "Campaigns" sections, /campaigns,
// /live-campaign) navigates here. Registered as a dynamic route in the
// app/(details)/ route group (app/(details)/campaign/[id].tsx), the same
// "no tab bar" reasoning as every other screen in that group. Loads the
// campaign from the creator's single-campaign endpoint (campaign API group
// CB2, GET /feed/campaigns/:id), rather than the mock data/campaigns.ts
// fixture this screen used before real backend wiring started. That mock
// also had a website link and "follower wanted" stat - the real endpoint
// has neither, so they're dropped rather than faked; the stat row shows
// budget, application deadline, and preferred gender instead.
export default function CampaignDetails() {
  const { colors, palette } = useTheme();
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

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={campaignDetailsStyle.headerRow}>
          <ScreenHeader title="Campaign details" onBack={() => router.back()} />
        </View>

        {isLoading ? (
          <CampaignDetailsSkeleton />
        ) : isError || !campaign ? (
          <CampaignsEmptyState
            variant="error"
            onRetry={refetch}
            style={campaignDetailsStyle.content}
          />
        ) : (
          <CampaignDetailsContent campaign={campaign} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CampaignDetailsContent({ campaign: item }: { campaign: CampaignFeedDetail }) {
  const { colors, palette } = useTheme();
  const coverUrl = resolveMediaUrl(item.coverUrl);
  const avatarUrl = getCampaignDetailsAvatarUrl(item);
  const location = formatCampaignLocation(item);
  const briefSections = getBriefSections(item.requirements);
  const engagementStatus = formatCampaignEngagementStatus(item.myEngagement);
  const businessName = item.business.businessName;

  return (
    <>
      <View style={campaignDetailsStyle.bannerWrap}>
        <FallbackImage
          source={coverUrl ? { uri: coverUrl } : null}
          fallbackSource={defaultCover}
          name={item.title}
          style={campaignDetailsStyle.banner}
        />
        <FallbackImage
          source={avatarUrl ? { uri: avatarUrl } : null}
          name={businessName}
          style={campaignDetailsStyle.avatar}
        />
      </View>

      <View style={campaignDetailsStyle.content}>
        <View style={campaignDetailsStyle.businessNameRow}>
          <Text style={[campaignDetailsStyle.businessName, { color: colors.text.primary }]}>
            {businessName}
          </Text>
          {item.business.verificationStatus === 'verified' && (
            <Image
              source={verifiedBadge}
              style={campaignDetailsStyle.verifiedIcon}
              contentFit="contain"
            />
          )}
        </View>

        <Text style={[campaignDetailsStyle.title, { color: colors.text.primary }]}>
          {item.title}
        </Text>
        {location && (
          <Text style={[campaignDetailsStyle.sectionBody, { color: palette.gray[400] }]}>
            {location}
          </Text>
        )}

        <View style={campaignDetailsStyle.statRow}>
          <StatTile
            icon={budgetIcon}
            label="Budget"
            value={formatCampaignPrice(item.budgetAmountMinor, item.currency)}
          />
          <StatTile
            icon={durationIcon}
            label="Apply by"
            value={formatCampaignDueDate(item.applicationDeadline)}
          />
          <StatTile
            icon={followersIcon}
            label="Gender"
            value={formatPreferredGender(item.preferredGender)}
          />
        </View>

        {item.description && (
          <>
            <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
              About campaign
            </Text>
            <Text style={[campaignDetailsStyle.sectionBody, { color: palette.gray[400] }]}>
              {item.description}
            </Text>
          </>
        )}

        {!!item.promoting.length && (
          <>
            <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
              Promoting
            </Text>
            <BulletList items={item.promoting} style={campaignDetailsStyle.sectionHeaderGap} />
          </>
        )}

        {briefSections.map(section => (
          <View key={section.id}>
            <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
              {section.label}
            </Text>
            <BulletList items={section.items} style={campaignDetailsStyle.sectionHeaderGap} />
          </View>
        ))}

        {!!item.deliverables.length && (
          <>
            <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
              What you need to create
            </Text>
            <View
              style={[campaignDetailsStyle.sectionHeaderGap, campaignDetailsStyle.deliverablesGap]}>
              {item.deliverables.map(deliverable => (
                <InfoCard
                  key={deliverable.id}
                  {...formatDeliverable(deliverable)}
                  backgroundColor={palette.gray[25]}
                />
              ))}
            </View>
          </>
        )}

        <View style={campaignDetailsStyle.footerActions}>
          {item.applicationDeadline && (
            <View style={campaignDetailsStyle.deadlineRow}>
              <Image
                source={calendarIcon}
                style={campaignDetailsStyle.calendarIcon}
                contentFit="contain"
              />
              <Text style={[campaignDetailsStyle.deadlineLabel, { color: colors.text.primary }]}>
                {`Application deadline: ${formatCampaignDueDate(item.applicationDeadline)}`}
              </Text>
            </View>
          )}

          {/* Already applied or invited: show where it stands instead of a
                second Apply (the backend would 409 a duplicate). */}
          <Button
            title={engagementStatus ?? 'Apply Now'}
            disabled={!!engagementStatus}
            style={[buttonStyle.primary, campaignDetailsStyle.applyButton]}
            titleStyle={buttonStyle.primaryTitle}
            onPress={() => router.push(`/campaign/${item.id}/apply`)}
            testID="campaign-details-apply"
          />
        </View>
      </View>
    </>
  );
}
