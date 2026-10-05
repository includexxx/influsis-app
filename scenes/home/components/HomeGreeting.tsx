import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { greetingFor } from '../utils/greeting';

export interface HomeGreetingProps {
  /** Who to greet - see utils/greeting.ts's greetingName. */
  name: string;
  /** Injected for tests; defaults to now. */
  now?: Date;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: { gap: 2 },
  greeting: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  name: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3 },
});

// A short, personal opener above the earnings card: the time-of-day
// greeting and the creator's name.
function HomeGreeting({ name, now = new Date(), style }: HomeGreetingProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, style]} accessible accessibilityRole="header">
      <Text style={[styles.greeting, { color: colors.text.secondary }]}>{greetingFor(now)} 👋</Text>
      <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

export default HomeGreeting;
