import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, creatorProfileStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import GigCard from '@/components/elements/GigCard';
import StarRating from '@/components/elements/StarRating';
import ReviewCard from '@/components/elements/ReviewCard';
import { creators } from '@/data/creators';
import { gigs } from '@/data/gigs';

const verifiedCheckIcon = require('@/assets/images/creators/verified-check.png');
const starHeaderIcon = require('@/assets/images/profile/star-header.png');

// The Creator Profile screen (Figma "Creator Profile Details - Business
// Side_sample 2", node 6001:37822), pushed from any creator's tap -
// Home's "Top Rated Creator" row (a Pressable CircleAvatar) and the full
// /top-creators list (CreatorCard) both navigate here
// (scenes/main/Home.tsx, scenes/main/TopCreators.tsx). Registered as a
// dynamic route in the app/(details)/ route group
// (app/(details)/creator/[id].tsx), the same "no tab bar" reasoning as
// every other screen in that group. Looks the tapped creator up by id in
// data/creators.ts, the canonical creator list every
// creator-showing screen now shares - see
// docs/screen/creator-profile/README.md.
export default function CreatorProfile() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = creators.find(item => item.id === id);

  if (!creator) {
    return <Redirect href="/home" />;
  }

  const activeGigs = gigs.filter(gig => creator.activeGigIds?.includes(gig.id));

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={creatorProfileStyle.headerRow}>
          <ScreenHeader title="Profile" onBack={() => router.back()} />
        </View>

        {creator.bannerImage && (
          <View style={creatorProfileStyle.bannerWrap}>
            <Image
              source={creator.bannerImage}
              style={creatorProfileStyle.banner}
              contentFit="cover"
            />
            {creator.avatar && (
              <Image
                source={creator.avatar}
                style={creatorProfileStyle.avatar}
                contentFit="cover"
              />
            )}
          </View>
        )}

        <View style={creatorProfileStyle.content}>
          <View style={creatorProfileStyle.nameRow}>
            <Text style={[creatorProfileStyle.name, { color: colors.text.primary }]}>
              {creator.name}
            </Text>
            {creator.verified && (
              <Image
                source={verifiedCheckIcon}
                style={creatorProfileStyle.verifiedIcon}
                contentFit="contain"
              />
            )}
          </View>
          {creator.bio && (
            <Text style={[creatorProfileStyle.bio, { color: palette.gray[300] }]}>
              {creator.bio}
            </Text>
          )}

          {!!activeGigs.length && (
            <View style={creatorProfileStyle.activeGigsSection}>
              <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Active Gigs
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={creatorProfileStyle.sectionHeaderGap}>
                <View style={[creatorProfileStyle.row, creatorProfileStyle.gigsRowGap]}>
                  {activeGigs.map(gig => (
                    <GigCard
                      key={gig.id}
                      {...gig}
                      style={creatorProfileStyle.gigCard}
                      onPress={() => router.push(`/gig/${gig.id}`)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {!!creator.categories?.length && (
            <View style={creatorProfileStyle.tagsSection}>
              <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Tags
              </Text>
              <View
                style={[creatorProfileStyle.tagRow, creatorProfileStyle.sectionHeaderGap]}>
                {creator.categories.map(category => (
                  <View
                    key={category}
                    style={[
                      creatorProfileStyle.tagPill,
                      { backgroundColor: palette.primary[50] },
                    ]}>
                    <Text style={[creatorProfileStyle.tagLabel, { color: palette.gray[500] }]}>
                      {category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {creator.customerRating != null && (
            <View style={creatorProfileStyle.reviewsHeaderSection}>
              <View style={creatorProfileStyle.reviewsSummaryRow}>
                <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                  Customer Review
                </Text>
                <StarRating
                  rating={creator.customerRating}
                  maxStars={1}
                  icon={starHeaderIcon}
                  starSize={28}
                  label={String(creator.customerRating)}
                />
              </View>

              {!!creator.reviews?.length && (
                <View
                  style={[
                    creatorProfileStyle.reviewsGap,
                    creatorProfileStyle.sectionHeaderGap,
                  ]}>
                  {creator.reviews.map(review => (
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
