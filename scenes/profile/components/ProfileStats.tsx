import { Fragment } from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { accountStyle } from '../account.style';
import { AccentTone, toneColors } from '@/theme';

export interface ProfileStat {
  icon: React.ComponentProps<typeof Feather>['name'];
  tone: AccentTone;
  /** `null` while the profile is still loading — shown as a dash. */
  value: number | null;
  label: string;
}

// Three-column summary card that overlaps the bottom of the Profile tab's
// header. Only counts the profile itself returns (portfolio, platforms,
// categories) - no invented follower/rating numbers.
export default function ProfileStats({ stats }: { stats: ProfileStat[] }) {
  const { colors, palette, isDark } = useTheme();

  return (
    <View
      style={[accountStyle.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="profile-stats">
      {stats.map((stat, index) => {
        const tone = toneColors(stat.tone, isDark);
        return (
          <Fragment key={stat.label}>
            {index > 0 ? (
              <View style={[accountStyle.statDivider, { backgroundColor: colors.divider }]} />
            ) : null}
            <View
              style={accountStyle.statColumn}
              accessible
              accessibilityLabel={`${stat.value ?? 'Loading'} ${stat.label}`}>
              <View style={[accountStyle.statIcon, { backgroundColor: tone.background }]}>
                <Feather name={stat.icon} size={16} color={tone.foreground} />
              </View>
              <Text style={[accountStyle.statValue, { color: colors.text.primary }]}>
                {stat.value ?? '—'}
              </Text>
              <Text style={[accountStyle.statLabel, { color: palette.gray[300] }]}>
                {stat.label}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
