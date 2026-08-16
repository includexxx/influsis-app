import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, helpCenterStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import AccordionItem from '@/components/elements/AccordionItem';
import { faqs } from '@/data/faqs';

// The Help Center screen (Figma "Help Center", node 6027:8303), opened
// from the Account screen's "Help Center" row. First question starts
// expanded (Figma's own default state); at most one is open at a time.
// See docs/screen/profile/help-center.md and data/faqs.ts for why the
// answer copy and 6th question differ from Figma's literal content.
export default function HelpCenter() {
  const { colors } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

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
