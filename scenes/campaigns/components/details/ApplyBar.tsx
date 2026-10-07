import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { campaignDetailsStyle as s } from '../../campaignDetails.style';

export interface ApplyBarProps {
  budget: string;
  /** Under the price, e.g. "Apply by 10 Oct 2026". */
  caption: string;
  /** "Apply Now", or where the creator already stands ("Applied", ...), or
   * "Applications closed". */
  label: string;
  disabled: boolean;
  /** Glyph beside a disabled label: a check when already engaged, a lock
   * once applications have closed. */
  disabledIcon?: React.ComponentProps<typeof Feather>['name'];
  bottomInset: number;
  onPress: () => void;
}

// Pinned to the bottom of Campaign Details: the budget on the left and the
// primary action on the right - a gradient pill while applying is possible,
// a flat muted pill once it isn't (already engaged, or the deadline passed).
export default function ApplyBar({
  budget,
  caption,
  label,
  disabled,
  disabledIcon = 'check-circle',
  bottomInset,
  onPress,
}: ApplyBarProps) {
  const { colors, palette, isDark } = useTheme();
  const mutedFill = isDark ? 'rgba(255, 255, 255, 0.08)' : palette.gray[25];

  return (
    <View
      style={[
        s.applyBar,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: Math.max(bottomInset, 12) + 4,
        },
      ]}>
      <View style={s.applyPriceBlock}>
        <Text style={[s.applyPriceLabel, { color: palette.gray[300] }]} numberOfLines={1}>
          {caption}
        </Text>
        <Text
          style={[s.applyPrice, { color: colors.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {budget}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [s.applyButton, pressed && s.pressed]}
        testID="campaign-details-apply">
        {disabled ? (
          <View style={[s.applyButtonFill, { backgroundColor: mutedFill }]}>
            <Feather name={disabledIcon} size={18} color={palette.gray[300]} />
            <Text style={[s.applyButtonText, { color: palette.gray[300] }]}>{label}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[palette.primary[400], palette.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.applyButtonFill}>
            <Text style={[s.applyButtonText, { color: palette.white }]}>{label}</Text>
            <Feather name="arrow-right" size={18} color={palette.white} />
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}
