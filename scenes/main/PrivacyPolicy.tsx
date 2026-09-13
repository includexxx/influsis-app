import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import { layoutStyle, privacyPolicyStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';

const privacyIcon = require('@/assets/images/account/privacy-lock.png');

const RULES: { label: string; text: string }[] = [
  {
    label: 'Device Information',
    text: 'We may collect information about the type of device you use, its operating system, and other technical details to help us improve our app.',
  },
  {
    label: 'Usage Information',
    text: 'We may collect information about how you use our app, such as which features you use and how often you use them.',
  },
  {
    label: 'Personal Information',
    text: 'We may collect personal information, such as your name, email address, or phone number, if you choose to provide it to us.',
  },
];

// The Privacy Policy screen (Figma "Privacy Policy", node 6027:8267),
// opened from the Account screen's "Privacy Policy" row. Rendered once -
// Figma's own frame repeats the entire "Rules for platform" heading,
// intro and bullet list twice back-to-back (a duplicated content group,
// node 6027:8300), the same kind of copy-paste content error already
// normalized away elsewhere in this project (see data/campaigns.ts's
// "About the business" note).
//
// Presentation only: restyled into an elevated hero card (tinted icon chip
// reused from the Account screen's own Privacy Policy row) plus a
// numbered-badge rules card, matching the card/chip/shadow language the
// Account screen redesign introduced. Content and copy are unchanged.
export default function PrivacyPolicy() {
  const { colors, palette, isDark } = useTheme();
  const accentChip = isDark ? 'rgba(244, 46, 158, 0.18)' : palette.primary[50];

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Privacy Policy"
          onBack={() => router.back()}
          style={privacyPolicyStyle.headerGap}
        />

        <View
          style={[
            privacyPolicyStyle.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            getShadowStyle('sm'),
          ]}>
          <View style={[privacyPolicyStyle.iconChip, { backgroundColor: accentChip }]}>
            <Image
              source={privacyIcon}
              style={[privacyPolicyStyle.iconChipImage, { tintColor: colors.primary }]}
              contentFit="contain"
            />
          </View>
          <Text style={[privacyPolicyStyle.heading, { color: colors.text.primary }]}>
            Rules for platform
          </Text>
          <Text style={[privacyPolicyStyle.intro, { color: colors.text.secondary }]}>
            When you use our app, we may collect the following types of personal information:
          </Text>
        </View>

        <View
          style={[
            privacyPolicyStyle.rulesCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            getShadowStyle('sm'),
          ]}>
          {RULES.map((rule, index) => (
            <View key={rule.label}>
              <View style={privacyPolicyStyle.ruleRow}>
                <View style={[privacyPolicyStyle.ruleBadge, { backgroundColor: accentChip }]}>
                  <Text style={[privacyPolicyStyle.ruleBadgeText, { color: colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={privacyPolicyStyle.ruleTextBlock}>
                  <Text style={[privacyPolicyStyle.ruleLabel, { color: colors.text.primary }]}>
                    {rule.label}
                  </Text>
                  <Text style={[privacyPolicyStyle.ruleText, { color: colors.text.secondary }]}>
                    {rule.text}
                  </Text>
                </View>
              </View>
              {index < RULES.length - 1 && (
                <View
                  style={[privacyPolicyStyle.ruleDivider, { backgroundColor: colors.divider }]}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
