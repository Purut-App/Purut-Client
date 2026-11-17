import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { ChapterSummary } from '@/features/wiki/api';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useChapters, useSearch } from '@/features/wiki/use-wiki';
import { useTheme } from '@/hooks/use-theme';

/**
 * 문법 위키 목차.
 *
 * 검색어를 넣으면 목차 대신 결과를 보여준다. 화면을 따로 두면 뒤로가기가 한 단계
 * 늘어나는데, 찾다가 다시 훑는 흐름이 잦아서 한 화면에서 전환한다.
 */
export default function WikiHomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const { data: chapters, isPending, error } = useChapters();
  const { data: results, isFetching: searching } = useSearch(keyword);
  const favorites = useFavorites();

  const searchMode = keyword.trim().length >= 2;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.toolbar}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={16}
            tintColor={theme.textSecondary}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="용어 검색"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="즐겨찾기"
          onPress={() => router.push('/wiki/favorites')}
          style={[
            styles.starButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <SymbolView
            name={{ ios: 'star.fill', android: 'star', web: 'star' }}
            size={18}
            tintColor={Palette.warning}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
        </Pressable>
      </View>

      {searchMode ? (
        <SearchResults
          loading={searching}
          results={results ?? []}
          favorites={favorites}
          keyword={keyword.trim()}
        />
      ) : isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            {error.message}
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {chapters?.map((chapter) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              onPress={() => router.push(`/wiki/${chapter.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function ChapterRow({ chapter, onPress }: { chapter: ChapterSummary; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <View style={[styles.badge, { backgroundColor: Palette.primarySoft }]}>
        <ThemedText type="smallBold" style={styles.badgeText}>
          {chapter.chapterNo}
        </ThemedText>
      </View>

      <View style={styles.rowBody}>
        <ThemedText type="smallBold">{chapter.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {chapter.termCount}개 용어
        </ThemedText>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        tintColor={theme.textSecondary}
        weight={{ ios: 'semibold', android: { name: 'outlined', font: 500 } }}
      />
    </Pressable>
  );
}

function SearchResults({
  loading,
  results,
  favorites,
  keyword,
}: {
  loading: boolean;
  results: import('@/features/wiki/api').TermItem[];
  favorites: ReturnType<typeof useFavorites>;
  keyword: string;
}) {
  if (loading && results.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          &lsquo;{keyword}&rsquo; 검색 결과가 없어요
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <ThemedText type="small" themeColor="textSecondary">
        {results.length}개 용어
      </ThemedText>
      {results.map((term) => (
        <TermCard
          key={term.id}
          term={term}
          favorite={favorites.has(term.id)}
          onToggleFavorite={() => favorites.toggle(term.id)}
          showChapter
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  starButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  list: { padding: 20, paddingTop: 6, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Palette.primaryDark },
  rowBody: { flex: 1, gap: 2 },
});
