import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import { layoutStyle, helpCenterStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import AccordionItem from '@/components/elements/AccordionItem';
import Image from '@/components/elements/Image';
import { faqs } from '@/data/faqs';

const helpCenterIcon = require('@/assets/images/account/help-center.png');

// The Help Center screen (Figma "Help Center", node 6027:8303), opened
// from the Account screen's "Help Center" row. First question starts
// expanded (Figma's own default state); at most one is open at a time.
// See docs/screen/profile/help-center.md and data/faqs.ts for why the
// answer copy and 6th question differ from Figma's literal content.
//
// Presentation only: restyled into an elevated hero card (tinted icon chip
// reused from the Account screen's own Help Center row) above the FAQ
// accordion, matching the card/chip/shadow language the Account screen
// redesign introduced. Questions, answers and toggle behavior are
// unchanged.
export default function HelpCenter() {
  const { colors, palette, isDark } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const accentChip = isDark ? 'rgba(244, 46, 158, 0.18)' : palette.primary[50];

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Help Center"
          onBack={() => router.back()}
          style={helpCenterStyle.headerGap}
        />

        <View
          style={[
            helpCenterStyle.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            getShadowStyle('sm'),
          ]}>
          <View style={[helpCenterStyle.iconChip, { backgroundColor: accentChip }]}>
            <Image
              source={helpCenterIcon}
              style={[helpCenterStyle.iconChipImage, { tintColor: colors.primary }]}
              contentFit="contain"
            />
          </View>
          <Text style={[helpCenterStyle.heading, { color: colors.text.primary }]}>
            Frequently Asked Questions
          </Text>
          <Text
            style={[helpCenterStyle.intro, { color: colors.text.secondary, textAlign: 'center' }]}>
            Find quick answers to the most common questions about using influsis.
          </Text>
        </View>

        <View style={helpCenterStyle.list}>
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              expanded={expandedIndex === index}
              onToggle={() => setExpandedIndex(prev => (prev === index ? null : index))}
              testID={`faq-item-${index}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
