import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { PlaybackSpeedMenu } from '@/features/listening/playback-speed-menu';
import { LearningResultColors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { useWithdraw } from '@/features/me/use-me';
import { useLearningSettings } from '@/features/settings/use-learning-settings';
import {
  SettingsSection as Section,
  SettingsRow as Row,
  SettingsToggle as ToggleRow,
} from '@/features/settings/settings-ui';

/**
 * 약관 문서는 웹에 있다. 스토어 심사가 이 URL 을 직접 열어보므로 앱 안에만 두면 안 된다.
 *
 * 주소를 따로 상수로 박지 않고 API 주소에서 뽑는다. 개발 서버를 보고 있을 때
 * 운영 약관이 열리면 어느 환경인지 헷갈린다.
 */
async function openLegal(doc: 'terms' | 'privacy') {
  const base = (process.env.EXPO_PUBLIC_LEGAL_URL ?? '').replace(/\/$/, '');
  if (!base) {
    Alert.alert('준비 중', '아직 링크가 등록되지 않았어요.');
    return;
  }
  await WebBrowser.openBrowserAsync(`${base}/legal/${doc}`);
}

/**
 * 설정.
 *
 * 담는 것은 "가끔 들어와 바꾸고 나오는 것"이다. 학습 기본값은 서버에 둘 이유가 없어
 * 기기에 저장한다.
 */
export default function SettingsScreen() {
  const router = useRouter();

  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.signOut);
  const { settings, update } = useLearningSettings();
  const withdraw = useWithdraw();
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function confirmSignOut() {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  /** 앱스토어 심사가 앱 내 계정 삭제 경로를 요구한다 */
  function confirmWithdraw() {
    Alert.alert(
      '회원탈퇴',
      '탈퇴하면 다시 로그인할 수 없어요.\n같은 이메일로는 재가입도 되지 않습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            try {
              await withdraw.mutateAsync();
              await signOut();
            } catch {
              Alert.alert('탈퇴 실패', '잠시 후 다시 시도해 주세요.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ServiceScreen title="설정">
      <Section title="계정">
        <Row label="이메일" value={me?.email ?? '—'} />
        <Row
          label="프로필 수정"
          hint="이름 · 학년 · 학교"
          onPress={() => router.push('/onboarding')}
        />
        <Row label="비밀번호 변경" onPress={() => router.push('/settings/password')} />
      </Section>

      <Section title="학습">
        <Row
          label="듣기 재생 속도"
          value={`${settings.playbackRate}x`}
          numeric
          onPress={() => setSpeedMenuOpen(true)}
        />
        <ToggleRow
          label="해석 기본 표시"
          value={settings.showTranslation}
          onChange={(v) => update({ showTranslation: v })}
        />
        <ToggleRow
          label="재생 따라 자동 스크롤"
          value={settings.autoScroll}
          onChange={(v) => update({ autoScroll: v })}
        />
      </Section>

      <Section title="앱">
        <Row
          label="저장한 회차"
          hint="오프라인 음원 관리"
          onPress={() => router.push('/listening/downloads')}
        />
        <Row label="버전" value={Constants.expoConfig?.version ?? '—'} />
        <Row label="이용약관" onPress={() => openLegal('terms')} />
        <Row label="개인정보처리방침" onPress={() => openLegal('privacy')} />
      </Section>

      <View style={styles.accountActions}>
        <Pressable
          accessibilityRole="button"
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={confirmWithdraw}
          style={styles.withdraw}
        >
          <Text style={styles.withdrawText}>{busy ? '처리 중' : '회원탈퇴'}</Text>
        </Pressable>
      </View>
      <PlaybackSpeedMenu
        visible={speedMenuOpen}
        value={settings.playbackRate}
        onSelect={(value) => {
          void update({ playbackRate: value });
        }}
        onClose={() => setSpeedMenuOpen(false)}
      />
    </ServiceScreen>
  );
}
const styles = StyleSheet.create({
  accountActions: { gap: 12, marginTop: 4 },
  logout: {
    backgroundColor: '#FFFFFF',
    minHeight: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#1A1F2C', fontSize: 15, fontWeight: '700' },
  withdraw: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  withdrawText: { color: LearningResultColors.incorrect.text, fontSize: 12, fontWeight: '600' },
});
