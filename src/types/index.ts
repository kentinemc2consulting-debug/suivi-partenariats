export interface Partner {
  id: string;
  name: string;
  logo?: string;
  duration: string;
  startDate: string;
  endDate: string;
  commission?: number; // percentage - deprecated, kept for backwards compatibility
  commissionClient?: number; // percentage
  commissionConsulting?: number; // percentage
  isActive: boolean;
  type?: 'ambassadeur' | 'strategique';
  companyHubspotUrl?: string;
  contactPerson?: {
    name: string;
    email: string;
    hubspotUrl?: string;
  };
}

export interface QualifiedIntroduction {
  id: string;
  partnerId: string;
  date: string;
  contactName: string;
  company: string;
  contractSigned?: boolean; // deprecated
  status: 'pending' | 'negotiating' | 'signed' | 'not_interested';
  deletedAt?: string;
}

export interface Event {
  id: string;
  partnerId: string;
  proposalDate: string;
  eventDate?: string;
  eventName: string;
  eventLocation?: string;

  attended?: boolean; // deprecated
  status: 'pending' | 'accepted' | 'declined';
  deletedAt?: string;
}

export interface Publication {
  id: string;
  partnerId: string;
  publicationDate: string;
  platform: string; // LinkedIn, etc.
  link: string;
  lastUpdated?: string; // For manual LinkedIn date updates
  statsReportDate?: string;
  deletedAt?: string;
}

export interface Statistics {
  id: string;
  partnerId: string;
  reportDate: string;
  link: string;
  submittedDate?: string;
}

export interface QuarterlyReport {
  id: string;
  partnerId: string;
  reportDate: string;
  link: string;
  deletedAt?: string;
}

export interface GitHubStats {
  followers: number;
  publicRepos: number;
  contributions: number;
  lastUpdated: string;
  history: GitHubStatsHistory[];
}

export interface GitHubStatsHistory {
  date: string;
  followers: number;
  publicRepos: number;
  contributions: number;
}

export interface PartnershipData {
  partner: Partner;
  introductions: QualifiedIntroduction[];
  events: Event[];
  publications: Publication[];
  statistics: Statistics[];
  quarterlyReports: QuarterlyReport[];
}
