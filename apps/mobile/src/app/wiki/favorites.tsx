import { Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { TermCard } from '@/features/wiki/term-card';
import { useFavorites } from '@/features/wiki/use-favorites';
import { useFavoriteTerms } from '@/features/wiki/use-wiki';
import { WikiCount, WikiState, wikiStyles } from '@/features/wiki/wiki-ui';

export default function WikiFavoritesScreen() {
  const favorites = useFavorites();
  const terms = useFavoriteTerms(favorites.ids, favorites.loaded);
  return (
    <ServiceScreen title="즐겨찾기">
      <View style={wikiStyles.sectionHeading}>
        <Text style={wikiStyles.sectionTitle}>저장한 문법 용어</Text>
        <WikiCount count={favorites.ids.length} label="개" />
      </View>
      <View style={wikiStyles.list}>
        {!favorites.loaded || (favorites.ids.length > 0 && terms.isPending) ? (
          <WikiState loading />
        ) : favorites.ids.length === 0 ? (
          <WikiState title="아직 담은 용어가 없어요" detail="용어 카드의 별을 눌러 담아 보세요" />
        ) : terms.isError ? (
          <WikiState title="저장한 용어를 불러오지 못했어요" onRetry={() => void terms.refetch()} />
        ) : !terms.data?.length ? (
          <WikiState title="표시할 용어가 없어요" />
        ) : (
          terms.data.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              favorite={favorites.has(term.id)}
              onToggleFavorite={() => void favorites.toggle(term.id)}
              showChapter
            />
          ))
        )}
      </View>
    </ServiceScreen>
  );
}
