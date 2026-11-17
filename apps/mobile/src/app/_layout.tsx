import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAudioModeAsync } from 'expo-audio';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { useAuthStore } from '@/features/auth/auth-store';
import { useProgressQueueFlush } from '@/features/listening/use-network';
import { AppBottomNavigation } from '@/components/app-bottom-navigation';
import { NumberFontFamily } from '@/constants/theme';

/** 서버 상태는 TanStack Query, UI 상태는 Zustand 로 분리한다. */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * 인증 게이트. 로그인 여부에 따라 (auth) 그룹과 앱 화면 사이를 오간다.
 * 세션 복구가 끝나기 전에 판단하면 이미 로그인한 사용자가 로그인 화면을 스쳐 보게 된다.
 */
function useAuthRedirect() {
  const restoring = useAuthStore((state) => state.restoring);
  const tokens = useAuthStore((state) => state.tokens);
  const me = useAuthStore((state) => state.me);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!tokens) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    // 학년이 없으면 단어 DAY 가 열리지 않는다. 소셜 로그인도 이 화면을 거친다
    if (me && !me.onboarded) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // The onboarding form also edits an existing profile from My Page/settings.
    // Its submit handler owns navigation after saving, so keep that route open.
    if (inAuthGroup) {
      router.replace('/');
    }
  }, [restoring, tokens, me, segments, router]);

  return restoring;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    [NumberFontFamily]: require('../../assets/fonts/BricolageGrotesque-ExtraBold.ttf'),
  });
  const [queryClient] = useState(createQueryClient);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  // 듣기 음원을 화면이 꺼져도 계속 재생하려면 오디오 세션을 이렇게 잡아야 한다.
  // app.json 의 UIBackgroundModes 선언만으로는 동작하지 않는다.
  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      // 학습 앱이라 무음 스위치가 켜져 있어도 소리가 나야 한다
      playsInSilentMode: true,
      // 듣기는 집중이 목적이므로 다른 앱 오디오는 멈춘다
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // 오디오 세션 설정 실패가 앱 실행을 막을 이유는 없다. 재생 시 다시 시도된다
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        {fontsLoaded || fontError ? (
          <RootNavigator />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const restoring = useAuthRedirect();

  // 오프라인에서 쌓인 듣기 진도를 온라인 복귀 시 보낸다
  useProgressQueueFlush();

  if (restoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.navigator}>
      <Stack>
        <Stack.Screen name="index" options={{ animation: 'none', headerShown: false }} />
        <Stack.Screen
          name="calendar"
          options={{ animation: 'none', headerShown: false }}
        />
        <Stack.Screen name="study" options={{ animation: 'none', headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ title: '회원가입' }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, headerBackVisible: false }}
        />
        <Stack.Screen name="mypage" options={{ animation: 'none', headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="settings/password" options={{ headerShown: false }} />
        <Stack.Screen name="homework/index" options={{ headerShown: false }} />
        <Stack.Screen name="homework/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vocabulary/index" options={{ headerShown: false }} />
        <Stack.Screen name="vocabulary/[dayId]" options={{ headerShown: false }} />
        <Stack.Screen
          name="vocabulary/wrong-notes"
          options={{ title: '오답노트', headerShown: false }}
        />
        {/*
        시험 중 실수로 빠져나가지 않도록 헤더 뒤로가기와 스와이프는 막되,
        화면 안의 "중단하기"로는 나갈 수 있게 한다 (확인 후 이탈, 답은 저장됨)
      */}
        <Stack.Screen
          name="quiz/[attemptId]/index"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="quiz/[attemptId]/result"
          options={{ title: '시험 결과', headerShown: false }}
        />
        <Stack.Screen name="qna/index" options={{ headerShown: false }} />
        <Stack.Screen name="qna/new" options={{ headerShown: false }} />
        <Stack.Screen name="qna/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="listening/index" options={{ headerShown: false }} />
        <Stack.Screen name="listening/downloads" options={{ headerShown: false }} />
        {/* 아래 두 화면은 제목을 시험 이름으로 바꾼다. 데이터를 받은 뒤라 화면 쪽에서 설정한다 */}
        <Stack.Screen name="listening/[examId]/index" options={{ headerShown: false }} />
        <Stack.Screen name="listening/[examId]/full" options={{ headerShown: false }} />
        <Stack.Screen name="listening/[examId]/[itemId]" options={{ headerShown: false }} />
        <Stack.Screen name="wiki/index" options={{ headerShown: false }} />
        <Stack.Screen name="wiki/[chapterId]" options={{ headerShown: false }} />
        <Stack.Screen name="wiki/favorites" options={{ headerShown: false }} />
      </Stack>
      <AppBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  navigator: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
