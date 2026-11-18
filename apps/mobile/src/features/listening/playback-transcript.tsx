import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SentenceItem } from './api';
import { findCurrentSentence, useHasTimings } from './use-sentence-sync';

export function PlaybackTranscript({
  sentences,
  positionMs,
  showTranslation,
  autoScroll,
  pending,
  error,
  intro,
  onRetry,
  onSeek,
}: {
  sentences: SentenceItem[];
  positionMs: number;
  showTranslation: boolean;
  autoScroll: boolean;
  pending: boolean;
  error: boolean;
  intro: boolean;
  onRetry: () => void;
  onSeek: (ms: number) => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const layouts = useRef<Record<number, { y: number; height: number }>>({});
  const viewport = useRef(0);
  const scrollY = useRef(0);
  const manualAt = useRef(0);
  const hasTimings = useHasTimings(sentences);
  const active = hasTimings ? findCurrentSentence(sentences, positionMs) : -1;
  useEffect(() => {
    const row = layouts.current[active];
    if (!autoScroll || !row || viewport.current <= 0 || Date.now() - manualAt.current < 4000)
      return;
    const top = scrollY.current + viewport.current * 0.15;
    const bottom = scrollY.current + viewport.current * 0.75;
    if (row.y >= top && row.y + row.height <= bottom) return;
    scroll.current?.scrollTo({ y: Math.max(0, row.y - viewport.current * 0.35), animated: true });
  }, [active, autoScroll, showTranslation]);
  return (
    <ScrollView
      ref={scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onLayout={(e) => {
        viewport.current = e.nativeEvent.layout.height;
      }}
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      onScrollBeginDrag={() => {
        manualAt.current = Date.now();
      }}
    >
      {intro ? (
        <Text style={styles.notice}>
          안내 방송에는 대사가 없어요. 문항을 선택하면 대사를 볼 수 있어요.
        </Text>
      ) : pending ? (
        <ActivityIndicator color="#527C42" />
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.notice}>대사를 불러오지 못했어요</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {sentences.map((sentence, index) => (
            <Pressable
              key={sentence.id}
              accessibilityRole="button"
              accessibilityLabel={sentence.textEn}
              accessibilityState={{ selected: index === active, disabled: !hasTimings }}
              disabled={!hasTimings}
              onLayout={(e) => {
                layouts.current[index] = e.nativeEvent.layout;
              }}
              onPress={() => {
                manualAt.current = 0;
                onSeek(sentence.startMs);
              }}
              style={styles.sentence}
            >
              {sentence.speaker ? <Text style={styles.speaker}>{sentence.speaker}</Text> : null}
              <Text
                style={[
                  styles.english,
                  index < active && styles.past,
                  index === active && styles.active,
                ]}
              >
                {sentence.textEn}
              </Text>
              {showTranslation && sentence.textKo ? (
                <Text style={styles.korean}>{sentence.textKo}</Text>
              ) : null}
            </Pressable>
          ))}
          {sentences.length === 0 ? (
            <Text style={styles.notice}>이 문항에 등록된 대사가 없어요</Text>
          ) : !hasTimings ? (
            <Text style={styles.notice}>아직 문장별 싱크가 없어 문장 이동은 할 수 없어요</Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 28, paddingTop: 18, paddingBottom: 70, gap: 24, flexGrow: 1 },
  sentence: { gap: 8 },
  speaker: { color: '#74826C', fontSize: 11, fontWeight: '700' },
  english: {
    color: '#1A1F2C',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  korean: { color: '#74826C', fontSize: 14, lineHeight: 22 },
  past: { color: '#99AC90' },
  active: { color: '#446F37' },
  notice: {
    color: '#74826C',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 20,
  },
  state: { alignItems: 'center' },
  retry: { padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF' },
  retryText: { color: '#527C42', fontWeight: '600' },
});
