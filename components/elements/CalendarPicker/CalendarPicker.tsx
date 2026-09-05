import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';
import BottomSheet from '../BottomSheet';

const navBeforeIcon = require('@/assets/images/profile-verification/calendar-nav-before.png');
const navNextIcon = require('@/assets/images/profile-verification/calendar-nav-next.png');

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface CalendarPickerProps {
  value?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
  onClose?: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Local-date key (not toISOString, which converts to UTC and can shift the
// calendar day depending on the device's timezone offset).
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildMonthGrid(year: number, month: number): Date[][] {
  const startDayOfWeek = new Date(year, month, 1).getDay();
  const cursor = new Date(year, month, 1 - startDayOfWeek);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    borderRadius: 999,
  },
  dayText: {
    fontSize: 15,
  },
});

// BottomSheet-based month calendar grid for date-of-birth selection (Figma's
// "Docked Input Date Picker [desktop]" M3 component, node 6001:38419).
// Month/year prev-next navigation only - the dropdown carets shown in Figma
// for jumping directly to a month/year are decorative here (out of scope,
// see docs/screen/profile-verification/date-of-birth.md).
//
// Caller must only mount this when it should be visible (see SuccessSheet
// for why: @gorhom/bottom-sheet's keyboard listeners stay attached for as
// long as it's mounted, even while closed).
function CalendarPicker({ value, maxDate, onSelect, onClose }: CalendarPickerProps) {
  const { colors, palette } = useTheme();
  const initial = value ?? maxDate ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }

  const weeks = buildMonthGrid(viewYear, viewMonth);

  return (
    <BottomSheet isOpen initialOpen onClose={onClose} handleComponent={null}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.navGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={goToPrevMonth}>
              <Image source={navBeforeIcon} style={styles.navIcon} contentFit="contain" />
            </Pressable>
            <Text style={[styles.navLabel, { color: colors.text.primary }]}>
              {MONTH_NAMES[viewMonth]}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={goToNextMonth}>
              <Image source={navNextIcon} style={styles.navIcon} contentFit="contain" />
            </Pressable>
          </View>
          <View style={styles.navGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous year"
              onPress={() => setViewYear(y => y - 1)}>
              <Image source={navBeforeIcon} style={styles.navIcon} contentFit="contain" />
            </Pressable>
            <Text style={[styles.navLabel, { color: colors.text.primary }]}>{viewYear}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next year"
              onPress={() => setViewYear(y => y + 1)}>
              <Image source={navNextIcon} style={styles.navIcon} contentFit="contain" />
            </Pressable>
          </View>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, { color: palette.gray[300] }]}>{label}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map(date => {
              const inMonth = date.getMonth() === viewMonth;
              const isSelected = !!value && isSameDay(date, value);
              const isDisabled = !!maxDate && date > maxDate;

              return (
                <Pressable
                  key={dateKey(date)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  testID={`calendar-day-${dateKey(date)}`}
                  onPress={() => onSelect(date)}
                  style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayCell,
                      styles.daySelected,
                      { width: '78%', height: '78%' },
                      isSelected && { backgroundColor: palette.primary[400] },
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected
                            ? palette.white
                            : isDisabled
                              ? palette.gray[100]
                              : inMonth
                                ? colors.text.primary
                                : palette.gray[200],
                        },
                      ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

export default CalendarPicker;
