import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, influencerProfileStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import GigCard from '@/components/elements/GigCard';
import StarRating from '@/components/elements/StarRating';
import ReviewCard from '@/components/elements/ReviewCard';
import { influencers } from '@/data/influencers';
import { gigs } from '@/data/gigs';

const verifiedCheckIcon = require('@/assets/images/influencers/verified-check.png');
const starHeaderIcon = require('@/assets/images/profile/star-header.png');

// The Influencer Profile screen (Figma "Influencer Profile Details - Brand
// Side_sample 2", node 6001:37822), pushed from any influencer's tap -
// Home's "Top Rated Influencer" row (a Pressable CircleAvatar) and the full
// /top-influencers list (InfluencerCard) both navigate here
// (scenes/main/Home.tsx, scenes/main/TopInfluencers.tsx). Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/influencer/[id].tsx), the same "no tab bar" reasoning as
// every other screen in that group. Looks the tapped influencer up by id in
// data/influencers.ts, the canonical influencer list every
// influencer-showing screen now shares - see
// docs/screen/influencer-profile/README.md.
export default function InfluencerProfile() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const influencer = influencers.find(item => item.id === id);

  if (!influencer) {
    return <Redirect href="/home" />;
  }

  const activeGigs = gigs.filter(gig => influencer.activeGigIds?.includes(gig.id));

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={influencerProfileStyle.headerRow}>
          <ScreenHeader title="Profile" onBack={() => router.back()} />
        </View>

        {influencer.bannerImage && (
          <View style={influencerProfileStyle.bannerWrap}>
            <Image
              source={influencer.bannerImage}
              style={influencerProfileStyle.banner}
              contentFit="cover"
            />
            {influencer.avatar && (
              <Image
                source={influencer.avatar}
                style={influencerProfileStyle.avatar}
                contentFit="cover"
              />
            )}
          </View>
        )}

        <View style={influencerProfileStyle.content}>
          <View style={influencerProfileStyle.nameRow}>
            <Text style={[influencerProfileStyle.name, { color: colors.text.primary }]}>
              {influencer.name}
            </Text>
            {influencer.verified && (
              <Image
                source={verifiedCheckIcon}
                style={influencerProfileStyle.verifiedIcon}
                contentFit="contain"
              />
            )}
          </View>
          {influencer.bio && (
            <Text style={[influencerProfileStyle.bio, { color: palette.gray[300] }]}>
              {influencer.bio}
            </Text>
          )}

          {!!activeGigs.length && (
            <View style={influencerProfileStyle.activeGigsSection}>
              <Text style={[influencerProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Active Gigs
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={influencerProfileStyle.sectionHeaderGap}>
                <View style={[influencerProfileStyle.row, influencerProfileStyle.gigsRowGap]}>
                  {activeGigs.map(gig => (
                    <GigCard
                      key={gig.id}
                      {...gig}
                      style={influencerProfileStyle.gigCard}
                      onPress={() => router.push(`/gig/${gig.id}`)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {!!influencer.categories?.length && (
            <View style={influencerProfileStyle.tagsSection}>
              <Text style={[influencerProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Tags
              </Text>
              <View
                style={[influencerProfileStyle.tagRow, influencerProfileStyle.sectionHeaderGap]}>
                {influencer.categories.map(category => (
                  <View
                    key={category}
                    style={[
                      influencerProfileStyle.tagPill,
                      { backgroundColor: palette.primary[50] },
                    ]}>
                    <Text style={[influencerProfileStyle.tagLabel, { color: palette.gray[500] }]}>
                      {category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {influencer.customerRating != null && (
            <View style={influencerProfileStyle.reviewsHeaderSection}>
              <View style={influencerProfileStyle.reviewsSummaryRow}>
                <Text style={[influencerProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                  Customer Review
                </Text>
                <StarRating
                  rating={influencer.customerRating}
                  maxStars={1}
                  icon={starHeaderIcon}
                  starSize={28}
                  label={String(influencer.customerRating)}
                />
              </View>

              {!!influencer.reviews?.length && (
                <View
                  style={[
                    influencerProfileStyle.reviewsGap,
                    influencerProfileStyle.sectionHeaderGap,
                  ]}>
                  {influencer.reviews.map(review => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
