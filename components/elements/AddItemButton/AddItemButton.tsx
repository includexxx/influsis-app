import { Text, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const addFeatureIcon = require('@/assets/images/create-gig/add-feature.png');

export interface AddItemButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 14,
    lineHeight: 28,
    fontWeight: '500',
  },
});

// Ghost "+ Add feature" link (Figma "Frame 260", node 6301:8089 and
// siblings) used below both the "What's Included" and "Requirements for
// buyers" lists on the Create Gig pricing step - generic `label` so it can
// be reused for any future "add another item" affordance.
function AddItemButton({ label, style, ...others }: AddItemButtonProps) {
  const { palette } = useTheme();

  return (
    <Pressable accessibilityRole="button" style={[styles.root, style]} {...others}>
      <Image source={addFeatureIcon} style={styles.icon} contentFit="contain" />
      <Text style={[styles.label, { color: palette.gray[300] }]}>{label}</Text>
    </Pressable>
  );
}

export default AddItemButton;
