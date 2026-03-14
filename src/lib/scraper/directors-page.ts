import * as cheerio from "cheerio";
import { DIRECTORS_PAGE_URL } from "../constants";
import type { ConsentFormLink } from "../types";

interface ScrapedDirector {
  name: string;
  address: string;
  appointmentDate: string;
  consentLink: ConsentFormLink | null;
  isCurrent: boolean;
}

export async function scrapeDirectorsPage(
  companyNumber: string
): Promise<ScrapedDirector[]> {
  const url = DIRECTORS_PAGE_URL(companyNumber);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch directors page: ${res.status}`);
  }

  const html = await res.text();
  return parseDirectorsPage(html);
}

function parseDirectorsPage(html: string): ScrapedDirector[] {
  const $ = cheerio.load(html);
  const directors: ScrapedDirector[] = [];

  // The page structure: directors are in flat HTML separated by <hr> elements
  // Each block contains: "Full legal name: ...", "Residential Address: ...",
  // "Appointment Date: ...", and a consent link (<a> tag)
  //
  // Strategy: get full page text, split by "Full legal name:", then for each
  // block find the nearest <a> link in the HTML that corresponds to it.

  // First, collect all consent-related links with their position in the HTML
  const consentLinks: {
    docId: string | null;
    type: "direct" | "documents-page";
    htmlIndex: number;
  }[] = [];

  const htmlStr = $.html() || "";

  // Find all "View Consent Form" / "Link to Consent Form" links
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().toLowerCase();

    if (!text.includes("consent")) return;

    const htmlPos = htmlStr.indexOf(href.substring(0, 30));

    if (href.includes("/service/services/documents/")) {
      // Direct document link (current directors)
      const match = href.match(/documents\/([A-F0-9]+)/i);
      consentLinks.push({
        docId: match ? match[1] : null,
        type: "direct",
        htmlIndex: htmlPos,
      });
    } else if (href.includes("javascript:") && href.includes("documents")) {
      // JS redirect to documents page (former directors)
      consentLinks.push({
        docId: null,
        type: "documents-page",
        htmlIndex: htmlPos,
      });
    }
  });

  // Now parse director text blocks
  const bodyText = $("body").text();
  const blocks = bodyText.split(/Full\s+legal\s+name:\s*/i);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);

    // Name is the first non-empty content
    const name = lines[0] || "";
    if (!name) continue;

    // Extract fields from the text block
    const addrMatch = block.match(
      /Residential\s+Address:\s*([\s\S]*?)(?=Appointment\s+Date:|$)/i
    );
    const address = addrMatch
      ? addrMatch[1].replace(/\s+/g, " ").trim().replace(/,\s*$/, "")
      : "";

    const dateMatch = block.match(/Appointment\s+Date:\s*([^\n]+)/i);
    const appointmentDate = dateMatch ? dateMatch[1].trim() : "";

    // Match consent link: the i-th director block corresponds to the i-th consent link
    // (consent links appear in the same order as directors on the page)
    const linkIndex = i - 1;
    let consentLink: ConsentFormLink | null = null;

    if (linkIndex < consentLinks.length) {
      const link = consentLinks[linkIndex];
      if (link.type === "direct" && link.docId) {
        consentLink = {
          type: "direct",
          documentId: link.docId,
          url: `/api/documents/${link.docId}`,
          matchConfidence: "high",
        };
      }
      // For "documents-page" type, consentLink stays null → will fall through to documents page matching
    }

    directors.push({
      name,
      address,
      appointmentDate,
      consentLink,
      isCurrent: consentLink?.type === "direct",
    });
  }

  return directors;
}

export async function findConsentFormForDirector(
  companyNumber: string,
  directorFirstName: string,
  directorLastName: string
): Promise<ConsentFormLink | null> {
  const directors = await scrapeDirectorsPage(companyNumber);

  if (directors.length === 0) return null;

  const lastNameUpper = directorLastName.toUpperCase();
  const firstNameUpper = directorFirstName.toUpperCase();

  // Try exact first+last match
  for (const dir of directors) {
    const dirUpper = dir.name.toUpperCase();
    if (dirUpper.includes(firstNameUpper) && dirUpper.includes(lastNameUpper)) {
      if (dir.consentLink) return dir.consentLink;
    }
  }

  // Try last name only match
  for (const dir of directors) {
    if (dir.name.toUpperCase().includes(lastNameUpper)) {
      if (dir.consentLink) return dir.consentLink;
    }
  }

  return null;
}
