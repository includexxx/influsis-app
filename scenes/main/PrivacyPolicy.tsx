import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, privacyPolicyStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';

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
// "About the brand" note).
export default function PrivacyPolicy() {
  const { colors, palette } = useTheme();

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

        <Text style={[privacyPolicyStyle.heading, { color: colors.text.primary }]}>
          Rules for platform
        </Text>
        <Text style={[privacyPolicyStyle.intro, { color: palette.gray[300] }]}>
          When you use our app, we may collect the following types of personal information:
        </Text>

        {RULES.map(rule => (
          <View key={rule.label} style={privacyPolicyStyle.bulletRow}>
            <Text style={[privacyPolicyStyle.bullet, { color: palette.gray[300] }]}>{'•'}</Text>
            <Text style={[privacyPolicyStyle.bulletText, { color: palette.gray[300] }]}>
              <Text style={privacyPolicyStyle.bulletLabel}>{rule.label}</Text>
              {`: ${rule.text}`}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
