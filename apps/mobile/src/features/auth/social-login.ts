import { Alert } from 'react-native';

import type { SocialProvider } from '@/features/auth/api';

/**
 * 각 사 SDK 에서 자격증명을 받아온다.
 *
 * <b>아직 SDK 가 붙어 있지 않다.</b> 네이티브 모듈이라 설치하는 순간 Expo Go 로는
 * 앱이 뜨지 않고 development build 가 필요해진다. Apple 로그인은 개발자 계정이
 * 있어야 설정 자체가 시작되므로, 세 개를 한 번에 붙이려고 미뤄뒀다.
 *
 * 화면과 서버 호출 경로는 이미 완성돼 있어서, 여기 세 함수만 채우면 동작한다.
 *
 * <pre>
 * KAKAO   @react-native-seoul/kakao-login  → login() → accessToken
 * GOOGLE  @react-native-google-signin      → signIn() → idToken   (webClientId 설정 필요)
 * APPLE   expo-apple-authentication        → signInAsync() → identityToken + fullName
 * </pre>
 */

export type SocialCredential = {
  credential: string;
  /** Apple 최초 로그인에서만 값이 있다. Apple 은 이름을 한 번만 준다 */
  displayName?: string;
};

export class SocialLoginUnavailable extends Error {
  constructor(readonly provider: SocialProvider) {
    super(`${provider} 로그인이 아직 준비되지 않았습니다.`);
  }
}

export async function getSocialCredential(provider: SocialProvider): Promise<SocialCredential> {
  throw new SocialLoginUnavailable(provider);
}

/**
 * 사용자에게 상황을 알린다.
 *
 * 버튼을 눌렀는데 아무 반응이 없으면 고장으로 보인다. 준비 중이라는 것과
 * 지금 쓸 수 있는 방법(이메일)을 함께 알려준다.
 */
export function notifyUnavailable(provider: SocialProvider) {
  const label = { KAKAO: '카카오', GOOGLE: 'Google', APPLE: 'Apple' }[provider];
  Alert.alert(
    '준비 중이에요',
    `${label} 로그인은 곧 열립니다.\n지금은 이메일로 로그인해 주세요.`,
  );
}
