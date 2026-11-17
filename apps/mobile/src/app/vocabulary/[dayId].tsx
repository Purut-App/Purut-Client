import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NumberFontFamily, Palette } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { useAuthStore } from '@/features/auth/auth-store';
import type { WordItem } from '@/features/vocabulary/api';
import { useSavedWords } from '@/features/vocabulary/use-saved-words';
import { useDay, useDays } from '@/features/vocabulary/use-vocabulary';

type WordViewMode = 'ALL' | 'HEADWORD' | 'MEANING';

const WORD_VIEW_OPTIONS: { label: string; value: WordViewMode }[] = [
  { label: '전체보기', value: 'ALL' },
  { label: '영어단어', value: 'HEADWORD' },
  { label: '뜻 보기', value: 'MEANING' },
];

/**
 * 단어장.
 * DAY의 실제 응시 결과를 기준으로 맞춘 단어와 다시 볼 단어를 한눈에 보여 준다.
 */
export default function WordListScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.me?.id ?? null);

  const { data, isPending, error } = useDay(dayId);
  const { data: days } = useDays();
  const { savedWordIds, toggleSavedWord } = useSavedWords(userId);
  const [wordViewMode, setWordViewMode] = useState<WordViewMode>('ALL');
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

  function toggleWordCard(wordId: number) {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setExpandedWordId((current) => (current === wordId ? null : wordId));
  }

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          단어장을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  const daySummary = days?.find((day) => day.id === dayId);
  const correctCount = getCorrectCount(daySummary?.correctCount, data.words.length);
  const unansweredCount = Math.max(0, data.words.length - correctCount);

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
      >
        <View style={styles.studyHeading}>
          <ThemedText style={styles.studyTitle}>단어 공부</ThemedText>
          <ThemedText style={styles.totalWords}>
            Day {data.dayNo} · {data.words.length} words
          </ThemedText>
        </View>
        <View style={styles.summaryCards}>
          <SummaryCard count={correctCount} label="맞춘 단어" tone="green" />
          <SummaryCard count={unansweredCount} label="아직 못 맞춘 단어" tone="blue" />
        </View>

        <View style={styles.wordViewFilter}>
          {WORD_VIEW_OPTIONS.map(({ label, value }) => {
            const selected = wordViewMode === value;

            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setWordViewMode(value)}
                style={[styles.wordViewOption, selected && styles.wordViewOptionSelected]}
              >
                <ThemedText
                  style={[styles.wordViewOptionText, selected && styles.wordViewOptionTextSelected]}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.wordList}>
          {data.words.map((word) => (
            <WordRow
              key={word.id}
              word={word}
              viewMode={wordViewMode}
              expanded={expandedWordId === word.id}
              onPress={() => toggleWordCard(word.id)}
              saved={savedWordIds.has(word.id)}
              onToggleSaved={() =>
                void toggleSavedWord(word, dayId, data.title ?? `Day ${data.dayNo}`)
              }
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
        <ThemedText numberOfLines={1} style={styles.topBarTitle}>
          {data.title ?? `Day ${data.dayNo}`}
        </ThemedText>
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
          style={styles.topBarButton}
        >
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
            size={20}
            tintColor={Palette.ink}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

function getCorrectCount(correctCount: number | null | undefined, wordCount: number) {
  return Math.min(wordCount, Math.max(0, correctCount ?? 0));
}

function SummaryCard({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: 'green' | 'blue';
}) {
  return (
    <View style={styles.summaryCard}>
      <ThemedText
        style={[styles.summaryCount, tone === 'green' ? styles.greenCount : styles.blueCount]}
      >
        {count}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function WordRow({
  word,
  viewMode,
  expanded,
  onPress,
  saved,
  onToggleSaved,
}: {
  word: WordItem;
  viewMode: WordViewMode;
  expanded: boolean;
  onPress: () => void;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const showHeadword = viewMode !== 'MEANING' || expanded;
  const showMeaning = viewMode !== 'HEADWORD' || expanded;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wordRow,
        expanded && styles.wordRowExpanded,
        pressed && styles.wordRowPressed,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? '내 단어장에서 제거' : '내 단어장에 저장'}
        accessibilityState={{ selected: saved }}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          onToggleSaved();
        }}
        style={[styles.saveButton, saved && styles.saveButtonSelected]}
      >
        <SymbolView
          name={{
            ios: saved ? 'heart.fill' : 'heart',
            android: saved ? 'favorite' : 'favorite_border',
            web: saved ? 'favorite' : 'favorite_border',
          }}
          size={22}
          tintColor={saved ? '#527C42' : '#8B9683'}
          weight="semibold"
        />
      </Pressable>
      <View style={styles.wordContent}>
        <ThemedText style={[styles.wordHeadword, !showHeadword && styles.hiddenWordContent]}>
          {showHeadword ? word.headword : '• • •'}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={[styles.wordMeaning, !showMeaning && styles.hiddenWordContent]}
        >
          {showMeaning ? word.meaningKo : '• • •'}
        </ThemedText>
      </View>
      {word.exampleEn && expanded ? (
        <View style={styles.exampleSection}>
          <View style={styles.exampleDivider} />
          <ThemedText style={styles.exampleLabel}>예문</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.example}>
            {word.exampleEn}
          </ThemedText>
          {word.exampleKo ? (
            <ThemedText style={styles.exampleTranslation}>{word.exampleKo}</ThemedText>
          ) : null}
        </View>
      ) : null}
      <View style={styles.expandIndicator}>
        <SymbolView
          name={
            expanded
              ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
              : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
          }
          size={14}
          tintColor="#8B9683"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  center: { flex: 1, backgroundColor: '#E3F2DE', alignItems: 'center', justifyContent: 'center' },
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
    zIndex: 2,
  },
  topBarTitle: {
    position: 'absolute',
    right: 78,
    left: 78,
    bottom: 29,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  topBarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  list: { paddingHorizontal: 18, gap: 18 },
  studyHeading: { gap: 6, paddingHorizontal: 4 },
  studyTitle: {
    color: Palette.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -1,
  },
  totalWords: { color: '#63745A', fontSize: 13, lineHeight: 20 },
  summaryCards: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    minHeight: 136,
    justifyContent: 'space-between',
    padding: 22,
    gap: 12,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  summaryCount: { fontSize: 40, lineHeight: 48, fontFamily: NumberFontFamily, letterSpacing: -1.5 },
  greenCount: { color: '#446F37' },
  blueCount: { color: '#376799' },
  summaryLabel: { color: '#737D6C', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  wordViewFilter: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 24,
    backgroundColor: '#F2F8ED',
  },
  wordViewOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  wordViewOptionSelected: { backgroundColor: '#527C42' },
  wordViewOptionText: { color: '#6D7C62', fontSize: 13, fontWeight: '600' },
  wordViewOptionTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  wordList: { gap: 14 },
  wordRow: {
    position: 'relative',
    minHeight: 138,
    padding: 22,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  wordRowExpanded: { borderColor: '#A7BE99' },
  wordRowPressed: { opacity: 0.8 },
  saveButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  saveButtonSelected: { backgroundColor: '#EDF4E7' },
  wordContent: { gap: 10, paddingRight: 42 },
  wordHeadword: {
    color: Palette.ink,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  wordMeaning: { color: '#63745A', fontSize: 16, lineHeight: 24 },
  hiddenWordContent: { color: '#B0BAA8' },
  exampleSection: { gap: 9, paddingTop: 18 },
  exampleDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#DDE7D6', marginBottom: 4 },
  exampleLabel: { color: '#527C42', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  example: { color: Palette.ink, fontSize: 14, lineHeight: 22 },
  exampleTranslation: { color: '#737D6C', fontSize: 13, lineHeight: 21 },
  expandIndicator: { alignItems: 'flex-end', marginTop: 10 },
});
