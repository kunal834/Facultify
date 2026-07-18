"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareResultCardProps {
  submissionId: string;
  studentName: string;
}

async function fetchCardBlob(submissionId: string): Promise<Blob> {
  const res = await fetch(`/api/cards/result/${submissionId}?size=story`);
  if (!res.ok) {
    throw new Error(`Could not generate the result card (${res.status})`);
  }
  return res.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ShareResultCard({ submissionId, studentName }: ShareResultCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const blob = await fetchCardBlob(submissionId);
      const filename = `${studentName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "result"}-facultify.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My test result",
          text: "Check out my test result on Facultify!",
        });
      } else {
        downloadBlob(blob, filename);
        toast.success("Result card downloaded — share it from your gallery.");
      }
    } catch (err) {
      // AbortError fires when the user just closes the native share sheet — not a real failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Could not share your result right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleShare} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4 mr-2" />
      )}
      {loading ? "Preparing…" : "Share Result"}
    </Button>
  );
}
