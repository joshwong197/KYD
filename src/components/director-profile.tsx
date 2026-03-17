"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  PenTool,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  DirectorProfile as DirectorProfileType,
  CompanyAssociation,
  SignatureExtractionResult,
} from "@/lib/types";
import { getCompanyStatusLabel } from "@/lib/constants";
import { AddressComparison } from "./address-comparison";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  return dateStr.replace(/[+-]\d{4}$/, "").trim();
}

interface DirectorProfileProps {
  profile: DirectorProfileType;
  signatureResults: Map<string, SignatureExtractionResult>;
  consentLoading: boolean;
  onViewPdf: (url: string, companyName: string) => void;
}

export function DirectorProfileCard({
  profile,
  signatureResults,
  consentLoading,
  onViewPdf,
}: DirectorProfileProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCompanies = profile.companies.filter(
    (c) => c.status === "active"
  );

  // Check if addresses differ across companies
  const uniqueAddresses = new Set(
    profile.companies
      .map((c) => c.physicalAddress?.addressLines?.join(", ") || "")
      .filter(Boolean)
  );
  const hasAddressDiscrepancy = uniqueAddresses.size > 1;

  // Collect extracted signatures for comparison
  const extractedSignatures = profile.companies
    .filter((c) => c.status === "active")
    .map((c) => signatureResults.get(c.companyNumber))
    .filter(
      (r): r is SignatureExtractionResult =>
        r !== undefined && r.imageDataUrl !== null
    );

  const loadingCount = profile.companies
    .filter((c) => c.status === "active")
    .map((c) => signatureResults.get(c.companyNumber))
    .filter((r) => r?.loading).length;

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {profile.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {profile.companies.length} compan
                {profile.companies.length === 1 ? "y" : "ies"}
              </span>
              {activeCompanies.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                >
                  {activeCompanies.length} active
                </Badge>
              )}
              {hasAddressDiscrepancy && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Address varies
                </Badge>
              )}
              {loadingCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Extracting signatures...
                </span>
              )}
              {extractedSignatures.length > 0 && loadingCount === 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  <PenTool className="w-3 h-3 mr-1" />
                  {extractedSignatures.length} signature
                  {extractedSignatures.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <Separator className="mb-4" />

          {/* Signature Comparison */}
          {extractedSignatures.length >= 2 && (
            <div className="mb-4 p-3 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Signature Comparison
                </span>
                <span className="text-xs text-blue-500 dark:text-blue-400">
                  {extractedSignatures.length} signatures from active companies
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extractedSignatures.map((sig) => (
                  <button
                    key={`sig-cmp-${sig.companyNumber}`}
                    onClick={() =>
                      sig.pdfUrl &&
                      onViewPdf(sig.pdfUrl, sig.companyName)
                    }
                    className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <div className="px-2 py-1 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                        {sig.companyName}
                      </span>
                    </div>
                    <div className="bg-white p-1 max-h-32 overflow-hidden">
                      <img
                        src={sig.imageDataUrl!}
                        alt={`Signature from ${sig.companyName}`}
                        className="w-full object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Address Comparison */}
          {profile.companies.length > 1 && (
            <AddressComparison companies={profile.companies} />
          )}

          {/* Company Details */}
          <div className="space-y-3 mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Companies
            </p>
            {profile.companies.map((company) => (
              <CompanyRow
                key={`${company.companyNumber}-${company.appointmentDate}`}
                company={company}
                signatureResult={signatureResults.get(company.companyNumber)}
                consentLoading={consentLoading}
                onViewPdf={onViewPdf}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CompanyRow({
  company,
  signatureResult,
  consentLoading,
  onViewPdf,
}: {
  company: CompanyAssociation;
  signatureResult?: SignatureExtractionResult;
  consentLoading: boolean;
  onViewPdf: (url: string, companyName: string) => void;
}) {
  const isActive = company.status === "active";
  const statusLabel = getCompanyStatusLabel(company.companyStatus);

  return (
    <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {company.companyName}
            </span>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`text-xs shrink-0 ${
                isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {isActive
                ? "Active"
                : company.resignationDate
                  ? "Resigned"
                  : statusLabel}
            </Badge>
          </div>

          <div className="mt-1.5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {company.physicalAddress?.addressLines && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  {company.physicalAddress.addressLines.join(", ")}
                  {company.physicalAddress.postCode &&
                    `, ${company.physicalAddress.postCode}`}
                  {company.physicalAddress.countryCode &&
                    company.physicalAddress.countryCode !== "NZ" &&
                    ` (${company.physicalAddress.countryCode})`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>
                Appointed: {formatDate(company.appointmentDate)}
                {company.resignationDate &&
                  ` | Resigned: ${formatDate(company.resignationDate)}`}
              </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Company #{company.companyNumber}
              {statusLabel !== "Registered" && ` (${statusLabel})`}
            </div>
          </div>
        </div>

        {/* Inline Signature */}
        {isActive && signatureResult && (
          <div className="shrink-0 w-36">
            {signatureResult.loading ? (
              <div className="flex items-center justify-center h-16 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            ) : signatureResult.imageDataUrl ? (
              <button
                onClick={() =>
                  signatureResult.pdfUrl &&
                  onViewPdf(signatureResult.pdfUrl, company.companyName)
                }
                className="block w-full rounded border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                title="Click to view full consent form"
              >
                <img
                  src={signatureResult.imageDataUrl}
                  alt={`Signature for ${company.companyName}`}
                  className="w-full h-16 object-contain bg-white"
                />
                <div className="flex items-center justify-center gap-1 py-0.5 bg-slate-100 dark:bg-slate-900/50 text-xs text-gray-500 dark:text-gray-400">
                  <Eye className="w-3 h-3" />
                  View form
                </div>
              </button>
            ) : signatureResult.error ? (
              <div className="flex items-center justify-center h-16 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs text-red-500 px-1 text-center">
                No form found
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Status for active companies being searched */}
      {isActive && consentLoading && !signatureResult && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Searching for consent form...
        </div>
      )}
    </div>
  );
}
