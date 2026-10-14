import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { palette } from '@/theme';

export interface AuthSubmitButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  /** Greys the button out and ignores presses, e.g. with no reset token. */
  disabled?: boolean;
  testID?: string;
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // A soft brand-colored glow under the button.
    shadowColor: palette.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  busy: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: palette.white,
    letterSpacing: 0.2,
  },
});

// The auth screens' primary action: a full-width brand-gradient pill with a
// trailing arrow, swapped for a spinner (and disabled) while submitting.
// `disabled` greys it out when the form can't be sent at all.
export default function AuthSubmitButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  testID,
}: AuthSubmitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      disabled={disabled || isLoading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        isLoading && styles.busy,
        disabled && styles.disabled,
      ]}>
      <LinearGradient
        colors={[palette.primary[400], palette.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {isLoading ? (
        <ActivityIndicator color={palette.white} />
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          <Feather name="arrow-right" size={18} color={palette.white} />
        </>
      )}
    </Pressable>
  );
}
