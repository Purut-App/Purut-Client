import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { NumberFontFamily, DropdownSurface } from '@/constants/theme';
import type { ChapterSummary } from '@/features/wiki/api';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useChapters, useSearch } from '@/features/wiki/use-wiki';
import {
  FavoritesLink,
  WikiColors,
  WikiCount,
  WikiState,
  wikiStyles,
} from '@/features/wiki/wiki-ui';

export default function WikiHomeScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [focused, setFocused] = useState(false);
  const chapters = useChapters();
  const search = useSearch(keyword);
  const favorites = useFavorites();
  const searchMode = keyword.trim().length >= 2;
  const totalTerms = chapters.data?.reduce((total, chapter) => total + chapter.termCount, 0);

  return (
    <ServiceScreen
      title="Wiki"
      titleAccessory={<FavoritesLink onPress={() => router.push('/wiki/favorites')} />}
    >
      <View style={[styles.searchBox, focused && styles.searchFocused]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={20}
          tintColor={WikiColors.green}
        />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="궁금한 용어 검색"
          placeholderTextColor={WikiColors.muted}
          style={styles.input}
          accessibilityLabel="위키 용어 검색"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {keyword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            onPress={() => setKeyword('')}
            hitSlop={8}
          >
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              size={20}
              tintColor={WikiColors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {!searchMode && keyword.trim().length === 1 ? (
        <Text style={styles.searchHint}>두 글자 이상 입력해 주세요</Text>
      ) : null}
      {!searchMode && chapters.data ? (
        <View style={styles.overview}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{chapters.data.length}</Text>
            <Text style={styles.metricLabel}>전체 장</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{totalTerms}</Text>
            <Text style={styles.metricLabel}>문법 용어</Text>
          </View>
        </View>
      ) : null}
      <View style={wikiStyles.sectionHeading}>
        <Text style={wikiStyles.sectionTitle}>{searchMode ? '검색 결과' : '목차'}</Text>
        {(searchMode ? search.data : chapters.data) ? (
          <WikiCount
            count={(searchMode ? search.data : chapters.data)?.length ?? 0}
            label={searchMode ? '개 용어' : '장'}
          />
        ) : null}
      </View>
      <View style={wikiStyles.list}>
        {searchMode ? (
          search.isPending ? (
            <WikiState loading />
          ) : search.isError ? (
            <WikiState
              title="검색 결과를 불러오지 못했어요"
              onRetry={() => void search.refetch()}
            />
          ) : !search.data?.length ? (
            <WikiState title="검색 결과가 없어요" detail="다른 용어로 검색해 보세요" />
          ) : (
            search.data.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                favorite={favorites.has(term.id)}
                onToggleFavorite={() => void favorites.toggle(term.id)}
                showChapter
              />
            ))
          )
        ) : chapters.isPending ? (
          <WikiState loading />
        ) : chapters.isError ? (
          <WikiState title="목차를 불러오지 못했어요" onRetry={() => void chapters.refetch()} />
        ) : !chapters.data?.length ? (
          <WikiState title="등록된 문법이 없어요" />
        ) : (
          chapters.data.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              onPress={() => router.push(`/wiki/${chapter.id}`)}
            />
          ))
        )}
      </View>
    </ServiceScreen>
  );
}

function ChapterCard({ chapter, onPress }: { chapter: ChapterSummary; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chapter.chapterNo}장 ${chapter.title}, 용어 ${chapter.termCount}개`}
      onPress={onPress}
      style={({ pressed }) => [styles.chapterCard, pressed && styles.chapterPressed]}
    >
      <View style={styles.chapterTop}>
        <Text style={styles.chapterNumber}>{chapter.chapterNo}</Text>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
          tintColor="#8B9683"
        />
      </View>
      <View style={styles.chapterTitleRow}>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
        <View style={styles.termChip}>
          <WikiCount count={chapter.termCount} label="개 용어" />
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  searchBox: {
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchFocused: { ...DropdownSurface },
  input: { flex: 1, minHeight: 52, fontSize: 16, color: WikiColors.ink, paddingVertical: 12 },
  searchHint: { color: WikiColors.muted, fontSize: 13, paddingHorizontal: 8 },
  overview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  metric: { flex: 1, gap: 8 },
  metricValue: { color: WikiColors.ink, fontSize: 36, fontFamily: NumberFontFamily },
  metricLabel: { color: WikiColors.muted, fontSize: 14 },
  metricDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#EDF2E8' },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  chapterPressed: { borderColor: WikiColors.border, backgroundColor: '#FAFCF7' },
  chapterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  chapterNumber: {
    color: WikiColors.ink,
    fontFamily: NumberFontFamily,
    fontSize: 38,
    lineHeight: 44,
  },
  chapterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chapterTitle: {
    flex: 1,
    color: WikiColors.ink,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  termChip: {
    backgroundColor: WikiColors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
});
