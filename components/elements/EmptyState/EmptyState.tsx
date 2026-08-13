import { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface EmptyStateProps {
  illustration: ReactNode;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 32,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    width: 291,
  },
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});

// Generic "nothing here" block (Figma "Illustration" + "Text", node
// 6123:7563) - an illustration slot plus title/description, centered. First
// used by the Search screen's "No campaign Found" state
// (docs/screen/search), written generically so other screens without data
// yet (Order, Message, ...) can reuse it with their own illustration.
function EmptyState({ illustration, title, description, style }: EmptyStateProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      {illustration}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: palette.gray[900] }]}>{title}</Text>
        <Text style={[styles.description, { color: palette.gray[300] }]}>{description}</Text>
      </View>
    </View>
  );
}

export default EmptyState;
