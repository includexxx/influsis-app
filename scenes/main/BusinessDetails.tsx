import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, businessDetailsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import { useGetBusinessProfileQuery } from '@/scenes/business/api/businessDirectoryApi';
import { getBusinessInitial } from '@/scenes/business/utils/businessAvatar';
import {
  BusinessAvatar,
  BusinessDetailsSkeleton,
  BusinessesEmptyState,
} from '@/scenes/business/components';

const styles = StyleSheet.create({
  bannerFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerFallbackText: {
    fontSize: 48,
    fontWeight: '600',
  },
});

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
const globeIcon = require('@/assets/images/business-details/globe.png');

// The Business Details screen (Figma "Campaign Details_Sample 2", node
// 6001:37719), pushed from any business's tap - Home's "Business" row and
// the full /businesses grid navigate here (scenes/home/components/
// BusinessLogosSection.tsx, scenes/main/Businesses.tsx). Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/business/[id].tsx), the same "no tab bar" reasoning as
// every other screen in that group. Looks the tapped business up by userId
// via the public single-profile endpoint (RBAC API group §E2, GET
// /business-profiles/:userId), rather than the mock data/businesses.ts
// fixture this screen used before real backend wiring started. That mock
// also showed an "Ongoing Campaign" section for the business - the real
// endpoint doesn't project a business's campaigns, so that section is
// dropped rather than faked.
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
              {business.coverUrl ? (
                <Image
                  source={{ uri: business.coverUrl }}
                  style={businessDetailsStyle.banner}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    businessDetailsStyle.banner,
                    styles.bannerFallback,
                    { backgroundColor: palette.gray[50] },
                  ]}>
                  <Text style={[styles.bannerFallbackText, { color: palette.gray[400] }]}>
                    {getBusinessInitial(business.businessName)}
                  </Text>
                </View>
              )}
              <BusinessAvatar
                source={business.avatarUrl ? { uri: business.avatarUrl } : null}
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
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
