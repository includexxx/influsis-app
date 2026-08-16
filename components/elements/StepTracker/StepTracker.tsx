import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const checkIcon = require('@/assets/images/order-details/tracker-check.png');
const incompleteIcon = require('@/assets/images/order-details/tracker-incomplete.png');

export interface StepTrackerStep {
  title: string;
  description: string;
  completed?: boolean;
}

export interface StepTrackerProps {
  steps: StepTrackerStep[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
  },
  iconColumn: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteIcon: {
    width: 24,
    height: 24,
  },
  checkIcon: {
    width: 12,
    height: 12,
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 1,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#313131',
  },
  description: {
    fontSize: 14,
    color: '#667085',
  },
});

// Vertical step tracker (Figma "Progress steps / Progress icons centered",
// node 6040:8719 - the Order Deliver screen's "Order Details" tab's "Order
// Tracker" card). A `completed` step gets a filled pink circle + checkmark
// and a pink connector down to the next step; an incomplete step gets
// Figma's own pre-flattened black-circle-plus-white-dot glyph and a gray
// connector. Generic step title/description so any future ordered-progress
// list (not just Order Tracker) can reuse it.
function StepTracker({ steps, style, testID }: StepTrackerProps) {
  const { palette } = useTheme();

  return (
    <View style={style} testID={testID}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={index} style={[styles.row, !isLast && { paddingBottom: 20 }]}>
            <View style={styles.iconColumn}>
              {step.completed ? (
                <View style={[styles.iconCircle, { backgroundColor: palette.primary[400] }]}>
                  <Image source={checkIcon} style={styles.checkIcon} contentFit="contain" />
                </View>
              ) : (
                <Image source={incompleteIcon} style={styles.incompleteIcon} contentFit="contain" />
              )}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: step.completed ? palette.primary[400] : palette.gray[300] },
                  ]}
                />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default StepTracker;
