import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StableScrollView } from '@/components/stable-scroll-view';
import { LearningResultColors } from '@/constants/theme';

export {
  SettingsField as AuthField,
  SettingsButton as AuthButton,
} from '@/features/settings/settings-ui';

export function AuthScreen({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <StableScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.brandCopy}>
              <Text style={styles.brand}>푸릇푸릇</Text>
            </View>
            <Image
              source={require('../../../assets/images/character.png')}
              contentFit="contain"
              style={styles.character}
              accessibilityLabel="푸릇 캐릭터"
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </View>
          {footer}
        </View>
      </StableScrollView>
    </KeyboardAvoidingView>
  );
}
export function AuthError({ message }: { message?: string | null }) {
  return message ? (
    <View style={styles.errorBox}>
      <Text accessibilityRole="alert" style={styles.errorText}>
        {message}
      </Text>
    </View>
  ) : null;
}
export const authStyles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 6,
  },
  footerText: { color: '#74826C', fontSize: 14, lineHeight: 22 },
  link: { color: '#527C42', fontSize: 14, lineHeight: 22, fontWeight: '700', paddingVertical: 8 },
  socials: { gap: 10 },
  notice: { color: '#74826C', fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { flexGrow: 1, paddingHorizontal: 18, justifyContent: 'center' },
  body: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 22 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 12,
  },
  brandCopy: { flex: 1, gap: 8 },
  brand: { color: '#1A1F2C', fontSize: 30, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  character: { width: 104, height: 112 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 22, gap: 20 },
  title: { color: '#1A1F2C', fontSize: 25, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  errorBox: { backgroundColor: LearningResultColors.incorrect.soft, padding: 14, borderRadius: 16 },
  errorText: { color: LearningResultColors.incorrect.text, fontSize: 13, lineHeight: 21 },
});
