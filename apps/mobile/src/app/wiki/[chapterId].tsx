import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useChapter } from '@/features/wiki/use-wiki';

/** 장 본문. 용어 카드가 원문 순서대로 이어진다. */
export default function WikiChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { data, isPending, error } = useChapter(chapterId);
  const favorites = useFavorites();

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
          {error?.message ?? '불러오지 못했습니다'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">
            {data.chapterNo}. {data.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {data.terms.length}개 용어
          </ThemedText>
        </View>

        {data.terms.map((term) => (
          <TermCard
            key={term.id}
            term={term}
            favorite={favorites.has(term.id)}
            onToggleFavorite={() => favorites.toggle(term.id)}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12 },
  header: { gap: 4, marginBottom: 4 },
});
