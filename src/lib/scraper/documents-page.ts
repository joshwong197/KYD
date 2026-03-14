import * as cheerio from "cheerio";
import { DOCUMENTS_PAGE_URL } from "../constants";
import type { ConsentFormLink } from "../types";

interface DocumentEntry {
  date: string;
  type: string;
  documentId: string | null;
  sizeKb: string | null;
}

export async function scrapeDocumentsPage(
  companyNumber: string
): Promise<DocumentEntry[]> {
  const url = DOCUMENTS_PAGE_URL(companyNumber);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch documents page: ${res.status}`);
  }

  const html = await res.text();
  return parseDocumentsPage(html);
}

function parseDocumentsPage(html: string): DocumentEntry[] {
  const $ = cheerio.load(html);
  const docs: DocumentEntry[] = [];

  // The documents page uses table.dataList with Date, Document Type, Size columns
  // Document links appear in two patterns:
  // 1. javascript:showDocumentDetails(numericId) - newer documents (parent row)
  // 2. Direct URLs: /companies/app/service/services/documents/{HEX_ID} - download links (sub-rows)
  // Some rows have a sub-row beneath them with the actual PDF download link

  $("table.dataList tr, table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const dateText = $(cells[0]).text().trim();
    const typeCell = $(cells[1]);
    const typeText = typeCell.text().trim();
    const sizeText = cells.length >= 3 ? $(cells[2]).text().trim() : null;

    // Skip header rows and empty rows
    if (!dateText || !typeText) return;
    // Skip sub-rows that just have a download link (no date)
    if (!dateText.match(/\d{2}\s+\w+\s+\d{4}/)) return;

    // Extract document ID from links in this row AND the next row (sub-row)
    let documentId: string | null = null;

    // Check all links in this row and nearby rows
    const nextRow = $(row).next("tr");
    const allLinks = [
      ...typeCell.find("a").toArray(),
      ...nextRow.find("a").toArray(),
    ];

    for (const link of allLinks) {
      const href = $(link).attr("href") || "";

      // Direct document link pattern: /documents/{HEX_ID}
      const hexMatch = href.match(/documents\/([A-F0-9]{20,})/i);
      if (hexMatch) {
        documentId = hexMatch[1];
        break;
      }

      // showDocumentDetails pattern - we can't use this directly but note it
      const detailMatch = href.match(/showDocumentDetails\((\d+)\)/);
      if (detailMatch) {
        // Store numeric ID as fallback - we'll look for a sub-row with the actual hex ID
        // Check the next row for the downloadable PDF link
        const subLinks = nextRow.find("a");
        subLinks.each((_, subEl) => {
          const subHref = $(subEl).attr("href") || "";
          const subHexMatch = subHref.match(/documents\/([A-F0-9]{20,})/i);
          if (subHexMatch) {
            documentId = subHexMatch[1];
          }
        });
      }
    }

    docs.push({
      date: dateText,
      type: typeText.split("\n")[0].trim(), // Take first line only (ignore sub-links text)
      documentId,
      sizeKb: sizeText,
    });
  });

  return docs;
}

function isConsentForm(typeText: string): boolean {
  const lower = typeText.toLowerCase();
  return (
    lower.includes("director consent") ||
    lower.includes("consent of director") ||
    lower.includes("consent form")
  );
}

export async function matchConsentFormByDate(
  companyNumber: string,
  appointmentDate: string
): Promise<ConsentFormLink[]> {
  const docs = await scrapeDocumentsPage(companyNumber);

  // Filter for consent form entries that have downloadable document IDs
  const consentForms = docs.filter(
    (d) => isConsentForm(d.type) && d.documentId
  );

  if (consentForms.length === 0) return [];

  // If there's only one consent form, it's very likely the right one
  if (consentForms.length === 1 && consentForms[0].documentId) {
    return [
      {
        type: "matched",
        documentId: consentForms[0].documentId,
        url: `/api/documents/${consentForms[0].documentId}`,
        filingDate: consentForms[0].date,
        matchConfidence: "high",
      },
    ];
  }

  // Multiple consent forms - try to match by appointment date
  const results: ConsentFormLink[] = [];
  const targetDate = parseFlexibleDate(appointmentDate);

  for (const form of consentForms) {
    if (!form.documentId) continue;

    const formDate = parseFlexibleDate(form.date);
    const daysDiff =
      formDate && targetDate
        ? Math.abs(formDate.getTime() - targetDate.getTime()) /
          (1000 * 60 * 60 * 24)
        : Infinity;

    // Check if related documents were filed at the same time
    const sameTimeFiling = docs.some(
      (d) =>
        d.date === form.date &&
        (d.type.toLowerCase().includes("particulars of director") ||
          d.type.toLowerCase().includes("new company incorporation") ||
          d.type.toLowerCase().includes("new company"))
    );

    let confidence: "high" | "medium" | "low" = "low";
    if (daysDiff <= 2 && sameTimeFiling) {
      confidence = "high";
    } else if (daysDiff <= 2) {
      confidence = "medium";
    } else if (sameTimeFiling) {
      confidence = "medium";
    }

    results.push({
      type: "matched",
      documentId: form.documentId,
      url: `/api/documents/${form.documentId}`,
      filingDate: form.date,
      matchConfidence: confidence,
    });
  }

  results.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.matchConfidence] - confOrder[b.matchConfidence];
  });

  return results;
}

function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Strip timezone offset like "+1200"
  const cleaned = dateStr.replace(/[+-]\d{4}$/, "").trim();

  // Try native Date parsing ("21 Feb 2020 07:45" or "2007-06-11")
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try ISO date pattern
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(
      parseInt(isoMatch[1]),
      parseInt(isoMatch[2]) - 1,
      parseInt(isoMatch[3])
    );
  }

  return null;
}
