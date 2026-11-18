import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { LearningResultColors, NumberFontFamily } from '@/constants/theme';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}
export function SettingsRow({
  label,
  value,
  hint,
  onPress,
  numeric = false,
}: {
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
  numeric?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {value ? (
        <Text numberOfLines={1} style={[styles.value, numeric && styles.number]}>
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor="#8B9683"
        />
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
export function SettingsToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, styles.copy]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#DDE5D7', true: '#56AD62' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
export function SettingsField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#8B9683"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, error && styles.invalid, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
export function SettingsButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
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
const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionTitle: { color: '#74826C', fontSize: 13, fontWeight: '700', paddingHorizontal: 6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, paddingHorizontal: 22, paddingVertical: 6 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  copy: { flex: 1, gap: 5 },
  label: { color: '#1A1F2C', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  hint: { color: '#7B8774', fontSize: 12, lineHeight: 19 },
  value: { color: '#74826C', fontSize: 13, flexShrink: 1, maxWidth: '65%' },
  number: { fontFamily: NumberFontFamily, fontSize: 17 },
  field: { gap: 10 },
  input: {
    backgroundColor: '#F6F9F3',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3EBDD',
    minHeight: 54,
    padding: 16,
    fontSize: 16,
    color: '#1A1F2C',
  },
  focused: { borderColor: '#A7BE99' },
  invalid: { borderColor: LearningResultColors.incorrect.accent },
  error: { color: LearningResultColors.incorrect.text, fontSize: 12, lineHeight: 19 },
  button: {
    backgroundColor: '#527C42',
    minHeight: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
