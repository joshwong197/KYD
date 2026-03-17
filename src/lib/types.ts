// From Entity Role Search API
export interface PhysicalAddress {
  addressLines: string[];
  postCode?: string;
  countryCode?: string;
  pafId?: string;
}

export interface Shareholding {
  associatedCompanyName: string;
  associatedCompanyNumber: string;
  associatedCompanyNzbn?: string;
  associatedCompanyStatusCode?: string;
  jointlyHeld?: boolean;
  numberOfShares?: number;
}

export interface DirectorRole {
  firstName: string;
  middleName?: string;
  lastName: string;
  roleType: string;
  physicalAddress: PhysicalAddress;
  status: string;
  appointmentDate?: string;
  resignationDate?: string;
  // Present for Director roles
  associatedCompanyNumber?: string;
  associatedCompanyNzbn?: string;
  associatedCompanyName?: string;
  associatedCompanyStatusCode?: string;
  // Present for DirectorShareholder roles (company info is here instead)
  shareholdings?: Shareholding[];
}

export interface DirectorSearchResponse {
  totalResults: number;
  currentPage: number;
  pageSize: number;
  roles: DirectorRole[];
}

// Grouped view for display
export interface DirectorProfile {
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  companies: CompanyAssociation[];
}

export interface CompanyAssociation {
  companyNumber: string;
  companyNzbn?: string;
  companyName: string;
  companyStatus: string;
  roleType: string;
  status: string;
  appointmentDate?: string;
  resignationDate?: string;
  physicalAddress: PhysicalAddress;
  consentForms?: ConsentFormLink[];
}

// From scraping
export interface ConsentFormLink {
  type: "direct" | "matched";
  documentId: string;
  url: string;
  filingDate?: string;
  matchConfidence: "high" | "medium" | "low";
}

// For PDF signature
export interface ExtractedSignature {
  companyName: string;
  companyNumber: string;
  imageDataUrl: string;
  pdfPageNumber: number;
}

// Batch consent form API
export interface BatchConsentFormRequest {
  firstName: string;
  lastName: string;
  companies: Array<{
    companyNumber: string;
    status: string;
  }>;
}

export interface BatchConsentFormResponse {
  results: Record<string, ConsentFormLink | null>;
}

// Client-side signature extraction
export interface SignatureExtractionResult {
  companyNumber: string;
  companyName: string;
  pdfUrl: string | null;
  imageDataUrl: string | null;
  loading: boolean;
  error: string | null;
}
