"use client";

import { FileText, Eye, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConsentFormLink } from "@/lib/types";

interface ConsentFormListProps {
  forms: ConsentFormLink[];
  companyName: string;
  onViewPdf: (url: string, companyName: string) => void;
}

export function ConsentFormList({
  forms,
  companyName,
  onViewPdf,
}: ConsentFormListProps) {
  return (
    <div className="space-y-1.5">
      {forms.map((form, idx) => (
        <div
          key={`${form.documentId}-${idx}`}
          className="flex items-center gap-2"
        >
          <FileText className="w-3 h-3 text-gray-400 shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewPdf(form.url, companyName)}
            className="text-xs h-6 px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Eye className="w-3 h-3 mr-1" />
            View Consent Form
          </Button>
          <ConfidenceBadge confidence={form.matchConfidence} type={form.type} />
          {form.filingDate && (
            <span className="text-xs text-gray-400">
              Filed: {form.filingDate}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBadge({
  confidence,
  type,
}: {
  confidence: string;
  type: string;
}) {
  if (type === "direct") {
    return (
      <Badge
        variant="secondary"
        className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      >
        <CheckCircle className="w-3 h-3 mr-0.5" />
        Direct link
      </Badge>
    );
  }

  const colors: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Badge
      variant="secondary"
      className={`text-xs ${colors[confidence] || colors.low}`}
    >
      {confidence === "low" && <AlertCircle className="w-3 h-3 mr-0.5" />}
      {confidence} match
    </Badge>
  );
}
