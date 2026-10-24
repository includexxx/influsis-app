import FallbackImage from '@/components/elements/FallbackImage';
import Image from '@/components/elements/Image';
import ScreenHeader from '@/components/elements/ScreenHeader';
import { useTheme } from '@/hooks';
import ReviewsList from '@/scenes/profile/components/ReviewsList';
import { layoutStyle } from '@/styles';
import { resolveMediaUrl } from '@/utils/media';
import { Feather } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useGetBusinessProfileQuery,
  useGetBusinessReviewsPageQuery,
} from './api/businessDirectoryApi';
import { businessDetailsStyle } from './businessDetails.style';
import {
  BusinessAvatar,
  BusinessCampaignsSection,
  BusinessDetailsSkeleton,
  BusinessesEmptyState,
} from './components';
import { businessRatingSummary } from './utils/businessReputation';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const globeIcon = require('@/assets/images/business-details/globe.png');

// The Business Details screen (Figma "Campaign Details_Sample 2", node
// 6001:37719), pushed from any business's tap - Home's "Business" row and
// the full /businesses grid navigate here (scenes/home/components/
// BusinessLogosSection.tsx, scenes/business/Businesses.tsx). Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/business/[id].tsx), the same "no tab bar" reasoning as
// every other screen in that group. Looks the tapped business up by userId
// via the public single-profile endpoint (RBAC API group §E2, GET
// /business-profiles/:userId), rather than the mock data/businesses.ts
// fixture this screen used before real backend wiring started. The profile
// endpoint doesn't project the business's campaigns, so the "Ongoing
// Campaign" section below it loads them separately from the creator feed
// narrowed to this business (GET /feed/campaigns?businessId=) - see
// components/BusinessCampaignsSection.tsx. Backend 23b adds the rating
// summary under the description (E2 `reputation`) and "Reviews from
// creators" (CK4) after the campaigns, so a creator can judge a business
// before applying.
export default function BusinessDetails() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: business,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBusinessProfileQuery({ userId: id ?? '' }, { skip: !id });

  if (!id || error?.code === 'NOT_FOUND') {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={businessDetailsStyle.headerRow}>
          <ScreenHeader title="Business Details" onBack={() => router.back()} />
        </View>

        {isLoading ? (
          <BusinessDetailsSkeleton />
        ) : isError || !business ? (
          <BusinessesEmptyState
            variant="error"
            onRetry={refetch}
            style={businessDetailsStyle.content}
          />
        ) : (
          <>
            <View style={businessDetailsStyle.bannerWrap}>
              <FallbackImage
                source={business.coverUrl ? { uri: resolveMediaUrl(business.coverUrl) } : null}
                name={business.businessName}
                style={businessDetailsStyle.banner}
              />
              <BusinessAvatar
                source={business.avatarUrl ? { uri: resolveMediaUrl(business.avatarUrl) } : null}
                businessName={business.businessName}
                size={62}
                style={businessDetailsStyle.avatar}
              />
            </View>

            <View style={businessDetailsStyle.content}>
              <View style={businessDetailsStyle.nameRow}>
                <Text style={[businessDetailsStyle.name, { color: colors.text.primary }]}>
                  {business.businessName}
                </Text>
                {business.verificationStatus === 'verified' && (
                  <Image
                    source={verifiedBadge}
                    style={businessDetailsStyle.verifiedIcon}
                    contentFit="contain"
                  />
                )}
              </View>

              {business.websiteUrl && (
                <View style={businessDetailsStyle.addressRow}>
                  <Image
                    source={globeIcon}
                    style={businessDetailsStyle.globeIcon}
                    contentFit="contain"
                  />
                  <Text style={[businessDetailsStyle.website, { color: palette.gray[400] }]}>
                    {business.websiteUrl}
                  </Text>
                </View>
              )}

              {business.description && (
                <Text style={[businessDetailsStyle.description, { color: colors.text.primary }]}>
                  {business.description}
                </Text>
              )}

              {business.reputation ? (
                <View style={businessDetailsStyle.ratingRow} testID="business-rating-summary">
                  <Feather name="star" size={16} color={palette.warning[500]} />
                  <Text style={[businessDetailsStyle.ratingText, { color: colors.text.primary }]}>
                    {businessRatingSummary(business.reputation)}
                  </Text>
                </View>
              ) : null}

              <BusinessCampaignsSection businessId={id} />

              <Text style={[businessDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Reviews from creators
              </Text>
              <ReviewsList
                useQuery={useGetBusinessReviewsPageQuery}
                args={{ userId: id }}
                reviewer="creator"
                emptyText="No reviews from creators yet."
                testIDPrefix="business"
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
