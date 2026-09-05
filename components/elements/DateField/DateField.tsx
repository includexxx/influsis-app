import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const calendarIcon = require('@/assets/images/profile-verification/calendar-today.png');

export interface DateFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  labelBadge: {
    position: 'absolute',
    top: -9,
    left: 12,
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
});

// Read-only "docked input date picker" field (Figma's M3 date field, node
// 6449:5839) - tapping anywhere on it opens CalendarPicker rather than
// bringing up a keyboard. The floating pink "Date" label is always shown
// (no typed-input state to animate it from), matching the Figma spec.
function DateField({
  label,
  value,
  placeholder = 'Select date',
  helperText,
  error,
  onPress,
  style,
  testID,
}: DateFieldProps) {
  const { colors, palette } = useTheme();

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
        style={[
          styles.root,
          { borderColor: error ? colors.error : palette.gray[100], backgroundColor: colors.card },
        ]}>
        <View style={[styles.labelBadge, { backgroundColor: colors.card }]}>
          <Text style={[styles.labelText, { color: palette.primary[400] }]}>{label}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.value, { color: value ? colors.text.primary : palette.gray[200] }]}>
            {value ?? placeholder}
          </Text>
          <View style={[styles.iconCircle, { backgroundColor: palette.primary[25] }]}>
            <Image source={calendarIcon} style={styles.icon} contentFit="contain" />
          </View>
        </View>
      </Pressable>
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: palette.gray[300] }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

export default DateField;
