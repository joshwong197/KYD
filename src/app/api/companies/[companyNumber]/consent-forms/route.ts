import { NextRequest, NextResponse } from "next/server";
import { findConsentFormForDirector } from "@/lib/scraper/directors-page";
import { matchConsentFormByDate } from "@/lib/scraper/documents-page";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyNumber: string }> }
) {
  const { companyNumber } = await params;
  const { searchParams } = request.nextUrl;
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const appointmentDate = searchParams.get("appointmentDate") || "";

  if (!lastName) {
    return NextResponse.json(
      { error: "lastName is required" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Try to get direct consent form link from directors page
    const directLink = await findConsentFormForDirector(
      companyNumber,
      firstName,
      lastName
    );

    if (directLink) {
      return NextResponse.json({ consentForms: [directLink] });
    }

    // Step 2: Fall back to documents page date-based matching
    if (appointmentDate) {
      const matched = await matchConsentFormByDate(
        companyNumber,
        appointmentDate
      );

      if (matched.length > 0) {
        return NextResponse.json({ consentForms: matched });
      }
    }

    // Step 3: No consent forms found
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
