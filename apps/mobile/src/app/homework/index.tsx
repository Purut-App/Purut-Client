import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { NumberFontFamily, Palette } from '@/constants/theme';
import type { AssignmentListItem, CalendarStatus } from '@/features/homework/api';

import { HomeworkCard } from '@/features/homework/homework-card';
import { HomeworkDatePicker } from '@/features/homework/date-picker';
import { useAssignments } from '@/features/homework/use-homework';

type HomeworkFilter = 'all' | 'completed' | 'incomplete';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export default function HomeworkListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filter, setFilter] = useState<HomeworkFilter>('all');
  const { data, isPending, error, refetch } = useAssignments(month);
  const today = startOfDay(new Date());
  const weekDates = useMemo(() => datesInWeek(selectedDate), [selectedDate]);
  const selectedDateKey = dateKey(selectedDate);
  const filteredAssignments = (data ?? [])
    .filter((assignment) => isAssignmentActiveOnDate(assignment, selectedDateKey))
    .filter((assignment) => matchesFilter(assignment.status, filter))
    .sort((first, second) => {
      const firstSubmitted = matchesFilter(first.status, 'completed');
      const secondSubmitted = matchesFilter(second.status, 'completed');
      return (
        Number(firstSubmitted) - Number(secondSubmitted) ||
        first.dueDate.localeCompare(second.dueDate)
      );
    });

  function chooseDate(date: Date) {
    setSelectedDate(date);
    setMonth(startOfMonth(date));
  }
  function changeMonth(delta: number) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    chooseDate(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDate.getDate(), lastDay),
      ),
    );
  }
  const weekSwipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 45 || Math.abs(gesture.dx) < Math.abs(gesture.dy) * 1.5)
            return;
          const next = new Date(selectedDate);
          next.setDate(next.getDate() + (gesture.dx < 0 ? 7 : -7));
          setSelectedDate(next);
          setMonth(startOfMonth(next));
        },
      }),
    [selectedDate],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.calendarHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topNavigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            onPress={() => router.back()}
            style={styles.topNavigationButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={21}
              tintColor={Palette.ink}
            />
          </Pressable>
          <Text style={styles.pageTitle}>숙제</Text>
          {/* Preserve the existing homework-add entry point; its creation flow is separate. */}
          <View style={styles.addButton} accessible accessibilityLabel="숙제 추가">
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={24}
              tintColor="#FFFFFF"
            />
          </View>
        </View>
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${month.getFullYear()}년 ${month.getMonth() + 1}월, 달력에서 날짜 선택`}
            accessibilityState={{ expanded: calendarOpen }}
            onPress={() => setCalendarOpen(true)}
            style={styles.monthPickerButton}
          >
            <Text style={styles.monthTitle}>
              <Text style={styles.monthNumber}>{month.getFullYear()}</Text>년{' '}
              <Text style={styles.monthNumber}>{month.getMonth() + 1}</Text>월
            </Text>
            <SymbolView
              name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
              size={15}
              tintColor="#7B8774"
            />
          </Pressable>
          <View style={styles.monthButtons}>
            <CalendarButton label="이전 달" direction="left" onPress={() => changeMonth(-1)} />
            <CalendarButton label="다음 달" direction="right" onPress={() => changeMonth(1)} />
          </View>
        </View>
        <View style={styles.dateRow} {...weekSwipe.panHandlers}>
          {weekDates.map((date) => {
            const active = sameDay(date, selectedDate);
            const isToday = sameDay(date, today);
            return (
              <Pressable
                key={dateKey(date)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}`}
                onPress={() => chooseDate(date)}
                style={[styles.dateChip, active && styles.dateChipActive]}
              >
                <Text style={[styles.weekday, active && styles.dateTextActive]}>
                  {WEEKDAYS[date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, active && styles.dateTextActive]}>
                  {date.getDate()}
                </Text>
                <View
                  style={[
                    styles.todayDot,
                    isToday && styles.todayDotVisible,
                    isToday && active && styles.todayDotActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.filterRow}>
          <HomeworkFilterButton
            active={filter === 'all'}
            label="전체"
            onPress={() => setFilter('all')}
          />
          <HomeworkFilterButton
            active={filter === 'incomplete'}
            label="미제출"
            onPress={() => setFilter('incomplete')}
          />
          <HomeworkFilterButton
            active={filter === 'completed'}
            label="제출완료"
            onPress={() => setFilter('completed')}
          />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          }}
        >
          {isPending ? (
            <View style={styles.center}>
              <ActivityIndicator color="#527C42" />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>숙제를 불러오지 못했습니다</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : filteredAssignments.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>이 날짜에는 해당하는 숙제가 없어요</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {filteredAssignments.map((assignment) => (
                <HomeworkCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => router.push(`/homework/${assignment.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
      {calendarOpen ? (
        <HomeworkDatePicker
          selectedDate={selectedDate}
          onSelect={chooseDate}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}
    </View>
  );
}

function CalendarButton({
  direction,
  label,
  onPress,
}: {
  direction: 'left' | 'right';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.calendarButton}
    >
      <SymbolView
        name={
          direction === 'left'
            ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
        }
        size={15}
        tintColor={Palette.ink}
      />
    </Pressable>
  );
}
function HomeworkFilterButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.filterButton, active && styles.filterButtonActive]}
    >
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
    </Pressable>
  );
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function datesInWeek(date: Date) {
  const first = new Date(date);
  first.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(first);
    day.setDate(first.getDate() + index);
    return day;
  });
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function matchesFilter(status: CalendarStatus, filter: HomeworkFilter) {
  if (filter === 'all') return true;

  const completed = status === 'SUBMITTED' || status === 'REVIEWED';
  return filter === 'completed' ? completed : !completed;
}

function isAssignmentActiveOnDate(assignment: AssignmentListItem, selectedDate: string) {
  return assignment.assignedDate <= selectedDate && selectedDate <= assignment.dueDate;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  calendarHeader: { paddingHorizontal: 20, paddingBottom: 22 },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  topNavigationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { color: Palette.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.5 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  monthPickerButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { color: Palette.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.6 },
  monthNumber: { fontFamily: NumberFontFamily, fontWeight: 'normal' },
  monthButtons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calendarButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', gap: 7, marginTop: 18 },
  dateChip: {
    flex: 1,
    minHeight: 74,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6FAF3',
    gap: 4,
  },
  dateChipActive: { backgroundColor: '#527C42' },
  dateNumber: { color: Palette.ink, fontSize: 23, fontFamily: NumberFontFamily },
  weekday: { color: '#53634F', fontSize: 11, fontWeight: '500' },
  dateTextActive: { color: '#FFFFFF' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  todayDotVisible: { backgroundColor: '#527C42' },
  todayDotActive: { backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 18 },
  filterButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#F6FAF3',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: Palette.ink },
  filterLabel: { color: '#53634F', fontSize: 13, fontWeight: '600' },
  filterLabelActive: { color: '#FFFFFF' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: APP_BOTTOM_NAV_CONTENT_OFFSET,
  },
  emptyText: { color: '#53634F', fontSize: 15, textAlign: 'center' },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  retryText: { color: Palette.ink, fontSize: 14, fontWeight: '700' },
  cardList: { gap: 14, paddingHorizontal: 18 },
});
