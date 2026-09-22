import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useFavoriteTerms } from '@/features/wiki/use-wiki';

/**
 * 즐겨찾기.
 *
 * id 만 기기에 저장하고 내용은 서버에서 받는다. 교재가 수정돼도 최신 내용이 보인다.
 */
export default function WikiFavoritesScreen() {
  const favorites = useFavorites();
  const { data, isPending } = useFavoriteTerms(favorites.ids, favorites.loaded);

  if (!favorites.loaded || (favorites.ids.length > 0 && isPending)) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (favorites.ids.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          아직 담은 용어가 없어요{'\n'}용어 카드의 별을 눌러 담아 보세요
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {data?.length ?? 0}개 용어
          </ThemedText>
        </View>

        {data?.map((term) => (
          <TermCard
            key={term.id}
            term={term}
            favorite
            onToggleFavorite={() => favorites.toggle(term.id)}
            showChapter
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  empty: { textAlign: 'center', lineHeight: 22 },
  content: { padding: 20, gap: 12 },
  header: { marginBottom: 2 },
});
