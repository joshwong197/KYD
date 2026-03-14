"use client";

import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface SignatureEntry {
  companyName: string;
  imageDataUrl: string;
}

interface SignatureGalleryProps {
  signatures: SignatureEntry[];
  onClear: () => void;
}

export function SignatureGallery({
  signatures,
  onClear,
}: SignatureGalleryProps) {
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  if (signatures.length === 0) return null;

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4 pb-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Extracted Signatures
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Compare signatures across companies
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs text-red-500 hover:text-red-600"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
      <CardContent className="pt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {signatures.map((sig, idx) => (
            <div
              key={`sig-${idx}`}
              className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {sig.companyName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setZoomedIndex(zoomedIndex === idx ? null : idx)
                  }
                  className="h-6 w-6 p-0"
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
              <div
                className={`bg-white p-2 ${
                  zoomedIndex === idx ? "" : "max-h-48 overflow-hidden"
                }`}
              >
                <img
                  src={sig.imageDataUrl}
                  alt={`Signature from ${sig.companyName}`}
                  className="w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
