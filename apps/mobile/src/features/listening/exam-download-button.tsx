import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { DownloadState } from './use-offline';
/** 회차 단위 다운로드 버튼. 한 회차가 약 51MB 라 전체 일괄 다운로드는 두지 않는다 */
export function ExamDownloadButton({
  offline,
  state,
  online,
  onDownload,
  onRemove,
}: {
  offline: boolean;
  state: DownloadState;
  online: boolean;
  onDownload: () => void;
  onRemove: () => void;
}) {
  if (state.status === 'downloading') {
    return (
      <View style={styles.downloadButton}>
        <ActivityIndicator size="small" color="#527C42" />
        <ThemedText type="small" style={styles.downloadText}>
          {state.done}/{state.total}
        </ThemedText>
      </View>
    );
  }

  if (offline) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다운로드 삭제"
        onPress={onRemove}
        style={({ pressed }) => [styles.downloadButton, { opacity: pressed ? 0.82 : 1 }]}
      >
        <SymbolView
          name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
          size={16}
          tintColor="#527C42"
          weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
        />
        <ThemedText type="small" style={styles.downloadText}>
          저장됨
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="오프라인 저장"
      accessibilityState={{ disabled: !online }}
      disabled={!online}
      onPress={onDownload}
      style={({ pressed }) => [
        styles.downloadButton,
        {
          opacity: !online ? 0.4 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <SymbolView
        name={{ ios: 'arrow.down.circle', android: 'download', web: 'download' }}
        size={16}
        tintColor="#527C42"
        weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
      />
      <ThemedText type="small" style={styles.downloadText}>
        {state.status === 'error' ? '다시 시도' : '저장'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  downloadButton: {
    width: 104,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#EDF5E7',
    paddingHorizontal: 10,
  },
  downloadText: { color: '#527C42', fontSize: 13, fontWeight: '600' },
});
