import { NextRequest, NextResponse } from "next/server";
import { DOCUMENT_DOWNLOAD_URL } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // Validate the doc ID is a hex string (prevent path traversal)
  if (!/^[A-Fa-f0-9]+$/.test(docId)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const url = DOCUMENT_DOWNLOAD_URL(docId);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Document fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType =
      res.headers.get("content-type") || "application/pdf";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Document proxy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
