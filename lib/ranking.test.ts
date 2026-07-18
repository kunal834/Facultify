import { describe, it, expect } from "vitest";
import { computeRank, computePercentile, getOrdinal } from "./ranking";

describe("computeRank", () => {
  it("ranks the unique top score as 1", () => {
    expect(computeRank([90, 80, 70], 90)).toBe(1);
  });

  it("ranks the unique bottom score last", () => {
    expect(computeRank([90, 80, 70], 70)).toBe(3);
  });

  it("gives tied scores the same rank", () => {
    expect(computeRank([90, 90, 70], 90)).toBe(1);
  });

  it("skips the next rank after a tie (1224 ranking)", () => {
    // Two people tied at 90 (rank 1), so the 70 is rank 3, not rank 2.
    expect(computeRank([90, 90, 70], 70)).toBe(3);
  });

  it("handles a single participant as rank 1", () => {
    expect(computeRank([55], 55)).toBe(1);
  });

  it("handles an empty scores list as rank 1", () => {
    expect(computeRank([], 55)).toBe(1);
  });
});

describe("computePercentile", () => {
  it("gives the sole participant the 100th percentile", () => {
    expect(computePercentile([85], 85)).toBe(100);
  });

  it("gives an empty field the 100th percentile", () => {
    expect(computePercentile([], 85)).toBe(100);
  });

  it("gives the top score the 100th percentile", () => {
    expect(computePercentile([90, 80], 90)).toBe(100);
  });

  it("gives the bottom-of-two score the 50th percentile", () => {
    expect(computePercentile([90, 80], 80)).toBe(50);
  });

  it("is monotonic non-decreasing with score across a tied field", () => {
    const scores = [90, 90, 80, 70];
    expect(computePercentile(scores, 70)).toBeLessThanOrEqual(computePercentile(scores, 80));
    expect(computePercentile(scores, 80)).toBeLessThanOrEqual(computePercentile(scores, 90));
  });
});

describe("getOrdinal", () => {
  it("formats common cases", () => {
    expect(getOrdinal(1)).toBe("1st");
    expect(getOrdinal(2)).toBe("2nd");
    expect(getOrdinal(3)).toBe("3rd");
    expect(getOrdinal(4)).toBe("4th");
  });

  it("handles the 11th/12th/13th exception", () => {
    expect(getOrdinal(11)).toBe("11th");
    expect(getOrdinal(12)).toBe("12th");
    expect(getOrdinal(13)).toBe("13th");
  });

  it("handles larger numbers", () => {
    expect(getOrdinal(21)).toBe("21st");
    expect(getOrdinal(102)).toBe("102nd");
    expect(getOrdinal(113)).toBe("113th");
  });
});
