// Pure rank/percentile math — no DB access, so it's cheap to unit test and
// safe to reuse anywhere a set of scores needs to be turned into a rank
// (batch rank on a rank card today; all-India rank/percentile in the live
// mock feature later).

/**
 * Standard competition ranking (1224): ties share a rank, the next distinct
 * rank skips accordingly (e.g. two people tied at 1st, next person is 3rd).
 */
export function computeRank(scores: number[], targetScore: number): number {
  return 1 + scores.filter((s) => s > targetScore).length;
}

/**
 * Percentile using the inclusive "at or below" convention: the sole
 * participant in a field of one is defined as the 100th percentile.
 */
export function computePercentile(scores: number[], targetScore: number): number {
  if (scores.length === 0) return 100;
  const atOrBelow = scores.filter((s) => s <= targetScore).length;
  return Math.round((atOrBelow / scores.length) * 100);
}

export function getOrdinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}
