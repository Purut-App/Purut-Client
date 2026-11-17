import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { LearningResultColors } from '@/constants/theme';
import {
  SettingsField as TextField,
  SettingsButton as PrimaryButton,
} from '@/features/settings/settings-ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFormError } from '@/features/auth/use-form-error';

const GRADES = [1, 2, 3];

/**
 * 최초 프로필 설정.
 *
 * 회원가입 폼이 아니라 별도 화면인 이유: 소셜 로그인에는 가입 폼이 없다.
 * 카카오·네이버로 들어온 학생도 여기를 거쳐야 학년이 채워진다.
 * 학년이 없으면 단어 DAY 가 열리지 않는다.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const me = useAuthStore((state) => state.me);
  const submitOnboarding = useAuthStore((state) => state.submitOnboarding);
  const { message, fields, capture, clear } = useFormError();

  const [name, setName] = useState(me?.name ?? '');
  const [grade, setGrade] = useState<number | null>(me?.grade ?? null);
  const [school, setSchool] = useState(me?.school ?? '');
  const [submitting, setSubmitting] = useState(false);

  const editingProfile = Boolean(me?.onboarded);
  const canSubmit = name.trim().length > 0 && grade !== null && !submitting;

  async function handleSubmit() {
    if (grade === null) return;
    clear();
    setSubmitting(true);
    try {
      await submitOnboarding({
        name: name.trim(),
        grade,
        school: school.trim() || undefined,
      });
      if (editingProfile) router.back();
      else router.replace('/');
    } catch (error) {
      capture(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ServiceScreen
      title={editingProfile ? '프로필 수정' : '프로필 설정'}
      back={editingProfile}
      keyboard
    >
      <View style={styles.card}>
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <TextField
          label="이름"
          value={name}
          onChangeText={setName}
          error={fields.name}
          editable={!submitting}
        />
        <View style={styles.field}>
          <Text style={styles.label}>학년</Text>
          <View style={styles.grades}>
            {GRADES.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: grade === value }}
                disabled={submitting}
                onPress={() => setGrade(value)}
                style={[styles.grade, grade === value && styles.gradeActive]}
              >
                <Text style={[styles.gradeText, grade === value && styles.gradeTextActive]}>
                  고{value}
                </Text>
              </Pressable>
            ))}
          </View>
          {fields.grade ? <Text style={styles.error}>{fields.grade}</Text> : null}
        </View>
        <TextField
          label="학교 (선택)"
          value={school}
          onChangeText={setSchool}
          error={fields.school}
          placeholder="정운고등학교"
          editable={!submitting}
        />
        <PrimaryButton
          label={editingProfile ? '저장하기' : '시작하기'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </View>
    </ServiceScreen>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 30, gap: 22 },
  field: { gap: 10 },
  label: { color: '#1A1F2C', fontSize: 15, fontWeight: '600' },
  grades: { flexDirection: 'row', gap: 10 },
  grade: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#EDF5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeActive: { backgroundColor: '#527C42' },
  gradeText: { color: '#527C42', fontSize: 15, fontWeight: '700' },
  gradeTextActive: { color: '#FFFFFF' },
  error: { color: LearningResultColors.incorrect.text, fontSize: 12, lineHeight: 20 },
});
