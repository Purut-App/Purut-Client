import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { SocialProvider } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  getSocialCredential,
  notifyUnavailable,
  SocialLoginUnavailable,
} from '@/features/auth/social-login';
import { availableProviders, Divider, SocialButton } from '@/features/auth/social-buttons';
import { useFormError } from '@/features/auth/use-form-error';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithSocial = useAuthStore((state) => state.signInWithSocial);
  const { message, fields, capture, clear } = useFormError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  const busy = submitting || pendingProvider !== null;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  async function handleSubmit() {
    clear();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (error) {
      capture(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSocial(provider: SocialProvider) {
    clear();
    setPendingProvider(provider);
    try {
      const { credential, displayName } = await getSocialCredential(provider);
      await signInWithSocial(provider, credential, displayName);
      router.replace('/');
    } catch (error) {
      // SDK 가 아직 없는 것과 로그인 실패는 사용자에게 다른 상황이다
      if (error instanceof SocialLoginUnavailable) {
        notifyUnavailable(provider);
      } else {
        capture(error);
      }
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="title">푸릇푸릇</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              로그인하고 오늘의 학습을 시작하세요
            </ThemedText>
          </View>

          {message ? (
            <ThemedText type="small" style={styles.formError}>
              {message}
            </ThemedText>
          ) : null}

          <TextField
            label="이메일"
            value={email}
            onChangeText={setEmail}
            error={fields.email}
            placeholder="student@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            textContentType="emailAddress"
          />

          <TextField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            error={fields.password}
            placeholder="비밀번호"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={canSubmit ? handleSubmit : undefined}
          />

          <PrimaryButton label="로그인" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />

          <Divider label="또는" />

          <View style={styles.socials}>
            {availableProviders().map((provider) => (
              <SocialButton
                key={provider}
                provider={provider}
                onPress={() => handleSocial(provider)}
                loading={pendingProvider === provider}
                disabled={busy && pendingProvider !== provider}
              />
            ))}
          </View>

          {/* 소셜은 첫 로그인이 곧 가입이다. 동의 절차 없이 계정이 생기므로
              여기서 고지한다 — 국내 앱에서 통용되는 방식이고 심사에서도 확인한다 */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.consentNotice}>
            소셜 로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 봅니다
          </ThemedText>

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              아직 계정이 없으신가요?
            </ThemedText>
            <Link href="/signup" replace>
              <ThemedText type="smallBold" style={styles.link}>
                회원가입
              </ThemedText>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 18,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  formError: {
    color: Palette.danger,
  },
  socials: {
    gap: 10,
  },
  consentNotice: {
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  link: {
    color: Palette.primary,
  },
});
