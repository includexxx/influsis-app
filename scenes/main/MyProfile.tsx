import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import {
  layoutStyle,
  creatorProfileStyle,
  myProfileStyle,
  TAG_COLORS,
  TagColorKey,
} from '@/styles';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import { isCreatorProfileResponse } from '@/types';
import { profileSubmitErrorMessage } from '@/utils/profileErrors';
import { CONTENT_CATEGORY_OPTIONS, SUBCATEGORIES_BY_CATEGORY } from '@/data/contentCategories';
import { LANGUAGE_OPTIONS, DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import { PORTFOLIO_PLATFORM_OPTIONS } from '@/data/portfolioPlatforms';
import { getDivisionLabel } from '@/data/locations';
import { resolveMediaUrl } from '@/utils/media';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ProfileHero, { PROFILE_HERO_TOP } from '@/components/elements/ProfileHero';
import IconSectionHeader from '@/components/elements/IconSectionHeader';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
import CircleAvatar from '@/components/elements/CircleAvatar';
import StatusBadge from '@/components/elements/StatusBadge';

const avatarImage = require('@/assets/images/account/avatar.png');

// Every subcategory value across every category, flattened once for lookup —
// a stored value doesn't carry which category it came from.
const ALL_SUBCATEGORY_OPTIONS = Object.values(SUBCATEGORIES_BY_CATEGORY).flat();

/** A stored option value back to its display label, or the raw value
 * capitalized when it's free text from an "Others" branch. */
function labelFor(value: string, options: { value: string; label: string }[]): string {
  const match = options.find(option => option.value === value);
  if (match) return match.label;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function openLink(url: string) {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  Linking.canOpenURL(target)
    .then(supported => {
      if (supported) return Linking.openURL(target);
    })
    // Best-effort — an unopenable link (malformed, no handler) shouldn't crash the screen.
    .catch(() => undefined);
}

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

          <View style={[myProfileStyle.credCard, { borderColor: colors.border }]}>
            <CredColumn icon="star" value={ratingDisplay} label="Rating" />
            <View style={[myProfileStyle.credDivider, { backgroundColor: colors.divider }]} />
            <CredColumn icon="briefcase" value={projectsDisplay} label="Projects" />
            <View style={[myProfileStyle.credDivider, { backgroundColor: colors.divider }]} />
            <CredColumn icon="clock" value={responseDisplay} label="Response time" />
          </View>

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

          {locationRows.length ? (
            <View style={myProfileStyle.section}>
              <IconSectionHeader icon="map-pin" label="Location" />
              <View
                style={[
                  myProfileStyle.locationCard,
                  myProfileStyle.sectionBody,
                  { borderColor: colors.border },
                ]}>
                {locationRows.map((row, index) => (
                  <View key={row.label}>
                    <View style={myProfileStyle.metaRow}>
                      <Text style={[myProfileStyle.metaLabel, { color: themePalette.gray[300] }]}>
                        {row.label}
                      </Text>
                      <Text style={[myProfileStyle.metaValue, { color: colors.text.primary }]}>
                        {row.value}
                      </Text>
                    </View>
                    {index < locationRows.length - 1 ? (
                      <View
                        style={[myProfileStyle.metaRowDivider, { backgroundColor: colors.divider }]}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={myProfileStyle.section}>
            <IconSectionHeader icon="image" label="Portfolio" />
            <View style={[myProfileStyle.portfolioGrid, myProfileStyle.sectionBody]}>
              {profile.portfolio.map((item, index) => (
                <Pressable
                  key={`${item.url}-${index}`}
                  style={[myProfileStyle.portfolioTile, { borderColor: colors.border }]}
                  onPress={() => openLink(item.url)}
                  testID={`my-profile-portfolio-${index}`}>
                  {item.thumbnailUrl ? (
                    <Image
                      source={{ uri: resolveMediaUrl(item.thumbnailUrl)! }}
                      style={{ flex: 1 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        myProfileStyle.portfolioPlaceholder,
                        { backgroundColor: themePalette.primary[isDark ? 900 : 50] },
                      ]}>
                      <Text
                        style={[
                          myProfileStyle.portfolioPlaceholderLabel,
                          { color: themePalette.gray[isDark ? 100 : 500] },
                        ]}>
                        {labelFor(item.platform, PORTFOLIO_PLATFORM_OPTIONS)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add work"
                onPress={() => router.push('/profile-edit')}
                style={[myProfileStyle.addWorkTile, { borderColor: colors.border }]}
                testID="my-profile-add-work">
                <Feather name="plus" size={20} color={themePalette.gray[300]} />
                <Text style={[myProfileStyle.addWorkLabel, { color: themePalette.gray[300] }]}>
                  Add work
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CredColumn({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string;
  label: string;
}) {
  const { colors, palette: themePalette } = useTheme();
  return (
    <View style={myProfileStyle.credColumn}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[myProfileStyle.credValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[myProfileStyle.credLabel, { color: themePalette.gray[300] }]}>{label}</Text>
    </View>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={myProfileStyle.section}>
      <IconSectionHeader icon={icon} label={label} />
      <View style={myProfileStyle.sectionBody}>{children}</View>
    </View>
  );
}

function TagRow({
  values,
  options,
  colorKey,
}: {
  values: string[];
  options: { value: string; label: string }[];
  colorKey: TagColorKey;
}) {
  const { isDark } = useTheme();
  if (!values.length) return null;
  const tone = isDark ? TAG_COLORS[colorKey].dark : TAG_COLORS[colorKey].light;

  return (
    <View style={myProfileStyle.tagRowWrap}>
      {values.map(value => (
        <View key={value} style={[myProfileStyle.tagPill, { backgroundColor: tone.bg }]}>
          <Text style={[myProfileStyle.tagLabel, { color: tone.text }]}>
            {labelFor(value, options)}
          </Text>
        </View>
      ))}
    </View>
  );
}
