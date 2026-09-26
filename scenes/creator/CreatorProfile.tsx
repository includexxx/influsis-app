import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { creatorProfileStyle } from './creatorProfile.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import FallbackImage from '@/components/elements/FallbackImage';
import { useGetCreatorProfileQuery } from './api/creatorDirectoryApi';
import { CreatorAvatar, CreatorProfileSkeleton, CreatorsEmptyState } from './components';

const verifiedCheckIcon = require('@/assets/images/creators/verified-check.png');

// The Creator Profile screen (Figma "Creator Profile Details - Business
// Side_sample 2", node 6001:37822), pushed from any creator's tap - Home's
// "Top Rated Creator" row and the full /top-creators list both navigate
// here (scenes/home/components/TopRatedCreatorsSection.tsx,
// scenes/creator/TopCreators.tsx). Registered as a dynamic route in the
// app/(details)/ route group (app/(details)/creator/[id].tsx), the same "no
// tab bar" reasoning as every other screen in that group. Looks the tapped
// creator up by userId via the public single-profile endpoint (RBAC API
// group §E4, GET /creator-profiles/:userId), rather than the mock
// data/creators.ts fixture this screen used before real backend wiring
// started. That mock also showed "Active Gigs" and "Customer Review"
// sections - the real endpoint doesn't project a creator's gigs or reviews,
// so both are dropped rather than faked.
export default function CreatorProfile() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: creator,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCreatorProfileQuery({ userId: id ?? '' }, { skip: !id });

  if (!id || error?.code === 'NOT_FOUND') {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={creatorProfileStyle.headerRow}>
          <ScreenHeader title="Profile" onBack={() => router.back()} />
        </View>

        {isLoading ? (
          <CreatorProfileSkeleton />
        ) : isError || !creator ? (
          <CreatorsEmptyState
            variant="error"
            onRetry={refetch}
            style={creatorProfileStyle.content}
          />
        ) : (
          <>
            <View style={creatorProfileStyle.bannerWrap}>
              <FallbackImage
                source={creator.coverUrl ? { uri: creator.coverUrl } : null}
                name={creator.displayName}
                style={creatorProfileStyle.banner}
              />
              <CreatorAvatar
                source={creator.avatarUrl ? { uri: creator.avatarUrl } : null}
                displayName={creator.displayName}
                size={78}
                style={creatorProfileStyle.avatar}
              />
            </View>

            <View style={creatorProfileStyle.content}>
              <View style={creatorProfileStyle.nameRow}>
                <Text style={[creatorProfileStyle.name, { color: colors.text.primary }]}>
                  {creator.displayName}
                </Text>
                {creator.verificationStatus === 'verified' && (
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

              {!!creator.categories.length && (
                <View style={creatorProfileStyle.tagsSection}>
                  <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                    Tags
                  </Text>
                  <View style={[creatorProfileStyle.tagRow, creatorProfileStyle.sectionHeaderGap]}>
                    {creator.categories.map((category, index) => (
                      <View
                        key={`${category}-${index}`}
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
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
