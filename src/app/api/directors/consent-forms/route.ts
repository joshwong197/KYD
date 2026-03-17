import { NextRequest, NextResponse } from "next/server";
import { findConsentFormForDirector } from "@/lib/scraper/directors-page";
import type { BatchConsentFormRequest, ConsentFormLink } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: BatchConsentFormRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { firstName, lastName, companies } = body;

  if (!lastName) {
    return NextResponse.json(
      { error: "lastName is required" },
      { status: 400 }
    );
  }

  // Only process active directorships
  const activeCompanies = companies.filter((c) => c.status === "active");

  if (activeCompanies.length === 0) {
    return NextResponse.json({ results: {} });
  }

  // Scrape all directors pages in parallel with per-company timeout
  const entries = await Promise.allSettled(
    activeCompanies.map(async (company) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const link = await findConsentFormForDirector(
          company.companyNumber,
          firstName,
          lastName
        );
        return { companyNumber: company.companyNumber, link };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  const results: Record<string, ConsentFormLink | null> = {};
  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      const { companyNumber, link } = entry.value;
      // Only include direct links (high confidence)
      results[companyNumber] = link?.type === "direct" ? link : null;
    }
    // Rejected promises → that company is omitted (null)
  }

  return NextResponse.json({ results });
}
