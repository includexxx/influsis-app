import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import Image from '@/components/elements/Image';

export interface PhoneCountryPrefixProps {
  /** Flag image URL; omitted while no country is selected. */
  flag?: string;
  dialCode?: string;
  onPress: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingRight: 10,
    borderRightWidth: 1,
  },
  flag: {
    width: 22,
    height: 16,
    borderRadius: 3,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '600',
  },
});

// The phone field's leading country picker: flag, dial code and a chevron,
// set off from the number by a hairline. Opens the country-code sheet.
export default function PhoneCountryPrefix({
  flag,
  dialCode,
  onPress,
  testID,
}: PhoneCountryPrefixProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dialCode ? `Country code ${dialCode}, change` : 'Select country code'}
      hitSlop={8}
      onPress={onPress}
      testID={testID}>
      <View style={[styles.root, { borderRightColor: colors.border }]}>
        {flag ? <Image source={{ uri: flag }} style={styles.flag} contentFit="cover" /> : null}
        {dialCode ? (
          <Text style={[styles.dialCode, { color: colors.text.primary }]}>{dialCode}</Text>
        ) : null}
        <Feather name="chevron-down" size={16} color={colors.text.secondary} />
      </View>
    </Pressable>
  );
}
