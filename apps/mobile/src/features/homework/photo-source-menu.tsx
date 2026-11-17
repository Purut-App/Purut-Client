import { useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

type PhotoSource = 'camera' | 'library';

/** Dismiss the menu before opening the native camera or photo library. */
export function PhotoSourceMenu({
  visible,
  onClose,
  onChoose,
}: {
  visible: boolean;
  onClose: () => void;
  onChoose: (source: PhotoSource) => void;
}) {
  const insets = useSafeAreaInsets();
  const nextSource = useRef<PhotoSource | null>(null);

  function launchSelection() {
    const source = nextSource.current;
    nextSource.current = null;
    if (source) onChoose(source);
  }
  function closeMenu() {
    nextSource.current = null;
    onClose();
  }
  function choose(source: PhotoSource) {
    nextSource.current = source;
    onClose();
    // iOS waits for onDismiss so native presentations do not overlap.
    if (Platform.OS !== 'ios') requestAnimationFrame(launchSelection);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={closeMenu}
      onDismiss={launchSelection}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="사진 선택 닫기"
          onPress={closeMenu}
        />
        <View
          style={[
            styles.menu,
            {
              paddingBottom: insets.bottom + 22,
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.heading}>
            <Text style={styles.title}>사진 선택</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 선택 닫기"
              onPress={closeMenu}
              style={styles.closeButton}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={16}
                tintColor={Palette.ink}
              />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => choose('camera')}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Text style={styles.optionText}>사진 촬영하기</Text>
            <View style={styles.iconCircle}>
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                size={25}
                tintColor="#527C42"
              />
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => choose('library')}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Text style={styles.optionText}>앨범에서 선택하기</Text>
            <View style={styles.iconCircle}>
              <SymbolView
                name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
                size={24}
                tintColor="#527C42"
              />
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 44, 0.24)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menu: {
    width: '100%',
    padding: 22,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    minHeight: 44,
  },
  title: { color: Palette.ink, fontSize: 19, fontWeight: '700', flex: 1, textAlign: 'center' },
  closeButton: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    minHeight: 82,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  optionText: { color: Palette.ink, fontSize: 16, fontWeight: '700', flex: 1 },
  iconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#DFE7DA', marginHorizontal: 4 },
  pressed: { opacity: 0.65 },
});
