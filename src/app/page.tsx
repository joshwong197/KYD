"use client";

import { useState } from "react";
import { Search, Shield } from "lucide-react";
import { Header } from "@/components/header";
import { DirectorSearch } from "@/components/director-search";
import { DirectorProfileCard } from "@/components/director-profile";
import { PdfViewer } from "@/components/pdf-viewer";
import { SignatureGallery } from "@/components/signature-gallery";
import { useDirectorSearch } from "@/hooks/use-director-search";
import { useConsentForms } from "@/hooks/use-consent-forms";

interface SignatureEntry {
  companyName: string;
  imageDataUrl: string;
}

export default function Home() {
  const { results, totalResults, loading, error, search } =
    useDirectorSearch();
  const { formsByCompany, fetchConsentForms } = useConsentForms();
  const [pdfView, setPdfView] = useState<{
    url: string;
    companyName: string;
  } | null>(null);
  const [signatures, setSignatures] = useState<SignatureEntry[]>([]);

  const handleViewPdf = (url: string, companyName: string) => {
    setPdfView({ url, companyName });
  };

  const handleSignatureExtracted = (
    dataUrl: string,
    companyName: string
  ) => {
    setSignatures((prev) => [...prev, { companyName, imageDataUrl: dataUrl }]);
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

          {/* Signature Gallery */}
          {signatures.length > 0 && (
            <div className="mb-6">
              <SignatureGallery
                signatures={signatures}
                onClear={() => setSignatures([])}
              />
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((profile) => (
                <DirectorProfileCard
                  key={`${profile.firstName}-${profile.lastName}`}
                  profile={profile}
                  formsByCompany={formsByCompany}
                  onFetchConsentForms={fetchConsentForms}
                  onViewPdf={handleViewPdf}
                />
              ))}
            </div>
          ) : !loading && !error ? (
            <EmptyState />
          ) : null}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {pdfView && (
        <PdfViewer
          url={pdfView.url}
          companyName={pdfView.companyName}
          onClose={() => setPdfView(null)}
          onSignatureExtracted={handleSignatureExtracted}
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
