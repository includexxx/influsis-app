import { Fragment } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { accountStyle } from '../account.style';
import { AccentTone, toneColors } from './tones';

export interface ProfileMenuItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  tone: AccentTone;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}

// One labelled group of the Profile tab's menu: an uppercase section label
// over a rounded card of rows separated by inset hairlines.
export function ProfileMenuSection({ label, items }: { label: string; items: ProfileMenuItem[] }) {
  const { colors, palette } = useTheme();

  return (
    <View style={accountStyle.section}>
      <Text
        style={[accountStyle.sectionLabel, { color: palette.gray[300] }]}
        accessibilityRole="header">
        {label}
      </Text>
      <View
        style={[
          accountStyle.menuCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        {items.map((item, index) => (
          <Fragment key={item.title}>
            {index > 0 ? (
              <View style={[accountStyle.menuDivider, { backgroundColor: colors.divider }]} />
            ) : null}
            <ProfileMenuRow {...item} />
          </Fragment>
        ))}
      </View>
    </View>
  );
}

// Tinted icon chip + title/subtitle + chevron. The row highlights while
// pressed rather than fading, so the card edge stays crisp.
export function ProfileMenuRow({ icon, tone, title, subtitle, onPress, testID }: ProfileMenuItem) {
  const { colors, palette, isDark } = useTheme();
  const toneStyle = toneColors(tone, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      onPress={onPress}
      style={({ pressed }) => [
        accountStyle.menuRow,
        pressed && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : palette.gray[25] },
      ]}
      testID={testID}>
      <View style={[accountStyle.menuIcon, { backgroundColor: toneStyle.background }]}>
        <Feather name={icon} size={19} color={toneStyle.foreground} />
      </View>
      <View style={accountStyle.menuText}>
        <Text style={[accountStyle.menuTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[accountStyle.menuSubtitle, { color: palette.gray[300] }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={palette.gray[200]} />
    </Pressable>
  );
}
