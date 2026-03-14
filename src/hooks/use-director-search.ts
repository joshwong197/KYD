"use client";

import { useState, useCallback } from "react";
import type {
  DirectorRole,
  DirectorProfile,
  DirectorSearchResponse,
} from "@/lib/types";

export function useDirectorSearch() {
  const [results, setResults] = useState<DirectorProfile[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchedName, setSearchedName] = useState("");

  const search = useCallback(async (name: string, page = 0) => {
    if (name.length < 2) return;

    setLoading(true);
    setError(null);
    setSearchedName(name);
    setCurrentPage(page);

    try {
      const res = await fetch(
        `/api/directors/search?name=${encodeURIComponent(name)}&page=${page}&pageSize=50`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }

      const data: DirectorSearchResponse = await res.json();
      const grouped = groupByDirector(data.roles);

      setResults(grouped);
      setTotalResults(data.totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (searchedName) {
      search(searchedName, currentPage + 1);
    }
  }, [search, searchedName, currentPage]);

  return { results, totalResults, loading, error, search, loadMore, currentPage };
}

function groupByDirector(roles: DirectorRole[]): DirectorProfile[] {
  const map = new Map<string, DirectorProfile>();

  for (const role of roles) {
    const key = `${role.firstName?.trim().toUpperCase() || ""}_${role.lastName?.trim().toUpperCase() || ""}`;

    if (!map.has(key)) {
      map.set(key, {
        name: formatDirectorName(role.firstName, role.middleName, role.lastName),
        firstName: role.firstName || "",
        middleName: role.middleName,
        lastName: role.lastName || "",
        companies: [],
      });
    }

    const profile = map.get(key)!;

    if (role.middleName && !profile.middleName) {
      profile.middleName = role.middleName;
      profile.name = formatDirectorName(role.firstName, role.middleName, role.lastName);
    }

    // For Director roles, company info is at top level
    if (role.associatedCompanyNumber) {
      profile.companies.push({
        companyNumber: role.associatedCompanyNumber,
        companyNzbn: role.associatedCompanyNzbn,
        companyName: role.associatedCompanyName || "Unknown",
        companyStatus: role.associatedCompanyStatusCode || "",
        roleType: role.roleType,
        status: role.status,
        appointmentDate: role.appointmentDate,
        resignationDate: role.resignationDate,
        physicalAddress: role.physicalAddress,
      });
    }

    // For DirectorShareholder roles, company info is in shareholdings
    if (role.shareholdings?.length) {
      for (const sh of role.shareholdings) {
        profile.companies.push({
          companyNumber: sh.associatedCompanyNumber,
          companyNzbn: sh.associatedCompanyNzbn,
          companyName: sh.associatedCompanyName,
          companyStatus: sh.associatedCompanyStatusCode || "",
          roleType: role.roleType,
          status: role.status,
          appointmentDate: role.appointmentDate,
          resignationDate: role.resignationDate,
          physicalAddress: role.physicalAddress,
        });
      }
    }
  }

  const profiles = Array.from(map.values());

  // Deduplicate: keep one entry per company number (prefer active, most recent)
  for (const profile of profiles) {
    const seen = new Map<string, number>();
    const deduped: typeof profile.companies = [];
    for (const c of profile.companies) {
      const idx = seen.get(c.companyNumber);
      if (idx !== undefined) {
        const prev = deduped[idx];
        if (c.status === "active" && prev.status !== "active") {
          deduped[idx] = c;
        }
      } else {
        seen.set(c.companyNumber, deduped.length);
        deduped.push(c);
      }
    }
    profile.companies = deduped;
  }

  profiles.sort((a, b) => b.companies.length - a.companies.length);

  for (const profile of profiles) {
    profile.companies.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return (b.appointmentDate || "").localeCompare(a.appointmentDate || "");
    });
  }

  return profiles;
}

function formatDirectorName(
  first?: string,
  middle?: string,
  last?: string
): string {
  return [first, middle, last]
    .filter((p) => p && p.trim())
    .join(" ");
}
