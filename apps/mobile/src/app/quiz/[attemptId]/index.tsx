import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NumberFontFamily, Palette } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDay } from '@/features/vocabulary/use-vocabulary';
import { useQuizSession } from '@/features/vocabulary/use-quiz-session';

/**
 * 시험 진행.
 * 선택 즉시 다음 문항으로 넘어가고 정답은 알려주지 않는다 —
 * 정답을 바로 보여주면 시험이 아니라 연습이 된다.
 */
export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const onFinish = useCallback(
    () => router.replace(`/quiz/${attemptId}/result`),
    [router, attemptId],
  );
  const onError = useCallback((message: string) => Alert.alert('제출에 실패했어요', message), []);
  const { attempt, current, index, total, select, submitting } = useQuizSession(attemptId, {
    onFinish,
    onError,
  });
  const { data: day } = useDay(attempt?.dayId ?? '');

  const [locked, setLocked] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [questionTranslateX] = useState(() => new Animated.Value(0));
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  /**
   * 중도 이탈.
   * 고른 답은 서버에 이미 저장돼 있으므로 나중에 이어 풀 수 있다.
   * 실수로 나가는 것만 막으면 되니 확인만 한 번 받는다.
   */
  function handleExit() {
    Alert.alert('시험을 중단할까요?', '지금까지 고른 답은 저장돼요. 나중에 이어서 풀 수 있어요.', [
      { text: '계속 풀기', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!attempt || !current) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  async function handleSelect(choiceIndex: number) {
    if (locked || submitting) return;
    setLocked(true);
    setSelectedChoice(choiceIndex);

    try {
      await animateQuestion(questionTranslateX, -width);
      const result = await select(choiceIndex);

      if (result === 'NEXT') {
        setSelectedChoice(null);
        questionTranslateX.setValue(width);
        await animateQuestion(questionTranslateX, 0);
      } else if (result === 'FAILED') {
        questionTranslateX.setValue(-width);
        await animateQuestion(questionTranslateX, 0);
      }
    } finally {
      setSelectedChoice(null);
      setLocked(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="시험 중단하고 뒤로가기"
          disabled={locked || submitting}
          hitSlop={8}
          onPress={handleExit}
          style={styles.backButton}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={Palette.ink}
          />
        </Pressable>
        <View style={styles.progressHeader}>
          <View style={styles.questionMeta}>
            <ThemedText numberOfLines={1} style={styles.wordbookTitle}>
              {day?.title ?? '단어장'}
            </ThemedText>
            <ThemedText style={styles.questionCount}>
              {index + 1}
              <ThemedText style={styles.questionTotal}> / {total}</ThemedText>
            </ThemedText>
          </View>
          <View
            style={styles.progressTrack}
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: total, now: index + 1 }}
            accessibilityLabel="시험 진행"
          >
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.quizContent,
          { minHeight: height - insets.top - 100, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Animated.View
          style={[styles.promptAnimatedWrap, { transform: [{ translateX: questionTranslateX }] }]}
        >
          <View style={styles.promptWrap}>
            <ThemedText style={styles.promptLabel}>
              {current.questionType === 'EN_TO_KO'
                ? '알맞은 뜻을 골라주세요'
                : '알맞은 영어 단어를 골라주세요'}
            </ThemedText>
            <ThemedText type="title" style={styles.prompt}>
              {current.prompt}
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.choices}>
          {current.choices.map((choice, choiceIndex) => {
            const selected = selectedChoice === choiceIndex;
            return (
              <Pressable
                key={`${current.wordId}-${choiceIndex}`}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: locked || submitting }}
                onPress={() => void handleSelect(choiceIndex)}
                disabled={locked || submitting}
                style={({ pressed }) => [
                  styles.choice,
                  selected && styles.choiceSelected,
                  pressed && styles.choicePressed,
                ]}
              >
                <ThemedText type="smallBold" style={styles.choiceText}>
                  {choice}
                </ThemedText>
                <View style={[styles.selectionCircle, selected && styles.selectionCircleActive]}>
                  {selected ? <View style={styles.selectionDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {submitting ? (
        <View style={[styles.submitting, { paddingBottom: insets.bottom + 16 }]}>
          <ActivityIndicator color="#527C42" />
          <ThemedText type="small" style={styles.submittingText}>
            채점 중…
          </ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  center: { flex: 1, backgroundColor: '#E3F2DE', alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  progressHeader: { flex: 1, gap: 10 },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordbookTitle: { color: '#63745A', fontSize: 13, fontWeight: '600', lineHeight: 20, flex: 1 },
  questionCount: { color: Palette.ink, fontSize: 17, fontFamily: NumberFontFamily, lineHeight: 22 },
  questionTotal: { color: '#7A8473', fontSize: 12, fontWeight: '500' },
  progressTrack: { height: 7, overflow: 'hidden', borderRadius: 4, backgroundColor: '#FFFFFF' },
  progressBar: { height: '100%', borderRadius: 4, backgroundColor: '#56AD62' },
  quizContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 42,
  },
  promptAnimatedWrap: { width: '100%' },
  promptWrap: {
    minHeight: 168,
    padding: 26,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    gap: 15,
  },
  promptLabel: { color: '#7A8473', fontSize: 12, lineHeight: 18 },
  prompt: {
    color: Palette.ink,
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: -0.7,
  },
  choices: { gap: 12 },
  choice: {
    width: '100%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceSelected: { borderColor: '#527C42', backgroundColor: '#F4F9F0' },
  choicePressed: { opacity: 0.75 },
  choiceText: {
    color: Palette.ink,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  selectionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDF1E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircleActive: { backgroundColor: '#527C42' },
  selectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  submitting: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2DE',
  },
  submittingText: { color: '#63745A' },
});

function animateQuestion(value: Animated.Value, toValue: number) {
  return new Promise<void>((resolve) => {
    Animated.timing(value, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => resolve());
  });
}
