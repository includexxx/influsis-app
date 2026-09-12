import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, creatorProfileStyle, myProfileStyle } from '@/styles';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import { isCreatorProfileResponse } from '@/types';
import { profileSubmitErrorMessage } from '@/utils/profileErrors';
import { CONTENT_CATEGORY_OPTIONS, SUBCATEGORIES_BY_CATEGORY } from '@/data/contentCategories';
import { LANGUAGE_OPTIONS, DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import { PORTFOLIO_PLATFORM_OPTIONS } from '@/data/portfolioPlatforms';
import { getDivisionLabel } from '@/data/locations';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import Button from '@/components/elements/Button';
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
// write side). Mirrors CreatorProfile.tsx's banner+avatar layout and reuses
// creatorProfileStyle wholesale; myProfileStyle only adds what that doesn't
// already cover (a wrapping tag row, meta rows, the portfolio grid).
export default function MyProfile() {
  const { colors, palette } = useTheme();
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

  const metaRows: { label: string; value: string }[] = [];
  if (profile.city) metaRows.push({ label: 'City', value: profile.city });
  if (profile.state) metaRows.push({ label: 'Division', value: getDivisionLabel(profile.state) });
  if (profile.country) metaRows.push({ label: 'Country', value: profile.country });
  if (profile.postalCode) metaRows.push({ label: 'Postal code', value: profile.postalCode });
  if (profile.address) metaRows.push({ label: 'Address', value: profile.address });

  const contactRows: { label: string; value: string; onPress?: () => void }[] = [];
  if (profile.contactEmail) contactRows.push({ label: 'Email', value: profile.contactEmail });
  if (profile.contactPhone) contactRows.push({ label: 'Phone', value: profile.contactPhone });
  if (profile.websiteUrl) {
    contactRows.push({
      label: 'Website',
      value: profile.websiteUrl,
      onPress: () => openLink(profile.websiteUrl as string),
    });
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={creatorProfileStyle.headerRow}>
          <ScreenHeader
            title="My Profile"
            onBack={() => router.back()}
            rightElement={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => router.push('/profile-edit')}
                testID="my-profile-edit">
                <Text style={[myProfileStyle.headerAction, { color: colors.primary }]}>Edit</Text>
              </Pressable>
            }
          />
        </View>

        <View style={creatorProfileStyle.bannerWrap}>
          {profile.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              style={creatorProfileStyle.banner}
              contentFit="cover"
            />
          ) : (
            <View style={[creatorProfileStyle.banner, { backgroundColor: palette.primary[50] }]} />
          )}
          <Image
            source={profile.avatarUrl ? { uri: profile.avatarUrl } : avatarImage}
            style={creatorProfileStyle.avatar}
            contentFit="cover"
          />
        </View>

        <View style={creatorProfileStyle.content}>
          <View style={creatorProfileStyle.nameRow}>
            <Text style={[creatorProfileStyle.name, { color: colors.text.primary }]}>
              {profile.name}
            </Text>
            <StatusBadge
              label={profile.verificationStatus}
              color={profile.verificationStatus === 'verified' ? undefined : palette.gray[100]}
              textColor={profile.verificationStatus === 'verified' ? undefined : palette.gray[500]}
            />
          </View>
          {handle ? (
            <Text style={[myProfileStyle.handleText, { color: palette.gray[300] }]}>@{handle}</Text>
          ) : null}
          {profile.bio ? (
            <Text style={[creatorProfileStyle.bio, { color: palette.gray[300] }]}>
              {profile.bio}
            </Text>
          ) : null}

          {renderTagSection(
            'Categories',
            profile.categories,
            CONTENT_CATEGORY_OPTIONS,
            colors,
            palette,
          )}
          {renderTagSection(
            'Subcategories',
            profile.subcategories,
            ALL_SUBCATEGORY_OPTIONS,
            colors,
            palette,
          )}
          {renderTagSection('Languages', profile.languages, LANGUAGE_OPTIONS, colors, palette)}
          {renderTagSection(
            'Deliverables',
            profile.deliverables,
            DELIVERABLE_OPTIONS,
            colors,
            palette,
          )}

          {metaRows.length ? (
            <View style={creatorProfileStyle.tagsSection}>
              <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Location
              </Text>
              <View style={creatorProfileStyle.sectionHeaderGap}>
                {metaRows.map(row => (
                  <View key={row.label} style={myProfileStyle.metaRow}>
                    <Text style={[myProfileStyle.metaLabel, { color: palette.gray[300] }]}>
                      {row.label}
                    </Text>
                    <Text style={[myProfileStyle.metaValue, { color: colors.text.primary }]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {contactRows.length ? (
            <View style={creatorProfileStyle.tagsSection}>
              <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Contact
              </Text>
              <View style={creatorProfileStyle.sectionHeaderGap}>
                {contactRows.map(row => (
                  <Pressable
                    key={row.label}
                    disabled={!row.onPress}
                    onPress={row.onPress}
                    style={myProfileStyle.metaRow}>
                    <Text style={[myProfileStyle.metaLabel, { color: palette.gray[300] }]}>
                      {row.label}
                    </Text>
                    <Text
                      style={[
                        myProfileStyle.metaValue,
                        { color: row.onPress ? colors.primary : colors.text.primary },
                      ]}>
                      {row.value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {profile.portfolio.length ? (
            <View style={creatorProfileStyle.tagsSection}>
              <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
                Portfolio
              </Text>
              <View style={[myProfileStyle.portfolioGrid, creatorProfileStyle.sectionHeaderGap]}>
                {profile.portfolio.map((item, index) => (
                  <Pressable
                    key={`${item.url}-${index}`}
                    style={[myProfileStyle.portfolioTile, { borderColor: palette.gray[100] }]}
                    onPress={() => openLink(item.url)}
                    testID={`my-profile-portfolio-${index}`}>
                    {item.thumbnailUrl ? (
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={{ flex: 1 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          myProfileStyle.portfolioPlaceholder,
                          { backgroundColor: palette.primary[50] },
                        ]}>
                        <Text
                          style={[
                            myProfileStyle.portfolioPlaceholderLabel,
                            { color: palette.gray[500] },
                          ]}>
                          {labelFor(item.platform, PORTFOLIO_PLATFORM_OPTIONS)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderTagSection(
  title: string,
  values: string[],
  options: { value: string; label: string }[],
  colors: ReturnType<typeof useTheme>['colors'],
  palette: ReturnType<typeof useTheme>['palette'],
) {
  if (!values.length) return null;
  return (
    <View style={creatorProfileStyle.tagsSection}>
      <Text style={[creatorProfileStyle.sectionTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      <View style={[myProfileStyle.tagRowWrap, creatorProfileStyle.sectionHeaderGap]}>
        {values.map(value => (
          <View
            key={value}
            style={[creatorProfileStyle.tagPill, { backgroundColor: palette.primary[50] }]}>
            <Text style={[creatorProfileStyle.tagLabel, { color: palette.gray[500] }]}>
              {labelFor(value, options)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
