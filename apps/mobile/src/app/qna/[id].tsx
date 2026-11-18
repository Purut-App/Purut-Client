import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  StableScrollView as ScrollView,
  type StableScrollViewHandle,
} from '@/components/stable-scroll-view';

import {
  QnaButton as PrimaryButton,
  QnaText as ThemedText,
  QnaChrome,
  QNA_THEME,
  QnaStatusChip,
} from '@/features/qna/qna-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_BOTTOM_NAV_CONTENT_OFFSET } from '@/components/app-bottom-navigation';
import { PhotoSourceMenu } from '@/features/homework/photo-source-menu';
import {
  MAX_QNA_ATTACHMENTS,
  pickQnaPhotos,
  takeQnaPhoto,
  uploadQnaImage,
  type PreparedQnaImage,
} from '@/features/qna/upload';
import type {
  AttachmentInput,
  QuestionAttachment,
  QuestionCategory,
  QuestionReference,
} from '@/features/qna/api';
import { AuthorBadge, DraftAttachment } from '@/features/qna/composer-parts';
import {
  useAddQuestionMessage,
  useAttachmentUrl,
  useCloseQuestion,
  useDeleteQuestion,
  useQuestion,
  useUpdateQuestion,
} from '@/features/qna/use-qna';

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  HOMEWORK: '숙제',
  VOCAB: '단어',
  LISTENING: '리스닝',
  TEXTBOOK: '교재',
  ETC: '기타',
};

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = QNA_THEME;
  const conversation = useRef<StableScrollViewHandle>(null);
  const draftNeedsScroll = useRef(false);
  const [draftDate, setDraftDate] = useState(() => new Date().toISOString());
  const screen = useWindowDimensions();
  const question = useQuestion(id);
  const addMessage = useAddQuestionMessage(id);
  const close = useCloseQuestion(id);
  const remove = useDeleteQuestion(id);
  const update = useUpdateQuestion(id);
  const [reply, setReply] = useState('');
  const [replyImages, setReplyImages] = useState<PreparedQnaImage[]>([]);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const detail = question.data;

  async function selectReplyPhotos(source: 'camera' | 'library') {
    const remaining = MAX_QNA_ATTACHMENTS - replyImages.length;
    if (remaining <= 0 || pickingPhotos || sendingReply) return;
    setPickingPhotos(true);
    try {
      const photo = source === 'camera' ? await takeQnaPhoto() : null;
      const selected =
        source === 'camera' ? (photo ? [photo] : []) : await pickQnaPhotos(remaining);
      setReplyImages((current) => [...current, ...selected].slice(0, MAX_QNA_ATTACHMENTS));
    } catch (error) {
      Alert.alert('사진 선택 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setPickingPhotos(false);
    }
  }
  async function submitReply() {
    if (reply.trim().length < 2 || sendingReply || pickingPhotos) return;
    setSendingReply(true);
    try {
      const attachments: AttachmentInput[] = [];
      for (const image of replyImages) attachments.push(await uploadQnaImage(image));
      await addMessage.mutateAsync({
        body: reply.trim(),
        attachments,
      });
      setReply('');
      setReplyImages([]);
      setComposerOpen(false);
      Keyboard.dismiss();
      requestAnimationFrame(() => conversation.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      Alert.alert('재질문 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSendingReply(false);
    }
  }

  async function submitEdit() {
    if (!detail) return;
    try {
      await update.mutateAsync({
        title: editTitle.trim(),
        body: editBody.trim(),
        publicVisible: detail.publicVisible,
      });
      setEditing(false);
    } catch (error) {
      Alert.alert('수정 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function deleteMine() {
    Alert.alert('질문 삭제', '답변 전 질문만 삭제할 수 있어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync();
            router.replace('/qna');
          } catch (error) {
            Alert.alert(
              '삭제 실패',
              error instanceof Error ? error.message : '다시 시도해 주세요.',
            );
          }
        },
      },
    ]);
  }

  if (question.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#527C42" />
        <QnaChrome />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          질문을 불러오지 못했습니다
        </ThemedText>
        <QnaChrome />
      </View>
    );
  }

  const canEdit = detail.mine && detail.status === 'PENDING';
  const canReply = detail.mine && detail.status !== 'CLOSED';
  const firstAnswerIndex = detail.messages.findIndex((message) => message.role === 'TEACHER');
  const lastAnswerIndex = detail.messages.map((message) => message.role).lastIndexOf('TEACHER');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        ref={conversation}
        style={{ flex: 1 }}
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
        <View style={styles.questionCard}>
          <AuthorBadge name={detail.authorName} date={detail.createdAt} />
          <View style={styles.questionTop}>
            <View style={styles.badges}>
              <ThemedText style={styles.categoryLabel}>
                {CATEGORY_LABEL[detail.category]}
              </ThemedText>
              {!detail.publicVisible ? (
                <SymbolView
                  accessibilityLabel="비공개 질문"
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  size={13}
                  tintColor="#8B9683"
                />
              ) : null}
            </View>
            <QnaStatusChip status={detail.status} />
          </View>
          <ThemedText type="subtitle">{detail.title}</ThemedText>
          <ReferenceCard reference={detail.reference} />
          <ThemedText style={styles.body}>{detail.body}</ThemedText>
          <AttachmentGrid attachments={detail.attachments} onOpen={setPreview} />
          {canEdit ? (
            <View style={styles.questionActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setEditTitle(detail.title);
                  setEditBody(detail.body);
                  setEditing(true);
                }}
                style={styles.textAction}
              >
                <ThemedText type="small" style={{ color: '#527C42', fontWeight: '700' }}>
                  수정
                </ThemedText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={deleteMine} style={styles.textAction}>
                <ThemedText type="small" style={{ color: '#C93F4B', fontWeight: '700' }}>
                  삭제
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>

        {detail.messages.map((message, index) => {
          const teacher = message.role === 'TEACHER';
          const firstAnswer = index === firstAnswerIndex;
          return (
            <View key={message.id}>
              <View
                style={[
                  styles.message,
                  firstAnswer
                    ? styles.answerCard
                    : teacher
                      ? styles.teacherBubble
                      : styles.studentBubble,
                ]}
              >
                <AuthorBadge name={message.authorName} date={message.createdAt} teacher={teacher} />
                <ThemedText
                  type="small"
                  style={{ color: teacher ? '#527C42' : '#74826C', fontWeight: '700' }}
                >
                  {teacher ? '선생님 답변' : '재질문'}
                </ThemedText>
                <ThemedText style={styles.body}>{message.body}</ThemedText>
                <AttachmentGrid attachments={message.attachments} onOpen={setPreview} />
              </View>
              {index === lastAnswerIndex && canReply && !composerOpen ? (
                <View style={styles.answerActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="재질문"
                    accessibilityState={{ expanded: composerOpen }}
                    disabled={!canReply}
                    onPress={() => {
                      draftNeedsScroll.current = true;
                      setDraftDate(new Date().toISOString());
                      setComposerOpen(true);
                    }}
                    style={styles.answerAction}
                  >
                    <SymbolView
                      name={{
                        ios: 'bubble.left',
                        android: 'chat_bubble_outline',
                        web: 'chat_bubble_outline',
                      }}
                      size={18}
                      tintColor="#527C42"
                    />
                    <ThemedText style={styles.answerActionText}>재질문</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={detail.status !== 'ANSWERED' || close.isPending}
                    accessibilityState={{
                      disabled: detail.status !== 'ANSWERED' || close.isPending,
                    }}
                    onPress={() =>
                      close.mutate(undefined, {
                        onSuccess: () => {
                          setComposerOpen(false);
                          Keyboard.dismiss();
                        },
                        onError: (error) => Alert.alert('처리 실패', error.message),
                      })
                    }
                    style={[styles.answerAction, detail.status !== 'ANSWERED' && { opacity: 0.4 }]}
                  >
                    {close.isPending ? (
                      <ActivityIndicator color="#527C42" />
                    ) : (
                      <SymbolView
                        name={{
                          ios: 'checkmark.circle',
                          android: 'check_circle_outline',
                          web: 'check_circle_outline',
                        }}
                        size={18}
                        tintColor="#527C42"
                      />
                    )}
                    <ThemedText style={styles.answerActionText}>해결됨</ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
        {canReply && composerOpen ? (
          <View
            style={[styles.questionCard, styles.draftCard]}
            onLayout={() => {
              if (!draftNeedsScroll.current) return;
              draftNeedsScroll.current = false;
              requestAnimationFrame(() => conversation.current?.scrollToEnd({ animated: true }));
            }}
          >
            <AuthorBadge name={detail.authorName} date={draftDate} />
            <View style={styles.draftHeading}>
              <ThemedText style={styles.categoryLabel}>재질문</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="재질문 작성 취소"
                disabled={sendingReply}
                onPress={() => {
                  setComposerOpen(false);
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.draftCancelButton,
                  (pressed || sendingReply) && { opacity: 0.6 },
                ]}
              >
                <ThemedText type="small" style={styles.draftCancelText}>
                  취소
                </ThemedText>
              </Pressable>
            </View>
            <TextInput
              autoFocus
              accessibilityLabel="재질문 내용"
              value={reply}
              onChangeText={setReply}
              multiline
              textAlignVertical="top"
              placeholder="추가로 궁금한 점을 적어 주세요"
              placeholderTextColor={theme.textSecondary}
              style={styles.draftInput}
              editable={!sendingReply}
            />
            {replyImages.length === 1 ? (
              <DraftAttachment
                image={replyImages[0]}
                index={0}
                large
                disabled={sendingReply}
                onOpen={setPreview}
                onRemove={() => setReplyImages([])}
              />
            ) : replyImages.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.attachmentGrid}
              >
                {replyImages.map((image, index) => (
                  <DraftAttachment
                    key={`${image.uri}-${index}`}
                    image={image}
                    index={index}
                    disabled={sendingReply}
                    onOpen={setPreview}
                    onRemove={() =>
                      setReplyImages((current) => current.filter((_, i) => i !== index))
                    }
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.draftActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`사진 첨부, ${replyImages.length}/${MAX_QNA_ATTACHMENTS}장`}
                disabled={
                  replyImages.length >= MAX_QNA_ATTACHMENTS || pickingPhotos || sendingReply
                }
                onPress={() => {
                  Keyboard.dismiss();
                  setPhotoMenuOpen(true);
                }}
                style={[
                  styles.draftAttachButton,
                  (replyImages.length >= MAX_QNA_ATTACHMENTS || sendingReply) && { opacity: 0.4 },
                ]}
              >
                {pickingPhotos ? (
                  <ActivityIndicator color="#527C42" />
                ) : (
                  <SymbolView
                    name={{ ios: 'paperclip', android: 'attach_file', web: 'attach_file' }}
                    size={23}
                    tintColor="#527C42"
                  />
                )}
              </Pressable>
              <View style={styles.draftSubmit}>
                <PrimaryButton
                  label="재질문"
                  loading={sendingReply}
                  disabled={reply.trim().length < 2 || pickingPhotos}
                  onPress={submitReply}
                />
              </View>
            </View>
          </View>
        ) : null}
        {detail.messages.length === 0 ? (
          <View style={styles.waiting}>
            <SymbolView
              name={{ ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' }}
              size={24}
              tintColor="#8B9C80"
            />
            <ThemedText type="small" themeColor="textSecondary">
              아직 답변이 없어요
            </ThemedText>
          </View>
        ) : null}
        {detail.status === 'CLOSED' && !composerOpen ? (
          <View style={styles.closed}>
            <View style={styles.closedHeading}>
              <SymbolView
                name={{
                  ios: 'checkmark.circle.fill',
                  android: 'check_circle',
                  web: 'check_circle',
                }}
                size={22}
                tintColor="#56AD62"
              />
              <ThemedText style={styles.closedTitle}>해결된 질문이에요</ThemedText>
            </View>

          </View>
        ) : null}
      </ScrollView>

      <QnaChrome />
      <PhotoSourceMenu
        visible={photoMenuOpen}
        onClose={() => setPhotoMenuOpen(false)}
        onChoose={(source) => {
          void selectReplyPhotos(source);
        }}
      />
      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.editOverlay}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="수정 창 닫기"
            onPress={() => setEditing(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.editSheet,
              { paddingBottom: insets.bottom + 20, maxHeight: screen.height - insets.top - 20 },
            ]}
          >
            <View style={styles.handle} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalContent}
            >
              <ThemedText type="subtitle">질문 수정</ThemedText>
              <ThemedText type="smallBold">제목</ThemedText>
              <TextInput
                accessibilityLabel="수정할 제목"
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={60}
                style={styles.editTitle}
              />
              <ThemedText type="smallBold">내용</ThemedText>
              <TextInput
                accessibilityLabel="수정할 내용"
                value={editBody}
                onChangeText={setEditBody}
                multiline
                textAlignVertical="top"
                style={styles.editBody}
              />
              <PrimaryButton
                label="수정 완료"
                loading={update.isPending}
                disabled={editTitle.trim().length < 2 || editBody.trim().length < 10}
                onPress={submitEdit}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                style={styles.cancelButton}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  취소
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                style={{
                  width: screen.width,
                  height: screen.height - insets.top - insets.bottom - 80,
                }}
                contentFit="contain"
              />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ReferenceCard({ reference }: { reference: QuestionReference }) {
  const router = useRouter();
  const theme = QNA_THEME;

  if (reference.examId && reference.itemNo) {
    return (
      <Pressable
        onPress={() => router.push(`/listening/${reference.examId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold" style={{ color: '#527C42' }}>
          {reference.examTitle} · {reference.itemNo}번
        </ThemedText>
      </Pressable>
    );
  }
  if (reference.wordDayId) {
    return (
      <Pressable
        onPress={() => router.push(`/vocabulary/${reference.wordDayId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">Day {reference.wordDayNo}</ThemedText>
      </Pressable>
    );
  }
  if (reference.assignmentId) {
    return (
      <Pressable
        onPress={() => router.push(`/homework/${reference.assignmentId}`)}
        style={[styles.reference, { borderColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">{reference.assignmentTitle}</ThemedText>
      </Pressable>
    );
  }
  if (reference.textbook) {
    return (
      <View style={[styles.reference, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">
          {reference.textbook} · p.{reference.page}
        </ThemedText>
      </View>
    );
  }
  return null;
}

function AttachmentGrid({
  attachments,
  onOpen,
}: {
  attachments: QuestionAttachment[];
  onOpen: (url: string) => void;
}) {
  if (attachments.length === 0) return null;
  return attachments.length === 1 ? (
    <AttachmentThumb attachment={attachments[0]} onOpen={onOpen} large />
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.attachmentGrid}
    >
      {attachments.map((attachment) => (
        <AttachmentThumb key={attachment.id} attachment={attachment} onOpen={onOpen} />
      ))}
    </ScrollView>
  );
}

function AttachmentThumb({
  attachment,
  onOpen,
  large = false,
}: {
  attachment: QuestionAttachment;
  onOpen: (url: string) => void;
  large?: boolean;
}) {
  const signed = useAttachmentUrl(attachment.id);
  const url = signed.data?.url;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={signed.error ? '첨부 사진 다시 불러오기' : '첨부 사진 확대'}
      onPress={() => {
        if (url) onOpen(url);
        else if (signed.error) void signed.refetch();
      }}
      style={[styles.attachment, large && styles.attachmentLarge]}
    >
      {url ? (
        <Image source={{ uri: url }} style={styles.attachmentImage} contentFit="contain" />
      ) : signed.error ? (
        <ThemedText type="small" themeColor="textSecondary">
          다시 시도
        </ThemedText>
      ) : (
        <ActivityIndicator color="#527C42" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F2DE' },
  content: { paddingHorizontal: 18, gap: 18 },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    paddingTop: 40,
    marginTop: 24,
    gap: 18,
  },
  questionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryLabel: { color: '#527C42', fontSize: 13, fontWeight: '700' },
  questionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  textAction: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  body: { fontSize: 16, lineHeight: 27 },
  reference: { borderRadius: 18, padding: 16, backgroundColor: '#F0F6EA' },
  message: { padding: 22, paddingTop: 40, marginTop: 24, gap: 14, minWidth: '78%' },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#A7BE99',
  },
  teacherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderTopRightRadius: 8,
    alignSelf: 'flex-end',
    maxWidth: '94%',
  },
  studentBubble: {
    backgroundColor: '#D4E7CA',
    borderRadius: 26,
    borderTopLeftRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '94%',
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#56AD62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageDate: { fontSize: 11 },
  resolveButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#EDF5E7',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  attachmentGrid: { gap: 10 },
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
  waiting: { paddingVertical: 30, alignItems: 'center', gap: 12 },
  closed: { backgroundColor: '#FFFFFF', borderRadius: 26, padding: 20, gap: 16, marginTop: 4 },
  closedHeading: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  closedTitle: { color: '#446F37', fontSize: 15, fontWeight: '700', flex: 1 },
  reopenButton: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#EDF5E7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  reopenText: { color: '#527C42', fontSize: 14, fontWeight: '700' },
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
  answerActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: '#EDF5E7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  answerActionText: { fontSize: 14, color: '#527C42', fontWeight: '700' },
  draftCancelButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#F0F4EC',
    borderWidth: 1,
    borderColor: '#D8E3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftCancelText: { color: '#66765D', fontSize: 13, fontWeight: '700' },
  draftHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  draftAttachButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDF5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftCard: { borderWidth: 1.5, borderColor: '#A7BE99' },
  draftInput: {
    minHeight: 170,
    color: '#1A1F2C',
    fontSize: 16,
    lineHeight: 27,
    paddingTop: 0,
    paddingBottom: 12,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  draftSubmit: { width: 100 },
  editOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,31,44,0.28)' },
  editSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8DFD3',
    alignSelf: 'center',
  },
  modalContent: { padding: 24, gap: 14 },
  editTitle: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: '#E3EBDD',
    borderRadius: 18,
    padding: 16,
    fontSize: 17,
    color: '#1A1F2C',
    backgroundColor: '#F6F9F3',
  },
  editBody: {
    minHeight: 220,
    borderWidth: 1.5,
    borderColor: '#E3EBDD',
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    lineHeight: 25,
    color: '#1A1F2C',
    backgroundColor: '#F6F9F3',
  },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
