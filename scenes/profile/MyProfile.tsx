import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { creatorProfileStyle } from '@/scenes/creator/creatorProfile.style';
import { myProfileStyle } from './myProfile.style';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import { isCreatorProfileResponse } from '@/types';
import { profileSubmitErrorMessage } from '@/utils/profileErrors';
import { CONTENT_CATEGORY_OPTIONS, SUBCATEGORIES_BY_CATEGORY } from '@/data/contentCategories';
import { LANGUAGE_OPTIONS, DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import { getDivisionLabel } from '@/data/locations';
import { resolveMediaUrl } from '@/utils/media';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ProfileHero, { PROFILE_HERO_TOP } from '@/components/elements/ProfileHero';
import Button from '@/components/elements/Button';
import CircleAvatar from '@/components/elements/CircleAvatar';
import StatusBadge from '@/components/elements/StatusBadge';
import IconSectionHeader from '@/components/elements/IconSectionHeader';
import {
  CredStrip,
  LocationCard,
  PortfolioGrid,
  Section,
  SocialPlatformRow,
  TagRow,
} from './components/ProfileSections';
import { capitalize } from './utils/profileDisplay';

const avatarImage = require('@/assets/images/account/avatar.png');

// Every subcategory value across every category, flattened once for lookup —
// a stored value doesn't carry which category it came from.
const ALL_SUBCATEGORY_OPTIONS = Object.values(SUBCATEGORIES_BY_CATEGORY).flat();

// The read-only "My Profile" view (creator role) — a pushed detail screen
// reachable from the Profile tab's "My Profile" row, deliberately separate
// from that tab (which stays a settings menu) and from Edit Profile (the
// write side).
//
// Presentation is a deliberately editorial, non-SaaS-card layout: a dark
// gradient hero (the cover photo, when set, shows through a darkened
// overlay ramp instead of plain underneath it — see `ProfileHero`), a
// serif-flavored display name (ClashDisplay — this project's confirmed
// brand display face; Fraunces itself isn't bundled as an asset), a
// bordered credibility strip, and tags color-coded per type. Loading/error/
// wrong-role states below keep the original plain `ScreenHeader` treatment
// since there's nothing to make editorial yet.
export default function MyProfile() {
  const { colors, palette: themePalette, isDark } = useTheme();
  const { data, isLoading, isError, error, refetch } = useGetMyProfileQuery();

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="My Profile"
          onBack={() => router.back()}
          style={creatorProfileStyle.headerRow}
        />
        <View style={myProfileStyle.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    const message = profileSubmitErrorMessage(error);
    const isNotFound = message === "We couldn't find your profile.";
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="My Profile"
          onBack={() => router.back()}
          style={creatorProfileStyle.headerRow}
        />
        <View style={myProfileStyle.centered}>
          <Text style={[myProfileStyle.centeredText, { color: colors.text.primary }]}>
            {isNotFound ? "You haven't set up your profile yet." : message}
          </Text>
          {isNotFound ? (
            <Button
              title="Complete onboarding"
              onPress={() => router.push('/creator-onboarding')}
              testID="my-profile-onboard-cta"
            />
          ) : (
            <Button title="Try again" onPress={() => refetch()} testID="my-profile-retry" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!isCreatorProfileResponse(data)) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="My Profile"
          onBack={() => router.back()}
          style={creatorProfileStyle.headerRow}
        />
        <View style={myProfileStyle.centered}>
          <Text style={[myProfileStyle.centeredText, { color: colors.text.primary }]}>
            This screen is for creator accounts.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { profile, handle } = data;
  const isVerified = profile.verificationStatus === 'verified';

  const locationRows: { label: string; value: string }[] = [];
  if (profile.city) locationRows.push({ label: 'City', value: profile.city });
  if (profile.state)
    locationRows.push({ label: 'Division', value: getDivisionLabel(profile.state) });
  if (profile.country) locationRows.push({ label: 'Country', value: capitalize(profile.country) });
  if (profile.postalCode) locationRows.push({ label: 'Postal code', value: profile.postalCode });

  const cityCountryLine = [profile.city, profile.country ? capitalize(profile.country) : null]
    .filter(Boolean)
    .join(', ');

  // `rating`/completed-project count/response time aren't fields the backend
  // returns on `CreatorProfile` yet (see types/profile.ts) — this strip is
  // built to spec but shows honest placeholders rather than invented
  // numbers until those land. Portfolio entries are the closest real proxy
  // this profile has for "projects" today.
  const ratingDisplay = 'New';
  const projectsDisplay = String(profile.portfolio.length);
  const responseDisplay = '—';

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: PROFILE_HERO_TOP }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        style={[layoutStyle.screen, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}>
        <View style={myProfileStyle.heroWrap}>
          <ProfileHero
            title="My profile"
            onBack={() => router.back()}
            coverUri={profile.coverUrl ? resolveMediaUrl(profile.coverUrl)! : undefined}
            rightElement={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => router.push('/profile-edit')}
                style={myProfileStyle.editPill}
                testID="my-profile-edit">
                <Text style={myProfileStyle.editPillLabel}>Edit</Text>
              </Pressable>
            }
          />
          <View style={myProfileStyle.avatarRing}>
            <CircleAvatar
              source={
                profile.avatarUrl ? { uri: resolveMediaUrl(profile.avatarUrl)! } : avatarImage
              }
              size={84}
            />
          </View>
        </View>

        <View style={myProfileStyle.content}>
          <View style={myProfileStyle.nameRow}>
            <Text style={[myProfileStyle.name, { color: colors.text.primary }]}>
              {profile.name}
            </Text>
            {/* Not yet wired to a verification flow — no such route exists in
                this app today, so this stays a status badge, not a control. */}
            <StatusBadge
              label={isVerified ? 'Verified' : 'Unverified'}
              color={isVerified ? undefined : themePalette.gray[isDark ? 700 : 50]}
              textColor={isVerified ? undefined : themePalette.gray[isDark ? 100 : 500]}
            />
          </View>

          <View style={myProfileStyle.metaLine}>
            {handle ? (
              <Text style={[myProfileStyle.handleText, { color: themePalette.gray[300] }]}>
                @{handle}
              </Text>
            ) : null}
            {handle && cityCountryLine ? (
              <Text style={[myProfileStyle.metaDot, { color: themePalette.gray[300] }]}>·</Text>
            ) : null}
            {cityCountryLine ? (
              <Text style={[myProfileStyle.locationInline, { color: themePalette.gray[300] }]}>
                {cityCountryLine}
              </Text>
            ) : null}
          </View>

          {profile.bio ? (
            <Text style={[myProfileStyle.bio, { color: themePalette.gray[300] }]}>
              {profile.bio}
            </Text>
          ) : null}

          <CredStrip
            columns={[
              { icon: 'star', value: ratingDisplay, label: 'Rating' },
              { icon: 'briefcase', value: projectsDisplay, label: 'Projects' },
              { icon: 'clock', value: responseDisplay, label: 'Response time' },
            ]}
          />

          <Section icon="grid" label="Category">
            <TagRow
              values={profile.categories}
              options={CONTENT_CATEGORY_OPTIONS}
              colorKey="category"
            />
          </Section>

          <Section icon="layers" label="Subcategories">
            <TagRow
              values={profile.subcategories}
              options={ALL_SUBCATEGORY_OPTIONS}
              colorKey="subcategory"
            />
          </Section>

          <Section icon="globe" label="Languages">
            <TagRow values={profile.languages} options={LANGUAGE_OPTIONS} colorKey="language" />
          </Section>

          <Section icon="package" label="Deliverables">
            <TagRow
              values={profile.deliverables}
              options={DELIVERABLE_OPTIONS}
              colorKey="deliverable"
            />
          </Section>

          {profile.platforms.length ? (
            <Section icon="at-sign" label="Social platforms">
              <SocialPlatformRow platforms={profile.platforms} />
            </Section>
          ) : null}

          <LocationCard rows={locationRows} />

          <View style={myProfileStyle.section}>
            <IconSectionHeader icon="image" label="Portfolio" />
            <PortfolioGrid
              items={profile.portfolio}
              onAddPress={() => router.push('/profile-edit')}
              testIDPrefix="my-profile"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
