import { View, TextInput, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const searchIcon = require('@/assets/images/home/search.png');

export interface SearchBarProps {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
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
    gap: 8,
    height: 54,
    borderRadius: 67,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  icon: {
    width: 20,
    height: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});

// Pill-shaped search input (Figma node 6119:6268) reused two ways: as a
// real editable field with a live-filtering value (Search screen,
// scenes/main/Search.tsx) or as a non-editable tap target that just
// navigates there (Home screen's search bar, scenes/main/Home.tsx) -
// `editable={false}` renders the same look but disables typing and wraps
// the field in a Pressable so `onPress` fires instead of opening a keyboard.
function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search your campaign',
  editable = true,
  autoFocus,
  onPress,
  style,
  testID,
}: SearchBarProps) {
  const { colors, palette } = useTheme();

  const field = (
    <View
      style={[
        styles.root,
        { borderColor: palette.gray[50], backgroundColor: palette.gray[25] },
        style,
      ]}>
      <Image source={searchIcon} style={styles.icon} contentFit="contain" />
      <TextInput
        style={[
          styles.input,
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
