// 출생연도 선택지 (10년대 단위)
// 어르신 친화: 정확한 연도 대신 "1950년대" 같은 큰 범위로 선택
// 저장값은 10년대 중간(5의 자리) — 나이별 운동 기준에 충분

export interface DecadeOption {
  label: string;      // "1950년대"
  birthYear: number;  // 1955
}

export function buildDecadeOptions(): DecadeOption[] {
  // 1940 ~ 2000년대 (필요시 확장)
  const startYears = [1940, 1950, 1960, 1970, 1980, 1990, 2000];
  return startYears.map((startYear) => ({
    label: `${startYear}년대`,
    birthYear: startYear + 5,
  }));
}
