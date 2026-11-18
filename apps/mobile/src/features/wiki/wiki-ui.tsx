import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NumberFontFamily } from '@/constants/theme';

export const WikiColors = {
  ink: '#1A1F2C',
  green: '#527C42',
  muted: '#7E8B76',
  soft: '#EDF5E7',
  border: '#A7BE99',
};

export function WikiState({
  loading,
  title,
  detail,
  onRetry,
}: {
  loading?: boolean;
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator color={WikiColors.green} />
      ) : (
        <>
          <Text style={styles.stateTitle}>{title}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          {onRetry ? (
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

export function WikiCount({ count, label }: { count: number; label: string }) {
  return (
    <Text style={styles.count}>
      <Text style={styles.number}>{count}</Text>
      {label}
    </Text>
  );
}

export function FavoritesLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="즐겨찾기 보기"
      onPress={onPress}
      style={({ pressed }) => [styles.favoriteLink, pressed && styles.pressed]}
    >
      <SymbolView
        name={{ ios: 'star.fill', android: 'star', web: 'star' }}
        size={18}
        tintColor={WikiColors.green}
      />
      <Text style={styles.favoriteText}>즐겨찾기</Text>
    </Pressable>
  );
}

export const wikiStyles = StyleSheet.create({
  list: { gap: 12 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: { color: WikiColors.ink, fontSize: 19, fontWeight: '700' },
});
const styles = StyleSheet.create({
  state: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 28,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateTitle: { color: WikiColors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  detail: { color: WikiColors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  retry: {
    backgroundColor: WikiColors.soft,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: { color: WikiColors.green, fontSize: 14, fontWeight: '700' },
  count: { color: WikiColors.muted, fontSize: 14 },
  number: { fontFamily: NumberFontFamily },
  favoriteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 42,
    borderRadius: 999,
  },
  favoriteText: { color: WikiColors.green, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
