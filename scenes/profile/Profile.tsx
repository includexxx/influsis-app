import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTheme, useDataPersist, DataPersistKeys } from '@/hooks';
import { useAppSlice, useAuthSlice } from '@/slices';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import { isCreatorProfileResponse } from '@/types';
import { layoutStyle } from '@/styles';
import { resolveMediaUrl } from '@/utils/media';
import { profileSubmitErrorMessage } from '@/utils/profileErrors';
import ConfirmDialog from '@/components/elements/ConfirmDialog';
import { accountStyle } from './account.style';
import ProfileHeader, { PROFILE_HEADER_TOP } from './components/ProfileHeader';
import ProfileStats from './components/ProfileStats';
import ProfileStrengthCard from './components/ProfileStrengthCard';
import { ProfileMenuItem, ProfileMenuSection } from './components/ProfileMenu';
import { toneColors } from '@/theme';
import { capitalize } from './utils/profileDisplay';
import { completionHint, getProfileCompletion, verificationBadge } from './utils/profileCompletion';

const appVersion = Constants.expoConfig?.version;

// The Profile tab (Figma "Account", node 6001:38957 + 6027:8164's logout
// popup) - a settings menu with an identity header, not a data display; the
// full read-only profile lives on My Profile. See
// docs/screen/profile/account.md.
//
// Top to bottom: a brand-gradient header (cover photo, avatar, name, handle,
// location, verification), a stats card overlapping it, a profile-strength
// nudge while the profile is incomplete, the grouped menu, and Logout behind
// a confirmation. No loading state: the header's fallbacks read fine while
// the query is in flight, and a spinner would flash on every tab visit.
export default function Profile() {
  const { colors, palette, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { dispatch, setUser } = useAppSlice();
  const { account, signOut } = useAuthSlice();
  const { removePersistData } = useDataPersist();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { data, isError, error } = useGetMyProfileQuery();

  const creator = data && isCreatorProfileResponse(data) ? data.profile : undefined;
  // A creator who signed up but never finished onboarding has no profile
  // yet - the strength card points them at onboarding instead of editing.
  const needsOnboarding =
    isError && profileSubmitErrorMessage(error) === "We couldn't find your profile.";

  const displayName = data?.profile.name ?? 'Your Profile';
  const displaySubtitle = data?.handle ? `@${data.handle}` : (account?.email ?? '-');
  const location = creator
    ? [creator.city, creator.country ? capitalize(creator.country) : null]
        .filter(Boolean)
        .join(', ')
    : undefined;
  // Stats only make sense for a creator; a business/admin account (or a
  // failed load) gets the header alone.
  const showStats = !isError && (!data || !!creator);
  const completion = creator ? getProfileCompletion(creator) : undefined;

  const accountItems: ProfileMenuItem[] = [
    {
      icon: 'user',
      tone: 'primary',
      title: 'My Profile',
      subtitle: 'See your profile as businesses do',
      onPress: () => router.push('/my-profile'),
      testID: 'account-row-my-profile',
    },
    {
      icon: 'edit-3',
      tone: 'navy',
      title: 'Edit Profile',
      subtitle: 'Photo, bio, niches and links',
      onPress: () => router.push('/profile-edit'),
      testID: 'account-row-profile',
    },
    {
      icon: 'shield',
      tone: 'success',
      title: 'Security',
      subtitle: 'Password and sign-in',
      onPress: () => router.push('/security-settings'),
      testID: 'account-row-security',
    },
  ];
  const workItems: ProfileMenuItem[] = [
    {
      icon: 'credit-card',
      tone: 'warning',
      title: 'Balance',
      subtitle: 'Earnings and withdrawals',
      onPress: () => router.push('/ballance'),
      testID: 'account-row-ballance',
    },
    {
      icon: 'briefcase',
      tone: 'primary',
      title: 'My Applications',
      subtitle: 'Campaigns you have applied to',
      onPress: () => router.push('/applications'),
      testID: 'account-row-applications',
    },
  ];
  const supportItems: ProfileMenuItem[] = [
    {
      icon: 'help-circle',
      tone: 'navy',
      title: 'Help Center',
      subtitle: 'FAQs and support',
      onPress: () => router.push('/help-center'),
      testID: 'account-row-help-center',
    },
    {
      icon: 'lock',
      tone: 'success',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      onPress: () => router.push('/privacy-policy'),
      testID: 'account-row-privacy-policy',
    },
  ];

  const danger = toneColors('error', isDark);

  function handleLogout() {
    setIsLogoutConfirmOpen(false);
    removePersistData(DataPersistKeys.USER);
    dispatch(setUser(undefined));
    dispatch(signOut());
    router.replace('/auth');
  }

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: colors.background }]}
      edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={accountStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[accountStyle.overscrollCap, { backgroundColor: PROFILE_HEADER_TOP }]} />

        <ProfileHeader
          name={displayName}
          subtitle={displaySubtitle}
          location={location || undefined}
          avatarUri={resolveMediaUrl(data?.profile.avatarUrl)}
          coverUri={resolveMediaUrl(creator?.coverUrl)}
          verification={creator ? verificationBadge(creator.verificationStatus) : undefined}
          topInset={insets.top}
          withStatsOverlap={showStats}
          onEditPress={() => router.push('/profile-edit')}
          onViewProfilePress={() => router.push('/my-profile')}
        />

        {showStats ? (
          <ProfileStats
            stats={[
              {
                icon: 'image',
                tone: 'primary',
                value: creator?.portfolio.length ?? null,
                label: 'Portfolio',
              },
              {
                icon: 'share-2',
                tone: 'navy',
                value: creator?.platforms.length ?? null,
                label: 'Platforms',
              },
              {
                icon: 'grid',
                tone: 'warning',
                value: creator?.categories.length ?? null,
                label: 'Categories',
              },
            ]}
          />
        ) : null}

        <View style={accountStyle.body}>
          {needsOnboarding ? (
            <ProfileStrengthCard
              percent={0}
              hint="Set up your creator profile to start applying to campaigns"
              ctaLabel="Start onboarding"
              onPress={() => router.push('/creator-onboarding')}
            />
          ) : completion && completion.percent < 100 ? (
            <ProfileStrengthCard
              percent={completion.percent}
              hint={completionHint(completion.missing)}
              ctaLabel="Complete profile"
              onPress={() => router.push('/profile-edit')}
            />
          ) : null}

          <ProfileMenuSection label="Account" items={accountItems} />
          <ProfileMenuSection label="Work" items={workItems} />
          <ProfileMenuSection label="Support" items={supportItems} />

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsLogoutConfirmOpen(true)}
            style={({ pressed }) => [
              accountStyle.logoutButton,
              {
                backgroundColor: danger.background,
                borderColor: isDark ? 'rgba(249, 112, 102, 0.24)' : palette.error[100],
              },
              pressed && accountStyle.pressed,
            ]}
            testID="account-row-logout">
            <Feather name="log-out" size={18} color={danger.foreground} />
            <Text style={[accountStyle.logoutText, { color: danger.foreground }]}>Logout</Text>
          </Pressable>

          {appVersion ? (
            <Text style={[accountStyle.version, { color: palette.gray[200] }]}>
              Influsis v{appVersion}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {isLogoutConfirmOpen && (
        <ConfirmDialog
          icon="log-out"
          tone="danger"
          title="Are you sure you want to logout?"
          message="You'll need to sign in again to manage your campaigns and payouts."
          primaryLabel="Cancel"
          onPrimaryPress={() => setIsLogoutConfirmOpen(false)}
          secondaryLabel="Log Out"
          onSecondaryPress={handleLogout}
          onClose={() => setIsLogoutConfirmOpen(false)}
          testID="logout-confirm"
        />
      )}
    </SafeAreaView>
  );
}
