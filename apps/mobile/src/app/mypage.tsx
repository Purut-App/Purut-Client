import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceScreen } from '@/components/service-screen';
import { useAuthStore } from '@/features/auth/auth-store';

export default function MyPageScreen() {
  const router = useRouter();
  const me = useAuthStore((state) => state.me);
  return (
    <ServiceScreen title="마이페이지" back={false}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Image
            source={require('../../assets/images/character.png')}
            contentFit="contain"
            style={styles.image}
          />
        </View>
        <Text style={styles.name}>{me?.name ?? '학생'}</Text>
        <Text style={styles.school}>
          {[me?.grade ? `${me.grade}학년` : null, me?.school].filter(Boolean).join(' · ') ||
            '프로필을 설정해 주세요'}
        </Text>
        {me?.email ? <Text style={styles.email}>{me.email}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}
          style={styles.edit}
        >
          <Text style={styles.editText}>프로필 수정</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="설정"
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.menu, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.icon}>
          <SymbolView
            name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
            size={23}
            tintColor="#527C42"
          />
        </View>
        <Text style={styles.menuTitle}>설정</Text>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
          tintColor="#8B9683"
        />
      </Pressable>
    </ServiceScreen>
  );
}
const styles = StyleSheet.create({
  profile: {
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 38,
    backgroundColor: '#EDF5E7',
    padding: 12,
    marginBottom: 6,
  },
  image: { width: '100%', height: '100%' },
  name: { color: '#1A1F2C', fontSize: 26, fontWeight: '800', lineHeight: 36 },
  school: { color: '#74826C', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  email: { color: '#8B9683', fontSize: 12, textAlign: 'center' },
  edit: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 22,
    backgroundColor: '#EDF5E7',
    justifyContent: 'center',
    marginTop: 10,
  },
  editText: { color: '#527C42', fontSize: 14, fontWeight: '700' },
  menu: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 22,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: '#EDF5E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: { color: '#1A1F2C', fontSize: 17, fontWeight: '700', flex: 1 },
});
