import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { DropdownSurface, NumberFontFamily, Palette } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/features/auth/auth-store';
import type { VocabLevel } from '@/features/auth/api';
import type { DayListItem } from '@/features/vocabulary/api';
import { useDays, useStartQuiz } from '@/features/vocabulary/use-vocabulary';

const DAY_CARD_ACTION_HEIGHT = 66;
type ProgressFilter = 'ALL' | 'NOT_STARTED' | 'ONGOING' | 'COMPLETE';
const PROGRESS_COLORS: Record<ProgressFilter, { background: string; text: string }> = {
  ALL: { background: '#527C42', text: '#FFFFFF' },
  NOT_STARTED: { background: '#E4E7E1', text: '#596351' },
  ONGOING: { background: '#DDEBFF', text: '#376799' },
  COMPLETE: { background: '#D2E8C8', text: '#446F37' },
};

const LEVELS: { value: VocabLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];
const PROGRESS_FILTERS: { value: ProgressFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'NOT_STARTED', label: '시작 전' },
  { value: 'ONGOING', label: '진행 중' },
  { value: 'COMPLETE', label: '완료' },
];

/** 레벨 선택 → DAY 리스트. 기본값은 내 레벨이고 다른 레벨도 열람할 수 있다. */
export default function VocabularyHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myLevel = useAuthStore((state) => state.me?.vocabLevel ?? null);
  const [level, setLevel] = useState<VocabLevel | null>(null);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('ALL');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const selectedLevel = level ?? myLevel;
  const { data, isPending, error } = useDays(selectedLevel ?? undefined);
  const startQuiz = useStartQuiz();
  const completedDayCount = data?.filter((day) => day.attemptCount > 0).length ?? 0;
  const correctWordCount = data?.reduce((total, day) => total + savedCorrectCount(day), 0) ?? 0;
  const filteredDays =
    data?.filter(
      (day) => progressFilter === 'ALL' || getDayProgressStatus(day) === progressFilter,
    ) ?? [];

  function toggleDayCard(dayId: string) {
    setExpandedDayId((current) => (current === dayId ? null : dayId));
  }

  async function startDayQuiz(day: DayListItem) {
    if (day.inProgressAttemptId) {
      router.push(`/quiz/${day.inProgressAttemptId}`);
      return;
    }

    try {
      const attempt = await startQuiz.mutateAsync({ dayId: day.id });
      router.push(`/quiz/${attempt.attemptId}`);
    } catch (startError) {
      Alert.alert(
        '시험을 시작하지 못했어요',
        startError instanceof Error ? startError.message : '다시 시도해 주세요',
      );
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + 92,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
        onScrollBeginDrag={() => {
          setDifficultyOpen(false);
        }}
      >
        <View style={styles.summary}>
          <ThemedText style={styles.summaryTitle}>단어시험</ThemedText>
          <View style={styles.summaryStats}>
            <SummaryStat
              icon={{ ios: 'checkmark.circle.fill', android: 'task_alt', web: 'task_alt' }}
              label="완료한 Day"
              value={completedDayCount}
            />
            <View style={styles.summaryDivider} />
            <SummaryStat
              icon={{ ios: 'text.book.closed.fill', android: 'menu_book', web: 'menu_book' }}
              label="맞힌 단어"
              value={correctWordCount}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <View style={styles.difficultyPicker}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: difficultyOpen }}
              onPress={() => setDifficultyOpen((open) => !open)}
              style={[styles.difficultyTrigger, difficultyOpen && styles.difficultyTriggerOpen]}
            >
              <ThemedText style={styles.difficultyTriggerText}>
                {LEVELS.find((option) => option.value === selectedLevel)?.label ?? '난이도'}
              </ThemedText>
              <SymbolView
                name={difficultyOpen ? 'chevron.up' : 'chevron.down'}
                size={16}
                tintColor="#527C42"
                weight="semibold"
              />
            </Pressable>

            {difficultyOpen ? (
              <View style={styles.difficultyMenu}>
                <View style={styles.difficultyMenuContent}>
                  {LEVELS.map(({ label, value }, index) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedLevel === value }}
                      onPress={() => {
                        setLevel(value);
                        setDifficultyOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.difficultyOption,
                        index > 0 && styles.difficultyOptionDivider,
                        selectedLevel === value && styles.difficultyOptionSelected,
                        pressed && styles.difficultyOptionPressed,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.difficultyOptionText,
                          selectedLevel === value && styles.difficultyOptionSelectedText,
                        ]}
                      >
                        {label}
                      </ThemedText>
                      {selectedLevel === value ? (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={17}
                          tintColor="#527C42"
                        />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.progressFilter}>
            {PROGRESS_FILTERS.map(({ label, value }) => {
              const active = progressFilter === value;

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setExpandedDayId(null);
                    setProgressFilter(value);
                  }}
                  style={[
                    styles.progressFilterOption,
                    active && { backgroundColor: PROGRESS_COLORS[value].background },
                  ]}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.progressFilterText,
                      active && { color: PROGRESS_COLORS[value].text, fontWeight: '700' },
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.cards}>
          {isPending ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#527C42" />
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {error.message}
              </ThemedText>
            </View>
          ) : data?.length === 0 ? (
            <View style={styles.stateCard}>
              <ThemedText type="small" themeColor="textSecondary">
                아직 열린 단어장이 없어요
              </ThemedText>
            </View>
          ) : null}
          {filteredDays.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              expanded={expandedDayId === day.id}
              quizLoading={startQuiz.isPending}
              onStudy={() => router.push(`/vocabulary/${day.id}`)}
              onToggle={() => toggleDayCard(day.id)}
              onQuiz={() => void startDayQuiz(day)}
            />
          ))}
        </View>
      </ScrollView>

      <LinearGradient
        colors={['rgba(227, 242, 222, 1)', 'rgba(227, 242, 222, 0.94)', 'rgba(227, 242, 222, 0)']}
        pointerEvents="none"
        style={[styles.headerFade, { height: insets.top + 90 }]}
      />

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.topBarButton}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={Palette.ink}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="오답노트"
          onPress={() => router.push('/vocabulary/wrong-notes')}
          hitSlop={8}
          style={styles.wrongNotesButton}
        >
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
            size={20}
            tintColor={Palette.ink}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <ThemedText style={styles.wrongNotesText}>오답노트</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: {
    ios: 'checkmark.circle.fill' | 'text.book.closed.fill';
    android: 'task_alt' | 'menu_book';
    web: 'task_alt' | 'menu_book';
  };
  label: string;
  value: number;
}) {
  return (
    <View style={styles.summaryStat}>
      <SymbolView name={icon} size={20} tintColor="#527C42" weight="semibold" />
      <View>
        <ThemedText style={styles.summaryValue}>{value}</ThemedText>
        <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      </View>
    </View>
  );
}

function DayCard({
  day,
  expanded,
  quizLoading,
  onStudy,
  onToggle,
  onQuiz,
}: {
  day: DayListItem;
  expanded: boolean;
  quizLoading: boolean;
  onStudy: () => void;
  onToggle: () => void;
  onQuiz: () => void;
}) {
  const [actionHeight] = useState(() => new Animated.Value(expanded ? DAY_CARD_ACTION_HEIGHT : 0));
  const correctCount = savedCorrectCount(day);
  const progress = day.wordCount > 0 ? correctCount / day.wordCount : 0;
  const status = getDayProgressStatus(day);

  useEffect(() => {
    Animated.timing(actionHeight, {
      toValue: expanded ? DAY_CARD_ACTION_HEIGHT : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [actionHeight, expanded]);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Day ${day.dayNo}, ${getDayProgressLabel(status)}, ${correctCount}/${day.wordCount}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.cardMain, { opacity: pressed ? 0.82 : 1 }]}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.dayInfo}>
            <ThemedText style={styles.dayEyebrow}>Day</ThemedText>
            <ThemedText style={styles.dayTitle}>{day.dayNo}</ThemedText>
          </View>
          <CircularProgress progress={progress} />
        </View>
        <View style={styles.cardBottomRow}>
          <View
            style={[
              styles.statusChip,
              status === 'COMPLETE'
                ? styles.completeChip
                : status === 'ONGOING'
                  ? styles.ongoingChip
                  : styles.notStartedChip,
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                status === 'COMPLETE'
                  ? styles.completeText
                  : status === 'ONGOING'
                    ? styles.ongoingText
                    : styles.notStartedText,
              ]}
            >
              {getDayProgressLabel(status)}
            </ThemedText>
          </View>
          <ThemedText style={styles.wordCountText}>
            {correctCount}/{day.wordCount}
          </ThemedText>
        </View>
      </Pressable>

      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        style={[styles.cardActionsContainer, { height: actionHeight }]}
      >
        <View style={styles.cardActions}>
          <Pressable accessibilityRole="button" onPress={onStudy} style={styles.studyButton}>
            <ThemedText style={styles.studyButtonText}>단어 공부</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={quizLoading}
            onPress={onQuiz}
            style={[styles.quizButton, quizLoading && styles.disabledButton]}
          >
            <ThemedText style={styles.quizButtonText}>단어시험</ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function savedCorrectCount(day: DayListItem) {
  const completed = day.attemptCount > 0;

  // 목록 API가 정답 수를 아직 보내지 않는 경우에는 기존 최고 점수로 환산한다.
  return Math.min(
    day.wordCount,
    Math.max(
      0,
      day.correctCount ??
        (completed ? Math.round(((day.bestScore ?? 0) / 100) * day.wordCount) : 0),
    ),
  );
}

function getDayProgressStatus(day: DayListItem): Exclude<ProgressFilter, 'ALL'> {
  if (day.inProgressAttemptId) return 'ONGOING';
  if (day.attemptCount > 0) return 'COMPLETE';
  return 'NOT_STARTED';
}

function getDayProgressLabel(status: Exclude<ProgressFilter, 'ALL'>) {
  return PROGRESS_FILTERS.find((option) => option.value === status)?.label ?? status;
}

function CircularProgress({ progress }: { progress: number }) {
  const value = Math.min(1, Math.max(0, progress));
  const circumference = 2 * Math.PI * 36;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><circle cx="44" cy="44" r="36" fill="none" stroke="#F0F3ED" stroke-width="8"/>${value > 0 ? `<circle cx="44" cy="44" r="36" fill="none" stroke="#56AD62" stroke-width="8" stroke-linecap="round" stroke-dasharray="${value * circumference} ${circumference}" transform="rotate(-90 44 44)"/>` : ''}</svg>`;
  return (
    <View
      style={styles.progressCircle}
      accessible
      accessibilityLabel={`정답률 ${Math.round(value * 100)}퍼센트`}
    >
      <Image
        source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessible={false}
      />
      <View style={styles.progressCircleInner}>
        <ThemedText style={styles.progressPercent}>
          {Math.round(value * 100)}
          <ThemedText style={styles.progressUnit}>%</ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 3,
  },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  wrongNotesButton: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    gap: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  wrongNotesText: { color: Palette.ink, fontSize: 13, fontWeight: '600' },
  summary: { gap: 18, paddingHorizontal: 18, paddingBottom: 18 },
  summaryTitle: {
    color: Palette.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -1,
    paddingHorizontal: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
  },
  summaryStat: { flex: 1, gap: 10 },
  summaryValue: {
    color: Palette.ink,
    fontSize: 36,
    fontFamily: NumberFontFamily,
    lineHeight: 44,
    letterSpacing: -1,
  },
  summaryLabel: { color: '#7A8473', fontSize: 12, lineHeight: 18, marginTop: 4 },
  summaryDivider: { width: 1, height: 66, backgroundColor: '#EEF3E9' },
  filters: { gap: 12, marginBottom: 16, paddingHorizontal: 18, zIndex: 1 },
  difficultyPicker: { alignSelf: 'stretch', position: 'relative', zIndex: 2 },
  difficultyTrigger: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  difficultyTriggerOpen: { ...DropdownSurface },
  difficultyTriggerText: { color: Palette.ink, fontSize: 16, fontWeight: '600' },
  difficultyMenu: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    borderRadius: 24,
    ...DropdownSurface,
    shadowColor: '#23371B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  difficultyMenuContent: { overflow: 'hidden', borderRadius: 22 },
  difficultyOption: {
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyOptionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DFE7DA' },
  difficultyOptionSelected: { backgroundColor: '#EDF4E7' },
  difficultyOptionSelectedText: { color: '#446F37' },
  difficultyOptionPressed: { backgroundColor: '#F2F7ED' },
  difficultyOptionText: { color: Palette.ink, fontSize: 15, fontWeight: '600' },
  progressFilter: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 24,
    backgroundColor: '#F2F8ED',
  },
  progressFilterOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 20,
  },
  progressFilterText: { color: '#6D7C62', fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  list: { paddingTop: 6, paddingBottom: 100 },
  stateCard: { padding: 24, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center' },
  cards: { gap: 14, paddingHorizontal: 18 },
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardExpanded: { borderColor: '#A7BE99' },
  cardMain: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 30,
  },
  dayInfo: { flex: 1, gap: 6 },
  dayEyebrow: { color: '#7A8473', fontSize: 12, fontWeight: '600', letterSpacing: 0.8 },
  dayTitle: {
    color: Palette.ink,
    fontSize: 42,
    fontFamily: NumberFontFamily,
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeChip: { backgroundColor: '#E3F2DE' },
  ongoingChip: { backgroundColor: '#E5F0FF' },
  notStartedChip: { backgroundColor: '#F0F1EF' },
  statusText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  completeText: { color: '#446F37' },
  ongoingText: { color: '#376799' },
  notStartedText: { color: '#697164' },
  wordCountText: {
    width: 88,
    textAlign: 'center',
    color: '#7A8473',
    fontFamily: NumberFontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  progressCircle: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  progressCircleInner: { alignItems: 'center', justifyContent: 'center' },
  progressPercent: {
    color: Palette.ink,
    fontSize: 24,
    fontFamily: NumberFontFamily,
    lineHeight: 30,
  },
  progressUnit: { color: '#7A8473', fontSize: 11, fontWeight: '600' },
  cardActionsContainer: { overflow: 'hidden' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 20,
  },
  studyButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#EDF4E7',
  },
  quizButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Palette.ink,
  },
  disabledButton: { opacity: 0.45 },
  studyButtonText: { color: '#405E34', fontSize: 14, fontWeight: '700' },
  quizButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
