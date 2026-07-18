import { ImageResponse } from "next/og";
import { getCardFonts, CARD_FONT_FAMILY } from "@/lib/og-fonts";
import { getOrdinal } from "@/lib/ranking";
import type { ResultCardData, CardVariant } from "@/lib/cards/card-data";

export type CardSize = "story" | "square";

const SIZES: Record<CardSize, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const VARIANT_BADGE_BG: Record<CardVariant, string> = {
  topper: "#F59E0B",
  improvement: "#10B981",
  standard: "rgba(255,255,255,0.16)",
};

export async function renderResultCardImage(
  data: ResultCardData,
  variant: CardVariant,
  size: CardSize
): Promise<ImageResponse> {
  const fonts = await getCardFonts();
  const { width, height } = SIZES[size];
  const isStory = size === "story";

  const improvementDelta =
    variant === "improvement" && data.previousPercentage !== undefined
      ? data.percentage - data.previousPercentage
      : undefined;

  const badgeText =
    variant === "topper"
      ? `${getOrdinal(data.batchRank)} IN BATCH`
      : variant === "improvement"
      ? `+${improvementDelta}% VS LAST TEST`
      : "TEST RESULT";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: isStory ? "72px 64px" : "56px",
          background: `linear-gradient(160deg, ${data.primaryColor} 0%, ${data.secondaryColor} 100%)`,
          fontFamily: CARD_FONT_FAMILY,
          color: "#ffffff",
        }}
      >
        {/* Header — institution branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {data.institutionLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.institutionLogoUrl}
              width={56}
              height={56}
              alt=""
              style={{ borderRadius: 14, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {initials(data.institutionName)}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{data.institutionName}</div>
        </div>

        {/* Variant badge */}
        <div style={{ display: "flex", marginTop: isStory ? 64 : 40 }}>
          <div
            style={{
              display: "flex",
              background: VARIANT_BADGE_BG[variant],
              padding: "10px 24px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {badgeText}
          </div>
        </div>

        {/* Student + test */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: isStory ? 48 : 32 }}>
          <div style={{ display: "flex", fontSize: isStory ? 64 : 52, fontWeight: 700, lineHeight: 1.15 }}>
            {data.studentName}
          </div>
          <div style={{ display: "flex", fontSize: 30, opacity: 0.85, marginTop: 8 }}>
            {data.testTitle} · {data.subject}
          </div>
        </div>

        {/* Score — centerpiece */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: isStory ? 220 : 160, fontWeight: 700, lineHeight: 1 }}>
            {data.percentage}%
          </div>
          <div style={{ display: "flex", fontSize: 32, opacity: 0.85, marginTop: 12 }}>
            {data.score} / {data.maxScore} marks
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            width: "100%",
            background: "rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: "28px 32px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>{getOrdinal(data.batchRank)}</div>
            <div style={{ display: "flex", fontSize: 22, opacity: 0.75, marginTop: 4 }}>
              Batch Rank (of {data.batchSize})
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>{data.percentile}th</div>
            <div style={{ display: "flex", fontSize: 22, opacity: 0.75, marginTop: 4 }}>Percentile</div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: isStory ? 40 : 28,
            fontSize: 22,
            opacity: 0.6,
          }}
        >
          Powered by Facultify
        </div>
      </div>
    ),
    { width, height, fonts }
  );
}
