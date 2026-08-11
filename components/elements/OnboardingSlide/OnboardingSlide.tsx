import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { fonts } from '@/theme';

export interface OnboardingSlideProps {
  width: number;
  visual: React.ReactNode;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  visual: {
    width: '100%',
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  title: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
});

function OnboardingSlide({ width, visual, title, description, style }: OnboardingSlideProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { width }, style]}>
      <View style={styles.visual}>{visual}</View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
      </View>
    </View>
  );
}

export default OnboardingSlide;
