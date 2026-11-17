import { Image, type ImageSource } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { Palette } from '@/constants/theme';
import { toIsoDate, useAssignments } from '@/features/homework/use-homework';

/** Study selection: homework first, then learning modes and questions. */
export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = new Date();
  const { data: assignments, isPending, error } = useAssignments(today);
  const todayKey = toIsoDate(today);
  const nextAssignment = assignments
    ?.filter(
      (assignment) =>
        assignment.assignedDate <= todayKey &&
        assignment.dueDate >= todayKey &&
        (assignment.status === 'NOT_SUBMITTED' || assignment.status === 'RESUBMIT_REQUIRED'),
    )
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))[0];
  const homeworkTitle = isPending
    ? '숙제를 확인하고 있어요'
    : error
      ? '숙제 목록을 확인해 주세요'
      : (nextAssignment?.title ?? '등록된 숙제를 확인해 보세요');
  const homeworkDetail = nextAssignment
    ? `${formatDueDate(nextAssignment.dueDate)}까지${nextAssignment.status === 'RESUBMIT_REQUIRED' ? ' · 다시 제출해 주세요' : ''}`
    : null;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>공부</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`숙제. ${homeworkTitle}. 숙제 보기`}
          onPress={() => router.push('/homework')}
          style={({ pressed }) => [styles.homeworkPanel, pressed && styles.pressed]}
        >
          <View style={styles.homeworkCopy}>
            <Text style={styles.homeworkEyebrow}>나의 숙제</Text>
            <Text numberOfLines={2} style={styles.homeworkTitle}>
              {homeworkTitle}
            </Text>
            {homeworkDetail ? <Text style={styles.homeworkDetail}>{homeworkDetail}</Text> : null}
            <View style={styles.homeworkAction}>
              <Text style={styles.homeworkActionText}>숙제 보기</Text>
              <SymbolView
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                size={15}
                tintColor="#FFFFFF"
              />
            </View>
          </View>
          <Image
            source={require('../../assets/images/character.png')}
            contentFit="contain"
            style={styles.homeworkCharacter}
            accessible={false}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>학습 메뉴</Text>
        <View style={styles.menuGrid}>
          <View style={styles.tileRow}>
            <MenuTile
              label="단어시험"
              image={require('../../assets/images/menu-icons/vocabulary.png')}
              onPress={() => router.push('/vocabulary')}
            />
            <MenuTile
              label="리스닝"
              image={require('../../assets/images/menu-icons/listening.png')}
              onPress={() => router.push('/listening')}
            />
          </View>
          <View style={styles.tileRow}>
            <MenuTile label="Wiki" image={require('../../assets/images/menu-icons/wiki.png')} onPress={() => router.push('/wiki')} />
            <MenuTile label="인강" image={require('../../assets/images/menu-icons/course.png')} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Q&A. 질문하고 답변 확인하기"
          onPress={() => router.push('/qna')}
          style={({ pressed }) => [styles.qnaPanel, pressed && styles.pressed]}
        >
          <Image
            source={require('../../assets/images/menu-icons/qna.png')}
            contentFit="contain"
            style={styles.qnaIcon}
            accessible={false}
          />
          <View style={styles.qnaCopy}>
            <Text style={styles.qnaTitle}>Q&A</Text>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={18}
            tintColor={Palette.ink}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function formatDueDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

function MenuTile({
  label,
  image,
  onPress,
}: {
  label: string;
  image: ImageSource;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={onPress ? label : `${label}, 준비 중`}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        !onPress && styles.unavailableTile,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tileArtwork}>
        <Image source={image} contentFit="contain" style={styles.menuImage} accessible={false} />
        {!onPress ? <Text style={styles.comingSoon}>준비 중</Text> : null}
      </View>
      <View style={styles.tileCopy}>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18 },
  header: { gap: 6, marginBottom: 22 },
  pageTitle: { color: Palette.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  pressed: { opacity: 0.75 },
  homeworkPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 190,
  },
  homeworkCopy: { flex: 1, alignItems: 'flex-start' },
  homeworkEyebrow: { color: '#53634F', fontSize: 12, fontWeight: '600', marginBottom: 9 },
  homeworkTitle: {
    color: Palette.ink,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  homeworkDetail: { color: '#737373', fontSize: 12, lineHeight: 18, marginTop: 7 },
  homeworkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.ink,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
  },
  homeworkActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  homeworkCharacter: { width: '32%', aspectRatio: 1 },
  sectionTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 26,
    marginBottom: 12,
  },
  menuGrid: { gap: 12 },
  tileRow: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    minHeight: 164,
    justifyContent: 'space-between',
    gap: 16,
  },
  tileArtwork: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  menuImage: { width: 58, height: 58 },
  comingSoon: { color: '#737373', fontSize: 10, paddingTop: 3 },
  tileCopy: { gap: 6 },
  tileLabel: { color: Palette.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  unavailableTile: { opacity: 0.72 },
  qnaPanel: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qnaIcon: { width: 44, height: 44 },
  qnaCopy: { flex: 1, gap: 5 },
  qnaTitle: { color: Palette.ink, fontSize: 17, fontWeight: '700' },
});
