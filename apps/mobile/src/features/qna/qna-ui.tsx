import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { QuestionStatus } from './api';

export const QNA_THEME = {
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#E8F0E2',
  text: '#1A1F2C',
  textSecondary: '#7B8774',
};
export const QNA_STATUS: Record<
  QuestionStatus,
  { label: string; color: string; background: string }
> = {
  PENDING: { label: '답변 대기', color: '#75806E', background: '#EFF2EC' },
  ANSWERED: { label: '답변 완료', color: '#446F37', background: '#E3F2DE' },
  REOPENED: { label: '재질문', color: '#4C7FAD', background: '#E7F1FC' },
  CLOSED: { label: '종료', color: '#75806E', background: '#EFF2EC' },
};
export function QnaText({
  type,
  themeColor,
  style,
  ...props
}: TextProps & { type?: string; themeColor?: string }) {
  return (
    <Text
      {...props}
      style={[
        styles.text,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        themeColor === 'textSecondary' && styles.secondary,
        style,
      ]}
    />
  );
}
export function QnaChrome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar style="dark" />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(227,242,222,1)', 'rgba(227,242,222,0.94)', 'rgba(227,242,222,0)']}
        style={[styles.fade, { height: insets.top + 86 }]}
      />
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.back}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={21}
            tintColor="#1A1F2C"
          />
        </Pressable>
      </View>
    </>
  );
}
export function QnaButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(loading || disabled) }}
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (loading || disabled) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}
export function QnaField({ label, style, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <QnaText type="smallBold">{label}</QnaText>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor="#8B9683"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
    </View>
  );
}
export function QnaFilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}
export function QnaFilterChipRow({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipRow, style]}
    >
      {children}
    </ScrollView>
  );
}
export function QnaStatusChip({ status }: { status: QuestionStatus }) {
  const tone = QNA_STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Text style={[styles.badgeText, { color: tone.color }]}>{tone.label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  text: { color: '#1A1F2C', fontSize: 16, lineHeight: 25 },
  title: { fontSize: 30, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 23, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 },
  small: { fontSize: 13, lineHeight: 21 },
  smallBold: { fontSize: 15, lineHeight: 23, fontWeight: '700' },
  secondary: { color: '#7B8774' },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, zIndex: 4 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: 52,
    padding: 14,
    borderRadius: 26,
    backgroundColor: '#527C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  field: { gap: 10, flexShrink: 1 },
  input: {
    backgroundColor: '#F6F9F3',
    color: '#1A1F2C',
    borderWidth: 1.5,
    borderColor: '#E3EBDD',
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 52,
  },
  inputFocused: { borderColor: '#A7BE99' },
  chip: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#527C42' },
  chipText: { color: '#75806E', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  chipRow: { gap: 8, paddingVertical: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
