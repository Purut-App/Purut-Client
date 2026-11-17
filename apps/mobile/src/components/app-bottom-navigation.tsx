import { type Href, useRouter, useSegments } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/features/auth/auth-store';
import { Palette } from '@/constants/theme';

export const APP_BOTTOM_NAV_HEIGHT = 68;
export const APP_BOTTOM_NAV_BOTTOM_OFFSET = 12;
/** 스크롤 콘텐츠가 플로팅 메뉴바에 가려지지 않도록 확보할 최소 여백. */
export const APP_BOTTOM_NAV_CONTENT_OFFSET =
  APP_BOTTOM_NAV_HEIGHT + APP_BOTTOM_NAV_BOTTOM_OFFSET + 16;

/** Logged-in service screens share one fixed, floating bottom navigation. */
export function AppBottomNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const tokens = useAuthStore((state) => state.tokens);
  const topRoute = String(segments[0]);
  const isTransientFlow = topRoute === '(auth)' || topRoute === 'onboarding' || topRoute === 'quiz';

  const isListeningPlayer =
    topRoute === 'listening' &&
    (String(segments[2]) === 'full' || String(segments[2]) === '[itemId]');

  if (!tokens || isTransientFlow || isListeningPlayer) return null;

  const homeActive = topRoute === 'index';
  const currentTab = getCurrentTab(topRoute, homeActive);

  function navigateToTab(target: ReturnType<typeof getCurrentTab>, href: Href) {
    if (target === currentTab) return;

    router.replace(href);
  }

  return (
    <View style={styles.bottomNav}>
      <View style={styles.navContent}>
        <NavItem
          label="홈"
          active={homeActive}
          symbol={{ ios: 'house.fill', android: 'home', web: 'home' }}
          onPress={() =>
            navigateToTab('home', '/')
          }
        />
        <NavItem
          label="공부"
          active={topRoute === 'study'}
          symbol={{ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' }}
          onPress={() => navigateToTab('study', '/study')}
        />
        <NavItem
          label="캘린더"
          active={topRoute === 'calendar'}
          symbol={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          onPress={() => navigateToTab('calendar', '/calendar')}
        />
        <NavItem
          label="마이페이지"
          active={topRoute === 'mypage'}
          symbol={{ ios: 'person.fill', android: 'person', web: 'person' }}
          onPress={() => navigateToTab('mypage', '/mypage')}
        />
      </View>
    </View>
  );
}

function getCurrentTab(topRoute: string, homeActive: boolean) {
  if (homeActive) return 'home';
  if (topRoute === 'study') return 'study';
  if (topRoute === 'calendar') return 'calendar';
  if (topRoute === 'mypage') return 'mypage';
  return 'home';
}

function NavItem({
  active = false,
  label,
  onPress,
  symbol,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
  symbol: {
    ios: 'house.fill' | 'calendar' | 'book.closed.fill' | 'person.fill';
    android: 'home' | 'calendar_month' | 'menu_book' | 'person';
    web: 'home' | 'calendar_month' | 'menu_book' | 'person';
  };
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={styles.tab}
    >
      <View style={active ? styles.activeTab : undefined}>
        <SymbolView
          name={symbol}
          size={24}
          tintColor={active ? Palette.primaryDark : '#444444'}
          weight="regular"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: APP_BOTTOM_NAV_BOTTOM_OFFSET,
    height: APP_BOTTOM_NAV_HEIGHT,
    backgroundColor: '#F8F8F8',
    borderRadius: 999,
    paddingHorizontal: 20,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  navContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
