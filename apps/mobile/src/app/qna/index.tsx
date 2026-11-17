import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';

import { QnaText as ThemedText, QnaChrome, QnaStatusChip } from '@/features/qna/qna-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import type { QuestionCategory, QuestionListItem } from '@/features/qna/api';
import { useQnaNotices, useQuestions } from '@/features/qna/use-qna';

const CATEGORIES: { value: QuestionCategory | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'HOMEWORK', label: '숙제' },
  { value: 'VOCAB', label: '단어' },
  { value: 'LISTENING', label: '리스닝' },
  { value: 'TEXTBOOK', label: '교재' },
  { value: 'ETC', label: '기타' },
];

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  HOMEWORK: '숙제',
  VOCAB: '단어',
  LISTENING: '리스닝',
  TEXTBOOK: '교재',
  ETC: '기타',
};

export default function QnaHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const [minimumContentHeight, setMinimumContentHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const preservePosition = () =>
    setMinimumContentHeight(viewportHeight.current + Math.max(0, scrollY.current) + 1);
  const [scope, setScope] = useState<'public' | 'mine'>('public');
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const status = answeredOnly ? 'ANSWERED' : null;

  const questions = useQuestions({ scope, category, status });
  const notices = useQnaNotices();

  const items = useMemo(
    () => questions.data?.pages.flatMap((page) => page.items) ?? [],
    [questions.data],
  );

  return (
    <View style={styles.container}>
      <FlatList
        onTouchStart={preservePosition}
        data={questions.error ? [] : items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            minHeight: minimumContentHeight,
            paddingTop: insets.top + 86,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void questions.refetch().finally(() => setRefreshing(false));
        }}
        onEndReached={() => {
          if (questions.hasNextPage && !questions.isFetchingNextPage)
            void questions.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.heading}>
              <ThemedText type="title">Q&A</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="질문 작성"
                onPress={() => router.push('/qna/new')}
                style={({ pressed }) => [styles.askButton, pressed && styles.pressed]}
              >
                <ThemedText style={styles.askButtonText}>질문하기</ThemedText>
              </Pressable>
            </View>
            {(notices.data?.length ?? 0) > 0 ? (
              <View style={styles.notice}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="공지사항"
                  accessibilityState={{ expanded: noticesOpen }}
                  onPress={() => setNoticesOpen((value) => !value)}
                  style={styles.noticeToggle}
                >
                  <SymbolView
                    name={{ ios: 'pin.fill', android: 'push_pin', web: 'push_pin' }}
                    size={14}
                    tintColor="#527C42"
                  />
                  <ThemedText type="small" style={styles.noticeLabel}>
                    공지
                  </ThemedText>
                  <ThemedText type="small" numberOfLines={1} style={styles.noticeSummary}>
                    {notices.data?.[0]?.title}
                  </ThemedText>
                  <SymbolView
                    name={
                      noticesOpen
                        ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                        : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
                    }
                    size={14}
                    tintColor="#7B8774"
                  />
                </Pressable>
                {noticesOpen ? (
                  <View style={styles.noticeBody}>
                    {notices.data?.map((notice) => (
                      <View key={notice.id} style={styles.noticeItem}>
                        <ThemedText type="smallBold">{notice.title}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {notice.body}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View accessibilityRole="tablist" style={styles.tabs}>
              {(
                [
                  { value: 'public', label: '전체 질문' },
                  { value: 'mine', label: '내 질문' },
                ] as const
              ).map((tab) => (
                <Pressable
                  key={tab.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: scope === tab.value }}
                  onPress={() => {
                    preservePosition();
                    setScope(tab.value);
                  }}
                  style={[styles.tab, scope === tab.value && styles.tabActive]}
                >
                  <ThemedText style={[styles.tabText, scope === tab.value && styles.tabTextActive]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {CATEGORIES.map((option) => (
                <Pressable
                  key={option.value ?? 'all'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === option.value }}
                  onPress={() => {
                    preservePosition();
                    setCategory(option.value);
                  }}
                  style={[styles.category, category === option.value && styles.categoryActive]}
                >
                  <ThemedText
                    style={[
                      styles.categoryText,
                      category === option.value && styles.categoryTextActive,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.feedHeading}>
              <ThemedText type="smallBold">
                {category
                  ? CATEGORY_LABEL[category]
                  : scope === 'mine'
                    ? '내가 남긴 질문'
                    : '질문 모아보기'}
              </ThemedText>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: answeredOnly }}
                onPress={() => {
                  preservePosition();
                  setAnsweredOnly((value) => !value);
                }}
                style={styles.answeredFilter}
              >
                <View style={[styles.checkbox, answeredOnly && styles.checkboxActive]}>
                  {answeredOnly ? (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={11}
                      tintColor="#FFFFFF"
                    />
                  ) : null}
                </View>
                <ThemedText type="small" style={{ color: answeredOnly ? '#446F37' : '#7B8774' }}>
                  답변 완료만
                </ThemedText>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          questions.isPending ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#527C42" />
            </View>
          ) : questions.error ? (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                질문을 불러오지 못했습니다
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void questions.refetch();
                }}
                style={styles.emptyButton}
              >
                <ThemedText type="smallBold" style={{ color: '#527C42' }}>
                  다시 시도
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                아직 질문이 없어요. 궁금한 걸 물어보세요
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/qna/new')}
                style={styles.emptyButton}
              >
                <ThemedText type="smallBold" style={{ color: '#527C42' }}>
                  질문 작성
                </ThemedText>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          questions.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#527C42" />
            </View>
          ) : null
        }
        ItemSeparatorComponent={QuestionSeparator}
        renderItem={({ item }) => (
          <QuestionCard item={item} onPress={() => router.push(`/qna/${item.id}`)} />
        )}
      />
      <QnaChrome />
    </View>
  );
}

function QuestionSeparator() {
  return <View style={styles.questionSeparator} />;
}

function QuestionCard({ item, onPress }: { item: QuestionListItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${CATEGORY_LABEL[item.category]}, ${item.title}, 답변 ${item.answerCount}개`}
      onPress={onPress}
      style={({ pressed }) => [styles.questionRow, pressed && styles.questionPressed]}
    >
      <View style={styles.questionContext}>
        <ThemedText style={styles.subject}>{CATEGORY_LABEL[item.category]}</ThemedText>
        {item.mine ? <ThemedText style={styles.mine}>내 질문</ThemedText> : null}
        {!item.publicVisible ? (
          <SymbolView
            accessibilityLabel="비공개 질문"
            name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
            size={12}
            tintColor="#8B9683"
          />
        ) : null}
      </View>
      <ThemedText style={styles.questionTitle} numberOfLines={3}>
        {item.title}
      </ThemedText>
      <View style={styles.questionMeta}>
        <View style={styles.author}>
          <View style={styles.authorAvatar}>
            <Image
              source={require('../../../assets/images/character.png')}
              contentFit="contain"
              style={styles.authorImage}
            />
          </View>
          <View style={styles.authorLabel}>
            <ThemedText style={styles.authorName} numberOfLines={1}>
              {item.authorName}
            </ThemedText>
            <ThemedText style={styles.authorDate} numberOfLines={1}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.answerCount}>
          <SymbolView
            name={{
              ios: 'bubble.right',
              android: 'chat_bubble_outline',
              web: 'chat_bubble_outline',
            }}
            size={13}
            tintColor="#8B9683"
          />
          <ThemedText type="small" themeColor="textSecondary">
            {item.answerCount}
          </ThemedText>
        </View>
        <QnaStatusChip status={item.status} />
      </View>
    </Pressable>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  list: { paddingHorizontal: 18, flexGrow: 1 },
  listHeader: { gap: 18, paddingBottom: 12 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  askButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#527C42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  notice: { backgroundColor: '#F3F8EE', borderRadius: 20, overflow: 'hidden' },
  noticeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  noticeLabel: { color: '#527C42', fontWeight: '700' },
  noticeSummary: { flex: 1, color: '#74826C' },
  noticeBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 18 },
  noticeItem: { gap: 6 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#D7E8CF',
    borderRadius: 24,
    padding: 4,
    marginTop: 6,
  },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 15, color: '#7B8774', fontWeight: '600' },
  tabTextActive: { color: '#446F37', fontWeight: '700' },
  categories: { gap: 6 },
  category: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryActive: { backgroundColor: '#527C42' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#7B8774' },
  categoryTextActive: { color: '#FFFFFF' },
  feedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  answeredFilter: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#A7BE99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#527C42', borderColor: '#527C42' },
  questionSeparator: { height: 12 },
  questionRow: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 12,
  },
  questionPressed: { backgroundColor: '#F5F9F1' },
  questionContext: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  subject: { color: '#527C42', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  mine: { color: '#8B9683', fontSize: 11, lineHeight: 18 },
  questionTitle: { fontSize: 18, fontWeight: '700', lineHeight: 28, letterSpacing: -0.4 },
  questionMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  author: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  authorAvatar: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#CEE5BD', padding: 3 },
  authorImage: { width: '100%', height: '100%' },
  authorLabel: { marginLeft: 9, flexShrink: 1 },
  authorName: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
  authorDate: { fontSize: 9, lineHeight: 14, color: '#7B8774' },
  answerCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pressed: { opacity: 0.75 },
  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#EDF5E7',
  },
  footer: { paddingVertical: 16 },
});
