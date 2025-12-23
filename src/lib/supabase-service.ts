import { supabase } from './supabase'
import type { PartnershipData, Partner, QualifiedIntroduction, Event, Publication, QuarterlyReport } from '@/types'

/**
 * Fetch all partners with their related data
 */
export async function getAllPartnerships(): Promise<PartnershipData[]> {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    const client = supabase // Non-null assertion after check

    const { data: partners, error: partnersError } = await client
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

    if (partnersError) {
        console.error('Error fetching partners:', partnersError)
        throw new Error('Failed to fetch partners')
    }

    // Fetch related data for each partner
    const partnershipsData: PartnershipData[] = await Promise.all(
        partners.map(async (partner) => {
            const [introductions, events, publications, statistics, quarterlyReports] = await Promise.all([
                client.from('introductions').select('*').eq('partner_id', partner.id),
                client.from('events').select('*').eq('partner_id', partner.id),
                client.from('publications').select('*').eq('partner_id', partner.id),
                client.from('statistics').select('*').eq('partner_id', partner.id),
                client.from('quarterly_reports').select('*').eq('partner_id', partner.id),
            ])

            return {
                partner: {
                    id: partner.id,
                    name: partner.name,
                    duration: partner.duration,
                    startDate: partner.start_date,
                    endDate: partner.end_date,
                    commissionClient: partner.commission_client,
                    commissionConsulting: partner.commission_consulting,
                    isActive: partner.is_active,
                    type: partner.type,
                    companyHubspotUrl: partner.company_hubspot_url,
                    contactPerson: {
                        name: partner.contact_person_name,
                        email: partner.contact_person_email,
                        hubspotUrl: partner.contact_person_hubspot_url,
                    },
                },
                introductions: introductions.data?.map(mapIntroduction) || [],
                events: events.data?.map(mapEvent) || [],
                publications: publications.data?.map(mapPublication) || [],
                statistics: statistics.data || [],
                quarterlyReports: quarterlyReports.data?.map(mapQuarterlyReport) || [],
            }
        })
    )

    return partnershipsData
}

/**
 * Create a new partnership
 */
export async function createPartnership(partnershipData: PartnershipData): Promise<PartnershipData> {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    const client = supabase // Non-null assertion after check
    const { partner, introductions, events, publications, quarterlyReports } = partnershipData

    // Insert partner
    const { data: insertedPartner, error: partnerError } = await client
        .from('partners')
        .insert({
            id: partner.id,
            name: partner.name,
            duration: partner.duration,
            start_date: partner.startDate,
            end_date: partner.endDate,
            commission_client: partner.commissionClient || 0,
            commission_consulting: partner.commissionConsulting || 0,
            is_active: partner.isActive,
            type: partner.type,
            company_hubspot_url: partner.companyHubspotUrl,
            contact_person_name: partner.contactPerson?.name,
            contact_person_email: partner.contactPerson?.email,
            contact_person_hubspot_url: partner.contactPerson?.hubspotUrl,
        })
        .select()
        .single()

    if (partnerError) {
        console.error('Error creating partner:', partnerError)
        throw new Error('Failed to create partner')
    }

    // Insert related data if provided
    if (introductions && introductions.length > 0) {
        await client.from('introductions').insert(
            introductions.map((intro) => ({
                id: intro.id,
                partner_id: partner.id,
                date: intro.date,
                contact_name: intro.contactName,
                company: intro.company,
                status: intro.status,
                contract_signed: intro.contractSigned,
            }))
        )
    }

    if (events && events.length > 0) {
        await client.from('events').insert(
            events.map((event) => ({
                id: event.id,
                partner_id: partner.id,
                proposal_date: event.proposalDate,
                event_date: event.eventDate,
                event_name: event.eventName,
                event_location: event.eventLocation,
                status: event.status,
                attended: event.attended,
            }))
        )
    }

    if (publications && publications.length > 0) {
        await client.from('publications').insert(
            publications.map((pub) => ({
                id: pub.id,
                partner_id: partner.id,
                publication_date: pub.publicationDate,
                platform: pub.platform,
                link: pub.link,
                stats_report_date: pub.statsReportDate,
                last_updated: pub.lastUpdated,
            }))
        )
    }

    if (quarterlyReports && quarterlyReports.length > 0) {
        await client.from('quarterly_reports').insert(
            quarterlyReports.map((report) => ({
                id: report.id,
                partner_id: partner.id,
                report_date: report.reportDate,
                link: report.link,
            }))
        )
    }

    return partnershipData
}

/**
 * Update a partnership (partner info or related data)
 */
export async function updatePartnership(partnerId: string, updates: Partial<PartnershipData>): Promise<void> {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    const client = supabase // Non-null assertion after check

    // Update partner info if provided
    if (updates.partner) {
        const { error } = await client
            .from('partners')
            .update({
                name: updates.partner.name,
                duration: updates.partner.duration,
                start_date: updates.partner.startDate,
                end_date: updates.partner.endDate,
                commission_client: updates.partner.commissionClient,
                commission_consulting: updates.partner.commissionConsulting,
                is_active: updates.partner.isActive,
                type: updates.partner.type,
                company_hubspot_url: updates.partner.companyHubspotUrl,
                contact_person_name: updates.partner.contactPerson?.name,
                contact_person_email: updates.partner.contactPerson?.email,
                contact_person_hubspot_url: updates.partner.contactPerson?.hubspotUrl,
            })
            .eq('id', partnerId)

        if (error) {
            console.error('Error updating partner:', error)
            throw new Error('Failed to update partner')
        }
    }

    // Update introductions if provided
    if (updates.introductions) {
        // Delete all existing introductions and re-insert
        await client.from('introductions').delete().eq('partner_id', partnerId)
        if (updates.introductions.length > 0) {
            await client.from('introductions').insert(
                updates.introductions.map((intro) => ({
                    id: intro.id,
                    partner_id: partnerId,
                    date: intro.date,
                    contact_name: intro.contactName,
                    company: intro.company,
                    status: intro.status,
                    contract_signed: intro.contractSigned,
                    deleted_at: intro.deletedAt,
                }))
            )
        }
    }

    // Update events if provided
    if (updates.events) {
        await client.from('events').delete().eq('partner_id', partnerId)
        if (updates.events.length > 0) {
            await client.from('events').insert(
                updates.events.map((event) => ({
                    id: event.id,
                    partner_id: partnerId,
                    proposal_date: event.proposalDate,
                    event_date: event.eventDate,
                    event_name: event.eventName,
                    event_location: event.eventLocation,
                    status: event.status,
                    attended: event.attended,
                    deleted_at: event.deletedAt,
                }))
            )
        }
    }

    // Update publications if provided
    if (updates.publications) {
        await client.from('publications').delete().eq('partner_id', partnerId)
        if (updates.publications.length > 0) {
            await client.from('publications').insert(
                updates.publications.map((pub) => ({
                    id: pub.id,
                    partner_id: partnerId,
                    publication_date: pub.publicationDate,
                    platform: pub.platform,
                    link: pub.link,
                    stats_report_date: pub.statsReportDate,
                    last_updated: pub.lastUpdated,
                    deleted_at: pub.deletedAt,
                }))
            )
        }
    }

    // Update quarterly reports if provided
    if (updates.quarterlyReports) {
        await client.from('quarterly_reports').delete().eq('partner_id', partnerId)
        if (updates.quarterlyReports.length > 0) {
            await client.from('quarterly_reports').insert(
                updates.quarterlyReports.map((report) => ({
                    id: report.id,
                    partner_id: partnerId,
                    report_date: report.reportDate,
                    link: report.link,
                    deleted_at: report.deletedAt,
                }))
            )
        }
    }
}

// Helper mapping functions
function mapIntroduction(data: any): QualifiedIntroduction {
    return {
        id: data.id,
        partnerId: data.partner_id,
        date: data.date,
        contactName: data.contact_name,
        company: data.company,
        status: data.status,
        contractSigned: data.contract_signed,
        deletedAt: data.deleted_at,
    }
}

function mapEvent(data: any): Event {
    return {
        id: data.id,
        partnerId: data.partner_id,
        proposalDate: data.proposal_date,
        eventDate: data.event_date,
        eventName: data.event_name,
        eventLocation: data.event_location,
        status: data.status,
        attended: data.attended,
        deletedAt: data.deleted_at,
    }
}

function mapPublication(data: any): Publication {
    return {
        id: data.id,
        partnerId: data.partner_id,
        publicationDate: data.publication_date,
        platform: data.platform,
        link: data.link,
        statsReportDate: data.stats_report_date,
        lastUpdated: data.last_updated,
        deletedAt: data.deleted_at,
    }
}

function mapQuarterlyReport(data: any): QuarterlyReport {
    return {
        id: data.id,
        partnerId: data.partner_id,
        reportDate: data.report_date,
        link: data.link,
        deletedAt: data.deleted_at,
    }
}
