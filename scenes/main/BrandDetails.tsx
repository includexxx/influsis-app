import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, brandDetailsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import CampaignCard from '@/components/elements/CampaignCard';
import { brands } from '@/data/brands';
import { campaigns } from '@/data/campaigns';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const globeIcon = require('@/assets/images/brand-details/globe.png');

// The Brand Details screen (Figma "Campaign Details_Sample 2", node
// 6001:37719), pushed from any brand's tap - Home's "Brand" row and the
// full /brands grid (both a Pressable CircleAvatar) navigate here
// (scenes/main/Home.tsx, scenes/main/Brands.tsx). Registered as a dynamic
// route in the app/(details)/ route group (app/(details)/brand/[id].tsx),
// the same "no tab bar" reasoning as every other screen in that group.
// Looks the tapped brand up by id in data/brands.ts, the canonical brand
// list every brand-showing screen now shares - see
// docs/screen/brand-details/README.md.
export default function BrandDetails() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const brand = brands.find(item => item.id === id);

  if (!brand) {
    return <Redirect href="/home" />;
  }

  const ongoingCampaigns = campaigns.filter(campaign => brand.campaignIds?.includes(campaign.id));

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={brandDetailsStyle.headerRow}>
          <ScreenHeader title="Brand Details" onBack={() => router.back()} />
        </View>

        {brand.bannerImage && (
          <View style={brandDetailsStyle.bannerWrap}>
            <Image source={brand.bannerImage} style={brandDetailsStyle.banner} contentFit="cover" />
            {(brand.avatar ?? brand.source) && (
              <Image
                source={brand.avatar ?? brand.source}
                style={brandDetailsStyle.avatar}
                contentFit="cover"
              />
            )}
          </View>
        )}

        <View style={brandDetailsStyle.content}>
          <View style={brandDetailsStyle.nameRow}>
            <Text style={[brandDetailsStyle.name, { color: colors.text.primary }]}>
              {brand.name ?? brand.label}
            </Text>
            {brand.verified && (
              <Image source={verifiedBadge} style={brandDetailsStyle.verifiedIcon} contentFit="contain" />
            )}
          </View>

          {brand.website && (
            <View style={brandDetailsStyle.addressRow}>
              <Image source={globeIcon} style={brandDetailsStyle.globeIcon} contentFit="contain" />
              <Text style={[brandDetailsStyle.website, { color: palette.gray[400] }]}>
                {brand.website}
              </Text>
            </View>
          )}

          {brand.description && (
            <Text style={[brandDetailsStyle.description, { color: colors.text.primary }]}>
              {brand.description}
            </Text>
          )}

          {!!ongoingCampaigns.length && (
            <>
              <Text style={[brandDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Ongoing Campaign
              </Text>
              <View style={brandDetailsStyle.campaignListGap}>
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
