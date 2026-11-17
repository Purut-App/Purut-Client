import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { WordItem } from './api';

const storageKey = (userId: string) => `purut:vocabulary:saved-words:${userId}`;

/**
 * 내 단어장은 아직 별도 서버 API가 없으므로 계정별 로컬 저장소에 보관한다.
 * 저장 데이터에는 나중에 내 단어장 목록을 만들 때 필요한 단어 원문도 함께 남긴다.
 */
export function useSavedWords(userId: string | null) {
  const [saved, setSaved] = useState<{ userId: string | null; ids: Set<number> }>({
    userId: null,
    ids: new Set(),
  });
  const savedWordIds = saved.userId === userId ? saved.ids : new Set<number>();

  useEffect(() => {
    let active = true;

    if (!userId) {
      return undefined;
    }

    AsyncStorage.getItem(storageKey(userId))
      .then((raw) => {
        if (!active) return;
        const savedWords = raw ? (JSON.parse(raw) as { id: number }[]) : [];
        setSaved({ userId, ids: new Set(savedWords.map((word) => word.id)) });
      })
      .catch(() => {
        if (active) setSaved({ userId, ids: new Set() });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const toggleSavedWord = useCallback(
    async (word: WordItem, dayId: string, dayTitle: string) => {
      if (!userId) return;

      const raw = await AsyncStorage.getItem(storageKey(userId));
      const current = raw ? (JSON.parse(raw) as SavedWord[]) : [];
      const alreadySaved = current.some((item) => item.id === word.id);
      const next = alreadySaved
        ? current.filter((item) => item.id !== word.id)
        : [...current, { ...word, dayId, dayTitle, savedAt: new Date().toISOString() }];

      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
      setSaved({ userId, ids: new Set(next.map((item) => item.id)) });
    },
    [userId],
  );

  return { savedWordIds, toggleSavedWord };
}

type SavedWord = WordItem & {
  dayId: string;
  dayTitle: string;
  savedAt: string;
};
