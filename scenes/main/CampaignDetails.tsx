import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, useDetailLookup } from '@/hooks';
import { layoutStyle, buttonStyle, campaignDetailsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import StatTile from '@/components/elements/StatTile';
import BulletList from '@/components/elements/BulletList';
import InfoCard from '@/components/elements/InfoCard';
import VerifiedBadge from '@/components/elements/VerifiedBadge';
import ProfileBanner from '@/components/elements/ProfileBanner';
import { allCampaigns } from '@/data/campaigns';

const budgetIcon = require('@/assets/images/campaign-details/budget.png');
const durationIcon = require('@/assets/images/campaign-details/duration.png');
const followersIcon = require('@/assets/images/campaign-details/followers.png');
const websiteIcon = require('@/assets/images/campaign-details/website.png');
const calendarIcon = require('@/assets/images/campaign-details/calendar.png');

// The Campaign Details screen (Figma "Campaign Details_Sample 1", node
// 6001:37641), pushed from any campaign's tap - every CampaignCard in the
// app (Home's "Active Campaigns" hero row and "Campaigns" list section,
// the full /campaigns list, /live-campaign, /search results, and Brand
// Details' "Ongoing Campaign" section) navigates here. Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/campaign/[id].tsx), the same "no tab bar" reasoning as
// every other screen in that group. Looks the tapped campaign up by id in
// data/campaigns.ts's allCampaigns, the canonical campaign list every
// campaign-showing screen now shares - see
// docs/screen/campaign-details/README.md.
export default function CampaignDetails() {
  const { colors, palette } = useTheme();
  const { item: campaign, notFoundElement } = useDetailLookup(allCampaigns);

  if (!campaign) {
    return notFoundElement;
  }

  const avatarSource = campaign.avatar ?? campaign.brandAvatar;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={campaignDetailsStyle.headerRow}>
          <ScreenHeader title="Campaign details" onBack={() => router.back()} />
        </View>

        {campaign.bannerImage && (
          <ProfileBanner bannerImage={campaign.bannerImage} avatarImage={avatarSource} />
        )}

        <View style={campaignDetailsStyle.content}>
          {campaign.brandName && (
            <View style={campaignDetailsStyle.brandNameRow}>
              <Text style={[campaignDetailsStyle.brandName, { color: colors.text.primary }]}>
                {campaign.brandName}
              </Text>
              {campaign.verified && <VerifiedBadge />}
            </View>
          )}

          <Text style={[campaignDetailsStyle.title, { color: colors.text.primary }]}>
            {campaign.title}
          </Text>

          {(campaign.budget || campaign.duration || campaign.followerWanted) && (
            <View style={campaignDetailsStyle.statRow}>
              {campaign.budget && (
                <StatTile icon={budgetIcon} label="Budget" value={campaign.budget} />
              )}
              {campaign.duration && (
                <StatTile icon={durationIcon} label="Duration" value={campaign.duration} />
              )}
              {campaign.followerWanted && (
                <StatTile
                  icon={followersIcon}
                  label="Follower wanted"
                  value={campaign.followerWanted}
                />
              )}
            </View>
          )}

          {campaign.about && (
            <>
              <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                About campaign
              </Text>
              <Text style={[campaignDetailsStyle.sectionBody, { color: palette.gray[400] }]}>
                {campaign.about}
              </Text>
            </>
          )}

          {!!campaign.requirements?.length && (
            <>
              <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Requirements
              </Text>
              <BulletList
                items={campaign.requirements}
                style={campaignDetailsStyle.sectionHeaderGap}
              />
            </>
          )}

          {!!campaign.deliverables?.length && (
            <>
              <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                What you need to create
              </Text>
              <View
                style={[
                  campaignDetailsStyle.sectionHeaderGap,
                  campaignDetailsStyle.deliverablesGap,
                ]}>
                {campaign.deliverables.map(deliverable => (
                  <InfoCard
                    key={deliverable.title}
                    title={deliverable.title}
                    description={deliverable.description}
                    backgroundColor={palette.gray[25]}
                  />
                ))}
              </View>
            </>
          )}

          {campaign.brandDescription && (
            <>
              <Text style={[campaignDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                About the brand
              </Text>
              <Text style={[campaignDetailsStyle.sectionBody, { color: palette.gray[400] }]}>
                {campaign.brandDescription}
              </Text>
            </>
          )}

          <View style={campaignDetailsStyle.footerActions}>
            {campaign.website && (
              <View style={campaignDetailsStyle.visitWebsiteRow}>
                <Image
                  source={websiteIcon}
                  style={campaignDetailsStyle.websiteIcon}
                  contentFit="contain"
                />
                <Text
                  style={[campaignDetailsStyle.visitWebsiteLabel, { color: palette.primary[400] }]}>
                  Visit website
                </Text>
              </View>
            )}

            {campaign.applicationDeadline && (
              <View style={campaignDetailsStyle.deadlineRow}>
                <Image
                  source={calendarIcon}
                  style={campaignDetailsStyle.calendarIcon}
                  contentFit="contain"
                />
                <Text style={[campaignDetailsStyle.deadlineLabel, { color: colors.text.primary }]}>
                  {`Application deadline: ${campaign.applicationDeadline}`}
                </Text>
              </View>
            )}

            <Button
              title="Apply Now"
              style={[buttonStyle.primary, campaignDetailsStyle.applyButton]}
              titleStyle={buttonStyle.primaryTitle}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
