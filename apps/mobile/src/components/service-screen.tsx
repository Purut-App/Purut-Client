import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from './app-bottom-navigation';
import { StableScrollView } from './stable-scroll-view';

export function ServiceScreen({
  title,
  children,
  back = true,
  keyboard = false,
}: {
  title: string;
  children: ReactNode;
  back?: boolean;
  keyboard?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={keyboard && Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <StableScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (back ? 86 : 24),
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        {children}
      </StableScrollView>
      {back ? (
        <>
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
      ) : null}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18, gap: 18 },
  title: {
    color: '#1A1F2C',
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1,
    paddingHorizontal: 4,
  },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, zIndex: 3 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
