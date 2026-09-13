import { View, TextInput, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const searchIcon = require('@/assets/images/home/search.png');

export type SearchBarVariant = 'pill' | 'rounded';

export interface SearchBarProps {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  variant?: SearchBarVariant;
  editable?: boolean;
  autoFocus?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  // Home/Search screens' pill field (Figma node 6119:6268).
  pill: {
    gap: 8,
    height: 54,
    borderRadius: 67,
    paddingHorizontal: 16,
  },
  // Messages tab's rounded-rectangle field (Figma node 6279:8123) - a
  // shorter, squarer, unfilled variant of the same control.
  rounded: {
    gap: 15,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 21,
  },
  icon: {
    width: 20,
    height: 20,
  },
  iconRounded: {
    width: 15,
    height: 15,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  inputPill: {
    fontSize: 16,
  },
  inputRounded: {
    fontSize: 14,
  },
});

// Search input reused two ways: as a real editable field with a
// live-filtering value (Search screen, scenes/main/Search.tsx; Messages
// tab, scenes/main/Message.tsx) or as a non-editable tap target that just
// navigates there (Home screen's search bar, scenes/main/Home.tsx) -
// `editable={false}` renders the same look but disables typing and wraps
// the field in a Pressable so `onPress` fires instead of opening a keyboard.
//
// Two shapes, since Figma draws this control differently per screen:
// `pill` (the default, node 6119:6268) is the tall filled pill Home/Search
// use; `rounded` (node 6279:8123) is the Messages tab's shorter, squarer,
// unfilled rectangle. Everything else about the control is shared.
function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search your campaign',
  variant = 'pill',
  editable = true,
  autoFocus,
  onPress,
  style,
  testID,
}: SearchBarProps) {
  const { colors, palette } = useTheme();
  const isRounded = variant === 'rounded';

  const field = (
    <View
      style={[
        styles.root,
        isRounded ? styles.rounded : styles.pill,
        isRounded
          ? { borderColor: colors.border, backgroundColor: colors.card }
          : { borderColor: palette.gray[50], backgroundColor: palette.gray[25] },
        style,
      ]}>
      <Image
        source={searchIcon}
        style={isRounded ? styles.iconRounded : styles.icon}
        contentFit="contain"
      />
      <TextInput
        style={[
          styles.input,
          isRounded ? styles.inputRounded : styles.inputPill,
          { color: colors.text.primary, pointerEvents: editable ? 'auto' : 'none' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.gray[300]}
        editable={editable}
        autoFocus={autoFocus}
        testID={editable ? testID : undefined}
      />
    </View>
  );

  if (editable) {
    return field;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      onPress={onPress}
      testID={testID}>
      {field}
    </Pressable>
  );
}

export default SearchBar;
