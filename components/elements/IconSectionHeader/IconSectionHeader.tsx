import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { spacing } from '@/theme';

export interface IconSectionHeaderProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Small icon + sentence-case label row that titles a section on the
// editorial profile screens (scenes/main/MyProfile.tsx and
// scenes/main/EditProfile.tsx) — distinct from the shared `SectionHeader`
// (title + "See all", used by the Home screen's content rows), which
// doesn't fit a profile section's plain content.
function IconSectionHeader({ icon, label, style, testID }: IconSectionHeaderProps) {
  const { colors, palette } = useTheme();
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Feather name={icon} size={16} color={palette.gray[400]} />
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
    </View>
  );
}

export default IconSectionHeader;
