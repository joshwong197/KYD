import { NextRequest, NextResponse } from "next/server";
import { findConsentFormForDirector } from "@/lib/scraper/directors-page";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyNumber: string }> }
) {
  const { companyNumber } = await params;
  const { searchParams } = request.nextUrl;
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";

  if (!lastName) {
    return NextResponse.json(
      { error: "lastName is required" },
      { status: 400 }
    );
  }

  try {
    // Only use direct consent form links (high confidence)
    const directLink = await findConsentFormForDirector(
      companyNumber,
      firstName,
      lastName
    );

    if (directLink) {
      return NextResponse.json({ consentForms: [directLink] });
    }

    return NextResponse.json({
      consentForms: [],
      message: "No consent forms found for this director",
    });
  } catch (err) {
    console.error("Consent form search error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to find consent forms",
      },
      { status: 500 }
    );
  }
}
