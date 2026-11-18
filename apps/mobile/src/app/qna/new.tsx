import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Modal,
  useWindowDimensions,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { StableScrollView as ScrollView } from '@/components/stable-scroll-view';
import { Image } from 'expo-image';
import { DraftAttachment } from '@/features/qna/composer-parts';
import { useAuthStore } from '@/features/auth/auth-store';
import { SymbolView } from 'expo-symbols';
import { PhotoSourceMenu } from '@/features/homework/photo-source-menu';

import {
  QnaButton as PrimaryButton,
  QnaField as TextField,
  QnaText as ThemedText,
  QnaChrome,
} from '@/features/qna/qna-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DropdownSurface } from '@/constants/theme';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { useAssignments } from '@/features/homework/use-homework';
import { useExams } from '@/features/listening/use-listening';
import type { QuestionCategory } from '@/features/qna/api';
import { useCreateQuestion } from '@/features/qna/use-qna';
import {
  MAX_QNA_ATTACHMENTS,
  pickQnaPhotos,
  takeQnaPhoto,
  uploadQnaImage,
  type PreparedQnaImage,
} from '@/features/qna/upload';
import { useDays } from '@/features/vocabulary/use-vocabulary';

const CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'HOMEWORK', label: '숙제' },
  { value: 'VOCAB', label: '단어' },
  { value: 'LISTENING', label: '리스닝' },
  { value: 'TEXTBOOK', label: '교재' },
  { value: 'ETC', label: '기타' },
];

export default function NewQuestionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authorName = useAuthStore((state) => state.me?.name ?? '학생');
  const [openSelect, setOpenSelect] = useState<'category' | 'reference' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const screen = useWindowDimensions();
  const [category, setCategory] = useState<QuestionCategory>('ETC');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publicVisible, setPublicVisible] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<PreparedQnaImage[]>([]);
  const [examId, setExamId] = useState<string | undefined>();
  const [itemNo, setItemNo] = useState('');
  const [wordDayId, setWordDayId] = useState<string | undefined>();
  const [assignmentId, setAssignmentId] = useState<string | undefined>();
  const [textbook, setTextbook] = useState('');
  const [page, setPage] = useState('');

  const create = useCreateQuestion();
  const exams = useExams();
  const days = useDays();
  const assignments = useAssignments(new Date());

  async function addFromAlbum() {
    if (images.length >= MAX_QNA_ATTACHMENTS) return;
    const picked = await pickQnaPhotos(MAX_QNA_ATTACHMENTS - images.length);
    setImages((current) => [...current, ...picked].slice(0, MAX_QNA_ATTACHMENTS));
  }

  async function addFromCamera() {
    const photo = await takeQnaPhoto();
    if (photo) setImages((current) => [...current, photo].slice(0, MAX_QNA_ATTACHMENTS));
  }

  async function submit() {
    if (submitting || pickingPhotos) return;
    if (title.trim().length < 2 || body.trim().length < 10) {
      Alert.alert('입력 확인', '제목과 내용을 조금 더 자세히 적어 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const attachments = [];
      for (const image of images) {
        attachments.push(await uploadQnaImage(image));
      }
      const detail = await create.mutateAsync({
        category,
        title: title.trim(),
        body: body.trim(),
        publicVisible,
        refExamId: category === 'LISTENING' ? examId : undefined,
        refItemNo: category === 'LISTENING' ? Number(itemNo) || undefined : undefined,
        refWordDayId: category === 'VOCAB' ? wordDayId : undefined,
        refAssignmentId: category === 'HOMEWORK' ? assignmentId : undefined,
        refTextbook: category === 'TEXTBOOK' ? textbook.trim() : undefined,
        refPage: category === 'TEXTBOOK' ? Number(page) || undefined : undefined,
        attachments,
      });
      router.replace(`/qna/${detail.id}`);
    } catch (error) {
      Alert.alert('질문 등록 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 86,
            paddingBottom: insets.bottom + APP_BOTTOM_NAV_CONTENT_OFFSET,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authorHeading}>
          <View style={styles.authorAvatar}>
            <Image
              source={require('../../../assets/images/character.png')}
              contentFit="contain"
              style={styles.authorImage}
            />
          </View>
          <ThemedText style={styles.authorName}>{authorName}</ThemedText>
        </View>
        <View style={styles.referenceCard}>
          <ThemedText type="smallBold">분류</ThemedText>
          <QuestionSelect
            label="분류"
            hideLabel
            value={category}
            options={CATEGORIES}
            open={openSelect === 'category'}
            disabled={submitting}
            onToggle={() => {
              Keyboard.dismiss();
              setOpenSelect((current) => (current === 'category' ? null : 'category'));
            }}
            onSelect={(value) => {
              setCategory(value as QuestionCategory);
              setOpenSelect(null);
            }}
          />
          {category === 'LISTENING' ? (
            <>
              <QuestionSelect
                label="리스닝 회차"
                value={examId ?? ''}
                options={[
                  { value: '', label: '선택 안 함' },
                  ...(exams.data ?? []).map((exam) => ({ value: exam.id, label: exam.title })),
                ]}
                open={openSelect === 'reference'}
                disabled={submitting}
                loading={exams.isPending}
                error={Boolean(exams.error)}
                onRetry={() => {
                  void exams.refetch();
                }}
                onToggle={() => {
                  Keyboard.dismiss();
                  setOpenSelect((current) => (current === 'reference' ? null : 'reference'));
                }}
                onSelect={(value) => {
                  setExamId(value || undefined);
                  setOpenSelect(null);
                }}
              />
              <TextField
                label="문항 번호"
                keyboardType="number-pad"
                value={itemNo}
                onChangeText={setItemNo}
                editable={!submitting}
              />
            </>
          ) : null}
          {category === 'VOCAB' ? (
            <QuestionSelect
              label="단어 DAY"
              value={wordDayId ?? ''}
              options={[
                { value: '', label: '선택 안 함' },
                ...(days.data ?? []).map((day) => ({ value: day.id, label: `Day ${day.dayNo}` })),
              ]}
              open={openSelect === 'reference'}
              disabled={submitting}
              loading={days.isPending}
              error={Boolean(days.error)}
              onRetry={() => {
                void days.refetch();
              }}
              onToggle={() => {
                Keyboard.dismiss();
                setOpenSelect((current) => (current === 'reference' ? null : 'reference'));
              }}
              onSelect={(value) => {
                setWordDayId(value || undefined);
                setOpenSelect(null);
              }}
            />
          ) : null}
          {category === 'HOMEWORK' ? (
            <QuestionSelect
              label="숙제"
              value={assignmentId ?? ''}
              options={[
                { value: '', label: '선택 안 함' },
                ...(assignments.data ?? []).map((assignment) => ({
                  value: assignment.id,
                  label: assignment.title,
                })),
              ]}
              open={openSelect === 'reference'}
              disabled={submitting}
              loading={assignments.isPending}
              error={Boolean(assignments.error)}
              onRetry={() => {
                void assignments.refetch();
              }}
              onToggle={() => {
                Keyboard.dismiss();
                setOpenSelect((current) => (current === 'reference' ? null : 'reference'));
              }}
              onSelect={(value) => {
                setAssignmentId(value || undefined);
                setOpenSelect(null);
              }}
            />
          ) : null}
          {category === 'TEXTBOOK' ? (
            <View style={styles.twoColumns}>
              <TextField
                label="교재명"
                value={textbook}
                onChangeText={setTextbook}
                style={styles.flexInput}
                editable={!submitting}
              />
              <TextField
                label="페이지"
                keyboardType="number-pad"
                value={page}
                onChangeText={setPage}
                style={styles.pageInput}
                editable={!submitting}
              />
            </View>
          ) : null}
          <View style={styles.visibilityCard}>
            <View style={styles.visibilityText}>
              <ThemedText type="smallBold">공개 질문</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                다른 학생에게는 성만 표시돼요
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel="질문 공개 여부"
              value={publicVisible}
              onValueChange={setPublicVisible}
              disabled={submitting}
              trackColor={{ false: '#DDE5D7', true: '#56AD62' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        <View style={styles.questionCard}>
          <View style={styles.draftHeading}>
            <ThemedText style={styles.categoryLabel}>질문 작성</ThemedText>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              <ThemedText style={styles.cancelText}>취소</ThemedText>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="질문 제목"
            placeholder="제목을 적어 주세요"
            placeholderTextColor="#8B9683"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
            multiline
            style={styles.titleInput}
            editable={!submitting}
          />
          <TextInput
            accessibilityLabel="질문 내용"
            placeholder="궁금한 내용과 막힌 부분을 적어 주세요"
            placeholderTextColor="#8B9683"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            style={styles.bodyInput}
            editable={!submitting}
          />
          {images.length === 1 ? (
            <DraftAttachment
              image={images[0]}
              index={0}
              large
              disabled={submitting}
              onOpen={setPreview}
              onRemove={() => setImages([])}
            />
          ) : images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {images.map((image, index) => (
                <DraftAttachment
                  key={`${image.uri}-${index}`}
                  image={image}
                  index={index}
                  disabled={submitting}
                  onOpen={setPreview}
                  onRemove={() => setImages((current) => current.filter((_, i) => i !== index))}
                />
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.draftActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`사진 첨부, ${images.length}/${MAX_QNA_ATTACHMENTS}장`}
              disabled={images.length >= MAX_QNA_ATTACHMENTS || submitting || pickingPhotos}
              onPress={() => {
                Keyboard.dismiss();
                setPhotoMenu(true);
              }}
              style={[
                styles.attachButton,
                (images.length >= MAX_QNA_ATTACHMENTS || submitting) && { opacity: 0.4 },
              ]}
            >
              <SymbolView
                name={{ ios: 'paperclip', android: 'attach_file', web: 'attach_file' }}
                size={23}
                tintColor="#527C42"
              />
            </Pressable>
            <View style={styles.submitButton}>
              <PrimaryButton
                label="질문하기"
                loading={submitting || create.isPending}
                disabled={title.trim().length < 2 || body.trim().length < 10 || pickingPhotos}
                onPress={submit}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <QnaChrome />
      <PhotoSourceMenu
        visible={photoMenu}
        onClose={() => setPhotoMenu(false)}
        onChoose={(source) => {
          setPickingPhotos(true);
          void (source === 'camera' ? addFromCamera() : addFromAlbum())
            .catch((error) =>
              Alert.alert(
                '사진 선택 실패',
                error instanceof Error ? error.message : '다시 시도해 주세요.',
              ),
            )
            .finally(() => setPickingPhotos(false));
        }}
      />
      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.previewBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="사진 닫기"
            onPress={() => setPreview(null)}
            style={[styles.previewClose, { top: insets.top + 10 }]}
          >
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={22}
              tintColor="#FFFFFF"
            />
          </Pressable>
          {preview ? (
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={styles.previewScroll}
            >
              <Image
                source={{ uri: preview }}
                contentFit="contain"
                style={{
                  width: screen.width,
                  height: screen.height - insets.top - insets.bottom - 80,
                }}
              />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function QuestionSelect({
  label,
  hideLabel = false,
  value,
  options,
  open,
  disabled,
  loading,
  error,
  onRetry,
  onToggle,
  onSelect,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  options: { value: string; label: string }[];
  open: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={[styles.select, open && styles.selectOpen]}>
      {!hideLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${options.find((option) => option.value === value)?.label ?? '선택'}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={[styles.selectButton, open && styles.selectButtonOpen]}
      >
        <ThemedText type="smallBold" style={styles.selectValue} numberOfLines={1}>
          {options.find((option) => option.value === value)?.label ?? '선택'}
        </ThemedText>
        <SymbolView
          name={
            open
              ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
              : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
          }
          size={16}
          tintColor="#527C42"
        />
      </Pressable>
      {open ? (
        <View style={[styles.selectMenu, hideLabel && { top: 60 }]}>
          {loading ? (
            <View style={styles.selectState}>
              <ActivityIndicator color="#527C42" />
            </View>
          ) : error ? (
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.selectState}>
              <ThemedText type="small" style={{ color: '#527C42' }}>
                불러오지 못했어요 · 다시 시도
              </ThemedText>
            </Pressable>
          ) : (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === option.value }}
                  onPress={() => onSelect(option.value)}
                  style={[styles.selectOption, value === option.value && styles.selectOptionActive]}
                >
                  <ThemedText
                    type="small"
                    style={[
                      styles.selectValue,
                      value === option.value && { color: '#446F37', fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {value === option.value ? (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={14}
                      tintColor="#527C42"
                    />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18, gap: 18 },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    gap: 18,
  },
  draftHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLabel: { color: '#527C42', fontSize: 13, fontWeight: '700' },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#F0F4EC',
    borderWidth: 1,
    borderColor: '#D8E3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#66765D', fontSize: 13, fontWeight: '700' },
  titleInput: {
    color: '#1A1F2C',
    fontSize: 23,
    lineHeight: 33,
    fontWeight: '700',
    paddingVertical: 0,
  },
  bodyInput: {
    minHeight: 170,
    color: '#1A1F2C',
    fontSize: 16,
    lineHeight: 27,
    paddingTop: 0,
    paddingBottom: 12,
  },
  authorHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  authorAvatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#CEE5BD', padding: 6 },
  authorImage: { width: '100%', height: '100%' },
  authorName: { fontSize: 23, lineHeight: 33, fontWeight: '700', flexShrink: 1 },
  referenceCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22, gap: 16, zIndex: 2 },
  select: { gap: 8, zIndex: 1 },
  selectOpen: { zIndex: 5 },
  selectButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#F6F9F3',
    borderWidth: 1.5,
    borderColor: '#E3EBDD',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonOpen: { ...DropdownSurface },
  selectValue: { flex: 1 },
  selectMenu: {
    position: 'absolute',
    top: 84,
    left: 0,
    right: 0,
    maxHeight: 240,
    ...DropdownSurface,
    borderRadius: 20,
    padding: 6,
    shadowColor: '#344A29',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
  },
  selectState: { padding: 20, alignItems: 'center' },
  selectOption: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
  },
  selectOptionActive: { backgroundColor: '#EDF5E7' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  flexInput: { minWidth: 0, flex: 1 },
  pageInput: { width: 82 },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityText: { flex: 1, gap: 4 },
  photoStrip: { gap: 10 },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  attachButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDF5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: { width: 110 },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  previewClose: {
    position: 'absolute',
    right: 20,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
});
