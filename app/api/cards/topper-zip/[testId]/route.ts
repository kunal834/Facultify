import { NextRequest } from "next/server";
import JSZip from "jszip";
import { getTopperCardData, pickCardVariant, CardAccessError } from "@/lib/cards/card-data";
import { renderResultCardImage } from "@/lib/cards/render-result-card";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const count = req.nextUrl.searchParams.get("count") === "10" ? 10 : 3;

  try {
    const cards = await getTopperCardData(testId, count);
    if (cards.length === 0) {
      return new Response("No graded submissions for this test yet", { status: 404 });
    }

    const zip = new JSZip();
    for (const [i, data] of cards.entries()) {
      const variant = pickCardVariant(data);
      const image = await renderResultCardImage(data, variant, "square");
      const buffer = Buffer.from(await image.arrayBuffer());
      const safeName = data.studentName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "student";
      zip.file(`${i + 1}-${safeName}.png`, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });
    return new Response(zipBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="topper-cards-${testId}.zip"`,
      },
    });
  } catch (err) {
    if (err instanceof CardAccessError) {
      return new Response(err.message, { status: 403 });
    }
    console.error("Topper zip generation failed", err);
    return new Response("Failed to generate topper cards", { status: 500 });
  }
}
