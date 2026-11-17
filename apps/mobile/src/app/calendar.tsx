import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { NumberFontFamily, Palette } from '@/constants/theme';
import { calendarMonthDays } from '@/features/homework/calendar-dates';
import { HomeworkCard } from '@/features/homework/homework-card';

import { toIsoDate, useAssignments } from '@/features/homework/use-homework';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_CELL_HEIGHT = 56;
const CALENDAR_CHROME_HEIGHT = 132;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => stripTime(new Date()));
  const assignments = useAssignments(displayedMonth);
  const today = stripTime(new Date());
  const allAssignments = assignments.data ?? [];
  const selectedKey = toIsoDate(selectedDate);
  const visible = allAssignments
    .filter((item) => item.assignedDate <= selectedKey && selectedKey <= item.dueDate)
    .sort(
      (first, second) =>
        Number(['SUBMITTED', 'REVIEWED'].includes(first.status)) -
          Number(['SUBMITTED', 'REVIEWED'].includes(second.status)) ||
        first.dueDate.localeCompare(second.dueDate),
    );
  const [calendarProgress] = useState(() => new Animated.Value(0));
  const [incomingMonth, setIncomingMonth] = useState<Date | null>(null);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [monthLabelWidth, setMonthLabelWidth] = useState(0);

  const days = useMemo(() => calendarMonthDays(displayedMonth), [displayedMonth]);
  const incomingDays = useMemo(
    () => (incomingMonth ? calendarMonthDays(incomingMonth) : null),
    [incomingMonth],
  );
  const changeMonth = useCallback(
    (amount: number) => {
      if (incomingMonth) return;
      const nextMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + amount,
        1,
      );

      setTransitionDirection(amount);
      setIncomingMonth(nextMonth);
      calendarProgress.setValue(0);

      requestAnimationFrame(() => {
        Animated.timing(calendarProgress, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start(() => {
          setDisplayedMonth(nextMonth);
          setSelectedDate(
            new Date(
              nextMonth.getFullYear(),
              nextMonth.getMonth(),
              Math.min(
                selectedDate.getDate(),
                new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate(),
              ),
            ),
          );
          setIncomingMonth(null);
          // 이전 달 뷰가 제거되기 전 progress를 0으로 되돌리면,
          // 화면 밖으로 나간 이전 달이 한 프레임 동안 다시 보일 수 있다.
          // 다음 전환을 시작할 때만 0으로 초기화한다.
        });
      });
    },
    [displayedMonth, selectedDate, calendarProgress, incomingMonth],
  );
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 날짜 버튼에서 시작한 터치도, 가로로 충분히 움직이면 달 넘김으로 전환한다.
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -48) changeMonth(1);
          if (gesture.dx >= 48) changeMonth(-1);
        },
      }),
    [changeMonth],
  );
  const screenWidth = Dimensions.get('window').width;
  const calendarHeight =
    CALENDAR_CHROME_HEIGHT +
    (Math.max(days.length, incomingDays?.length ?? 0) / 7) * DAY_CELL_HEIGHT;
  const outgoingTranslate = calendarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -transitionDirection * screenWidth],
  });
  const incomingTranslate = calendarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [transitionDirection * screenWidth, 0],
  });
  // Move each complete title outside the viewport before the next occupies it.
  const labelSlideDistance = (monthLabelWidth || screenWidth) + 12;
  const outgoingLabelTranslate = calendarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -transitionDirection * labelSlideDistance],
  });
  const incomingLabelTranslate = calendarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [transitionDirection * labelSlideDistance, 0],
  });
  const renderDayGrid = (monthDays: (Date | null)[], interactive: boolean) => (
    <View style={styles.dayGrid}>
      {monthDays.map((date, index) => {
        if (!date) return <View key={`blank-${index}`} style={styles.dayCell} />;
        const selected = sameDay(date, selectedDate);
        const isToday = sameDay(date, today);
        const hasDeadline = allAssignments.some((item) => item.dueDate === toIsoDate(date));
        return (
          <Pressable
            key={toIsoDate(date)}
            disabled={!interactive}
            accessibilityRole="button"
            accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}${hasDeadline ? ', 마감 숙제 있음' : ''}`}
            accessibilityState={{ selected }}
            onPress={() => setSelectedDate(date)}
            style={styles.dayCell}
          >
            <View
              style={[
                styles.dayCircle,
                isToday && !selected && styles.todayDay,
                selected && styles.selectedDay,
              ]}
            >
              <Text style={[styles.dayText, selected && styles.selectedDayText]}>
                {date.getDate()}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  hasDeadline && styles.deadlineDot,
                  selected && hasDeadline && styles.selectedDot,
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
  const renderMonthLabel = (month: Date) => (
    <>
      <Text style={styles.numberFont}>{month.getFullYear()}</Text>년{' '}
      <Text style={styles.numberFont}>{month.getMonth() + 1}</Text>월
    </>
  );
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
      >
        <View style={[styles.calendarViewport, { height: calendarHeight }]}>
          <View style={styles.calendarCard} {...panResponder.panHandlers}>
            <View style={styles.monthHeader}>
              <View
                style={styles.monthLabelViewport}
                onLayout={(event) => setMonthLabelWidth(event.nativeEvent.layout.width)}
              >
                {incomingMonth ? (
                  <>
                    <Animated.Text
                      numberOfLines={1}
                      style={[
                        styles.monthLabel,
                        { transform: [{ translateX: outgoingLabelTranslate }] },
                      ]}
                    >
                      {renderMonthLabel(displayedMonth)}
                    </Animated.Text>
                    <Animated.Text
                      numberOfLines={1}
                      style={[
                        styles.monthLabel,
                        styles.transitioningMonthLabel,
                        { transform: [{ translateX: incomingLabelTranslate }] },
                      ]}
                    >
                      {renderMonthLabel(incomingMonth)}
                    </Animated.Text>
                  </>
                ) : (
                  <Text numberOfLines={1} style={styles.monthLabel}>
                    {renderMonthLabel(displayedMonth)}
                  </Text>
                )}
              </View>
              <View style={styles.monthControls}>
                <MonthButton
                  label="이전 달"
                  direction="left"
                  disabled={Boolean(incomingMonth)}
                  onPress={() => changeMonth(-1)}
                />
                <MonthButton
                  label="다음 달"
                  direction="right"
                  disabled={Boolean(incomingMonth)}
                  onPress={() => changeMonth(1)}
                />
              </View>
            </View>
            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>
            <View
              style={[styles.dayGridViewport, { height: calendarHeight - CALENDAR_CHROME_HEIGHT }]}
            >
              {incomingMonth && incomingDays ? (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.transitioningCalendar,
                      { transform: [{ translateX: outgoingTranslate }] },
                    ]}
                  >
                    {renderDayGrid(days, false)}
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.transitioningCalendar,
                      { transform: [{ translateX: incomingTranslate }] },
                    ]}
                  >
                    {renderDayGrid(incomingDays, false)}
                  </Animated.View>
                </>
              ) : (
                renderDayGrid(days, true)
              )}
            </View>
          </View>
        </View>
        <View style={styles.scheduleHeader}>
          <Text style={styles.selectedDate}>
            <Text style={styles.numberFont}>{selectedDate.getMonth() + 1}</Text>월{' '}
            <Text style={styles.numberFont}>{selectedDate.getDate()}</Text>일{' '}
            <Text style={styles.selectedWeekday}>{WEEKDAYS[selectedDate.getDay()]}요일</Text>
          </Text>
          <Text style={styles.scheduleLabel}>일정 · 숙제</Text>
        </View>
        {assignments.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#527C42" />
          </View>
        ) : assignments.error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>숙제를 불러오지 못했습니다</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void assignments.refetch();
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>이 날짜에는 해당하는 숙제가 없어요</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {visible.map((item) => (
              <HomeworkCard
                key={item.id}
                assignment={item}
                onPress={() => router.push(`/homework/${item.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
function MonthButton({
  label,
  direction,
  disabled,
  onPress,
}: {
  label: string;
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.monthButton, disabled && { opacity: 0.4 }]}
    >
      <SymbolView
        name={
          direction === 'left'
            ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
        }
        size={17}
        tintColor={Palette.ink}
      />
    </Pressable>
  );
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18 },
  calendarViewport: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    height: 44,
    paddingHorizontal: 4,
  },
  monthLabelViewport: { flex: 1, height: 40, overflow: 'hidden', position: 'relative' },
  monthLabel: {
    width: '100%',
    color: Palette.ink,
    fontSize: 21,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  numberFont: { fontFamily: NumberFontFamily, fontWeight: 'normal' },
  transitioningMonthLabel: { position: 'absolute', top: 0, left: 0 },
  monthControls: { flexDirection: 'row', gap: 4 },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F0',
  },
  weekRow: { flexDirection: 'row', marginBottom: 10, height: 20 },
  weekday: {
    flex: 1,
    color: '#8B9683',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayGridViewport: { overflow: 'hidden', position: 'relative' },
  transitioningCalendar: { position: 'absolute', top: 0, left: 0, right: 0 },
  dayCell: { width: '14.2857%', height: 56, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: '94%',
    maxWidth: 46,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectedDay: { backgroundColor: '#527C42' },
  todayDay: { backgroundColor: '#EDF5E7' },
  dayText: { color: Palette.ink, fontSize: 21, lineHeight: 26, fontFamily: NumberFontFamily },
  selectedDayText: { color: '#FFFFFF' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  deadlineDot: { backgroundColor: '#56AD62' },
  selectedDot: { backgroundColor: '#FFFFFF' },
  scheduleHeader: {
    paddingBottom: 18,
    paddingTop: 26,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  selectedDate: { color: Palette.ink, fontSize: 20, fontWeight: '700' },
  selectedWeekday: { color: '#7B8774', fontSize: 13, fontWeight: '500' },
  scheduleLabel: { color: '#7B8774', fontSize: 12, fontWeight: '600' },
  taskList: { gap: 14 },
  stateCard: {
    padding: 28,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 14,
  },
  stateText: { color: '#53634F', fontSize: 14, textAlign: 'center' },
  retry: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#EDF5E7',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  retryText: { color: '#527C42', fontSize: 14, fontWeight: '700' },
});
