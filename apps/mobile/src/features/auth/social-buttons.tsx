import { SymbolView, type SFSymbol } from 'expo-symbols';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { SocialProvider } from '@/features/auth/api';
import { useTheme } from '@/hooks/use-theme';

/**
 * 소셜 로그인 버튼.
 *
 * 색과 문구는 각 사 브랜드 가이드라인을 따른다. 임의로 바꾸면 심사에서 반려된다.
 *   카카오 — #FEE500 배경 + 검정 텍스트 85% 불투명도, "카카오 로그인"
 *   Apple  — 검정 배경 + 흰 텍스트, 사과 로고, "Apple로 로그인"
 *   구글   — 흰 배경 + 회색 테두리, "Google로 로그인"
 *
 * Apple 은 iOS 에서만 뜬다. Android 에 Apple 버튼을 두면 동작하지 않는다.
 * 반대로 <b>iOS 에서 다른 소셜 로그인을 제공하면 Apple 로그인이 필수</b>다
 * (App Store 심사 지침 4.8).
 */

type Style = {
  bg: string;
  fg: string;
  border?: string;
  label: string;
  symbol: SFSymbol;
};

const STYLES: Record<SocialProvider, Style> = {
  KAKAO: { bg: '#FEE500', fg: '#191600', label: '카카오 로그인', symbol: 'message.fill' },
  GOOGLE: { bg: '#FFFFFF', fg: '#1F1F1F', border: '#DADCE0', label: 'Google로 로그인', symbol: 'g.circle.fill' },
  APPLE: { bg: '#000000', fg: '#FFFFFF', label: 'Apple로 로그인', symbol: 'apple.logo' },
};

export function SocialButton({
  provider,
  onPress,
  loading,
  disabled,
}: {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const style = STYLES[provider];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={style.label}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: style.bg,
          borderColor: style.border ?? style.bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={style.fg} />
      ) : (
        <>
          <SymbolView
            name={{ ios: style.symbol, android: 'login', web: 'login' }}
            size={18}
            tintColor={style.fg}
            weight={{ ios: 'medium', android: { name: 'outlined', font: 500 } }}
          />
          <ThemedText type="smallBold" style={{ color: style.fg }}>
            {style.label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

/** "또는" 구분선. 이메일 로그인과 소셜 로그인 사이를 나눈다. */
export function Divider({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: theme.backgroundSelected }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.line, { backgroundColor: theme.backgroundSelected }]} />
    </View>
  );
}

/** 이 기기에서 쓸 수 있는 제공자. Apple 은 iOS 전용이다. */
export function availableProviders(): SocialProvider[] {
  return Platform.OS === 'ios' ? ['KAKAO', 'GOOGLE', 'APPLE'] : ['KAKAO', 'GOOGLE'];
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
