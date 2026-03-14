"use client";

import { MapPin, Check, AlertTriangle } from "lucide-react";
import type { CompanyAssociation } from "@/lib/types";

interface AddressComparisonProps {
  companies: CompanyAssociation[];
}

interface UniqueAddress {
  address: string;
  fullAddress: string;
  companies: string[];
  isActive: boolean;
}

export function AddressComparison({ companies }: AddressComparisonProps) {
  const entries = companies.filter(
    (c) => c.physicalAddress?.addressLines?.length
  );

  if (entries.length < 2) return null;

  // Group by unique address
  const addrMap = new Map<string, UniqueAddress>();
  for (const c of entries) {
    const addr = c.physicalAddress.addressLines.join(", ");
    const full =
      addr + (c.physicalAddress.postCode ? `, ${c.physicalAddress.postCode}` : "");
    const key = addr.toLowerCase().replace(/\s+/g, " ");

    if (addrMap.has(key)) {
      const existing = addrMap.get(key)!;
      existing.companies.push(c.companyName);
      if (c.status === "active") existing.isActive = true;
    } else {
      addrMap.set(key, {
        address: addr,
        fullAddress: full,
        companies: [c.companyName],
        isActive: c.status === "active",
      });
    }
  }

  const unique = Array.from(addrMap.values());
  const allMatch = unique.length === 1;

  return (
    <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Address Comparison
        </span>
        {allMatch ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="w-3 h-3" />
            All match
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            {unique.length} different addresses
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {unique.map((entry, idx) => (
          <div
            key={`addr-${idx}`}
            className={`text-xs p-2 rounded ${
              !allMatch ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
            }`}
          >
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              {entry.fullAddress}
            </div>
            <div className="text-gray-400 dark:text-gray-500 mt-0.5">
              Used by {entry.companies.length} compan
              {entry.companies.length === 1 ? "y" : "ies"}
              {entry.companies.length <= 3 && (
                <span>: {entry.companies.join(", ")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
