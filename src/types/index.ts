export interface Partner {
  id: string;
  name: string;
  slug?: string; // URL-friendly identifier (e.g., "carrefour")
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
  deletedAt?: string;
  servicesSummary?: string;
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

  // Champs pour synchronisation avec événements globaux
  globalEventId?: string;
  isSyncedFromGlobal?: boolean;
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

export interface MonthlyCheckIn {
  id: string;
  partnerId: string;
  checkInDate: string;
  notes?: string;
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
  monthlyCheckIns: MonthlyCheckIn[];
}

// Partenaire léger (pour événements sans fiche complète)
export interface LightweightPartner {
  id: string;
  name: string;
  email?: string;
  company?: string;
  isLightweight: true;
}

// Statut d'invitation pour un événement
export type InvitationStatus = 'proposed' | 'accepted' | 'declined' | 'pending';

// Invitation d'un partenaire à un événement global
export interface GlobalEventInvitation {
  partnerId: string; // ID du partenaire (réel ou léger)
  partnerName: string; // Nom du partenaire pour affichage rapide
  status: InvitationStatus;
  proposalDate: string;
  responseDate?: string;
  notes?: string;
  guests?: string[]; // Liste des personnes invitées
}

// Événement global
export interface GlobalEvent {
  id: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  invitations: GlobalEventInvitation[];
  deletedAt?: string;
}

// Structure de données globale
export interface GlobalData {
  globalEvents: GlobalEvent[];
  lightweightPartners: LightweightPartner[];
}
