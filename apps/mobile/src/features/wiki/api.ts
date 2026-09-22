import { apiFetch } from '@/lib/api';

export type ChapterSummary = {
  id: string;
  chapterNo: number;
  title: string;
  termCount: number;
};

/** 용어 카드 하나. 화면의 블록에 대응한다. */
export type TermItem = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  /** "run, eat, know" 같은 예시 목록. 없는 용어가 더 많다 */
  usages: string[];
  /** 예문과 해석은 같은 길이다. 짝으로 붙여 보여준다 */
  examples: string[];
  meanings: string[];
  chapterNo: number;
  chapterTitle: string;
};

export type ChapterDetail = {
  id: string;
  chapterNo: number;
  title: string;
  terms: TermItem[];
};

export function fetchChapters(accessToken: string) {
  return apiFetch<ChapterSummary[]>('/api/wiki/chapters', { accessToken });
}

export function fetchChapter(accessToken: string, chapterId: string) {
  return apiFetch<ChapterDetail>(`/api/wiki/chapters/${chapterId}`, { accessToken });
}

export function searchTerms(accessToken: string, keyword: string) {
  return apiFetch<TermItem[]>(`/api/wiki/search?keyword=${encodeURIComponent(keyword)}`, {
    accessToken,
  });
}

/** 즐겨찾기 복원. 기기에 저장한 id 목록으로 내용을 되묻는다. */
export function fetchTermsByIds(accessToken: string, ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return apiFetch<TermItem[]>(`/api/wiki/terms?ids=${ids.join(',')}`, { accessToken });
}
