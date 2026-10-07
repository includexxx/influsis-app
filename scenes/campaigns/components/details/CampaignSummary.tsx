import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { AccentTone, toneColors } from '@/theme';
import FallbackImage from '@/components/elements/FallbackImage';
import Image from '@/components/elements/Image';
import { campaignDetailsStyle as s } from '../../campaignDetails.style';
import { DeadlineState } from '../../utils/mapCampaignDetails';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');

type FeatherName = React.ComponentProps<typeof Feather>['name'];

/** The posting business: avatar, name + verified badge, posted date, and a
 * link through to its profile. */
export function BusinessRow({
  name,
  avatarUrl,
  verified,
  postedDate,
  onPress,
}: {
  name: string;
  avatarUrl: string | null;
  verified: boolean;
  postedDate: string | null;
  onPress: () => void;
}) {
  const { colors, palette, isDark } = useTheme();
  const tone = toneColors('primary', isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${verified ? ', verified' : ''}. View business`}
      onPress={onPress}
      style={({ pressed }) => [
        s.businessRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && s.pressed,
      ]}
      testID="campaign-details-business">
      <FallbackImage
        source={avatarUrl ? { uri: avatarUrl } : null}
        name={name}
        style={s.businessAvatar}
      />
      <View style={s.businessText}>
        <View style={s.businessNameRow}>
          <Text style={[s.businessName, { color: colors.text.primary }]} numberOfLines={1}>
            {name}
          </Text>
          {verified ? (
            <Image source={verifiedBadge} style={s.verifiedIcon} contentFit="contain" />
          ) : null}
        </View>
        <Text style={[s.businessMeta, { color: palette.gray[300] }]} numberOfLines={1}>
          {postedDate ? `Posted ${postedDate}` : 'Business'}
        </Text>
      </View>
      <View style={[s.businessLink, { backgroundColor: tone.background }]}>
        <Feather name="arrow-up-right" size={18} color={tone.foreground} />
      </View>
    </Pressable>
  );
}

/** Brand-gradient card with the campaign budget and, for tier 2/3
 * campaigns, the licensing uplift the creator earns on top. */
export function BudgetCard({
  budget,
  licensingPercent,
}: {
  budget: string;
  licensingPercent: number;
}) {
  const { palette } = useTheme();

  return (
    <LinearGradient
      colors={[palette.primary[400], palette.primary[600], palette.primary[800]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.budgetCard}
      testID="campaign-details-budget">
      <View style={s.budgetGlow} />
      <View style={s.budgetGlowSmall} />
      <Text style={s.budgetEyebrow}>CAMPAIGN BUDGET</Text>
      <Text style={s.budgetAmount} numberOfLines={1} adjustsFontSizeToFit>
        {budget}
      </Text>
      <View style={s.budgetChip}>
        <Feather name={licensingPercent > 0 ? 'award' : 'info'} size={13} color={palette.white} />
        <Text style={s.budgetChipText}>
          {licensingPercent > 0
            ? `+${licensingPercent}% licensing for usage rights`
            : 'Final pay is agreed in your offer'}
        </Text>
      </View>
    </LinearGradient>
  );
}

export interface FactItem {
  icon: FeatherName;
  tone: AccentTone;
  label: string;
  value: string;
  /** Optional status chip under the value, e.g. "3 days left". */
  badge?: { label: string; state: DeadlineState };
}

const BADGE_TONE: Record<DeadlineState, AccentTone> = {
  open: 'success',
  soon: 'warning',
  today: 'warning',
  closed: 'error',
};

/** Two-column grid of key facts (deadlines, gender). */
export function FactGrid({ facts }: { facts: FactItem[] }) {
  const { colors, palette, isDark } = useTheme();

  return (
    <View style={s.factGrid}>
      {facts.map(fact => {
        const tone = toneColors(fact.tone, isDark);
        const badgeTone = fact.badge ? toneColors(BADGE_TONE[fact.badge.state], isDark) : null;
        return (
          <View
            key={fact.label}
            style={[s.factTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.factIcon, { backgroundColor: tone.background }]}>
              <Feather name={fact.icon} size={16} color={tone.foreground} />
            </View>
            <Text style={[s.factLabel, { color: palette.gray[300] }]}>{fact.label}</Text>
            <Text style={[s.factValue, { color: colors.text.primary }]} numberOfLines={1}>
              {fact.value}
            </Text>
            {fact.badge && badgeTone ? (
              <View style={[s.factBadge, { backgroundColor: badgeTone.background }]}>
                <Text style={[s.factBadgeText, { color: badgeTone.foreground }]}>
                  {fact.badge.label}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
