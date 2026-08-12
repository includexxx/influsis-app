import {
  Pressable,
  PressableProps,
  Text,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface SelectableListItemProps extends Omit<PressableProps, 'style'> {
  icon: ImageSourcePropType;
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});

// Toggleable icon + label row used by the profile-verification multi-select
// screens (content categories, social media, languages) - unselected rows
// get a neutral border, selected rows get the brand-pink border (Figma
// "Profile_2/3/4" frames).
function SelectableListItem({ icon, label, selected, style, ...others }: SelectableListItemProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.root,
        {
          borderColor: selected ? palette.primary[400] : palette.gray[100],
          backgroundColor: colors.card,
        },
        style,
      ]}
      {...others}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
    </Pressable>
  );
}

export default SelectableListItem;
