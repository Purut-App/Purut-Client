import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { Fonts, NumberFontFamily, Palette } from '@/constants/theme';
import { LearningOverview } from '@/features/home/learning-overview';
import { useAuthStore } from '@/features/auth/auth-store';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const name = useAuthStore((state) => state.me?.name);
  const heroHeight = Math.min(420, Math.max(300, height * 0.44));

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET }}
      >
        <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text numberOfLines={2} style={styles.title}>
                {name ? `${name}님, 안녕하세요` : '안녕하세요'}
              </Text>
              <Text style={styles.caption}>오늘도 화이팅!</Text>
            </View>
          </View>
          <View style={styles.characterSlot} pointerEvents="none">
            <Image
              source={require('../../assets/images/character.png')}
              style={styles.characterImage}
              contentFit="contain"
              accessibilityLabel="푸릇 캐릭터"
            />
          </View>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/study')}
              style={({ pressed }) => [styles.studyButton, pressed && styles.pressed]}
            >
              <Text style={styles.studyButtonText}>공부하러 가기</Text>
              <SymbolView
                name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                size={18}
                tintColor="#FFFFFF"
              />
            </Pressable>
          </View>

          <LearningOverview />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  hero: { paddingHorizontal: 24, position: 'relative', overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    zIndex: 1,
  },
  greeting: { flex: 1, gap: 6 },
  title: { color: Palette.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.7 },
  caption: { color: '#555555', fontSize: 15 },
  characterSlot: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  characterImage: {
    width: '78%',
    height: '100%',
  },
  cards: { marginTop: -12, paddingHorizontal: 16, gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22 },
  cardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { color: Palette.ink, fontSize: 19, fontWeight: '700', letterSpacing: -0.5 },
  periodLabel: { color: '#737373', fontSize: 12 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 8 },
  totalValue: {
    color: Palette.ink,
    fontSize: 48,
    fontFamily: NumberFontFamily,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  totalUnit: { color: '#666666', fontSize: 18, fontWeight: '600' },
  sessionRow: { flexDirection: 'row', gap: 18, marginTop: 14, marginBottom: 22 },
  session: { flex: 1, gap: 8 },
  sessionLabel: { color: '#666666', fontSize: 13 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: Palette.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Palette.primary },
  sessionNumber: { fontFamily: NumberFontFamily, fontWeight: 'normal' },
  sessionValue: { color: Palette.ink, fontSize: 14, fontWeight: '600' },
  studyButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: Palette.ink,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  studyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  studyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 24,
    marginBottom: 22,
  },
  chartColumn: { flex: 1, alignItems: 'center', gap: 8 },
  chartValue: { color: '#737373', fontSize: 11, fontVariant: ['tabular-nums'] },
  barTrack: { width: '100%', height: 84, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 7, backgroundColor: '#E9E9E9' },
  todayBar: { backgroundColor: Palette.primary },
  dayLabel: { color: '#737373', fontSize: 12, fontWeight: '500' },
  accentText: { color: Palette.primaryDark, fontWeight: '700' },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  stat: { flex: 1, gap: 8 },
  statLabel: { color: '#737373', fontSize: 12 },
  statValue: {
    color: Palette.ink,
    fontSize: 22,
    fontFamily: NumberFontFamily,
    fontVariant: ['tabular-nums'],
  },
  statUnit: { color: '#737373', fontSize: 12, fontWeight: '500', fontFamily: Fonts.sans },
});
