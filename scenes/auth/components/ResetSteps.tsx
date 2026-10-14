import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

// The password-reset journey: Forgot Password (1) -> Verify OTP (2) -> Reset
// Password (3).
const STEPS = ['Email', 'Code', 'New password'] as const;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 8,
  },
});

// "Email -> Code -> New password" progress row for the password-reset
// screens: finished steps show a check, the current one is filled with the
// brand color, later ones stay muted.
export default function ResetSteps({ current }: { current: 1 | 2 | 3 }) {
  const { colors, palette, isDark } = useTheme();
  const brand = palette.primary[isDark ? 400 : 500];
  const muted = isDark ? palette.gray[700] : palette.gray[50];

  return (
    <View
      style={styles.root}
      accessibilityLabel={`Step ${current} of ${STEPS.length}: ${STEPS[current - 1]}`}
      testID="reset-steps">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={label}>
            {index > 0 ? (
              <View style={[styles.line, { backgroundColor: step <= current ? brand : muted }]} />
            ) : null}
            <View style={styles.step}>
              <View style={[styles.dot, { backgroundColor: done || active ? brand : muted }]}>
                {done ? (
                  <Feather name="check" size={14} color={palette.white} />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      { color: active ? palette.white : colors.text.secondary },
                    ]}>
                    {step}
                  </Text>
                )}
              </View>
              {active ? (
                <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
              ) : null}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
