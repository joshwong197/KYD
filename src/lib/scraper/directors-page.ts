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
  // IMPORTANT: The name is split across TWO lines:
  //   Full legal name: Christopher  Linwood
  //   PARKER
  // So we need to combine the first two non-empty lines as the full name.

  // First, collect all consent-related links in order
  const consentLinks: {
    docId: string | null;
    type: "direct" | "documents-page";
    url: string;
  }[] = [];

  // Find all "View Consent Form" / "Link to Consent Form" links
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().toLowerCase();

    if (!text.includes("consent")) return;

    if (href.includes("/service/services/documents/")) {
      // Direct document link (current directors) — "View Consent Form"
      const match = href.match(/documents\/([A-F0-9]+)/i);
      consentLinks.push({
        docId: match ? match[1] : null,
        type: "direct",
        url: href,
      });
    } else if (href.includes("javascript:") && href.includes("documents")) {
      // JS redirect to documents page (former directors) — "Link to Consent Form"
      consentLinks.push({
        docId: null,
        type: "documents-page",
        url: href,
      });
    }
  });

  // Now parse director text blocks
  const bodyText = $("body").text();
  const blocks = bodyText.split(/Full\s+legal\s+name:\s*/i);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Name is spread across first two lines: "FirstName MiddleName" + "SURNAME"
    // Combine them, stopping before "Residential Address:" or other field labels
    let nameParts: string[] = [];
    for (const line of lines) {
      if (
        /^(Residential\s+Address|Appointment\s+Date|Shareholder|Ceased\s+date|View\s+Consent|Link\s+to)/i.test(
          line
        )
      ) {
        break;
      }
      nameParts.push(line);
      // Surname is typically ALL CAPS on its own line — if we found it, stop
      if (nameParts.length >= 2) break;
    }

    const name = nameParts.join(" ").replace(/\s+/g, " ").trim();
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

  // Try exact first+last match — only return direct links (high confidence)
  for (const dir of directors) {
    const dirUpper = dir.name.toUpperCase();
    if (dirUpper.includes(firstNameUpper) && dirUpper.includes(lastNameUpper)) {
      if (dir.consentLink?.type === "direct") return dir.consentLink;
    }
  }

  // Try last name only match — only return direct links (high confidence)
  for (const dir of directors) {
    if (dir.name.toUpperCase().includes(lastNameUpper)) {
      if (dir.consentLink?.type === "direct") return dir.consentLink;
    }
  }

  return null;
}
