import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function SignUpScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const signInWithSocial = useAuthStore((state) => state.signInWithSocial);
  const { message, fields, capture, clear } = useFormError();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  const busy = submitting || pendingProvider !== null;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    agreed &&
    !submitting &&
    pendingProvider === null;

  async function handleSubmit() {
    clear();
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/');
    } catch (error) {
      capture(error);
    } finally {
      setSubmitting(false);
    }
  }

  // 소셜 로그인도 첫 로그인이 곧 가입이다. 동의 없이 계정이 생기면 안 되므로
  // 이메일 가입과 같은 체크박스를 요구한다
  async function handleSocial(provider: SocialProvider) {
    clear();
    setPendingProvider(provider);
    try {
      const { credential, displayName } = await getSocialCredential(provider);
      await signInWithSocial(provider, credential, displayName);
      router.replace('/');
    } catch (error) {
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
      title="회원가입"
      footer={
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>이미 계정이 있으신가요?</Text>
          <Link href="/login" replace style={authStyles.link}>
            로그인
          </Link>
        </View>
      }
    >
      <AuthError message={message} />
      <AuthField
        label="이름"
        value={name}
        onChangeText={setName}
        error={fields.name}
        placeholder="이름을 입력해 주세요"
        autoComplete="name"
        textContentType="name"
        editable={!busy}
      />
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
        placeholder="8자 이상"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!busy}
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
      />
      <View style={styles.consent}>
        <Text style={styles.consentText}>
          수집 항목: 이름, 이메일 · 목적: 학습 기록 관리 및 본인 확인
        </Text>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="이용약관 및 개인정보처리방침 필수 동의"
        accessibilityState={{ checked: agreed, disabled: busy }}
        disabled={busy}
        onPress={() => setAgreed((previous) => !previous)}
        style={styles.agreeRow}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.agreeText}>
          <Text style={styles.required}>(필수)</Text> 이용약관 및 개인정보처리방침에 동의합니다
        </Text>
      </Pressable>
      <AuthButton
        label="가입하기"
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
            disabled={!agreed || (busy && pendingProvider !== provider)}
          />
        ))}
      </View>
      {!agreed ? (
        <Text style={authStyles.notice}>소셜 로그인도 약관 동의 후 이용할 수 있어요</Text>
      ) : null}
    </AuthScreen>
  );
}
const styles = StyleSheet.create({
  consent: { backgroundColor: '#F6F9F3', borderRadius: 18, padding: 14 },
  consentText: { color: '#74826C', fontSize: 12, lineHeight: 20 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#A7BE99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#527C42', borderColor: '#527C42' },
  check: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '700' },
  agreeText: { flex: 1, color: '#586153', fontSize: 13, lineHeight: 21 },
  required: { color: '#527C42', fontWeight: '700' },
});
