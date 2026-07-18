import { NextRequest } from "next/server";
import { getResultCardData, pickCardVariant, CardAccessError } from "@/lib/cards/card-data";
import { renderResultCardImage, type CardSize } from "@/lib/cards/render-result-card";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const size: CardSize = req.nextUrl.searchParams.get("size") === "square" ? "square" : "story";

  try {
    const data = await getResultCardData(submissionId);
    const variant = pickCardVariant(data);
    return renderResultCardImage(data, variant, size);
  } catch (err) {
    if (err instanceof CardAccessError) {
      return new Response(err.message, { status: 403 });
    }
    console.error("Result card render failed", err);
    return new Response("Failed to render card", { status: 500 });
  }
}
