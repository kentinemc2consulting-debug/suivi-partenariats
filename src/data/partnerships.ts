export interface Partnership {
    slug: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    commissionRate?: string;
    isActive: boolean;
    contact?: {
        name: string;
        email?: string;
        phone?: string;
    };
    notes?: string;
}

// Import the JSON data
import partnersDataRaw from './partners.json';
import type { PartnershipData } from '@/types';

// Type assertion to handle empty array case
const partnersData = partnersDataRaw as PartnershipData[];

// Transform the JSON data to the simplified Partnership format
// Handle empty array case
export const partnerships: Partnership[] = Array.isArray(partnersData) && partnersData.length > 0
    ? partnersData.map((item) => ({
        slug: item.partner.id,
        name: item.partner.name,
        description: `Partenariat actif depuis ${new Date(item.partner.startDate).toLocaleDateString('fr-FR')}`,
        startDate: item.partner.startDate,
        endDate: item.partner.endDate,
        commissionRate: item.partner.commission ? `${item.partner.commission}%` : undefined,
        isActive: item.partner.isActive,
        notes: `${item.introductions.length} introduction(s), ${item.publications.length} publication(s), ${item.events.length} événement(s)`
    }))
    : [];

// Helper function to get a single partnership by slug
export function getPartnershipBySlug(slug: string): Partnership | undefined {
    return partnerships.find(p => p.slug === slug);
}

// Helper function to get detailed data for a partnership
export function getPartnershipDetails(slug: string) {
    if (!Array.isArray(partnersData) || partnersData.length === 0) {
        return null;
    }

    const partnerData = partnersData.find(item => item.partner.id === slug);
    if (!partnerData) return null;

    return {
        partner: {
            slug: partnerData.partner.id,
            name: partnerData.partner.name,
            startDate: partnerData.partner.startDate,
            endDate: partnerData.partner.endDate,
            commission: partnerData.partner.commission,
            isActive: partnerData.partner.isActive,
            duration: partnerData.partner.duration
        },
        introductions: partnerData.introductions,
        events: partnerData.events,
        publications: partnerData.publications,
        statistics: partnerData.statistics,
        quarterlyReports: partnerData.quarterlyReports
    };
}
