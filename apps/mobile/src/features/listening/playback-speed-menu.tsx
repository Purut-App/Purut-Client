import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumberFontFamily } from '@/constants/theme';
import { PLAYBACK_RATES } from '@/features/settings/use-learning-settings';

/** Selecting a speed is explicit; opening or dismissing the sheet never changes it. */
export function PlaybackSpeedMenu({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="재생 속도 선택 닫기"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}
        >
          <View style={styles.heading}>
            <Text style={styles.title}>재생 속도</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={styles.close}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor="#1A1F2C"
              />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.options}>
            {PLAYBACK_RATES.map((rate) => (
              <Pressable
                key={rate}
                accessibilityRole="radio"
                accessibilityLabel={`${rate}x${rate === 1 ? ', 기본 속도' : ''}`}
                accessibilityState={{ checked: rate === value }}
                onPress={() => {
                  onSelect(rate);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  rate === value && styles.optionSelected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.rate}>
                  {rate}
                  <Text style={styles.unit}>x</Text>
                </Text>
                {rate === 1 ? <Text style={styles.defaultLabel}>기본</Text> : null}
                <View style={styles.check}>
                  {rate === value ? (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={18}
                      tintColor="#527C42"
                    />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,31,44,0.24)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 22,
  },
  heading: { minHeight: 44, justifyContent: 'center', marginBottom: 16 },
  title: { color: '#1A1F2C', fontSize: 19, fontWeight: '700', textAlign: 'center' },
  close: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: { gap: 8 },
  option: {
    minHeight: 58,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionSelected: { backgroundColor: '#EDF5E7' },
  rate: { fontFamily: NumberFontFamily, fontSize: 23, color: '#1A1F2C' },
  unit: { fontFamily: 'System', fontSize: 13, fontWeight: '600', color: '#7B8774' },
  defaultLabel: { fontSize: 12, color: '#7B8774' },
  check: { marginLeft: 'auto', width: 24, alignItems: 'center' },
});
