import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { NumberFontFamily } from '@/constants/theme';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useChapter } from '@/features/wiki/use-wiki';
import {
  FavoritesLink,
  WikiColors,
  WikiCount,
  WikiState,
  wikiStyles,
} from '@/features/wiki/wiki-ui';

export default function WikiChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const chapter = useChapter(chapterId);
  const favorites = useFavorites();
  return (
    <ServiceScreen
      title={chapter.data?.title ?? '문법'}
      titleAccessory={<FavoritesLink onPress={() => router.push('/wiki/favorites')} />}
    >
      {chapter.isPending ? (
        <WikiState loading />
      ) : chapter.isError || !chapter.data ? (
        <WikiState title="문법을 불러오지 못했어요" onRetry={() => void chapter.refetch()} />
      ) : (
        <>
          <View style={styles.summary}>
            <View style={styles.chapterLabel}>
              <Text style={styles.chapterNumber}>{chapter.data.chapterNo}</Text>
              <Text style={styles.chapterUnit}>장</Text>
            </View>
            <WikiCount count={chapter.data.terms.length} label="개 용어" />
          </View>
          <View style={wikiStyles.list}>
            {chapter.data.terms.length ? (
              chapter.data.terms.map((term) => (
                <TermCard
                  key={term.id}
                  term={term}
                  favorite={favorites.has(term.id)}
                  onToggleFavorite={() => void favorites.toggle(term.id)}
                />
              ))
            ) : (
              <WikiState title="등록된 용어가 없어요" />
            )}
          </View>
        </>
      )}
    </ServiceScreen>
  );
}
const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 6,
  },
  chapterLabel: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  chapterNumber: { color: WikiColors.green, fontFamily: NumberFontFamily, fontSize: 30 },
  chapterUnit: { color: WikiColors.green, fontSize: 16, fontWeight: '700' },
});
