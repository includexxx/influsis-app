import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, businessDetailsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import CampaignCard from '@/components/elements/CampaignCard';
import { businesses } from '@/data/businesses';
import { campaigns } from '@/data/campaigns';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const globeIcon = require('@/assets/images/business-details/globe.png');

// The Business Details screen (Figma "Campaign Details_Sample 2", node
// 6001:37719), pushed from any business's tap - Home's "Business" row and the
// full /businesses grid (both a Pressable CircleAvatar) navigate here
// (scenes/main/Home.tsx, scenes/main/Businesses.tsx). Registered as a dynamic
// route in the app/(details)/ route group (app/(details)/business/[id].tsx),
// the same "no tab bar" reasoning as every other screen in that group.
// Looks the tapped business up by id in data/businesses.ts, the canonical business
// list every business-showing screen now shares - see
// docs/screen/business-details/README.md.
export default function BusinessDetails() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = businesses.find(item => item.id === id);

  if (!business) {
    return <Redirect href="/home" />;
  }

  const ongoingCampaigns = campaigns.filter(campaign => business.campaignIds?.includes(campaign.id));

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={businessDetailsStyle.headerRow}>
          <ScreenHeader title="Business Details" onBack={() => router.back()} />
        </View>

        {business.bannerImage && (
          <View style={businessDetailsStyle.bannerWrap}>
            <Image source={business.bannerImage} style={businessDetailsStyle.banner} contentFit="cover" />
            {(business.avatar ?? business.source) && (
              <Image
                source={business.avatar ?? business.source}
                style={businessDetailsStyle.avatar}
                contentFit="cover"
              />
            )}
          </View>
        )}

        <View style={businessDetailsStyle.content}>
          <View style={businessDetailsStyle.nameRow}>
            <Text style={[businessDetailsStyle.name, { color: colors.text.primary }]}>
              {business.name ?? business.label}
            </Text>
            {business.verified && (
              <Image
                source={verifiedBadge}
                style={businessDetailsStyle.verifiedIcon}
                contentFit="contain"
              />
            )}
          </View>

          {business.website && (
            <View style={businessDetailsStyle.addressRow}>
              <Image source={globeIcon} style={businessDetailsStyle.globeIcon} contentFit="contain" />
              <Text style={[businessDetailsStyle.website, { color: palette.gray[400] }]}>
                {business.website}
              </Text>
            </View>
          )}

          {business.description && (
            <Text style={[businessDetailsStyle.description, { color: colors.text.primary }]}>
              {business.description}
            </Text>
          )}

          {!!ongoingCampaigns.length && (
            <>
              <Text style={[businessDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Ongoing Campaign
              </Text>
              <View style={businessDetailsStyle.campaignListGap}>
                {ongoingCampaigns.map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    variant="list"
                    {...campaign}
                    onPress={() => router.push(`/campaign/${campaign.id}`)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
