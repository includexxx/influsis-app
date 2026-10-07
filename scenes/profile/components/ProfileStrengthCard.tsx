import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { accountStyle } from '../account.style';
import { toneColors } from '@/theme';

export interface ProfileStrengthCardProps {
  percent: number;
  hint: string;
  ctaLabel: string;
  onPress: () => void;
}

// "Profile strength" nudge on the Profile tab: a percentage, a gradient
// progress bar, which fields are still missing, and a link to fix them.
// The caller hides it once the profile is complete.
export default function ProfileStrengthCard({
  percent,
  hint,
  ctaLabel,
  onPress,
}: ProfileStrengthCardProps) {
  const { colors, palette, isDark } = useTheme();
  const tone = toneColors('primary', isDark);
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile strength ${clamped} percent. ${hint}. ${ctaLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        accountStyle.strengthCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && accountStyle.pressed,
      ]}
      testID="profile-strength">
      <View style={accountStyle.strengthHeader}>
        <View style={[accountStyle.strengthIcon, { backgroundColor: tone.background }]}>
          <Feather name="zap" size={18} color={tone.foreground} />
        </View>
        <View style={accountStyle.strengthTitleBlock}>
          <Text style={[accountStyle.strengthTitle, { color: colors.text.primary }]}>
            Profile strength
          </Text>
          <Text style={[accountStyle.strengthHint, { color: palette.gray[300] }]} numberOfLines={2}>
            {hint}
          </Text>
        </View>
        <Text style={[accountStyle.strengthPercent, { color: tone.foreground }]}>{clamped}%</Text>
      </View>

      <View style={[accountStyle.strengthTrack, { backgroundColor: colors.divider }]}>
        <LinearGradient
          colors={[palette.primary[300], palette.primary[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[accountStyle.strengthFill, { width: `${clamped}%` }]}
        />
      </View>

      <View style={accountStyle.strengthCta}>
        <Text style={[accountStyle.strengthCtaText, { color: tone.foreground }]}>{ctaLabel}</Text>
        <Feather name="arrow-right" size={16} color={tone.foreground} />
      </View>
    </Pressable>
  );
}
