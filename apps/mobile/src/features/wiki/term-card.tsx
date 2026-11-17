import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { NumberFontFamily } from '@/constants/theme';
import type { TermItem } from './api';
import { WikiColors } from './wiki-ui';

/** The same term layout is used in chapters, search results, and favorites. */
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
  const [expanded, setExpanded] = useState(false);
  const hasDetails = term.usages.length > 0 || term.examples.length > 0 || term.meanings.length > 0;
  function toggle() {
    if (!hasDetails) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setExpanded((current) => !current);
  }
  return (
    <Pressable
      accessibilityRole={hasDetails ? 'button' : undefined}
      accessibilityState={hasDetails ? { expanded } : undefined}
      onPress={toggle}
      style={({ pressed }) => [styles.card, expanded && styles.expanded, pressed && styles.pressed]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorite ? `${term.name} 즐겨찾기 해제` : `${term.name} 즐겨찾기 추가`}
        accessibilityState={{ selected: favorite }}
        onPress={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        style={[styles.favorite, favorite && styles.favoriteSelected]}
        hitSlop={8}
      >
        <SymbolView
          name={{ ios: favorite ? 'star.fill' : 'star', android: 'star', web: 'star' }}
          size={21}
          tintColor={favorite ? WikiColors.green : '#8B9683'}
          weight={{
            ios: 'regular',
            android: { name: favorite ? 'filled' : 'outlined', font: 400 },
          }}
        />
      </Pressable>
      <View style={styles.titleArea}>
        {showChapter ? (
          <Text style={styles.chapter}>
            <Text style={styles.chapterNumber}>{term.chapterNo}</Text>장 · {term.chapterTitle}
          </Text>
        ) : null}
        <Text style={styles.name}>{term.name}</Text>
        {term.nameEn ? <Text style={styles.nameEn}>{term.nameEn}</Text> : null}
      </View>
      <Text style={styles.description}>{term.description}</Text>
      {hasDetails && expanded ? (
        <View style={styles.exampleSection}>
          <View style={styles.exampleDivider} />
          {term.usages.length > 0 ? (
            <>
              <Text style={styles.exampleLabel}>용례</Text>
              {term.usages.map((usage, index) => (
                <Text key={index} style={styles.example}>
                  {usage}
                </Text>
              ))}
            </>
          ) : null}
          {Math.max(term.examples.length, term.meanings.length) > 0 ? (
            <>
              <Text style={styles.exampleLabel}>예문</Text>
              {Array.from(
                { length: Math.max(term.examples.length, term.meanings.length) },
                (_, index) => (
                  <View key={index} style={styles.examplePair}>
                    {term.examples[index] ? (
                      <Text style={styles.example}>{term.examples[index]}</Text>
                    ) : null}
                    {term.meanings[index] ? (
                      <Text style={styles.exampleTranslation}>{term.meanings[index]}</Text>
                    ) : null}
                  </View>
                ),
              )}
            </>
          ) : null}
        </View>
      ) : null}
      {hasDetails ? (
        <View style={styles.expandIndicator}>
          <SymbolView
            name={
              expanded
                ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
            }
            size={14}
            tintColor="#8B9683"
          />
        </View>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    position: 'relative',
    minHeight: 138,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  expanded: { borderColor: WikiColors.border },
  pressed: { opacity: 0.8 },
  titleArea: { gap: 6, paddingRight: 42 },
  chapter: { color: WikiColors.green, fontSize: 12, lineHeight: 19 },
  chapterNumber: { fontFamily: NumberFontFamily },
  name: {
    color: WikiColors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nameEn: { color: WikiColors.muted, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  favorite: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  favoriteSelected: { backgroundColor: '#EDF4E7' },
  description: { color: '#586153', fontSize: 16, lineHeight: 26, marginTop: 10 },
  exampleSection: { gap: 9, paddingTop: 18 },
  exampleDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#DDE7D6', marginBottom: 4 },
  exampleLabel: { color: '#527C42', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  example: { color: WikiColors.ink, fontSize: 14, lineHeight: 22 },
  exampleTranslation: { color: '#737D6C', fontSize: 13, lineHeight: 21 },
  examplePair: { gap: 9 },
  expandIndicator: { alignItems: 'flex-end', marginTop: 10 },
});
