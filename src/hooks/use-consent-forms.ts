"use client";

import { useState, useCallback } from "react";
import type { ConsentFormLink } from "@/lib/types";

interface ConsentFormState {
  loading: boolean;
  error: string | null;
  forms: ConsentFormLink[];
}

export function useConsentForms() {
  const [formsByCompany, setFormsByCompany] = useState<
    Record<string, ConsentFormState>
  >({});

  const fetchConsentForms = useCallback(
    async (
      companyNumber: string,
      firstName: string,
      lastName: string,
      appointmentDate?: string
    ) => {
      setFormsByCompany((prev) => ({
        ...prev,
        [companyNumber]: { loading: true, error: null, forms: [] },
      }));

      try {
        const params = new URLSearchParams({
          firstName,
          lastName,
        });
        if (appointmentDate) {
          params.set("appointmentDate", appointmentDate);
        }

        const res = await fetch(
          `/api/companies/${companyNumber}/consent-forms?${params}`
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch consent forms");
        }

        const data = await res.json();

        setFormsByCompany((prev) => ({
          ...prev,
          [companyNumber]: {
            loading: false,
            error: null,
            forms: data.consentForms || [],
          },
        }));
      } catch (err) {
        setFormsByCompany((prev) => ({
          ...prev,
          [companyNumber]: {
            loading: false,
            error: err instanceof Error ? err.message : "Failed",
            forms: [],
          },
        }));
      }
    },
    []
  );

  return { formsByCompany, fetchConsentForms };
}
