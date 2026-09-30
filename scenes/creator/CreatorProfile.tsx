import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { resolveMediaUrl } from '@/utils/media';
import { CONTENT_CATEGORY_OPTIONS, SUBCATEGORIES_BY_CATEGORY } from '@/data/contentCategories';
import { LANGUAGE_OPTIONS } from '@/data/onboardingOptions';
import { getDivisionLabel } from '@/data/locations';
import ProfileHero, { PROFILE_HERO_TOP } from '@/components/elements/ProfileHero';
import IconSectionHeader from '@/components/elements/IconSectionHeader';
import StatusBadge from '@/components/elements/StatusBadge';
import { myProfileStyle } from '@/scenes/profile/myProfile.style';
import {
  CredStrip,
  LinkChip,
  LocationCard,
  PortfolioGrid,
  Section,
  SocialPlatformRow,
  TagRow,
} from '@/scenes/profile/components/ProfileSections';
import { capitalize, formatMonthYear } from '@/scenes/profile/utils/profileDisplay';
import { creatorProfileStyle } from './creatorProfile.style';
import { useGetCreatorProfileQuery } from './api/creatorDirectoryApi';
import { CreatorAvatar, CreatorProfileSkeleton, CreatorsEmptyState } from './components';
import { CreatorProfilePublic } from './types/creatorDirectory';

// Every subcategory value across every category, flattened once for lookup —
// a stored value doesn't carry which category it came from.
const ALL_SUBCATEGORY_OPTIONS = Object.values(SUBCATEGORIES_BY_CATEGORY).flat();

// The Creator Profile screen, pushed from any creator's tap - Home's "Top
// Rated Creator" row and the full /top-creators list both navigate here
// (scenes/home/components/TopRatedCreatorsSection.tsx,
// scenes/creator/TopCreators.tsx). Registered as a dynamic route in the
// app/(details)/ route group (app/(details)/creator/[id].tsx), the same "no
// tab bar" reasoning as every other screen in that group.
//
// Laid out like the creator's own My Profile (scenes/profile/MyProfile.tsx)
// and built from the same blocks (scenes/profile/components/
// ProfileSections.tsx): dark ProfileHero with the cover photo, overlapping
// avatar, name + verified badge, @handle · location, bio, a credibility
// strip, then categories, subcategories, languages, social platforms,
// location, website and portfolio. Data comes from the public single-profile
// endpoint (RBAC API group §E4, GET /creator-profiles/:userId), which never
// includes contact/personal details or deliverables, so neither does this
// screen. Empty sections are hidden rather than shown blank.
export default function CreatorProfile() {
  const { colors } = useTheme();
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
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: PROFILE_HERO_TOP }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        style={[layoutStyle.screen, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <>
            <ProfileHero title="Profile" onBack={() => router.back()} />
            <CreatorProfileSkeleton />
          </>
        ) : isError || !creator ? (
          <>
            <ProfileHero title="Profile" onBack={() => router.back()} />
            <CreatorsEmptyState
              variant="error"
              onRetry={refetch}
              style={creatorProfileStyle.stateGap}
            />
          </>
        ) : (
          <CreatorProfileContent creator={creator} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CreatorProfileContent({ creator }: { creator: CreatorProfilePublic }) {
  const { colors, palette: themePalette } = useTheme();
  const coverUri = resolveMediaUrl(creator.coverUrl);
  const avatarUri = resolveMediaUrl(creator.avatarUrl);
  const isVerified = creator.verificationStatus === 'verified';

  const locationRows: { label: string; value: string }[] = [];
  if (creator.city) locationRows.push({ label: 'City', value: creator.city });
  if (creator.state)
    locationRows.push({ label: 'Division', value: getDivisionLabel(creator.state) });
  if (creator.country) locationRows.push({ label: 'Country', value: capitalize(creator.country) });

  const cityCountryLine = [creator.city, creator.country ? capitalize(creator.country) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <View style={myProfileStyle.heroWrap}>
        <ProfileHero
          title="Profile"
          onBack={() => router.back()}
          coverUri={coverUri ?? undefined}
        />
        <View style={myProfileStyle.avatarRing}>
          <CreatorAvatar
            source={avatarUri ? { uri: avatarUri } : null}
            displayName={creator.displayName}
            size={84}
          />
        </View>
      </View>

      <View style={myProfileStyle.content}>
        <View style={myProfileStyle.nameRow}>
          <Text style={[myProfileStyle.name, { color: colors.text.primary }]}>
            {creator.displayName}
          </Text>
          {isVerified ? <StatusBadge label="Verified" /> : null}
        </View>

        {creator.handle || cityCountryLine ? (
          <View style={myProfileStyle.metaLine}>
            {creator.handle ? (
              <Text style={[myProfileStyle.handleText, { color: themePalette.gray[300] }]}>
                @{creator.handle}
              </Text>
            ) : null}
            {creator.handle && cityCountryLine ? (
              <Text style={[myProfileStyle.metaDot, { color: themePalette.gray[300] }]}>·</Text>
            ) : null}
            {cityCountryLine ? (
              <Text style={[myProfileStyle.locationInline, { color: themePalette.gray[300] }]}>
                {cityCountryLine}
              </Text>
            ) : null}
          </View>
        ) : null}

        {creator.bio ? (
          <Text style={[myProfileStyle.bio, { color: themePalette.gray[300] }]}>{creator.bio}</Text>
        ) : null}

        {/* Rating isn't something the backend tracks yet - same honest
            placeholder as My Profile. Portfolio entries stand in for
            projects, and the account's age replaces My Profile's
            "Response time", which has no data behind it. */}
        <CredStrip
          columns={[
            { icon: 'star', value: 'New', label: 'Rating' },
            { icon: 'briefcase', value: String(creator.portfolio.length), label: 'Projects' },
            { icon: 'calendar', value: formatMonthYear(creator.createdAt), label: 'Member since' },
          ]}
        />

        {creator.categories.length ? (
          <Section icon="grid" label="Category">
            <TagRow
              values={creator.categories}
              options={CONTENT_CATEGORY_OPTIONS}
              colorKey="category"
            />
          </Section>
        ) : null}

        {creator.subcategories.length ? (
          <Section icon="layers" label="Subcategories">
            <TagRow
              values={creator.subcategories}
              options={ALL_SUBCATEGORY_OPTIONS}
              colorKey="subcategory"
            />
          </Section>
        ) : null}

        {creator.languages.length ? (
          <Section icon="globe" label="Languages">
            <TagRow values={creator.languages} options={LANGUAGE_OPTIONS} colorKey="language" />
          </Section>
        ) : null}

        {creator.platforms.length ? (
          <Section icon="at-sign" label="Social platforms">
            <SocialPlatformRow platforms={creator.platforms} />
          </Section>
        ) : null}

        <LocationCard rows={locationRows} />

        {creator.websiteUrl ? (
          <Section icon="link" label="Website">
            <View style={myProfileStyle.tagRowWrap}>
              <LinkChip
                label={creator.websiteUrl.replace(/^https?:\/\//i, '')}
                url={creator.websiteUrl}
                testID="creator-profile-website"
              />
            </View>
          </Section>
        ) : null}

        <View style={myProfileStyle.section}>
          <IconSectionHeader icon="image" label="Portfolio" />
          {creator.portfolio.length ? (
            <PortfolioGrid items={creator.portfolio} testIDPrefix="creator-profile" />
          ) : (
            <Text
              style={[
                myProfileStyle.sectionBody,
                creatorProfileStyle.emptyText,
                { color: themePalette.gray[300] },
              ]}>
              No portfolio work shared yet.
            </Text>
          )}
        </View>
      </View>
    </>
  );
}
