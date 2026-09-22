import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'wiki:favorites';

/**
 * 위키 즐겨찾기.
 *
 * 학습 기록이라기보다 개인 북마크에 가까워 기기에 저장한다. 학습 설정과 같은 방식이다.
 * 담은 순서를 지킨다 — 사용자가 나중에 담은 것을 뒤에서 찾기 때문이다.
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        setIds(raw ? (JSON.parse(raw) as string[]) : []);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(async (termId: string) => {
    // 저장 실패보다 화면이 먼저 반응하는 편이 낫다. 실패해도 다음 토글에서 복구된다
    let next: string[] = [];
    setIds((prev) => {
      next = prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId];
      return next;
    });
    await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const has = useCallback((termId: string) => ids.includes(termId), [ids]);

  return { ids, has, toggle, loaded };
}
