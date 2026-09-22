import { useQuery } from '@tanstack/react-query';

import { withAuth } from '@/lib/with-auth';

import { fetchChapter, fetchChapters, fetchTermsByIds, searchTerms } from './api';

export function useChapters() {
  return useQuery({
    queryKey: ['wiki', 'chapters'],
    queryFn: () => withAuth((token) => fetchChapters(token)),
    // 교재는 거의 바뀌지 않는다. 화면을 오갈 때마다 다시 받을 이유가 없다
    staleTime: 1000 * 60 * 60,
  });
}

export function useChapter(chapterId: string) {
  return useQuery({
    queryKey: ['wiki', 'chapter', chapterId],
    queryFn: () => withAuth((token) => fetchChapter(token, chapterId)),
    enabled: Boolean(chapterId),
    staleTime: 1000 * 60 * 60,
  });
}

export function useSearch(keyword: string) {
  const trimmed = keyword.trim();
  return useQuery({
    queryKey: ['wiki', 'search', trimmed],
    queryFn: () => withAuth((token) => searchTerms(token, trimmed)),
    // 서버도 두 글자 미만이면 빈 목록을 주지만, 요청 자체를 아낀다
    enabled: trimmed.length >= 2,
  });
}

export function useFavoriteTerms(ids: string[], enabled: boolean) {
  return useQuery({
    queryKey: ['wiki', 'favorites', ids],
    queryFn: () => withAuth((token) => fetchTermsByIds(token, ids)),
    enabled: enabled && ids.length > 0,
  });
}
