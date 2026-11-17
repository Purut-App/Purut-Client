import { useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumberFontFamily, Palette } from '@/constants/theme';
import { calendarMonthDays } from './calendar-dates';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function HomeworkDatePicker({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const days = useMemo(() => calendarMonthDays(month), [month]);
  const today = new Date();
  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
  const move = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View
        style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="달력 닫기"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.heading}>
              <Text style={styles.title}>
                <Text style={styles.number}>{month.getFullYear()}</Text>년{' '}
                <Text style={styles.number}>{month.getMonth() + 1}</Text>월
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 달"
                onPress={() => move(-1)}
                style={styles.iconButton}
              >
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                  size={17}
                  tintColor={Palette.ink}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다음 달"
                onPress={() => move(1)}
                style={styles.iconButton}
              >
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={17}
                  tintColor={Palette.ink}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="달력 닫기"
                onPress={onClose}
                style={styles.iconButton}
              >
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={17}
                  tintColor="#8B9683"
                />
              </Pressable>
            </View>
            <View style={styles.weekdays}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {days.map((date, index) => {
                if (!date) return <View key={`blank-${index}`} style={styles.cell} />;
                const selected = sameDay(date, selectedDate);
                const isToday = sameDay(date, today);
                return (
                  <View key={date.getDate()} style={styles.cell}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}`}
                      onPress={() => {
                        onSelect(date);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.day,
                        selected && styles.daySelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.dayText, selected && styles.selectedText]}>
                        {date.getDate()}
                      </Text>
                      <View
                        style={[
                          styles.dot,
                          isToday && styles.todayDot,
                          isToday && selected && styles.selectedDot,
                        ]}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,31,44,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
  },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 26 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 0 },
  title: { flex: 1, color: Palette.ink, fontSize: 19, fontWeight: '700', letterSpacing: -0.5 },
  number: { fontFamily: NumberFontFamily, fontWeight: 'normal', fontSize: 22 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: { flexDirection: 'row', marginBottom: 12 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#8B9683',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 58, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: '94%',
    maxWidth: 48,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  daySelected: { backgroundColor: '#527C42' },
  dayText: { color: Palette.ink, fontFamily: NumberFontFamily, fontSize: 21, lineHeight: 26 },
  selectedText: { color: '#FFFFFF' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  todayDot: { backgroundColor: '#56AD62' },
  selectedDot: { backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.6 },
});
