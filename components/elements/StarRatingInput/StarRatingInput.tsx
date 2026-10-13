import {
  AccessibilityActionEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const starIcon = require('@/assets/images/profile/star-rating.png');

const MAX_RATING = 5;
const STEP = 0.5;

export interface StarRatingInputProps {
  /** 0-5 in half steps; `null` until the user picks one. */
  value: number | null;
  onChange: (value: number) => void;
  starSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  halves: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
  },
});

function clamp(value: number): number {
  return Math.max(0, Math.min(MAX_RATING, value));
}

// "4.5 out of 5 stars" / "No rating".
export function ratingText(value: number | null): string {
  return value === null ? 'No rating' : `${value} out of ${MAX_RATING} stars`;
}

// A five-star picker in half steps (backend 23 reviews). Each star is two
// tap targets - the left half sets n - 0.5, the right half n. Screen readers
// get one adjustable control instead, stepping 0.5 at a time from 0 to 5; that
// is also the only way to reach 0, since the tap targets start at 0.5.
function StarRatingInput({
  value,
  onChange,
  starSize = 36,
  disabled = false,
  style,
  testID,
}: StarRatingInputProps) {
  const { palette } = useTheme();
  const starStyle = { width: starSize, height: starSize };

  function select(next: number) {
    if (!disabled) onChange(clamp(next));
  }

  function onAccessibilityAction(event: AccessibilityActionEvent) {
    if (event.nativeEvent.actionName === 'increment') select((value ?? 0) + STEP);
    // Nothing to decrease from until a rating is picked.
    if (event.nativeEvent.actionName === 'decrement' && value !== null) select(value - STEP);
  }

  return (
    <View
      style={[styles.root, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Rating"
      accessibilityValue={{ min: 0, max: MAX_RATING, now: value ?? 0, text: ratingText(value) }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      testID={testID}>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const star = index + 1;
        const fill = value === null ? 0 : Math.max(0, Math.min(1, value - index));
        return (
          <View key={star} style={[styles.star, starStyle]}>
            <Image
              source={starIcon}
              style={starStyle}
              contentFit="contain"
              tintColor={palette.gray[200]}
            />
            {fill > 0 ? (
              <View style={[styles.fill, { width: starSize * fill }]}>
                <Image source={starIcon} style={starStyle} contentFit="contain" />
              </View>
            ) : null}
            <View style={styles.halves}>
              <Pressable
                style={styles.half}
                disabled={disabled}
                importantForAccessibility="no"
                onPress={() => select(star - STEP)}
                testID={testID ? `${testID}-${star - STEP}` : undefined}
              />
              <Pressable
                style={styles.half}
                disabled={disabled}
                importantForAccessibility="no"
                onPress={() => select(star)}
                testID={testID ? `${testID}-${star}` : undefined}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default StarRatingInput;
