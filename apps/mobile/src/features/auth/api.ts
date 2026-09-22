import { apiFetch } from '@/lib/api';

export type VocabLevel = 'GRADE_1' | 'GRADE_2' | 'GRADE_3';

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  onboardingRequired: boolean;
};

export type Me = {
  id: string;
  email: string | null;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  grade: number | null;
  school: string | null;
  /** 어휘 레벨. 학교 학년과 별개고 선생님이 지정한다 */
  vocabLevel: VocabLevel | null;
  onboarded: boolean;
};

export function signUp(body: { email: string; password: string; name: string }) {
  return apiFetch<TokenResponse>('/api/auth/signup', { method: 'POST', body });
}

export function login(body: { email: string; password: string }) {
  return apiFetch<TokenResponse>('/api/auth/login', { method: 'POST', body });
}

export type SocialProvider = 'KAKAO' | 'GOOGLE' | 'APPLE';

/**
 * 소셜 로그인. 첫 로그인이 곧 회원가입이다.
 *
 * @param credential 각 사 SDK 로 받은 토큰. 카카오는 access_token,
 *                   구글·Apple 은 id_token 이다. 서버가 직접 검증한다
 * @param displayName Apple 최초 로그인에서만 보낸다. Apple 은 이름을 딱 한 번만
 *                    주기 때문이다. 서버는 표시 이름의 기본값으로만 쓴다
 */
export function loginWithSocial(
  provider: SocialProvider,
  credential: string,
  displayName?: string,
) {
  return apiFetch<TokenResponse>(`/api/auth/oauth/${provider}`, {
    method: 'POST',
    body: { accessToken: credential, displayName },
  });
}

export function refreshTokens(refreshToken: string) {
  return apiFetch<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function logout(refreshToken: string) {
  return apiFetch<void>('/api/auth/logout', { method: 'POST', body: { refreshToken } });
}

export function fetchMe(accessToken: string) {
  return apiFetch<Me>('/api/me', { accessToken });
}

/** 최초 프로필 설정. 이메일·소셜 어느 경로로 가입했든 여기를 거친다. */
export function completeOnboarding(
  accessToken: string,
  body: { name: string; grade: number; school?: string },
) {
  return apiFetch<Me>('/api/me/onboarding', { method: 'PUT', accessToken, body });
}
