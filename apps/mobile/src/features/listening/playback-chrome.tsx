import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

export function PlaybackHeader({
  title,
  subtitle,
  onBack,
  translation,
  onTranslation,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  translation?: boolean;
  onTranslation?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        onPress={onBack}
        style={styles.back}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={21}
          tintColor={Palette.ink}
        />
      </Pressable>
      <View style={styles.heading}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {onTranslation ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translation ? '해석 끄기' : '해석 보기'}
          accessibilityState={{ selected: translation }}
          onPress={onTranslation}
          style={[styles.translation, translation && styles.translationActive]}
        >
          <SymbolView
            name={{ ios: 'translate', android: 'translate', web: 'translate' }}
            size={20}
            tintColor={translation ? '#FFFFFF' : '#527C42'}
          />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
    </View>
  );
}
export type PlaybackMenuAnchor = { x: number; y: number; width: number; height: number };

export function PlaybackListSheet({
  visible,
  anchor,
  title,
  rows,
  onSelect,
  onClose,
}: {
  visible: boolean;
  anchor: PlaybackMenuAnchor | null;
  title: string;
  rows: {
    id: string;
    label: string;
    detail?: string | null;
    selected: boolean;
    completed?: boolean;
  }[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const selectedY = useRef(0);
  const width = Math.min(260, window.width - 36);
  const bottom = Math.max(insets.bottom + 12, window.height - (anchor?.y ?? window.height) + 10);
  const maxHeight = Math.max(120, Math.min(380, window.height - bottom - insets.top - 16));
  const left = Math.max(
    18,
    Math.min(window.width - width - 18, (anchor?.x ?? window.width) + (anchor?.width ?? 0) - width),
  );
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={() =>
        scroll.current?.scrollTo({ y: Math.max(0, selectedY.current - 80), animated: false })
      }
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="문항 목록 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { width, maxHeight, left, bottom }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              style={styles.back}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={19}
                tintColor={Palette.ink}
              />
            </Pressable>
          </View>
          <ScrollView
            ref={scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rows}
          >
            {rows.map((row) => (
              <Pressable
                key={row.id}
                onLayout={(event) => {
                  if (row.selected) {
                    selectedY.current = event.nativeEvent.layout.y;
                    scroll.current?.scrollTo({
                      y: Math.max(0, selectedY.current - 80),
                      animated: false,
                    });
                  }
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: row.selected }}
                onPress={() => {
                  onSelect(row.id);
                  onClose();
                }}
                style={[styles.row, row.selected && styles.rowSelected]}
              >
                <View style={styles.rowBody}>
                  <Text style={[styles.rowLabel, row.selected && styles.rowLabelSelected]}>
                    {row.label}
                  </Text>
                  {row.detail ? (
                    <Text style={styles.detail} numberOfLines={2}>
                      {row.detail}
                    </Text>
                  ) : null}
                </View>
                {row.selected ? (
                  <SymbolView
                    name={{ ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }}
                    size={19}
                    tintColor="#527C42"
                  />
                ) : row.completed ? (
                  <Text style={styles.done}>완료</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backSpacer: { width: 44 },
  heading: { flex: 1, alignItems: 'center', gap: 4 },
  title: { color: Palette.ink, fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#74826C', fontSize: 12, fontWeight: '500' },
  translation: {
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  translationActive: { backgroundColor: '#527C42' },
  translationText: { color: '#527C42', fontSize: 12, fontWeight: '700' },
  translationTextActive: { color: '#FFFFFF' },
  overlay: { flex: 1, backgroundColor: 'rgba(26,31,44,0.28)' },
  sheet: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 4,
    paddingBottom: 8,
  },
  handle: {
    width: 38,
    height: 5,
    backgroundColor: '#D8DFD3',
    borderRadius: 3,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  sheetTitle: { color: Palette.ink, fontSize: 21, fontWeight: '700' },
  rows: { paddingHorizontal: 18, gap: 6, paddingBottom: 12 },
  row: { padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowSelected: { backgroundColor: '#EDF5E7' },
  rowBody: { flex: 1, gap: 6 },
  rowLabel: { color: Palette.ink, fontSize: 16, fontWeight: '600' },
  rowLabelSelected: { color: '#446F37' },
  detail: { color: '#74826C', fontSize: 13, lineHeight: 20 },
  done: { color: '#527C42', fontSize: 12, fontWeight: '600' },
});
