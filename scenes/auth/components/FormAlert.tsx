import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

export interface FormAlertProps {
  message?: string;
  /** A way out of the error, e.g. "Start over" on an expired reset link. */
  action?: { label: string; onPress: () => void };
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});

// Form-level error banner for the auth screens (a failed sign-in, sign-up
// or reset that isn't tied to one field), with an optional action link.
// Renders nothing without a message.
export default function FormAlert({ message, action }: FormAlertProps) {
  const { colors, palette, isDark } = useTheme();
  if (!message) return null;
  const textColor = isDark ? palette.error[300] : palette.error[700];

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.alert,
        {
          backgroundColor: isDark ? 'rgba(249, 112, 102, 0.14)' : palette.error[50],
          borderColor: isDark ? 'rgba(249, 112, 102, 0.35)' : palette.error[200],
        },
      ]}
      testID="auth-form-alert">
      <Feather name="alert-circle" size={18} color={colors.error} />
      <View style={styles.body}>
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
        {action ? (
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={action.onPress}
            testID="auth-form-alert-action">
            <Text style={[styles.action, { color: textColor }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
