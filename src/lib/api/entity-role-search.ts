import { ENTITY_ROLES_BASE } from "../constants";
import type { DirectorSearchResponse } from "../types";

export async function searchEntityRoles(
  name: string,
  roleType: "DIR" | "SHR" | "ALL" = "DIR",
  page = 0,
  pageSize = 50
): Promise<DirectorSearchResponse> {
  const url = new URL(`${ENTITY_ROLES_BASE}/search`);
  url.searchParams.set("name", name);
  url.searchParams.set("role-type", roleType);
  url.searchParams.set("registered-only", "false");
  url.searchParams.set("page", String(page));
  url.searchParams.set("page-size", String(pageSize));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key":
        process.env.COMPANIES_ENTITY_ROLE_SEARCH_API_KEY!,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Entity role search failed (${res.status}): ${text}`);
  }

  return res.json();
}
