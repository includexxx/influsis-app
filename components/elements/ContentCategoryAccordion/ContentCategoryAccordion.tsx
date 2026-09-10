import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import Image from '../Image';
import Checkbox from '../Checkbox';

const chevronDownIcon = require('@/assets/images/create-gig/chevron-down.png');

export interface ContentCategoryOption {
  value: string;
  label: string;
}

export interface ContentCategoryAccordionProps {
  label: string;
  selected: boolean;
  expanded: boolean;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
  /** Subcategory checklist options; ignored when `children` is provided. */
  subcategoryOptions?: ContentCategoryOption[];
  selectedSubcategories?: string[];
  onToggleSubcategory?: (value: string) => void;
  /** Replaces the generated checklist body (the "Others" free-text field). */
  children?: ReactNode;
  /** Inline message shown under the body while the row is selected + open. */
  error?: string;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  chevron: {
    width: 24,
    height: 24,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Selectable category header (checkbox + label + expand chevron) over an
// inline subcategory checklist - the Content Categories onboarding step
// (build-plan 20c). `AccordionItem` is Help Center Q&A-specific (single open,
// string answer), so this is a sibling, not a reuse of it. The body renders
// only while the row is both selected and expanded; `children` swap the
// checklist for the "Others" specify field.
function ContentCategoryAccordion({
  label,
  selected,
  expanded,
  onToggleSelected,
  onToggleExpanded,
  subcategoryOptions = [],
  selectedSubcategories = [],
  onToggleSubcategory,
  children,
  error,
  testID,
}: ContentCategoryAccordionProps) {
  const { colors, palette } = useTheme();
  const open = selected && expanded;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
          borderColor: selected ? palette.primary[400] : palette.gray[100],
        },
      ]}
      testID={testID}>
      <View style={styles.header}>
        <Checkbox
          checked={selected}
          onPress={onToggleSelected}
          testID={testID ? `${testID}-checkbox` : undefined}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected, expanded }}
          onPress={onToggleExpanded}
          style={styles.headerPress}
          testID={testID ? `${testID}-header` : undefined}>
          <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
          <Image
            source={chevronDownIcon}
            style={[styles.chevron, expanded && styles.chevronExpanded]}
            contentFit="contain"
          />
        </Pressable>
      </View>

      {open && (
        <View style={styles.body}>
          {children ??
            subcategoryOptions.map(option => {
              const checked = selectedSubcategories.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  onPress={() => onToggleSubcategory?.(option.value)}
                  style={styles.subRow}
                  testID={testID ? `${testID}-sub-${option.value}` : undefined}>
                  <Text style={[styles.subLabel, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  <Checkbox checked={checked} pointerEvents="none" />
                </Pressable>
              );
            })}
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        </View>
      )}
    </View>
  );
}

export default ContentCategoryAccordion;
