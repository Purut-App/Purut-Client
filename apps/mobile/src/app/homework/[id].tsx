import { Image, type ImageSource } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { NumberFontFamily, Palette, LearningResultColors } from '@/constants/theme';
import { PhotoSourceMenu } from '@/features/homework/photo-source-menu';
import { dDayLabel, STATUS_STYLE } from '@/features/homework/status';
import {
  MAX_IMAGES,
  pickPhotos,
  takePhoto,
  uploadImage,
  type PreparedImage,
} from '@/features/homework/upload';
import { useAssignment, useSubmitHomework } from '@/features/homework/use-homework';

type Photo = { key: string; source: ImageSource; label: string; remove?: () => void };

/** Both submission states use the existing homework API without changing its payload. */
export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const { data, isPending, refetch } = useAssignment(id);
  const submit = useSubmitHomework(id);
  const [busy, setBusy] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [memo, setMemo] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pendingImages, setPendingImages] = useState<PreparedImage[]>([]);
  const [retainedIds, setRetainedIds] = useState<string[] | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [viewer, setViewer] = useState<{ photos: Photo[]; index: number } | null>(null);
  const assignment = data;

  if (!assignment) {
    return (
      <View style={[styles.screen, styles.center]}>
        {isPending ? (
          <ActivityIndicator color="#527C42" />
        ) : (
          <>
            <Text style={styles.body}>숙제를 불러오지 못했습니다</Text>
            <ActionButton label="다시 시도" onPress={() => void refetch()} />
            <ActionButton label="돌아가기" secondary onPress={() => router.back()} />
          </>
        )}
      </View>
    );
  }

  const submission = assignment.submission;
  const hasSubmission = Boolean(submission);
  const showEditor = !hasSubmission || editing;
  const canEdit = !assignment.closed;
  const canSubmitToServer = canEdit;
  const isBusy = busy || submit.isPending;
  const status = STATUS_STYLE[assignment.status];
  const studentNotes =
    submission?.comments.filter((comment) => !comment.fromTeacher && comment.body) ?? [];
  const teacherComments =
    submission?.comments.filter(
      (comment) => comment.fromTeacher && (comment.body || comment.imageUrl),
    ) ?? [];
  const existingImages = [...(submission?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const retainedImages = existingImages.filter(
    (image) => retainedIds === null || retainedIds.includes(image.id),
  );
  const imageCount = retainedImages.length + pendingImages.length;
  const hasChanges = pendingImages.length > 0 || retainedImages.length !== existingImages.length;
  const deadline = dDayLabel(assignment.dueDate);
  const currentMemo = memo ?? studentNotes.map((comment) => comment.body).join('\n\n');

  function openPhoto(photos: Photo[], index: number) {
    setViewer({ photos, index });
  }
  function beginEditing() {
    setRetainedIds(existingImages.map((image) => image.id));
    setPendingImages([]);
    setEditing(true);
  }
  function cancelEditing() {
    setPendingImages([]);
    setRetainedIds(null);
    setEditing(false);
    setMemo(null);
  }
  function openPhotoMenu() {
    if (!canEdit || isBusy || imageCount >= MAX_IMAGES) return;
    Keyboard.dismiss();
    setPhotoMenuVisible(true);
  }
  async function choosePhotos(source: 'camera' | 'library') {
    if (!canEdit || isBusy) return;
    const remaining = MAX_IMAGES - imageCount;
    if (remaining <= 0) {
      Alert.alert(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`);
      return;
    }
    setBusy(true);
    try {
      const picked = source === 'camera' ? [await takePhoto()] : await pickPhotos(remaining);
      const images = picked
        .filter((image): image is PreparedImage => image !== null)
        .slice(0, remaining);
      setPendingImages((current) => [...current, ...images]);
    } catch (selectionError) {
      Alert.alert(
        '사진을 선택하지 못했어요',
        selectionError instanceof Error ? selectionError.message : '다시 시도해 주세요',
      );
    } finally {
      setBusy(false);
    }
  }
  async function submitPhotos() {
    if (!canSubmitToServer || isBusy || imageCount === 0 || !hasChanges) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(pendingImages.map(uploadImage));
      const existing = retainedImages.map((image) => ({
        storageKey: image.storageKey,
        width: image.width ?? undefined,
        height: image.height ?? undefined,
      }));
      // Keep the server contract: POST { images: [{ storageKey, width, height }] }.
      await submit.mutateAsync([...existing, ...uploaded]);
      setPendingImages([]);
      setRetainedIds(null);
      setEditing(false);
    } catch (submissionError) {
      Alert.alert(
        '제출에 실패했어요',
        submissionError instanceof Error ? submissionError.message : '잠시 후 다시 시도해 주세요',
      );
    } finally {
      setBusy(false);
    }
  }
  function goBack() {
    if (
      showEditor &&
      (hasChanges ||
        (memo !== null && memo !== studentNotes.map((comment) => comment.body).join('\n\n')))
    ) {
      Alert.alert('작성 중인 내용을 저장하지 않고 나갈까요?', undefined, [
        { text: '계속 작성', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  }

  const editorPhotos: Photo[] = [
    ...retainedImages.map((image, index) => ({
      key: image.id,
      source: getSubmissionImageSource(image.url),
      label: `제출 사진 ${index + 1}`,
      remove: () =>
        setRetainedIds(
          retainedImages.filter((item) => item.id !== image.id).map((item) => item.id),
        ),
    })),
    ...pendingImages.map((image, index) => ({
      key: `pending-${index}-${image.uri}`,
      source: { uri: image.uri },
      label: `추가한 사진 ${index + 1}`,
      remove: () =>
        setPendingImages((current) => current.filter((_, itemIndex) => itemIndex !== index)),
    })),
  ];
  const submittedPhotos: Photo[] = existingImages.map((image, index) => ({
    key: image.id,
    source: getSubmissionImageSource(image.url),
    label: `제출 사진 ${index + 1}`,
  }));
  const submittedAt = submission ? formatSubmissionDateParts(submission.submittedAt) : null;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
            },
          ]}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              onPress={goBack}
              disabled={isBusy}
              style={styles.backButton}
            >
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                size={21}
                tintColor={Palette.ink}
              />
            </Pressable>
            <Text style={styles.pageTitle}>숙제 상세</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.subjectIcon}>
                <Image
                  source={subjectSource(assignment.subject)}
                  style={styles.subjectImage}
                  contentFit="contain"
                  accessible={false}
                />
              </View>
              <Text style={styles.subjectLabel}>{assignment.subject}</Text>
              <View
                style={[
                  styles.statusBadge,
                  hasSubmission ? styles.blueBadge : styles.peachBadge,
                  assignment.status === 'REVIEWED' && styles.greenBadge,
                  assignment.status === 'RESUBMIT_REQUIRED' && styles.peachBadge,
                  assignment.status === 'NOT_SUBMITTED' && styles.unsubmittedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusLabel,
                    assignment.status === 'NOT_SUBMITTED' && {
                      color: LearningResultColors.incorrect.text,
                    },
                  ]}
                >
                  {status.label}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{assignment.title}</Text>
            {assignment.description ? (
              <Text style={styles.body}>{assignment.description}</Text>
            ) : null}
            <View style={styles.dateRow}>
              <View style={styles.dateBlock}>
                <Text style={styles.smallLabel}>배정일</Text>
                <Text style={styles.dateNumber}>{formatShortDate(assignment.assignedDate)}</Text>
              </View>
              <View style={styles.dateBlock}>
                <Text style={styles.smallLabel}>마감일</Text>
                <Text style={styles.dateNumber}>{formatShortDate(assignment.dueDate)}</Text>
              </View>
              {!hasSubmission ? <Text style={styles.deadline}>{deadline}</Text> : null}
            </View>
          </View>

          {showEditor || studentNotes.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>제출 메모</Text>
              {showEditor ? (
                <TextInput
                  accessibilityLabel="제출 메모"
                  multiline
                  textAlignVertical="top"
                  editable={canEdit && !isBusy}
                  value={currentMemo}
                  onChangeText={setMemo}
                  placeholder="선생님께 남길 내용을 적어주세요"
                  placeholderTextColor="#8A9384"
                  style={styles.memoInput}
                />
              ) : (
                studentNotes.map((comment) => (
                  <Text key={comment.id} style={styles.body}>
                    {comment.body}
                  </Text>
                ))
              )}
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {showEditor
                  ? hasSubmission
                    ? '제출물 수정'
                    : '사진으로 제출하기'
                  : '내가 제출한 숙제'}
              </Text>
              <Text style={styles.smallLabel}>
                {showEditor ? `${imageCount}/${MAX_IMAGES}장` : `${existingImages.length}장`}
              </Text>
            </View>
            {submittedAt ? (
              <Text style={styles.submittedTime}>
                {submittedAt.date} {submittedAt.time} 제출
              </Text>
            ) : null}

            {showEditor ? (
              <>
                {editorPhotos.length > 0 ? (
                  <PhotoGrid
                    photos={editorPhotos}
                    onOpen={openPhoto}
                    editable={!isBusy && canEdit}
                  />
                ) : null}
                {imageCount < MAX_IMAGES ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      editorPhotos.length > 0
                        ? '사진 추가하기'
                        : '풀이 사진을 올려주세요. 사진 선택 열기'
                    }
                    accessibilityState={{ disabled: !canEdit || isBusy }}
                    disabled={!canEdit || isBusy}
                    onPress={openPhotoMenu}
                    style={({ pressed }) => [
                      styles.emptyPhotos,
                      editorPhotos.length > 0 && styles.addMorePhotos,
                      pressed && styles.pressed,
                    ]}
                  >
                    <SymbolView
                      name={
                        editorPhotos.length > 0
                          ? { ios: 'plus', android: 'add', web: 'add' }
                          : { ios: 'camera', android: 'photo_camera', web: 'photo_camera' }
                      }
                      size={editorPhotos.length > 0 ? 22 : 32}
                      tintColor="#527C42"
                    />
                    <Text style={styles.emptyTitle}>
                      {editorPhotos.length > 0 ? '사진 추가하기' : '풀이 사진을 올려주세요'}
                    </Text>
                    {editorPhotos.length === 0 ? (
                      <Text style={styles.smallLabel}>눌러서 사진을 선택해 주세요</Text>
                    ) : null}
                  </Pressable>
                ) : null}
                {assignment.closed ? (
                  <Text style={styles.closedText}>마감된 숙제라 제출물을 변경할 수 없어요.</Text>
                ) : null}
                <ActionButton
                  label={isBusy ? '처리 중…' : hasSubmission ? '수정한 사진 제출하기' : '제출하기'}
                  disabled={!canSubmitToServer || isBusy || imageCount === 0 || !hasChanges}
                  onPress={() => void submitPhotos()}
                />
                {editing ? (
                  <ActionButton
                    label="수정 취소"
                    secondary
                    disabled={isBusy}
                    onPress={cancelEditing}
                  />
                ) : null}
              </>
            ) : (
              <>
                {submittedPhotos.length > 0 ? (
                  <PhotoSummary photos={submittedPhotos} onPress={() => setGalleryVisible(true)} />
                ) : (
                  <Text style={styles.body}>제출한 사진이 없어요.</Text>
                )}
                {!assignment.closed ? (
                  <ActionButton
                    label="제출물 수정"
                    secondary
                    disabled={!canEdit}
                    onPress={beginEditing}
                  />
                ) : (
                  <Text style={styles.closedText}>마감된 숙제라 제출물을 변경할 수 없어요.</Text>
                )}
              </>
            )}
          </View>

          {hasSubmission ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>선생님 피드백</Text>
              {teacherComments.length > 0 ? (
                teacherComments.map((comment) => (
                  <View key={comment.id} style={styles.feedback}>
                    {comment.body ? <Text style={styles.body}>{comment.body}</Text> : null}
                    {comment.imageUrl ? (
                      <PhotoGrid
                        photos={[
                          {
                            key: comment.id,
                            source: { uri: comment.imageUrl },
                            label: '선생님 첨삭 이미지',
                          },
                        ]}
                        onOpen={openPhoto}
                      />
                    ) : null}
                    <Text style={styles.smallLabel}>
                      {formatSubmissionDateParts(comment.createdAt).date}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.body}>선생님 확인을 기다리고 있어요.</Text>
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoSourceMenu
        visible={photoMenuVisible}
        onClose={() => setPhotoMenuVisible(false)}
        onChoose={(source) => void choosePhotos(source)}
      />

      <Modal
        visible={viewer !== null || galleryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => (viewer ? setViewer(null) : setGalleryVisible(false))}
      >
        {viewer ? (
          <View
            style={[
              styles.viewer,
              { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerLabel}>
                {viewer ? `${viewer.index + 1} / ${viewer.photos.length}` : ''}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="사진 닫기"
                onPress={() => setViewer(null)}
                style={styles.viewerControl}
              >
                <Text style={styles.viewerLabel}>{galleryVisible ? '사진 목록' : '닫기'}</Text>
              </Pressable>
            </View>
            {viewer ? (
              <Image
                source={viewer.photos[viewer.index].source}
                contentFit="contain"
                style={styles.fullImage}
                accessibilityLabel={viewer.photos[viewer.index].label}
              />
            ) : null}
            <View style={styles.viewerNavigation}>
              <ActionButton
                label="이전 사진"
                secondary
                disabled={!viewer || viewer.index === 0}
                onPress={() =>
                  setViewer((current) =>
                    current ? { ...current, index: current.index - 1 } : null,
                  )
                }
              />
              <ActionButton
                label="다음 사진"
                secondary
                disabled={!viewer || viewer.index >= viewer.photos.length - 1}
                onPress={() =>
                  setViewer((current) =>
                    current ? { ...current, index: current.index + 1 } : null,
                  )
                }
              />
            </View>
          </View>
        ) : (
          <View style={styles.galleryOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel="전체 사진 닫기"
              onPress={() => setGalleryVisible(false)}
            />
            <View
              style={[
                styles.gallerySheet,
                { height: windowHeight * 0.78, paddingBottom: insets.bottom + 22 },
              ]}
              accessibilityViewIsModal
            >
              <View style={styles.galleryHeading}>
                <View style={styles.galleryHeadingCopy}>
                  <Text style={styles.sectionTitle}>제출 사진</Text>
                  <Text style={styles.smallLabel}>전체 {submittedPhotos.length}장</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="전체 사진 닫기"
                  onPress={() => setGalleryVisible(false)}
                  style={styles.backButton}
                >
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={18}
                    tintColor={Palette.ink}
                  />
                </Pressable>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.galleryContent}
              >
                <PhotoGrid photos={submittedPhotos} onOpen={openPhoto} />
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

/** Straight, compact photo stack; only the album preview is collapsed. */
function PhotoSummary({ photos, onPress }: { photos: Photo[]; onPress: () => void }) {
  const preview = photos.slice(0, 3);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`제출 사진 ${photos.length}장 전체 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.photoSummary, pressed && styles.pressed]}
    >
      <View style={styles.photoStack} accessible={false}>
        {preview.map((photo, index) => (
          <Image
            key={photo.key}
            source={photo.source}
            contentFit="cover"
            style={[
              styles.stackPhoto,
              {
                left: index * 12,
                top: (preview.length - 1 - index) * 7,
                zIndex: preview.length - index,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.photoSummaryCopy}>
        <Text style={styles.photoSummaryTitle}>제출 사진 {photos.length}장</Text>
        <View style={styles.viewAllRow}>
          <Text style={styles.viewAllText}>전체 보기</Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={13}
            tintColor="#527C42"
          />
        </View>
      </View>
    </Pressable>
  );
}

function PhotoGrid({
  photos,
  onOpen,
  editable = false,
}: {
  photos: Photo[];
  onOpen: (photos: Photo[], index: number) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.photoGrid}>
      {photos.map((photo, index) => (
        <View key={photo.key} style={styles.photoCell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${photo.label} 크게 보기`}
            onPress={() => onOpen(photos, index)}
            style={styles.photoButton}
          >
            <Image source={photo.source} contentFit="cover" style={styles.thumbnail} />
            <View style={styles.photoNumber}>
              <Text style={styles.photoNumberText}>{index + 1}</Text>
            </View>
          </Pressable>
          {editable && photo.remove ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${photo.label} 삭제`}
              onPress={photo.remove}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
function subjectSource(subject: string) {
  if (subject.includes('수학'))
    return require('../../../assets/images/subject-icons/lucide/calculator.png');
  if (subject.includes('국어'))
    return require('../../../assets/images/subject-icons/lucide/pencil.png');
  return require('../../../assets/images/subject-icons/lucide/book-open.png');
}
function getSubmissionImageSource(url: string): ImageSource {
  return { uri: url };
}

function localDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(value: string) {
  const date = localDate(value);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatSubmissionDateParts(value: string) {
  const date = new Date(value);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return { date: `${month}월 ${day}일`, time: `${hour}:${minute}` };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18, gap: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  pageTitle: { color: Palette.ink, fontSize: 20, fontWeight: '700' },
  card: { borderRadius: 28, backgroundColor: '#FFFFFF', padding: 22, gap: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F2F7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectImage: { width: 25, height: 25 },
  subjectLabel: { color: '#53634F', fontSize: 13, flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  unsubmittedBadge: { backgroundColor: LearningResultColors.incorrect.soft },
  peachBadge: { backgroundColor: '#FFF0E2' },
  blueBadge: { backgroundColor: '#E5F0FF' },
  greenBadge: { backgroundColor: '#E3F2DE' },
  statusLabel: { color: '#455243', fontSize: 12, fontWeight: '600' },
  title: {
    color: Palette.ink,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  body: { color: '#586153', fontSize: 14, lineHeight: 22 },
  dateRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEF3EA',
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  dateBlock: { gap: 6 },
  smallLabel: { color: '#737B6E', fontSize: 12, lineHeight: 18 },
  dateNumber: { color: Palette.ink, fontFamily: NumberFontFamily, fontSize: 22 },
  deadline: {
    color: LearningResultColors.incorrect.text,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: { color: Palette.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  submittedTime: { color: '#527C42', fontSize: 12, marginTop: -6 },
  emptyPhotos: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9EB491',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { color: Palette.ink, fontSize: 15, fontWeight: '600' },
  keyboardArea: { flex: 1 },
  memoInput: { color: '#586153', fontSize: 14, lineHeight: 22, minHeight: 86, padding: 0 },
  addMorePhotos: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 16 },
  actionButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: '#EDF4E7', flexGrow: 1 },
  secondaryText: { color: '#405E34' },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  closedText: { color: '#975526', fontSize: 12, lineHeight: 18 },
  photoSummary: { flexDirection: 'row', alignItems: 'center', gap: 18, minHeight: 140 },
  photoStack: { width: 140, height: 136 },
  stackPhoto: {
    position: 'absolute',
    width: 110,
    height: 118,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#EDF1E9',
  },
  photoSummaryCopy: { flex: 1, gap: 12 },
  photoSummaryTitle: { color: Palette.ink, fontSize: 15, fontWeight: '700' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { color: '#527C42', fontSize: 13, fontWeight: '600' },
  galleryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 44, 0.24)',
    justifyContent: 'flex-end',
  },
  gallerySheet: {
    padding: 22,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    gap: 18,
  },
  galleryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  galleryHeadingCopy: { gap: 5 },
  galleryContent: { paddingBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCell: { width: '47.8%', position: 'relative' },
  photoButton: { aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F4F8EF' },
  thumbnail: { width: '100%', height: '100%' },
  photoNumber: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  photoNumberText: { color: Palette.ink, fontFamily: NumberFontFamily, fontSize: 12 },
  removeButton: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.ink,
    borderRadius: 22,
  },
  removeText: { color: '#FFFFFF', fontSize: 24, lineHeight: 28 },
  feedback: { gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF3EA' },
  viewer: { flex: 1, backgroundColor: '#101827', paddingHorizontal: 18 },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewerLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  viewerControl: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: { flex: 1, width: '100%' },
  viewerNavigation: { flexDirection: 'row', gap: 12, paddingTop: 12 },
});
