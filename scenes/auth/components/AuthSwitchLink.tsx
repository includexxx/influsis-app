import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';

export interface AuthSwitchLinkProps {
  prompt: string;
  action: string;
  onPress: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 20,
  },
  action: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
});

// "New to Influsis? Create an account" - the footer that switches between
// the sign-in and sign-up forms.
export default function AuthSwitchLink({ prompt, action, onPress, testID }: AuthSwitchLinkProps) {
  const { colors, palette, isDark } = useTheme();

  return (
    <View style={styles.root}>
      <Text style={[styles.prompt, { color: colors.text.secondary }]}>{prompt}</Text>
      <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress} testID={testID}>
        <Text
          style={[styles.action, { color: isDark ? palette.primary[300] : palette.primary[500] }]}>
          {action}
        </Text>
      </Pressable>
    </View>
  );
}
