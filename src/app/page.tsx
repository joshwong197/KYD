"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Shield } from "lucide-react";
import { Header } from "@/components/header";
import { DirectorSearch } from "@/components/director-search";
import { DirectorProfileCard } from "@/components/director-profile";
import { PdfViewer } from "@/components/pdf-viewer";
import { useDirectorSearch } from "@/hooks/use-director-search";
import { useConsentForms } from "@/hooks/use-consent-forms";
import { useSignatureExtractor } from "@/hooks/use-signature-extractor";

export default function Home() {
  const { results, totalResults, loading, error, search } =
    useDirectorSearch();
  const { consentState, fetchForDirector, resetConsent } = useConsentForms();
  const { results: signatureResults, extractBatch, clearResults } =
    useSignatureExtractor();
  const [pdfView, setPdfView] = useState<{
    url: string;
    companyName: string;
  } | null>(null);

  // Track which results we've already fetched consent forms for
  const fetchedRef = useRef<string>("");

  // Auto-fetch consent forms and extract signatures when results change
  useEffect(() => {
    if (results.length === 0) {
      clearResults();
      resetConsent();
      return;
    }

    // Build a key to prevent re-fetching for the same results
    const resultKey = results
      .map((p) => `${p.firstName}-${p.lastName}`)
      .join("|");
    if (fetchedRef.current === resultKey) return;
    fetchedRef.current = resultKey;

    // Clear previous extractions
    clearResults();

    const fetchAll = async () => {
      for (const profile of results) {
        const activeCompanies = profile.companies
          .filter((c) => c.status === "active")
          .map((c) => ({
            companyNumber: c.companyNumber,
            status: c.status,
          }));

        if (activeCompanies.length === 0) continue;

        const consentResults = await fetchForDirector(
          profile.firstName,
          profile.lastName,
          activeCompanies
        );

        // Build extraction jobs from the consent form results
        const jobs = Object.entries(consentResults)
          .filter(
            (entry): entry is [string, NonNullable<(typeof entry)[1]>] =>
              entry[1] !== null
          )
          .map(([companyNumber, link]) => ({
            companyNumber,
            companyName:
              profile.companies.find(
                (c) => c.companyNumber === companyNumber
              )?.companyName || "",
            pdfUrl: link.url,
          }));

        if (jobs.length > 0) {
          extractBatch(jobs);
        }
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const handleViewPdf = (url: string, companyName: string) => {
    setPdfView({ url, companyName });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Search Section */}
          <div className="mb-8">
            <DirectorSearch onSearch={search} loading={loading} />
            {totalResults > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {totalResults} role{totalResults !== 1 ? "s" : ""} found
                {results.length > 0 &&
                  ` | ${results.length} director${results.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((profile) => (
                <DirectorProfileCard
                  key={`${profile.firstName}-${profile.lastName}`}
                  profile={profile}
                  signatureResults={signatureResults}
                  consentLoading={consentState.loading}
                  onViewPdf={handleViewPdf}
                />
              ))}
            </div>
          ) : !loading && !error ? (
            <EmptyState />
          ) : null}
        </div>
      </main>

      {/* PDF Viewer Modal — optional detail view */}
      {pdfView && (
        <PdfViewer
          url={pdfView.url}
          companyName={pdfView.companyName}
          onClose={() => setPdfView(null)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-blue-500 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Know Your Director
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Search for a director by name to view their residential addresses and
        consent form signatures across all associated NZ companies.
      </p>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 dark:text-gray-500">
        <Search className="w-3 h-3" />
        <span>Enter at least 2 characters to search</span>
      </div>
    </div>
  );
}
