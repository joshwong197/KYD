export const ENTITY_ROLES_BASE =
  "https://api.business.govt.nz/gateway/companies-office/companies-register/entity-roles/v3";

export const COMPANIES_OFFICE_BASE =
  "https://app.companiesoffice.govt.nz";

export const DIRECTORS_PAGE_URL = (companyNumber: string) =>
  `${COMPANIES_OFFICE_BASE}/companies/app/ui/pages/companies/${companyNumber}/directors`;

export const DOCUMENTS_PAGE_URL = (companyNumber: string) =>
  `${COMPANIES_OFFICE_BASE}/companies/app/ui/pages/companies/${companyNumber}/documents`;

export const DOCUMENT_DOWNLOAD_URL = (docId: string) =>
  `${COMPANIES_OFFICE_BASE}/companies/app/service/services/documents/${docId}`;

export const COMPANY_STATUS_MAP: Record<string, string> = {
  "50": "Registered",
  "60": "Removed",
  "70": "Struck Off",
  "80": "In Liquidation",
  "82": "In Receivership",
  "25": "Amalgamated",
};

export function getCompanyStatusLabel(code: string): string {
  return COMPANY_STATUS_MAP[code] || `Status ${code}`;
}
