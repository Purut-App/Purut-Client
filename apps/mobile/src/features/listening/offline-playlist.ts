import type { Playlist, PlaylistTrack } from './api';
import type { OfflineExam } from './offline-store';

/** Preserve shared-audio grouping (e.g. 16–17) without playing its file twice. */
export function playlistFromOffline(
  exam: OfflineExam,
  resolve: (fileName: string) => string | null,
): Playlist | null {
  if (!exam.complete) return null;
  const tracks: PlaylistTrack[] = [];
  if (exam.introFileName) {
    const uri = resolve(exam.introFileName);
    if (!uri) return null;
    tracks.push({
      kind: 'INTRO',
      itemId: null,
      label: '안내 방송',
      audioUrl: uri,
      durationMs: null,
    });
  }
  let lastFile: string | null = null;
  for (const item of exam.items) {
    const previous = tracks[tracks.length - 1];
    if (item.fileName === lastFile && previous) {
      previous.label = `${previous.label.replace(/(?:-\d+)?번$/, '')}-${item.itemNo}번`;
      continue;
    }
    const uri = resolve(item.fileName);
    if (!uri) return null;
    tracks.push({
      kind: 'ITEM',
      itemId: item.id,
      label: `${item.itemNo}번`,
      audioUrl: uri,
      durationMs: item.durationMs,
    });
    lastFile = item.fileName;
  }
  return { examId: exam.examId, examLabel: exam.examLabel, tracks };
}
