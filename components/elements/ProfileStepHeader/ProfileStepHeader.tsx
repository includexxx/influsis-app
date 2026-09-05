import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface ProfileStepHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: 6,
    borderRadius: 10,
  },
  stepLabel: {
    alignSelf: 'flex-end',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
  },
});

// Progress bar + "X of Y" + title + description block repeated at the top of
// every profile-verification step (Figma "Profile_1".."Profile_5" frames -
// same layout shape, only the copy and step number differ).
function ProfileStepHeader({
  step,
  totalSteps,
  title,
  description,
  style,
}: ProfileStepHeaderProps) {
  const { colors, palette } = useTheme();
  const progress = Math.min(Math.max(step / totalSteps, 0), 1);

  return (
    <View style={style}>
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
