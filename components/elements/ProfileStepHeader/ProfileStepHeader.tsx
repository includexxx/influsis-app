import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { spacing } from '@/theme';
import Image from '../Image';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

export interface ProfileStepHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  /** When set, renders a back chevron above the progress track (steps 2+). */
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  backButton: {
    width: 24,
    height: 24,
    marginBottom: spacing.lg,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  progressTrack: {
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: 6,
    borderRadius: 10,
  },
  stepLabel: {
    alignSelf: 'flex-end',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
  },
});

// Progress bar + "X of Y" + title + description block repeated at the top of
// every creator onboarding step (named for the retired profile-verification
// wizard). `onBack` adds the in-screen back affordance the onboarding flow
// wants on every step but the first (requirements §5).
function ProfileStepHeader({
  step,
  totalSteps,
  title,
  description,
  onBack,
  style,
}: ProfileStepHeaderProps) {
  const { colors, palette } = useTheme();
  const progress = Math.min(Math.max(step / totalSteps, 0), 1);

  return (
    <View style={style}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backButton}
          onPress={onBack}>
          <Image source={backChevronIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
      ) : null}
      <View style={[styles.progressTrack, { backgroundColor: palette.gray[50] }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: palette.primary[400] },
          ]}
        />
      </View>
      <Text style={[styles.stepLabel, { color: palette.gray[500] }]}>
        {step} of {totalSteps}
      </Text>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.description, { color: palette.gray[300] }]}>{description}</Text>
    </View>
  );
}

export default ProfileStepHeader;
