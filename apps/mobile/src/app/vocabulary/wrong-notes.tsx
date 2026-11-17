import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { LearningResultColors, NumberFontFamily, Palette } from '@/constants/theme';
import type { WrongNoteItem } from '@/features/me/api';
import { useWrongNotes } from '@/features/me/use-me';
import { useWrongNoteWord } from '@/features/vocabulary/use-wrong-note-word';

/** Preserve each wrong word, its meaning, wrong count and consecutive record. */
export default function WrongNotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isPending, error, refetch } = useWrongNotes();
  const notes = data ?? [];
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

  function toggleNote(wordId: number) {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setExpandedWordId((current) => (current === wordId ? null : wordId));
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + 92,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
      >
        <Text style={styles.pageTitle}>오답노트</Text>

        {isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={LearningResultColors.correct.text} />
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>오답노트를 불러오지 못했습니다</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>다시 볼 단어</Text>
              <View style={styles.summaryValueRow}>
                <Text style={styles.summaryCount}>{notes.length}</Text>
                <Text style={styles.summaryUnit}>개 단어</Text>
              </View>
            </View>

            {notes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>아직 틀린 단어가 없어요</Text>
                <Text style={styles.stateHint}>단어시험에서 틀리면 여기에 모입니다</Text>
              </View>
            ) : (
              <View style={styles.noteList}>
                {notes.map((note) => (
                  <NoteRow
                    key={note.wordId}
                    note={note}
                    expanded={expandedWordId === note.wordId}
                    onPress={() => toggleNote(note.wordId)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <LinearGradient
        colors={['rgba(227, 242, 222, 1)', 'rgba(227, 242, 222, 0.94)', 'rgba(227, 242, 222, 0)']}
        pointerEvents="none"
        style={[styles.headerFade, { height: insets.top + 90 }]}
      />
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={21}
            tintColor={Palette.ink}
          />
        </Pressable>
      </View>
    </View>
  );
}

function NoteRow({
  note,
  expanded,
  onPress,
}: {
  note: WrongNoteItem;
  expanded: boolean;
  onPress: () => void;
}) {
  const { data: word, isPending, error, refetch } = useWrongNoteWord(note.wordId, expanded);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${note.headword}, ${note.meaningKo}, 오답 ${note.wrongCount}회, 예문 ${expanded ? '접기' : '보기'}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        expanded && styles.rowExpanded,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.headword}>{note.headword}</Text>
        <View style={styles.wrongBadge}>
          <Text style={styles.wrongCount}>오답 {note.wrongCount}회</Text>
        </View>
      </View>
      <Text style={styles.meaning}>{note.meaningKo}</Text>
      {expanded ? (
        <View style={styles.exampleSection}>
          <Text style={styles.exampleLabel}>예문</Text>
          {isPending ? (
            <ActivityIndicator size="small" color="#527C42" />
          ) : error ? (
            <View style={styles.exampleError}>
              <Text style={styles.exampleTranslation}>예문을 불러오지 못했어요.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  void refetch();
                }}
                style={styles.exampleRetry}
              >
                <Text style={styles.exampleLabel}>다시 시도</Text>
              </Pressable>
            </View>
          ) : word?.exampleEn ? (
            <>
              <Text style={styles.example}>{word.exampleEn}</Text>
              {word.exampleKo ? (
                <Text style={styles.exampleTranslation}>{word.exampleKo}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.exampleTranslation}>
              {word ? '등록된 예문이 없어요.' : '이 단어의 예문을 찾지 못했어요.'}
            </Text>
          )}
        </View>
      ) : null}
      <View style={styles.rowFooter}>
        {note.streakCount > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streak}>연속 {note.streakCount}</Text>
          </View>
        ) : (
          <View />
        )}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  list: { paddingHorizontal: 18, gap: 18 },
  pageTitle: {
    color: Palette.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -1,
    paddingHorizontal: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  summaryCard: { borderRadius: 30, backgroundColor: '#FFFFFF', padding: 24, gap: 8 },
  summaryLabel: { color: '#737D6C', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  summaryCount: {
    color: Palette.ink,
    fontSize: 48,
    lineHeight: 58,
    fontFamily: NumberFontFamily,
    letterSpacing: -1.5,
  },
  summaryUnit: { color: '#737D6C', fontSize: 14, fontWeight: '500' },
  noteList: { gap: 14 },
  row: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: '#FFFFFF',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowExpanded: { borderColor: '#A7BE99' },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  exampleSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE7D6',
    paddingTop: 16,
    marginTop: 4,
    gap: 9,
  },
  exampleLabel: { color: '#527C42', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  example: { color: Palette.ink, fontSize: 14, lineHeight: 22 },
  exampleTranslation: { color: '#737D6C', fontSize: 13, lineHeight: 21 },
  exampleError: { gap: 6 },
  exampleRetry: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headword: {
    flex: 1,
    color: Palette.ink,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  meaning: { color: '#63745A', fontSize: 16, lineHeight: 24 },
  wrongBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: LearningResultColors.incorrect.soft,
  },
  wrongCount: {
    color: LearningResultColors.incorrect.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  streakBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: LearningResultColors.correct.soft,
    marginTop: 2,
  },
  streak: {
    color: LearningResultColors.correct.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  stateTitle: {
    color: Palette.ink,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    textAlign: 'center',
  },
  stateHint: { color: '#737D6C', fontSize: 13, lineHeight: 21, textAlign: 'center' },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#EDF4E7',
  },
  retryText: { color: LearningResultColors.correct.text, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
