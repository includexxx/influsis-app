import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { passwordStrength } from '../utils/passwordStrength';

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  bars: {
    flexDirection: 'row',
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  caption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  hint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});

// Four-bar strength meter under the sign-up password field, colored from
// red (Weak) to green (Strong), with a tip until the password is strong.
// Hidden while the field is empty.
export default function PasswordStrengthMeter({ password }: { password: string }) {
  const { colors, palette, isDark } = useTheme();
  const { score, label } = passwordStrength(password);
  if (score === 0) return null;

  const color = [
    colors.error,
    colors.error,
    palette.warning[500],
    palette.primary[400],
    palette.success[500],
  ][score];

  return (
    <View
      style={styles.root}
      accessibilityLabel={`Password strength: ${label}`}
      testID="password-strength">
      <View style={styles.bars}>
        {[1, 2, 3, 4].map(step => (
          <View
            key={step}
            style={[
              styles.bar,
              {
                backgroundColor:
                  step <= score ? color : isDark ? palette.gray[700] : palette.gray[50],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.caption}>
        <Text style={[styles.hint, { color: colors.text.secondary }]}>
          {score < 4 ? 'Use 8+ characters with upper & lower case, a number and a symbol' : ' '}
        </Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}
