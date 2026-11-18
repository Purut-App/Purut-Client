import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearningResultColors, NumberFontFamily, Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { fetchAttempt, fetchDay, type ReviewItem } from '@/features/vocabulary/api';
import { useSavedWords } from '@/features/vocabulary/use-saved-words';
import { withAuth } from '@/lib/with-auth';
import { useResult } from '@/features/vocabulary/use-vocabulary';

export default function QuizResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.me?.id ?? null);
  const { savedWordIds, toggleSavedWord } = useSavedWords(userId);
  const queryClient = useQueryClient();
  const [savingWordId, setSavingWordId] = useState<number | null>(null);
  const { data, isPending, error, refetch } = useResult(attemptId);
  const returnToVocabulary = () => router.dismissTo('/vocabulary');

  async function toggleReviewSaved(review: ReviewItem) {
    if (!userId || savingWordId !== null) return;
    setSavingWordId(review.wordId);
    try {
      // Resolve the real DAY for the existing saved-word format, using cached reads when available.
      const attempt = await queryClient.fetchQuery({
        queryKey: ['quiz', 'attempt', attemptId],
        queryFn: () => withAuth((token) => fetchAttempt(token, attemptId)),
        staleTime: 300_000,
      });
      const day = await queryClient.fetchQuery({
        queryKey: ['vocabulary', 'day', attempt.dayId],
        queryFn: () => withAuth((token) => fetchDay(token, attempt.dayId)),
        staleTime: 300_000,
      });
      const word = day.words.find((item) => item.id === review.wordId) ?? {
        id: review.wordId,
        headword: review.headword,
        meaningKo: review.meaningKo,
        exampleEn: review.exampleEn,
        exampleKo: null,
      };
      await toggleSavedWord(word, attempt.dayId, day.title ?? `Day ${day.dayNo}`);
    } catch (saveError) {
      Alert.alert(
        '관심 단어를 변경하지 못했어요',
        saveError instanceof Error ? saveError.message : '다시 시도해 주세요',
      );
    } finally {
      setSavingWordId(null);
    }
  }

  if (isPending) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={LearningResultColors.correct.text} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.body}>결과를 불러오지 못했습니다</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetch()}
          style={styles.doneButton}
        >
          <Text style={styles.doneButtonText}>다시 시도</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={returnToVocabulary} style={styles.errorBack}>
          <Text style={styles.body}>단어장으로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const wrongCount = Math.max(0, data.totalCount - data.correctCount);
  const elapsedSeconds = Math.max(
    0,
    Math.round((new Date(data.finishedAt).getTime() - new Date(data.startedAt).getTime()) / 1000),
  );
  const verdictColor = data.passed ? LearningResultColors.correct : LearningResultColors.incorrect;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 92, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.pageTitle}>시험 결과</Text>
        <View style={styles.scoreCard}>
          <View style={[styles.verdictBadge, { backgroundColor: verdictColor.soft }]}>
            <Text style={[styles.verdictText, { color: verdictColor.text }]}>
              {data.passed ? '합격' : '불합격'}
            </Text>
          </View>
          <View style={styles.scoreLine}>
            <Text style={styles.score}>{Math.round(data.score)}</Text>
            <Text style={styles.scoreUnit}>점</Text>
          </View>
          <Text style={styles.scoreMeta}>
            {data.correctCount} / {data.totalCount} 정답
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>정답</Text>
              <Text style={[styles.statNumber, { color: LearningResultColors.correct.text }]}>
                {data.correctCount}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>오답</Text>
              <Text style={[styles.statNumber, { color: LearningResultColors.incorrect.text }]}>
                {wrongCount}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>소요 시간</Text>
              <Text style={styles.elapsedTime}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
          </View>

          <View style={[styles.resultNote, { backgroundColor: verdictColor.soft }]}>
            <Text style={[styles.resultNoteText, { color: verdictColor.text }]}>
              {data.passed
                ? wrongCount > 0
                  ? `틀린 ${wrongCount}개는 오답노트에 담겼어요`
                  : '모두 맞혔어요'
                : `${data.passPercent}% 이상이면 합격이에요 · ${Math.max(0, neededToPass(data.totalCount, data.passPercent) - data.correctCount)}개 더 맞혀야 해요`}
            </Text>
          </View>
        </View>

        <View style={styles.reviewSectionHeading}>
          <Text style={styles.sectionTitle}>문항별 리뷰</Text>
          <Text style={styles.smallLabel}>총 {data.reviews.length}문항</Text>
        </View>
        {data.reviews.map((review) => (
          <ReviewRow
            key={review.wordId}
            review={review}
            saved={savedWordIds.has(review.wordId)}
            saving={savingWordId === review.wordId}
            saveDisabled={!userId || savingWordId !== null}
            onToggleSaved={() => void toggleReviewSaved(review)}
          />
        ))}
      </ScrollView>
      <LinearGradient
        colors={['rgba(227, 242, 222, 1)', 'rgba(227, 242, 222, 0.94)', 'rgba(227, 242, 222, 0)']}
        pointerEvents="none"
        style={[styles.headerFade, { height: insets.top + 90 }]}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="단어장으로 돌아가기"
          onPress={returnToVocabulary}
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

/** Keep the pass calculation consistent with the server's threshold. */
function neededToPass(totalCount: number, passPercent: number) {
  return Math.ceil((totalCount * passPercent) / 100);
}

function ReviewRow({
  review,
  saved,
  saving,
  saveDisabled,
  onToggleSaved,
}: {
  review: ReviewItem;
  saved: boolean;
  saving: boolean;
  saveDisabled: boolean;
  onToggleSaved: () => void;
}) {
  const tone = review.correct ? LearningResultColors.correct : LearningResultColors.incorrect;
  const myAnswer =
    review.selectedIndex == null ? '무응답' : (review.choices[review.selectedIndex] ?? '무응답');
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewHeader}>
        <Text style={styles.headword}>{review.headword}</Text>
        <View style={styles.reviewActions}>
          <View style={[styles.verdictBadge, { backgroundColor: tone.soft }]}>
            <Text style={[styles.verdictText, { color: tone.text }]}>
              {review.correct ? '정답' : '오답'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? '관심 단어에서 제거' : '관심 단어에 저장'}
            accessibilityState={{ selected: saved, disabled: saveDisabled }}
            disabled={saveDisabled}
            onPress={onToggleSaved}
            style={({ pressed }) => [
              styles.saveButton,
              saved && styles.saveButtonSelected,
              pressed && styles.saveButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#527C42" />
            ) : (
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
            )}
          </Pressable>
        </View>
      </View>
      <View style={styles.answerRow}>
        <Text style={[styles.answerLabel, { color: LearningResultColors.correct.text }]}>정답</Text>
        <Text style={styles.answerValue}>{review.choices[review.correctIndex]}</Text>
      </View>
      {!review.correct ? (
        <View style={[styles.answerRow, styles.myAnswerRow]}>
          <Text style={[styles.answerLabel, { color: LearningResultColors.incorrect.text }]}>
            오답
          </Text>
          <Text style={[styles.answerValue, { color: LearningResultColors.incorrect.text }]}>
            {myAnswer}
          </Text>
        </View>
      ) : null}
      {review.exampleEn ? (
        <View style={styles.exampleSection}>
          <Text style={styles.smallLabel}>예문</Text>
          <Text style={styles.example}>{review.exampleEn}</Text>
        </View>
      ) : null}
    </View>
  );
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}분 ${rest}초` : `${rest}초`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  content: { paddingHorizontal: 18, gap: 14 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 18,
    zIndex: 3,
  },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: Palette.ink,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreCard: {
    borderRadius: 32,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  verdictBadge: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12 },
  verdictText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  score: {
    color: Palette.ink,
    fontSize: 68,
    lineHeight: 78,
    fontFamily: NumberFontFamily,
    letterSpacing: -2.5,
  },
  scoreUnit: { color: '#737D6C', fontSize: 19, fontWeight: '600' },
  scoreMeta: { color: '#737D6C', fontSize: 13, lineHeight: 20, marginTop: -8 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF3E9',
    paddingTop: 20,
    marginTop: 4,
    width: '100%',
    gap: 12,
  },
  stat: { flex: 1, alignItems: 'center', gap: 8 },
  statLabel: { color: '#737D6C', fontSize: 12, lineHeight: 18 },
  statNumber: { fontSize: 25, lineHeight: 32, fontFamily: NumberFontFamily },
  statDivider: { width: 1, height: 35, backgroundColor: '#EEF3E9' },
  elapsedTime: {
    color: Palette.ink,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultNote: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, width: '100%' },
  resultNoteText: { fontSize: 13, lineHeight: 21, textAlign: 'center', fontWeight: '500' },
  reviewSectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: { color: Palette.ink, fontSize: 18, fontWeight: '700' },
  smallLabel: { color: '#737D6C', fontSize: 12, lineHeight: 18 },
  reviewRow: { borderRadius: 28, padding: 22, gap: 14, backgroundColor: '#FFFFFF' },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonSelected: { backgroundColor: '#EDF4E7' },
  saveButtonPressed: { opacity: 0.7 },
  headword: {
    color: Palette.ink,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.4,
  },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  answerLabel: { width: 36, fontSize: 12, lineHeight: 22, fontWeight: '600' },
  answerValue: { flex: 1, color: Palette.ink, fontSize: 14, lineHeight: 22 },
  myAnswerRow: {
    backgroundColor: LearningResultColors.incorrect.soft,
    borderRadius: 14,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exampleSection: { borderTopWidth: 1, borderTopColor: '#EEF3E9', paddingTop: 14, gap: 6 },
  example: { color: '#586153', fontSize: 14, lineHeight: 22 },
  body: { color: '#586153', fontSize: 14, lineHeight: 22 },
  doneButton: {
    minHeight: 52,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: Palette.ink,
    marginTop: 6,
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  errorBack: { minHeight: 44, justifyContent: 'center' },
});
