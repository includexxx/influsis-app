import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle, radius, spacing } from '@/theme';
import Image from '../Image';

const chevronDownIcon = require('@/assets/images/create-gig/chevron-down.png');

export interface AccordionItemProps {
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  question: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  chevron: {
    width: 24,
    height: 24,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  divider: {
    height: 1,
    marginTop: spacing.md,
  },
  answer: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
});

// Expandable question/answer row (Figma "Elements=FAQ", node 6027:8317's
// expanded state + 6027:8327 and 4 siblings' collapsed state, Help Center)
// - reuses Create Gig's `chevron-down` asset, rotated 180° when expanded,
// rather than exporting a near-duplicate up-chevron. Controlled
// (`expanded`/`onToggle`) so the caller decides accordion behavior (this
// project's Help Center keeps at most one item open at a time).
function AccordionItem({ question, answer, expanded, onToggle, testID }: AccordionItemProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.card, borderColor: colors.border },
        getShadowStyle('xs'),
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.header}
        testID={testID}>
        <Text style={[styles.question, { color: colors.text.primary }]}>{question}</Text>
        <Image
          source={chevronDownIcon}
          style={[styles.chevron, expanded && styles.chevronExpanded]}
          contentFit="contain"
        />
      </Pressable>
      {expanded && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.answer, { color: palette.gray[300] }]}>{answer}</Text>
        </>
      )}
    </View>
  );
}

export default AccordionItem;
