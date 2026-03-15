"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Focus,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  companyName: string;
  onClose: () => void;
  onSignatureExtracted?: (dataUrl: string, companyName: string) => void;
}

export function PdfViewer({
  url,
  companyName,
  onClose,
  onSignatureExtracted,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [autoZoomed, setAutoZoomed] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfDocRef = useRef<any>(null);
  const baseScaleRef = useRef(1.0);

  const renderPage = useCallback(
    async (pageNum: number, renderScale: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        setCurrentPage(pageNum);
      } catch (err) {
        console.error("Page render error:", err);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);

        // Calculate fit-to-width scale
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = containerRef.current?.clientWidth || 800;
        const fitScale = (containerWidth - 32) / viewport.width; // 32px padding
        baseScaleRef.current = fitScale;
        setScale(fitScale);

        await renderPage(1, fitScale);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderPage(currentPage, scale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  const handleAutoZoom = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    if (autoZoomed) {
      // Reset to full page view
      container.scrollTop = 0;
      setAutoZoomed(false);
    } else {
      // Scroll to bottom third where signature typically is
      const signatureY = canvas.height * 0.6;
      container.scrollTop = signatureY;
      setAutoZoomed(true);
    }
  };

  const extractSignature = () => {
    if (!canvasRef.current || !onSignatureExtracted) return;

    const canvas = canvasRef.current;
    // Extract bottom third of the page (where signatures typically appear)
    const sigCanvas = document.createElement("canvas");
    const startY = Math.floor(canvas.height * 0.6);
    const height = canvas.height - startY;

    sigCanvas.width = canvas.width;
    sigCanvas.height = height;

    const ctx = sigCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      canvas,
      0,
      startY,
      canvas.width,
      height,
      0,
      0,
      canvas.width,
      height
    );

    const dataUrl = sigCanvas.toDataURL("image/png");
    onSignatureExtracted(dataUrl, companyName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Consent Form
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {companyName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.max(baseScaleRef.current * 0.5, s - baseScaleRef.current * 0.25))}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-center">
              {Math.round((scale / baseScaleRef.current) * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.min(baseScaleRef.current * 3, s + baseScaleRef.current * 0.25))}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoZoom}
              className="h-7 px-2 text-xs"
              title={
                autoZoomed
                  ? "Show full page"
                  : "Auto-zoom to signature area"
              }
            >
              {autoZoomed ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Focus className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">
                {autoZoomed ? "Full Page" : "Signature"}
              </span>
            </Button>
            {onSignatureExtracted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={extractSignature}
                className="h-7 px-2 text-xs"
                title="Extract signature region"
              >
                <Download className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Extract</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-950">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Loading PDF...
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-64 text-red-500 text-sm">
              {error}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`mx-auto shadow-lg ${loading ? "hidden" : ""}`}
          />
        </div>

        {/* Footer */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 p-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => renderPage(currentPage - 1, scale)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => renderPage(currentPage + 1, scale)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
