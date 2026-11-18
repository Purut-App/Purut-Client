import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { QnaText as ThemedText } from './qna-ui';
import type { PreparedQnaImage } from './upload';
function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function AuthorBadge({
  name,
  date,
  teacher = false,
}: {
  name: string;
  date: string;
  teacher?: boolean;
}) {
  return (
    <View style={[styles.authorBadge, teacher ? styles.authorRight : styles.authorLeft]}>
      <View style={styles.authorAvatar}>
        <Image
          source={require('../../../assets/images/character.png')}
          style={styles.authorImage}
          contentFit="contain"
        />
      </View>
      <View style={styles.authorLabel}>
        <ThemedText style={styles.authorName} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText style={styles.authorTime}>{formatDateTime(date)}</ThemedText>
      </View>
    </View>
  );
}

export function DraftAttachment({
  image,
  index,
  large = false,
  disabled,
  onOpen,
  onRemove,
}: {
  image: PreparedQnaImage;
  index: number;
  large?: boolean;
  disabled: boolean;
  onOpen: (uri: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.attachment, large && styles.attachmentLarge]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`첨부 사진 ${index + 1} 확대`}
        onPress={() => onOpen(image.uri)}
        style={{ width: '100%', height: '100%' }}
      >
        <Image source={{ uri: image.uri }} contentFit="contain" style={styles.attachmentImage} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`첨부 사진 ${index + 1} 삭제`}
        disabled={disabled}
        onPress={onRemove}
        style={styles.removeDraftPhoto}
      >
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={12}
          tintColor="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  authorBadge: {
    position: 'absolute',
    top: -24,
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  authorLeft: { left: 16 },
  authorRight: { right: 16, flexDirection: 'row-reverse' },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#CEE5BD',
    padding: 4,
    borderWidth: 3,
    borderColor: '#E3F2DE',
    zIndex: 2,
  },
  authorImage: { width: '100%', height: '100%' },
  authorLabel: {
    backgroundColor: '#F6FAF2',
    borderWidth: 1,
    borderColor: '#B8CDAA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 1,
    flexShrink: 1,
  },
  authorName: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  authorTime: { fontSize: 10, lineHeight: 14, color: '#7B8774' },
  attachment: {
    width: 160,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6EF',
  },
  attachmentLarge: { width: '100%', height: 240 },
  attachmentImage: { width: '100%', height: '100%' },
  removeDraftPhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26,31,44,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
