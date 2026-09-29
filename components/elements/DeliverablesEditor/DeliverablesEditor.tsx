import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks';
import { palette, radius } from '@/theme';

import AddItemButton from '../AddItemButton';

export interface DeliverablesEditorItem {
  /** Stable per row, e.g. "instagram:reels". */
  key: string;
  label: string;
  count: number;
}

export interface DeliverablesEditorProps {
  items: DeliverablesEditorItem[];
  onCountChange: (index: number, count: number) => void;
  onRemove: (index: number) => void;
  /** Opens the caller-owned picker (an `OptionSheet` rendered by the scene). */
  onAddPress: () => void;
  /** Disables "Add deliverable" (list full, or nothing left to add). */
  addDisabled?: boolean;
  /** Row index -> message. */
  rowErrors?: Record<number, string>;
  /** A list-level message (empty list, too many). */
  error?: string | null;
  min?: number;
  max?: number;
  emptyText?: string;
  disabled?: boolean;
  testID?: string;
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  list: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  rowDivider: { borderTopWidth: 1 },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 12, lineHeight: 18 },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 14,
  },
});

// Backend 18l - edits one engagement's deliverables list ("scope"): a row per
// deliverable with a - count + control and a remove button, plus an "Add
// deliverable" button. Generic and controlled: the scene supplies labelled
// rows, applies each change, and owns the add picker - an OptionSheet must be
// a sibling of the scene's ScrollView (see CustomSelectField), so it can't
// live inside this element.
function DeliverablesEditor({
  items,
  onCountChange,
  onRemove,
  onAddPress,
  addDisabled = false,
  rowErrors = {},
  error = null,
  min = 1,
  max = 50,
  emptyText = 'Add at least one deliverable.',
  disabled = false,
  testID,
}: DeliverablesEditorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.root} testID={testID}>
      {items.length ? (
        <View style={[styles.list, { borderColor: colors.border }]}>
          {items.map((item, index) => {
            const rowError = rowErrors[index];
            const canDecrease = !disabled && item.count > min;
            const canIncrease = !disabled && item.count < max;
            return (
              <View
                key={item.key}
                style={[
                  styles.row,
                  index > 0 && [styles.rowDivider, { borderTopColor: colors.border }],
                ]}
                testID={testID ? `${testID}-row-${index}` : undefined}>
                <View style={styles.rowMain}>
                  <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease ${item.label}`}
                      accessibilityState={{ disabled: !canDecrease }}
                      disabled={!canDecrease}
                      onPress={() => onCountChange(index, item.count - 1)}
                      style={[styles.stepButton, { borderColor: colors.border }]}>
                      <Feather
                        name="minus"
                        size={16}
                        color={canDecrease ? colors.text.primary : palette.gray[200]}
                      />
                    </Pressable>
                    <Text style={[styles.count, { color: colors.text.primary }]}>{item.count}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Increase ${item.label}`}
                      accessibilityState={{ disabled: !canIncrease }}
                      disabled={!canIncrease}
                      onPress={() => onCountChange(index, item.count + 1)}
                      style={[styles.stepButton, { borderColor: colors.border }]}>
                      <Feather
                        name="plus"
                        size={16}
                        color={canIncrease ? colors.text.primary : palette.gray[200]}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.label}`}
                    disabled={disabled}
                    onPress={() => onRemove(index)}
                    style={styles.remove}>
                    <Feather name="trash-2" size={18} color={colors.text.primary} />
                  </Pressable>
                </View>
                {rowError ? (
                  <Text style={[styles.error, { color: colors.error }]}>{rowError}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[styles.empty, { borderColor: colors.border, color: palette.gray[300] }]}>
          {emptyText}
        </Text>
      )}

      <AddItemButton
        label="Add deliverable"
        onPress={onAddPress}
        disabled={disabled || addDisabled}
        accessibilityState={{ disabled: disabled || addDisabled }}
        testID={testID ? `${testID}-add` : undefined}
      />

      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default DeliverablesEditor;
