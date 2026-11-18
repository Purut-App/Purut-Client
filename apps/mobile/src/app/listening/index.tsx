import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';

import { ThemedText } from '@/components/themed-text';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { DropdownSurface, NumberFontFamily, Palette } from '@/constants/theme';
import type { ExamListItem } from '@/features/listening/api';
import { useExams } from '@/features/listening/use-listening';
import { ExamDownloadButton } from '@/features/listening/exam-download-button';
import { useIsOnline } from '@/features/listening/use-network';
import { useExamDownload, useOfflineLibrary } from '@/features/listening/use-offline';

const EXAM_TYPE_OPTIONS: { label: string; value: ExamListItem['examType'] | null }[] = [
  { label: '전체', value: null },
  { label: '수능', value: 'SUNEUNG' },
  { label: '6모', value: 'MOCK_6' },
  { label: '9모', value: 'MOCK_9' },
];

/** 시험 선택. 연도와 시험 종류로 좁힌다. */
export default function ListeningHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState<number | null>(null);
  const [examType, setExamType] = useState<ExamListItem['examType'] | null>(null);
  const [openFilter, setOpenFilter] = useState<'year' | 'type' | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const { data, isPending, error } = useExams();
  const { exams: savedExams, refresh: refreshSaved } = useOfflineLibrary();
  const savedExamIds = useMemo(() => new Set(savedExams.map((exam) => exam.examId)), [savedExams]);

  const years = useMemo(
    () => [...new Set((data ?? []).map((exam) => exam.year))].sort((a, b) => b - a),
    [data],
  );

  const visible = useMemo(
    () =>
      (data ?? [])
        .filter((exam) => year === null || exam.year === year)
        .filter((exam) => examType === null || exam.examType === examType)
        .filter((exam) => !showSavedOnly || savedExamIds.has(exam.id)),
    [data, year, examType, savedExamIds, showSavedOnly],
  );

  const filtered = year !== null || examType !== null || showSavedOnly;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 86,
          paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
        }}
      >
        <View style={styles.heading}>
          <Text style={styles.pageTitle}>리스닝</Text>
        </View>
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            {years.length > 1 ? (
              <FilterPill
                icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                label={year === null ? '연도' : `${year}년`}
                open={openFilter === 'year'}
                options={[
                  { label: '전체', value: null },
                  ...years.map((value) => ({ label: `${value}년`, value })),
                ]}
                value={year}
                onPress={() => setOpenFilter((current) => (current === 'year' ? null : 'year'))}
                onChange={(value) => {
                  setYear(value);
                  setOpenFilter(null);
                }}
              />
            ) : null}
            <FilterPill
              icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
              label={
                EXAM_TYPE_OPTIONS.find((option) => option.value === examType)?.label ?? '시험 종류'
              }
              open={openFilter === 'type'}
              options={EXAM_TYPE_OPTIONS}
              value={examType}
              onPress={() => setOpenFilter((current) => (current === 'type' ? null : 'type'))}
              onChange={(value) => {
                setExamType(value);
                setOpenFilter(null);
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="저장한 회차만 보기"
              accessibilityState={{ selected: showSavedOnly }}
              hitSlop={8}
              onPress={() => setShowSavedOnly((current) => !current)}
              style={[styles.savedToggle, showSavedOnly && styles.savedToggleSelected]}
            >
              <SymbolView
                name={{ ios: 'arrow.down.circle', android: 'download', web: 'download' }}
                size={19}
                tintColor={showSavedOnly ? '#FFFFFF' : '#527C42'}
                weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
              />
            </Pressable>
          </View>
        </View>

        {isPending ? (
          <View style={styles.center}>
            <ActivityIndicator color="#527C42" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ThemedText type="small" themeColor="textSecondary">
              시험 목록을 불러오지 못했습니다
            </ThemedText>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.center}>
            <ThemedText type="small" themeColor="textSecondary">
              {filtered ? '조건에 맞는 시험이 없어요' : '등록된 듣기 시험이 없어요'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onPress={() => router.push(`/listening/${exam.id}/full`)}
                onDownloadChanged={refreshSaved}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <LinearGradient
        colors={['rgba(227,242,222,1)', 'rgba(227,242,222,0.94)', 'rgba(227,242,222,0)']}
        pointerEvents="none"
        style={[styles.headerFade, { height: insets.top + 86 }]}
      />
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={21}
            tintColor={Palette.ink}
          />
        </Pressable>
      </View>
    </View>
  );
}

function FilterPill<T extends string | number>({
  icon,
  label,
  open,
  value,
  options,
  onPress,
  onChange,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  open: boolean;
  value: T | null;
  options: { label: string; value: T | null }[];
  onPress: () => void;
  onChange: (value: T | null) => void;
}) {
  return (
    <View style={styles.filterPicker}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onPress}
        style={[styles.filterPill, (open || value !== null) && styles.filterPillActive]}
      >
        <View style={styles.filterIcon}>
          <SymbolView
            name={icon}
            size={17}
            tintColor="#527C42"
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
        </View>
        <ThemedText style={styles.filterPillText}>{label}</ThemedText>
        <SymbolView
          name={
            open
              ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
              : { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }
          }
          size={18}
          tintColor="#527C42"
          weight="semibold"
        />
      </Pressable>

      {open ? (
        <View style={styles.filterMenu}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <Pressable
                  key={option.value ?? 'all'}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(option.value)}
                  style={[styles.filterMenuOption, selected && styles.filterMenuOptionSelected]}
                >
                  <ThemedText
                    style={[styles.filterMenuText, selected && styles.filterMenuTextSelected]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function ExamCard({
  exam,
  onPress,
  onDownloadChanged,
}: {
  exam: ExamListItem;
  onPress: () => void;
  onDownloadChanged: () => Promise<void>;
}) {
  const [pressed, setPressed] = useState(false);
  const online = useIsOnline();
  const { offline, state, download, remove } = useExamDownload(exam.id);
  const progress =
    exam.itemCount === 0
      ? 0
      : Math.min(100, Math.max(0, (exam.completedCount / exam.itemCount) * 100));
  return (
    <View style={[styles.card, pressed && styles.cardPressed]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${exam.title}, ${exam.itemCount}문항 중 ${exam.completedCount}개 학습 완료`}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.cardMain}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.examType}>{exam.examTypeLabel}</Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={17}
            tintColor="#8B9683"
          />
        </View>
        <View style={styles.yearRow}>
          <Text style={styles.year}>{exam.year}</Text>
          <Text style={styles.yearUnit}>학년도</Text>
        </View>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {exam.itemCount}문항 · {exam.completedCount}개 학습 완료
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </Pressable>
      <View style={styles.cardFooter}>
        <ExamDownloadButton
          offline={Boolean(offline?.complete)}
          state={state}
          online={online}
          onDownload={() => {
            void download().then(onDownloadChanged);
          }}
          onRemove={() => {
            void remove().then(onDownloadChanged);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  heading: { paddingHorizontal: 22 },
  pageTitle: {
    color: Palette.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4 },
  filters: { zIndex: 3, paddingTop: 20, paddingBottom: 16 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  filterPicker: { position: 'relative', zIndex: 2, elevation: 2 },
  filterPill: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 22,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: { ...DropdownSurface },
  filterIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  filterPillText: { color: Palette.ink, fontSize: 14, fontWeight: '700' },
  filterMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    minWidth: 154,
    maxHeight: 240,
    ...DropdownSurface,
    borderRadius: 22,
    paddingVertical: 6,
    shadowColor: '#344A29',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  filterMenuOption: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  filterMenuOptionSelected: { backgroundColor: '#EDF5E7' },
  filterMenuText: { color: Palette.ink, fontSize: 15, fontWeight: '600' },
  filterMenuTextSelected: { color: '#446F37', fontWeight: '700' },
  savedToggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
  },
  savedToggleSelected: { backgroundColor: '#527C42' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { paddingHorizontal: 18, paddingTop: 4, gap: 14 },
  card: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardMain: {
    padding: 24,
    paddingBottom: 14,
    borderRadius: 28,
  },
  cardFooter: { paddingHorizontal: 24, paddingBottom: 20, alignItems: 'flex-end' },
  cardPressed: { borderColor: '#A7BE99', backgroundColor: '#FCFEFA' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examType: { color: '#527C42', fontSize: 14, fontWeight: '700' },
  yearRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  year: {
    color: Palette.ink,
    fontSize: 42,
    lineHeight: 52,
    fontFamily: NumberFontFamily,
    letterSpacing: -1.2,
  },
  yearUnit: { color: '#7B8774', fontSize: 14, fontWeight: '600' },
  examTitle: { color: Palette.ink, fontSize: 17, fontWeight: '700', lineHeight: 25, marginTop: 4 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 24,
    marginBottom: 10,
  },
  progressLabel: { color: '#7B8774', fontSize: 12, fontWeight: '500', flexShrink: 1 },
  progressPercent: { color: '#446F37', fontSize: 17, fontFamily: NumberFontFamily },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#EDF3E9' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#56AD62' },
});
