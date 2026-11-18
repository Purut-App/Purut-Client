import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import {
  SettingsField as TextField,
  SettingsButton as PrimaryButton,
} from '@/features/settings/settings-ui';
import { useFormError } from '@/features/auth/use-form-error';
import { useChangePassword } from '@/features/me/use-me';
import { LearningResultColors } from '@/constants/theme';

/** 비밀번호 변경. 현재 비밀번호는 서버가 다시 확인한다 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const { message, fields, capture, clear } = useFormError();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit =
    current.length > 0 && next.length >= 8 && confirm.length > 0 && !changePassword.isPending;

  async function submit() {
    clear();
    setLocalError(null);

    // 서버에 보내기 전에 걸러낼 수 있는 것들
    if (next !== confirm) {
      setLocalError('새 비밀번호가 서로 달라요');
      return;
    }
    if (next === current) {
      setLocalError('지금 쓰는 비밀번호와 같아요');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      Alert.alert('변경 완료', '비밀번호가 바뀌었어요.');
      router.back();
    } catch (error) {
      capture(error);
    }
  }

  return (
    <ServiceScreen title="비밀번호 변경" keyboard>
      <View style={styles.card}>
        <TextField
          label="현재 비밀번호"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoComplete="current-password"
          error={fields.currentPassword}
        />
        <TextField
          label="새 비밀번호 (8자 이상)"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoComplete="new-password"
          error={fields.newPassword}
        />
        <TextField
          label="새 비밀번호 확인"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />

        {(localError ?? message) ? <Text style={styles.error}>{localError ?? message}</Text> : null}

        <PrimaryButton
          label="변경하기"
          onPress={submit}
          disabled={!canSubmit}
          loading={changePassword.isPending}
        />
      </View>
    </ServiceScreen>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 30, gap: 22 },
  error: { color: LearningResultColors.incorrect.text, fontSize: 13, lineHeight: 21 },
});
