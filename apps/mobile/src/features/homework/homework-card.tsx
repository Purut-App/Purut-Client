import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NumberFontFamily, Palette, LearningResultColors } from '@/constants/theme';
import type { AssignmentListItem, CalendarStatus } from './api';
import { dDayLabel, STATUS_STYLE } from './status';
const STATUS_BACKGROUNDS: Record<CalendarStatus, string> = {
  NOT_SUBMITTED: LearningResultColors.incorrect.soft,
  OVERDUE: '#F0E7FA',
  SUBMITTED: '#E5F0FF',
  REVIEWED: '#E3F2DE',
  RESUBMIT_REQUIRED: '#FFF2D6',
};
const STATUS_TEXT: Record<CalendarStatus, string> = {
  NOT_SUBMITTED: LearningResultColors.incorrect.text,
  OVERDUE: '#71419C',
  SUBMITTED: '#376799',
  REVIEWED: '#446F37',
  RESUBMIT_REQUIRED: '#8B6519',
};

export function HomeworkCard({
  assignment,
  onPress,
}: {
  assignment: AssignmentListItem;
  onPress: () => void;
}) {
  const submitted = assignment.status === 'SUBMITTED' || assignment.status === 'REVIEWED';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTitleRow}>
        <SubjectIcon subject={assignment.subject} />
        <View style={styles.cardTitleCopy}>
          <Text style={styles.subjectLabel}>{assignment.subject}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {assignment.title}
          </Text>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
          tintColor="#71806B"
        />
      </View>
      <View style={styles.cardStatusRow}>
        <View
          style={[styles.statusBadge, { backgroundColor: STATUS_BACKGROUNDS[assignment.status] }]}
        >
          <Text style={[styles.statusText, { color: STATUS_TEXT[assignment.status] }]}>
            {STATUS_STYLE[assignment.status].label}
          </Text>
        </View>
        {!submitted ? (
          <Text style={styles.deadlineText}>{dDayLabel(assignment.dueDate)}</Text>
        ) : null}
      </View>
      <Text style={styles.periodText}>
        배정 <Text style={styles.periodNumber}>{formatShortDate(assignment.assignedDate)}</Text>
        {' · 마감 '}
        <Text style={styles.periodNumber}>{formatShortDate(assignment.dueDate)}</Text>
      </Text>
    </Pressable>
  );
}
function SubjectIcon({ subject }: { subject: string }) {
  const source = subject.includes('수학')
    ? require('../../../assets/images/subject-icons/lucide/calculator.png')
    : subject.includes('영어')
      ? require('../../../assets/images/subject-icons/lucide/book-open.png')
      : subject.includes('국어')
        ? require('../../../assets/images/subject-icons/lucide/pencil.png')
        : require('../../../assets/images/subject-icons/lucide/book-open.png');
  return (
    <View style={styles.subjectIcon}>
      <Image source={source} contentFit="contain" style={styles.subjectImage} accessible={false} />
    </View>
  );
}

function formatShortDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 22, gap: 16, backgroundColor: '#FFFFFF' },
  cardPressed: { opacity: 0.75 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#F2F7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectImage: { width: 27, height: 27 },
  cardTitleCopy: { flex: 1, gap: 5 },
  subjectLabel: { color: '#737373', fontSize: 11, fontWeight: '500' },
  cardTitle: {
    color: Palette.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  statusText: { fontSize: 12, fontWeight: '600' },
  deadlineText: { color: LearningResultColors.incorrect.text, fontSize: 13, fontWeight: '600' },
  periodText: { color: '#737373', fontSize: 12 },
  periodNumber: { fontFamily: NumberFontFamily, fontSize: 14 },
});
