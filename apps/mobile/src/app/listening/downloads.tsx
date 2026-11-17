import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { LearningResultColors, NumberFontFamily } from '@/constants/theme';
import { useOfflineLibrary } from '@/features/listening/use-offline';

export default function ListeningDownloadsScreen() {
  const { exams, loading, totalBytes, removeOne, removeAll } = useOfflineLibrary();
  const report = (error: unknown) =>
    Alert.alert('삭제 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
  function confirmRemoveAll() {
    Alert.alert('전체 삭제', '받아둔 회차를 모두 지울까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void removeAll().catch(report);
        },
      },
    ]);
  }
  return (
    <ServiceScreen title="저장한 회차">
      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.count}>
            {exams.length}
            <Text style={styles.unit}>개 회차</Text>
          </Text>
          <Text style={styles.detail}>{formatBytes(totalBytes)}</Text>
        </View>
        {exams.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={confirmRemoveAll}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>전체 삭제</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#527C42" />
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.detail}>저장한 회차가 없어요</Text>
        </View>
      ) : (
        exams.map((exam) => (
          <View key={exam.examId} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>{exam.examLabel}</Text>
              <Text style={styles.detail}>
                {exam.items.length}문항 · {formatBytes(exam.bytes)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${exam.examLabel} 삭제`}
              onPress={() => {
                void removeOne(exam.examId).catch(report);
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>삭제</Text>
            </Pressable>
          </View>
        ))
      )}
    </ServiceScreen>
  );
}
function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${Math.max(0, Math.round(mb))}MB`;
}
const styles = StyleSheet.create({
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryCopy: { flex: 1, gap: 8 },
  count: { fontFamily: NumberFontFamily, color: '#1A1F2C', fontSize: 34 },
  unit: { fontFamily: 'System', fontSize: 13, color: '#7B8774' },
  detail: { color: '#7B8774', fontSize: 12, lineHeight: 20 },
  row: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: { flex: 1, gap: 7 },
  title: { color: '#1A1F2C', fontSize: 16, fontWeight: '700', lineHeight: 24 },
  deleteButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: LearningResultColors.incorrect.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: LearningResultColors.incorrect.text, fontSize: 12, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', padding: 30, borderRadius: 28, alignItems: 'center' },
});
