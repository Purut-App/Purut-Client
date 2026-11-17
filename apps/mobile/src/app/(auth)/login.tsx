import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthScreen, AuthField, AuthButton, AuthError, authStyles } from '@/features/auth/auth-ui';
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
    <AuthScreen
      title="로그인"
      footer={
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>아직 계정이 없으신가요?</Text>
          <Link href="/signup" replace style={authStyles.link}>
            회원가입
          </Link>
        </View>
      }
    >
      <AuthError message={message} />
      <AuthField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        error={fields.email}
        placeholder="이메일을 입력해 주세요"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
        textContentType="emailAddress"
        editable={!busy}
      />
      <AuthField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        error={fields.password}
        placeholder="비밀번호를 입력해 주세요"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
      />
      <AuthButton
        label="로그인"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!canSubmit}
      />
      <Divider label="또는" />
      <View style={authStyles.socials}>
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
      <Text style={authStyles.notice}>
        소셜 로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 봅니다
      </Text>
    </AuthScreen>
  );
}
