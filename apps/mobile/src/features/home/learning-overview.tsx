import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LearningResultColors, NumberFontFamily } from '@/constants/theme';
import { useAttemptHistory, useMeSummary } from '@/features/me/use-me';

const GREEN = '#56AD62';
const BLUE = '#8AADD0';
const RED = LearningResultColors.incorrect.accent;

/** Live homework totals and vocabulary results, shared by both home entry points. */
export function LearningOverview() {
  const router = useRouter();
  const summary = useMeSummary();
  const history = useAttemptHistory();
  const [historyOpen, setHistoryOpen] = useState(false);
  const homework = summary.data?.homework;
  const vocabulary = summary.data?.vocabulary;
  const attempts = [...(history.data ?? [])]
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .slice(-7);
  const ratio =
    homework && homework.total > 0
      ? Math.max(0, Math.min(1, homework.submitted / homework.total))
      : 0;
  const segments = homework
    ? [Math.max(0, homework.submitted), 0, Math.max(0, homework.pending)]
    : [0, 0, 0];
  return (
    <View style={styles.overview}>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="숙제 현황, 숙제 목록 보기"
          onPress={() => router.push('/homework')}
          style={styles.heading}
        >
          <Text style={styles.title}>숙제 현황</Text>
          <Chevron />
        </Pressable>
        {summary.isPending ? (
          <ActivityIndicator color="#527C42" />
        ) : !homework ? (
          <Retry
            onPress={() => {
              void summary.refetch();
            }}
          />
        ) : (
          <>
            <View style={styles.homeworkChart}>
              <View style={styles.donut}>
                <Donut segments={segments} total={homework.total} />
                <View style={styles.donutLabel}>
                  <Text style={styles.percent}>
                    {Math.round(ratio * 100)}
                    <Text style={styles.percentUnit}>%</Text>
                  </Text>
                  <Text style={styles.caption}>제출률</Text>
                </View>
              </View>
              <View style={styles.metrics}>
                <Metric label="전체" value={homework.total} />
                <Metric label="제출" value={homework.submitted} color={GREEN} />
                <Metric label="검토완료" value={homework.reviewed} />
                <Metric label="미제출" value={homework.pending} color={RED} />
              </View>
            </View>
            {homework.total === 0 ? <Text style={styles.empty}>등록된 숙제가 없어요</Text> : null}
          </>
        )}
      </View>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="단어시험 목록 보기"
          onPress={() => router.push('/vocabulary')}
          style={styles.heading}
        >
          <Text style={styles.title}>단어시험 기록</Text>
          <Chevron />
        </Pressable>
        {summary.isPending ? (
          <ActivityIndicator color="#527C42" />
        ) : !vocabulary ? (
          <Retry
            onPress={() => {
              void summary.refetch();
            }}
          />
        ) : (
          <View style={styles.scoreMetrics}>
            <Score label="평균" value={vocabulary.averageScore} unit="점" />
            <Score label="최고" value={vocabulary.bestScore} unit="점" />
            <Score label="응시" value={vocabulary.attemptCount} unit="회" />
          </View>
        )}
        {history.isPending ? (
          <ActivityIndicator color="#527C42" />
        ) : history.error ? (
          <Retry
            onPress={() => {
              void history.refetch();
            }}
          />
        ) : attempts.length === 0 ? (
          <Text style={styles.empty}>아직 응시한 시험이 없어요</Text>
        ) : (
          <>
            <View
              style={styles.chart}
              accessible
              accessibilityLabel={`최근 시험 점수. ${attempts.map((attempt) => `Day ${attempt.dayNo}, ${attempt.score}점`).join(', ')}`}
            >
              {attempts.map((attempt) => (
                <Pressable
                  key={attempt.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${attempt.dayNo}, ${attempt.score}점, 결과 보기`}
                  onPress={() => router.push(`/quiz/${attempt.id}/result`)}
                  style={styles.column}
                >
                  <Text style={styles.chartValue}>{attempt.score}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(
                            3,
                            (Math.max(0, Math.min(100, attempt.score)) / 100) * 82,
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel} numberOfLines={1}>
                    Day {attempt.dayNo}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: historyOpen }}
              onPress={() => setHistoryOpen((open) => !open)}
              style={styles.historyToggle}
            >
              <Text style={styles.historyToggleText}>시험 기록</Text>
              <SymbolView
                name={
                  historyOpen
                    ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                    : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
                }
                size={15}
                tintColor="#527C42"
              />
            </Pressable>
            {historyOpen ? (
              <View style={styles.history}>
                {(history.data ?? []).map((attempt) => (
                  <Pressable
                    key={attempt.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/quiz/${attempt.id}/result`)}
                    style={styles.historyRow}
                  >
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyTitle}>
                        {attempt.dayTitle ?? `Day ${attempt.dayNo}`}
                      </Text>
                      <Text style={styles.caption}>
                        {formatDate(attempt.finishedAt)} · {attempt.correctCount}/
                        {attempt.totalCount}
                      </Text>
                    </View>
                    <Text style={styles.historyScore}>
                      {attempt.score}
                      <Text style={styles.scoreUnit}>점</Text>
                    </Text>
                    <Chevron />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
function Donut({ segments, total }: { segments: number[]; total: number }) {
  const circumference = Math.PI * 82;
  const arcs = segments
    .map((value, index) => {
      const length = total > 0 ? Math.min(1, value / total) * circumference : 0;
      const offset =
        total > 0
          ? segments
              .slice(0, index)
              .reduce((sum, count) => sum + Math.min(1, count / total) * circumference, 0)
          : 0;
      const arc = `<circle cx="50" cy="50" r="41" fill="none" stroke="${[GREEN, BLUE, RED][index]}" stroke-width="9" stroke-dasharray="${length} ${circumference}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
      return length > 0 ? arc : '';
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="41" fill="none" stroke="#EDF3E9" stroke-width="9"/>${arcs}</svg>`;
  return (
    <Image
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
    />
  );
}
function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricLabel}>
        {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
        <Text style={styles.caption}>{label}</Text>
      </View>
      <Text
        style={[
          styles.metricValue,
          color === RED && { color: LearningResultColors.incorrect.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
function Score({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <View style={styles.scoreMetric}>
      <Text style={styles.caption}>{label}</Text>
      <Text style={styles.scoreValue}>
        {value ?? '—'}
        {value != null ? <Text style={styles.scoreUnit}>{unit}</Text> : null}
      </Text>
    </View>
  );
}
function Chevron() {
  return (
    <SymbolView
      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
      size={16}
      tintColor="#8B9683"
    />
  );
}
function Retry({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.retry}>
      <Text style={styles.caption}>불러오지 못했어요 · 다시 시도</Text>
    </Pressable>
  );
}
function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
const styles = StyleSheet.create({
  overview: { gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 24, gap: 20 },
  heading: {
    minHeight: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#1A1F2C', fontSize: 19, fontWeight: '700' },
  caption: { color: '#7B8774', fontSize: 11, lineHeight: 18 },
  homeworkChart: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  donut: { width: 108, height: 108 },
  donutLabel: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  percent: { color: '#1A1F2C', fontFamily: NumberFontFamily, fontSize: 28 },
  percentUnit: { fontSize: 13, color: '#7B8774' },
  metrics: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  metric: { width: '50%', gap: 3 },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  metricValue: { color: '#1A1F2C', fontFamily: NumberFontFamily, fontSize: 23 },
  empty: { color: '#7B8774', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  scoreMetrics: { flexDirection: 'row', gap: 8 },
  scoreMetric: { flex: 1, gap: 7 },
  scoreValue: { color: '#1A1F2C', fontFamily: NumberFontFamily, fontSize: 28 },
  scoreUnit: { fontSize: 12, fontFamily: 'System', fontWeight: '600', color: '#7B8774' },
  chart: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', paddingTop: 4 },
  column: { flex: 1, alignItems: 'center', gap: 7 },
  chartValue: { fontFamily: NumberFontFamily, color: '#527C42', fontSize: 12 },
  barTrack: {
    height: 82,
    width: '70%',
    maxWidth: 32,
    borderRadius: 10,
    backgroundColor: '#F2F6EE',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { backgroundColor: GREEN, borderRadius: 10 },
  dayLabel: { fontSize: 9, color: '#7B8774' },
  historyToggle: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#EDF5E7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyToggleText: { color: '#527C42', fontSize: 13, fontWeight: '700' },
  history: { gap: 4 },
  historyRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyCopy: { flex: 1, gap: 4 },
  historyTitle: { color: '#1A1F2C', fontSize: 14, fontWeight: '600' },
  historyScore: { fontFamily: NumberFontFamily, fontSize: 21, color: '#527C42' },
  retry: { paddingVertical: 18, alignItems: 'center' },
});
