import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { PlaybackSpeedMenu } from '@/features/listening/playback-speed-menu';
import { PlaybackControls } from '@/features/listening/playback-controls';
import {
  PlaybackHeader,
  PlaybackListSheet,
  type PlaybackMenuAnchor,
} from '@/features/listening/playback-chrome';
import { PlaybackTranscript } from '@/features/listening/playback-transcript';
import { useItem, usePlaylist } from '@/features/listening/use-listening';
import { localUri, readOfflineExam, type OfflineExam } from '@/features/listening/offline-store';
import { playlistFromOffline } from '@/features/listening/offline-playlist';
import { enqueueProgress } from '@/features/listening/progress-queue';
import { useLockScreenControls } from '@/features/listening/use-lock-screen';
import { useLearningSettings } from '@/features/settings/use-learning-settings';

/** One continuous player, with an optional transcript for the current question. */
export default function ListeningPlayerScreen() {
  const {
    examId,
    itemId: initialItemId,
    script,
  } = useLocalSearchParams<{ examId: string; itemId?: string; script?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [listAnchor, setListAnchor] = useState<PlaybackMenuAnchor | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(script === '1');
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId ?? null);
  const [offline, setOffline] = useState<OfflineExam | null>(null);
  const [offlineLoaded, setOfflineLoaded] = useState(false);
  const { data: remote, isPending, error } = usePlaylist(examId);
  useEffect(() => {
    let alive = true;
    readOfflineExam(examId)
      .then((saved) => {
        if (alive) setOffline(saved);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setOfflineLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [examId]);
  const localPlaylist = useMemo(
    () => (offline ? playlistFromOffline(offline, (name) => localUri(examId, name)) : null),
    [offline, examId],
  );
  const data = localPlaylist ?? remote;
  const tracks = useMemo(() => data?.tracks ?? [], [data]);
  const found = tracks.findIndex((track) => (track.itemId ?? 'intro') === selectedId);
  const index = found >= 0 ? found : 0;
  const current = tracks[index];
  const {
    data: item,
    isPending: itemPending,
    error: itemError,
    refetch: refetchItem,
  } = useItem(current?.itemId ?? '');
  const localItem = offline?.complete
    ? offline.items.find((entry) => entry.id === current?.itemId)
    : undefined;
  const detail = localItem ?? item;
  const { settings, loaded: settingsLoaded } = useLearningSettings();
  const [speed, setSpeed] = useState(1);
  const [showTranslation, setShowTranslation] = useState(true);
  const settingsApplied = useRef(false);
  useEffect(() => {
    if (!settingsLoaded || settingsApplied.current) return;
    settingsApplied.current = true;
    setSpeed(settings.playbackRate);
    setShowTranslation(settings.showTranslation);
  }, [settingsLoaded, settings]);
  const [finished, setFinished] = useState(false);
  const player = useAudioPlayer(offlineLoaded && current ? { uri: current.audioUrl } : null);
  const status = useAudioPlayerStatus(player);
  useLockScreenControls(
    player,
    current && data ? { title: current.label, artist: data.examLabel } : null,
  );
  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  const durationMs = Math.round((status.duration ?? 0) * 1000) || (current?.durationMs ?? 0);

  const savedAt = useRef(0);
  const latest = useRef({ itemId: current?.itemId, positionMs, durationMs });
  // Capture the old track before switching players or leaving the screen.
  useLayoutEffect(() => {
    latest.current = { itemId: current?.itemId, positionMs, durationMs };
  }, [current?.itemId, positionMs, durationMs]);
  useLayoutEffect(() => {
    savedAt.current = 0;
    const id = current?.itemId;
    return () => {
      const value = latest.current;
      if (id && value.itemId === id && value.positionMs > 0)
        enqueueProgress(id, {
          lastPositionMs: value.positionMs,
          completed: value.durationMs > 0 && value.positionMs / value.durationMs > 0.9,
        });
    };
  }, [current?.itemId]);
  useEffect(() => {
    if (!status.playing || !current?.itemId || positionMs - savedAt.current < 10000) return;
    savedAt.current = positionMs;
    enqueueProgress(current.itemId, {
      lastPositionMs: positionMs,
      completed: durationMs > 0 && positionMs / durationMs > 0.9,
    });
  }, [positionMs, durationMs, status.playing, current?.itemId]);

  const startedPlayer = useRef<typeof player | null>(null);
  useEffect(() => {
    if (!status.isLoaded || startedPlayer.current === player || !settingsLoaded) return;
    if (current?.itemId && !detail && itemPending) return;
    startedPlayer.current = player;
    player.setPlaybackRate(speed, 'high');
    const resumeMs = item?.id === current?.itemId ? item.lastPositionMs : 0;
    if (resumeMs > 0) void player.seekTo(resumeMs / 1000);
    player.play();
  }, [player, status.isLoaded, settingsLoaded, detail, itemPending, item, current?.itemId, speed]);
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (next) => {
      if (!next.didJustFinish) return;
      if (current?.itemId)
        enqueueProgress(current.itemId, {
          lastPositionMs: Math.round(next.currentTime * 1000),
          completed: true,
        });
      const following = tracks[index + 1];
      if (following) setSelectedId(following.itemId ?? 'intro');
      else setFinished(true);
    });
    return () => sub.remove();
  }, [player, current?.itemId, tracks, index]);
  const goTo = (next: number) => {
    if (next < 0 || next >= tracks.length) return;
    setFinished(false);
    setSelectedId(tracks[next].itemId ?? 'intro');
  };
  const seek = useCallback(
    (ms: number) => {
      void player.seekTo(ms / 1000);
    },
    [player],
  );
  const selectSpeed = (next: number) => {
    setSpeed(next);
    player.setPlaybackRate(next, 'high');
  };
  const loading = !offlineLoaded || (!data && isPending);
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <PlaybackHeader
        title={data?.examLabel ?? '리스닝'}
        subtitle={current?.label ?? '듣기'}
        onBack={() => router.back()}
        translation={showTranslation}
        onTranslation={scriptOpen ? () => setShowTranslation((value) => !value) : undefined}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#527C42" />
        </View>
      ) : !data || tracks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.hint}>
            {error ? '음원을 불러오지 못했습니다' : '재생할 음원이 없어요'}
          </Text>
        </View>
      ) : (
        <>
          {scriptOpen ? (
            <PlaybackTranscript
              key={current?.itemId ?? 'intro'}
              sentences={detail?.sentences ?? []}
              positionMs={positionMs}
              showTranslation={showTranslation}
              autoScroll={settings.autoScroll}
              pending={!detail && itemPending}
              error={!detail && Boolean(itemError)}
              intro={current?.kind === 'INTRO'}
              onRetry={() => {
                void refetchItem();
              }}
              onSeek={(ms) => {
                seek(ms);
                if (!status.playing) player.play();
              }}
            />
          ) : (
            <View style={styles.stage}>
              <View style={styles.cover}>
                <Text style={styles.coverLabel}>LISTENING</Text>
                <View style={styles.wave}>
                  {[24, 42, 66, 92, 66, 42, 24].map((height, i) => (
                    <View key={i} style={[styles.waveBar, { height }]} />
                  ))}
                </View>
                <Text style={styles.coverFooter}>ENGLISH PRACTICE</Text>
              </View>
              <Text style={styles.trackLabel}>{current?.label}</Text>
              <Text style={styles.examLabel}>{data.examLabel}</Text>
              {finished ? <Text style={styles.finished}>끝까지 들었어요</Text> : null}
            </View>
          )}
          <View style={{ paddingBottom: insets.bottom + 12 }}>
            <PlaybackControls
              key={current?.itemId ?? 'intro'}
              positionMs={positionMs}
              durationMs={durationMs}
              playing={status.playing}
              speed={speed}
              previousDisabled={index === 0}
              nextDisabled={index >= tracks.length - 1}
              onPrevious={() => goTo(index - 1)}
              onNext={() => goTo(index + 1)}
              onTogglePlay={() => {
                if (status.playing) player.pause();
                else {
                  setFinished(false);
                  player.play();
                }
              }}
              onSeek={seek}
              onSpeed={() => setSpeedMenuOpen(true)}
              speedMenuOpen={speedMenuOpen}
              onOpenList={setListAnchor}
              trackLabel={current?.label}
              scriptOpen={scriptOpen}
              onToggleScript={() => setScriptOpen((value) => !value)}
            />
          </View>
          <PlaybackSpeedMenu
            visible={speedMenuOpen}
            value={speed}
            onSelect={selectSpeed}
            onClose={() => setSpeedMenuOpen(false)}
          />
          <PlaybackListSheet
            visible={listAnchor !== null}
            anchor={listAnchor}
            title="문항 선택"
            onClose={() => setListAnchor(null)}
            onSelect={(id) => goTo(Number(id))}
            rows={tracks.map((track, i) => ({
              id: String(i),
              label: track.label,
              selected: i === index,
            }))}
          />
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2DE' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { color: '#74826C', fontSize: 14 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  cover: {
    width: '58%',
    maxWidth: 220,
    maxHeight: '62%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 18,
    marginBottom: 26,
  },
  coverLabel: { color: '#8B9C80', fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  waveBar: { width: 9, borderRadius: 5, backgroundColor: '#56AD62' },
  coverFooter: { color: '#8B9C80', fontSize: 8, letterSpacing: 2, fontWeight: '600' },
  trackLabel: {
    color: Palette.ink,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  examLabel: { color: '#74826C', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  finished: { color: '#446F37', fontSize: 13, marginTop: 10 },
});
