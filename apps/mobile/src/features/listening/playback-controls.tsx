import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlaybackMenuAnchor } from './playback-chrome';
import { DropdownSurface, NumberFontFamily, Palette } from '@/constants/theme';

/** Both listening modes share the same five controls and fixed utility positions. */
export function PlaybackControls({
  positionMs,
  durationMs,
  playing,
  speed,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  onTogglePlay,
  onSeek,
  onSpeed,
  speedMenuOpen = false,
  onOpenList,
  trackLabel = '문항 선택',
  scriptOpen = false,
  onToggleScript,
}: {
  positionMs: number;
  durationMs: number;
  playing: boolean;
  speed: number;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (ms: number) => void;
  onSpeed: () => void;
  speedMenuOpen?: boolean;
  onOpenList: (anchor: PlaybackMenuAnchor) => void;
  trackLabel?: string;
  scriptOpen?: boolean;
  onToggleScript?: () => void;
}) {
  const listButton = useRef<View>(null);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const seek = useCallback(
    (ms: number) => {
      onSeek(ms);
      setScrubMs(null);
    },
    [onSeek],
  );
  const msAt = useCallback(
    (x: number) => Math.round(Math.min(1, Math.max(0, width > 0 ? x / width : 0)) * durationMs),
    [width, durationMs],
  );
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => durationMs > 0,
        onMoveShouldSetPanResponder: () => durationMs > 0,
        onPanResponderGrant: (e) => setScrubMs(msAt(e.nativeEvent.locationX)),
        onPanResponderMove: (e) => setScrubMs(msAt(e.nativeEvent.locationX)),
        onPanResponderRelease: (e) => seek(msAt(e.nativeEvent.locationX)),
        onPanResponderTerminate: () => setScrubMs(null),
      }),
    [durationMs, msAt, seek],
  );
  const shown = scrubMs ?? positionMs;
  const ratio = durationMs > 0 ? Math.max(0, Math.min(1, shown / durationMs)) : 0;
  const skip = (delta: number) => seek(Math.max(0, Math.min(durationMs, positionMs + delta)));
  return (
    <View style={styles.player}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="재생 위치"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        accessibilityActions={[
          { name: 'increment', label: '5초 앞으로' },
          { name: 'decrement', label: '5초 뒤로' },
        ]}
        onAccessibilityAction={(e) => skip(e.nativeEvent.actionName === 'increment' ? 5000 : -5000)}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={styles.seekBar}
        {...pan.panHandlers}
      >
        <View pointerEvents="none" style={styles.seekTrack}>
          <View style={[styles.seekFill, { width: `${ratio * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(shown)}</Text>
        <Text style={styles.time}>−{formatTime(Math.max(0, durationMs - shown))}</Text>
      </View>
      <View style={styles.controls}>
        <Control
          symbol={{ ios: 'backward.end.fill', android: 'skip_previous', web: 'skip_previous' }}
          label="이전 문항"
          disabled={previousDisabled}
          onPress={onPrevious}
        />
        <Control
          symbol={{ ios: 'gobackward.5', android: 'replay_5', web: 'replay_5' }}
          label="5초 뒤로"
          onPress={() => skip(-5000)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? '일시정지' : '재생'}
          onPress={onTogglePlay}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}
        >
          <SymbolView
            name={{
              ios: playing ? 'pause.fill' : 'play.fill',
              android: playing ? 'pause' : 'play_arrow',
              web: playing ? 'pause' : 'play_arrow',
            }}
            size={32}
            tintColor="#446F37"
          />
        </Pressable>
        <Control
          symbol={{ ios: 'goforward.5', android: 'forward_5', web: 'forward_5' }}
          label="5초 앞으로"
          onPress={() => skip(5000)}
        />
        <Control
          symbol={{ ios: 'forward.end.fill', android: 'skip_next', web: 'skip_next' }}
          label="다음 문항"
          disabled={nextDisabled}
          onPress={onNext}
        />
      </View>
      <View style={styles.utilities}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`재생 속도 ${speed}배, 속도 선택`}
          accessibilityState={{ expanded: speedMenuOpen }}
          onPress={onSpeed}
          style={[styles.utility, styles.leftUtility, speedMenuOpen && styles.speedOpen]}
        >
          <Text style={styles.speed}>{speed}x</Text>
        </Pressable>
        <View style={styles.middleUtility}>
          {onToggleScript ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={scriptOpen ? '대사 숨기기' : '대사 보기'}
              accessibilityState={{ selected: scriptOpen }}
              onPress={onToggleScript}
              style={[styles.scriptButton, scriptOpen && styles.scriptActive]}
            >
              <SymbolView
                name={{ ios: 'text.quote', android: 'subtitles', web: 'subtitles' }}
                size={21}
                tintColor={scriptOpen ? '#446F37' : Palette.ink}
              />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`현재 ${trackLabel}, 문항 선택`}
          ref={listButton}
          onPress={() =>
            listButton.current?.measureInWindow((x, y, width, height) =>
              onOpenList({ x, y, width, height }),
            )
          }
          style={styles.utility}
        >
          <Text style={styles.speed} numberOfLines={1}>
            {trackLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
function Control({
  symbol,
  label,
  disabled = false,
  onPress,
}: {
  symbol: SymbolViewProps['name'];
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <SymbolView name={symbol} size={24} tintColor={Palette.ink} />
    </Pressable>
  );
}
function formatTime(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
const styles = StyleSheet.create({
  player: { paddingHorizontal: 28, paddingTop: 10 },
  seekBar: { height: 28, justifyContent: 'center' },
  seekTrack: { height: 4, backgroundColor: '#D5E5CE', borderRadius: 2, overflow: 'hidden' },
  seekFill: { height: 4, backgroundColor: '#56AD62', borderRadius: 2 },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: '#56AD62',
  },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: '#74826C', fontSize: 12, fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 20,
  },
  control: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilities: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  middleUtility: { flex: 1, alignItems: 'center' },
  leftUtility: { justifyContent: 'flex-start' },
  scriptButton: {
    width: 48,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptActive: { backgroundColor: '#FFFFFF' },
  utility: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  speedOpen: { ...DropdownSurface, borderRadius: 18, paddingHorizontal: 10 },
  speed: { fontFamily: NumberFontFamily, color: Palette.ink, fontSize: 18 },
  utilityText: { color: Palette.ink, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.25 },
  pressed: { opacity: 0.6 },
});
