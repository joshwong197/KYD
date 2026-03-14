"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  DirectorProfile as DirectorProfileType,
  CompanyAssociation,
  ConsentFormLink,
} from "@/lib/types";
import { getCompanyStatusLabel } from "@/lib/constants";
import { AddressComparison } from "./address-comparison";
import { ConsentFormList } from "./consent-form-list";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  // Strip timezone offset like "+1200" or "+1300"
  return dateStr.replace(/[+-]\d{4}$/, "").trim();
}

interface DirectorProfileProps {
  profile: DirectorProfileType;
  formsByCompany: Record<
    string,
    { loading: boolean; error: string | null; forms: ConsentFormLink[] }
  >;
  onFetchConsentForms: (
    companyNumber: string,
    firstName: string,
    lastName: string,
    appointmentDate?: string
  ) => void;
  onViewPdf: (url: string, companyName: string) => void;
}

export function DirectorProfileCard({
  profile,
  formsByCompany,
  onFetchConsentForms,
  onViewPdf,
}: DirectorProfileProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCompanies = profile.companies.filter(
    (c) => c.status === "active"
  );
  const inactiveCompanies = profile.companies.filter(
    (c) => c.status !== "active"
  );

  // Check if addresses differ across companies
  const uniqueAddresses = new Set(
    profile.companies
      .map((c) => c.physicalAddress?.addressLines?.join(", ") || "")
      .filter(Boolean)
  );
  const hasAddressDiscrepancy = uniqueAddresses.size > 1;

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
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <Separator className="mb-4" />

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
                profile={profile}
                formState={formsByCompany[company.companyNumber]}
                onFetchConsentForms={onFetchConsentForms}
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
  profile,
  formState,
  onFetchConsentForms,
  onViewPdf,
}: {
  company: CompanyAssociation;
  profile: DirectorProfileType;
  formState?: {
    loading: boolean;
    error: string | null;
    forms: ConsentFormLink[];
  };
  onFetchConsentForms: (
    companyNumber: string,
    firstName: string,
    lastName: string,
    appointmentDate?: string
  ) => void;
  onViewPdf: (url: string, companyName: string) => void;
}) {
  const isActive = company.status === "active";
  const statusLabel = getCompanyStatusLabel(company.companyStatus);

  return (
    <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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
              {isActive ? "Active" : company.resignationDate ? "Resigned" : statusLabel}
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
      </div>

      {/* Consent Forms */}
      <div className="mt-2">
        {!formState ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFetchConsentForms(
                company.companyNumber,
                profile.firstName,
                profile.lastName,
                company.appointmentDate
              )
            }
            className="text-xs h-7"
          >
            <FileText className="w-3 h-3 mr-1" />
            Get Consent Forms
          </Button>
        ) : formState.loading ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching for consent forms...
          </div>
        ) : formState.error ? (
          <div className="text-xs text-red-500">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            {formState.error}
          </div>
        ) : formState.forms.length === 0 ? (
          <p className="text-xs text-gray-400">No consent forms found</p>
        ) : (
          <ConsentFormList
            forms={formState.forms}
            companyName={company.companyName}
            onViewPdf={onViewPdf}
          />
        )}
      </div>
    </div>
  );
}
