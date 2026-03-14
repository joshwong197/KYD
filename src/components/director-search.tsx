"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DirectorSearchProps {
  onSearch: (name: string) => void;
  loading: boolean;
}

export function DirectorSearch({ onSearch, loading }: DirectorSearchProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.length >= 2) {
        debounceRef.current = setTimeout(() => {
          onSearch(value);
        }, 400);
      }
    },
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-0">
      <Input
        type="text"
        placeholder="Search director by name (e.g. John Smith)..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-r-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={query.length < 2 || loading}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 px-4 rounded-r-md disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
