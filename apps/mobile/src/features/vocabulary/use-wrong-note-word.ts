import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { VocabLevel } from '@/features/auth/api';
import { withAuth } from '@/lib/with-auth';

import { fetchDay, fetchDays, type DayDetail, type ResultResponse, type WordItem } from './api';

const LEVELS: VocabLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const STALE_TIME = 300_000;

/** Resolve examples through existing DAY reads; the wrong-notes endpoint is unchanged. */
export function useWrongNoteWord(wordId: number, enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['vocabulary', 'wrong-note-word', wordId],
    enabled,
    staleTime: STALE_TIME,
    queryFn: async (): Promise<WordItem | null> => {
      // A visited study page already has the complete word, including both example languages.
      for (const [, day] of queryClient.getQueriesData<DayDetail>({
        queryKey: ['vocabulary', 'day'],
      })) {
        const word = day?.words.find((item) => item.id === wordId);
        if (word) return word;
      }

      // Recent result pages can supply an English example without another network request.
      for (const [, result] of queryClient.getQueriesData<ResultResponse>({
        queryKey: ['quiz', 'result'],
      })) {
        const review = result?.reviews.find((item) => item.wordId === wordId);
        if (review?.exampleEn) {
          return {
            id: wordId,
            headword: review.headword,
            meaningKo: review.meaningKo,
            exampleEn: review.exampleEn,
            exampleKo: null,
          };
        }
      }

      // Wrong notes may come from any level. Only completed DAYs can have wrong answers.
      const levels = await Promise.all(
        LEVELS.map((level) =>
          queryClient.fetchQuery({
            queryKey: ['vocabulary', 'days', level],
            queryFn: () => withAuth((token) => fetchDays(token, level)),
            staleTime: STALE_TIME,
          }),
        ),
      );
      const days = [
        ...new Map(
          levels
            .flat()
            .filter((day) => day.attemptCount > 0)
            .map((day) => [day.id, day]),
        ).values(),
      ];
      for (const day of days) {
        const detail = await queryClient.fetchQuery({
          queryKey: ['vocabulary', 'day', day.id],
          queryFn: () => withAuth((token) => fetchDay(token, day.id)),
          staleTime: STALE_TIME,
        });
        const word = detail.words.find((item) => item.id === wordId);
        if (word) return word;
      }
      return null;
    },
  });
}
