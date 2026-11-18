import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const KEY = 'wiki:favorites';
const QUERY_KEY = ['wiki', 'favorite-ids'] as const;
let pendingWrite = Promise.resolve();

/** Keep the existing device bookmarks synchronized across all Wiki screens. */
export function useFavorites() {
  const queryClient = useQueryClient();
  const favorites = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    },
    staleTime: Infinity,
  });
  const ids = favorites.data;
  const toggle = useCallback(
    async (termId: string) => {
      const current = queryClient.getQueryData<string[]>(QUERY_KEY) ?? [];
      const next = current.includes(termId)
        ? current.filter((id) => id !== termId)
        : [...current, termId];
      queryClient.setQueryData(QUERY_KEY, next);
      // Serialize writes so rapid taps retain their order in device storage.
      pendingWrite = pendingWrite
        .then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)))
        .catch(() => undefined);
      await pendingWrite;
    },
    [queryClient],
  );
  const has = useCallback((termId: string) => ids?.includes(termId) ?? false, [ids]);
  return { ids: ids ?? [], has, toggle, loaded: favorites.isFetched };
}
