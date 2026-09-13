import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import BottomSheet from '../BottomSheet';
import SearchBar from '../SearchBar';
import Image from '../Image';

export interface CountryCodeOption {
  /** Lowercase ISO-3166 alpha-2 code, the value passed back to `onSelect`. */
  code: string;
  country: string;
  /** E.164 calling code, already `+`-prefixed (e.g. `+880`). */
  dialCode: string;
  /** Flag image URL (`@/data/country-flags`'s remote twemoji SVG). */
  flag: string;
}

export interface CountryCodeSheetProps {
  options: CountryCodeOption[];
  value?: string;
  onSelect: (code: string) => void;
  onClose?: () => void;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  searchGap: {
    marginBottom: spacing.xs,
  },
  option: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 24,
    height: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  empty: {
    paddingVertical: spacing['2xl'],
    textAlign: 'center',
    fontSize: 14,
  },
});

// Searchable country + dial-code list in a BottomSheet, opened by the Edit
// Profile screen's Phone Number flag (scenes/main/EditProfile.tsx). A
// separate component from `OptionSheet` rather than another of its variants:
// this list is the full ~250-country dataset, so it needs a search field,
// and its rows are two-column (country name left, dial code right) instead
// of `OptionSheet`'s centered single-label pills.
//
// Note the search field scrolls with the rows rather than sticking to the
// top - `BottomSheet` always wraps its children in its own scroll view, and
// a sticky header there would change every other consumer.
function CountryCodeSheet({ options, value, onSelect, onClose }: CountryCodeSheetProps) {
  const { colors, palette } = useTheme();
  const [query, setQuery] = useState('');

  // Matches on either half of the row, so both "bang" and "880" find
  // Bangladesh (with or without the user typing the leading `+`).
  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return options;
    return options.filter(
      option =>
        option.country.toLowerCase().includes(search) ||
        option.dialCode.includes(search.replace('+', '')),
    );
  }, [options, query]);

  return (
    <BottomSheet isOpen initialOpen onClose={onClose}>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search country"
          variant="rounded"
          style={styles.searchGap}
          testID="country-code-search"
        />

        {filteredOptions.length === 0 ? (
          <Text style={[styles.empty, { color: colors.text.secondary }]}>No country found</Text>
        ) : (
          filteredOptions.map(option => {
            const isSelected = option.code === value;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.option,
                  { backgroundColor: isSelected ? palette.primary[25] : palette.gray[25] },
                ]}
                onPress={() => onSelect(option.code)}
                testID={`country-code-${option.code}`}>
                <Image
                  source={{ uri: option.flag }}
                  style={styles.optionIcon}
                  contentFit="contain"
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? palette.primary[400] : colors.text.primary },
                  ]}
                  numberOfLines={1}>
                  {option.country}
                </Text>
                <Text
                  style={[
                    styles.dialCode,
                    { color: isSelected ? palette.primary[400] : palette.gray[300] },
                  ]}>
                  {option.dialCode}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </BottomSheet>
  );
}

export default CountryCodeSheet;
