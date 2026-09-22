import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import type { TermItem } from '@/features/wiki/api';
import { useTheme } from '@/hooks/use-theme';

/**
 * 용어 카드.
 *
 * 원문 교재의 한 항목이 카드 한 장이다. 읽는 순서를 그대로 따른다 —
 * 이름 → 쉬운 설명 → 예시 → 예문 → 뜻.
 *
 * 검색·즐겨찾기 화면에서는 이 용어가 몇 장에 있는지 알아야 해서 출처를 함께 보여준다.
 */
export function TermCard({
  term,
  favorite,
  onToggleFavorite,
  showChapter,
}: {
  term: TermItem;
  favorite: boolean;
  onToggleFavorite: () => void;
  showChapter?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <ThemedText type="smallBold" style={styles.name}>
            {term.name}
          </ThemedText>
          {term.nameEn ? (
            <ThemedText type="small" themeColor="textSecondary">
              {term.nameEn}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          accessibilityState={{ selected: favorite }}
          onPress={onToggleFavorite}
          hitSlop={10}>
          <SymbolView
            name={{ ios: favorite ? 'star.fill' : 'star', android: 'star', web: 'star' }}
            size={20}
            tintColor={favorite ? Palette.warning : theme.textSecondary}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
        </Pressable>
      </View>

      {showChapter ? (
        <ThemedText type="small" style={styles.chapter}>
          {term.chapterNo}. {term.chapterTitle}
        </ThemedText>
      ) : null}

      <ThemedText type="small" style={styles.description}>
        {term.description}
      </ThemedText>

      {term.usages.length > 0 ? (
        <View style={[styles.usages, { backgroundColor: theme.background }]}>
          {term.usages.map((usage, i) => (
            <ThemedText key={i} type="small" themeColor="textSecondary">
              {usage}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {/* 예문과 해석은 짝이다. 비교 예문이 있는 용어는 두 쌍이 온다 */}
      <View style={styles.examples}>
        {term.examples.map((example, i) => (
          <View key={i} style={styles.exampleRow}>
            <ThemedText type="small" style={styles.example}>
              {example}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {term.meanings[i] ?? ''}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleArea: { flex: 1, gap: 2 },
  name: { fontSize: 16 },
  chapter: { color: Palette.primary },
  description: { lineHeight: 21 },
  usages: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  examples: { gap: 8, marginTop: 2 },
  exampleRow: {
    gap: 2,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primarySoft,
    paddingLeft: 10,
  },
  example: { fontWeight: '600' },
});
