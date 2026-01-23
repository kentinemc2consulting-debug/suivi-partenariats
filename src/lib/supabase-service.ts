import { supabase } from './supabase'
import type { PartnershipData, Partner, QualifiedIntroduction, Event, Publication, QuarterlyReport, MonthlyCheckIn, GlobalEvent, LightweightPartner, GlobalEventInvitation } from '@/types'
import { generateSlug } from './slug-utils'

/**
 * Fetch all partners with their related data
 */
export async function getAllPartnerships(): Promise<PartnershipData[]> {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    const client = supabase // Non-null assertion after check

    const { data: partners, error: partnersError } = await client
        .from('partenariats_partners')
        .select('*')
        .order('created_at', { ascending: false })

    if (partnersError) {
        console.error('Error fetching partners:', partnersError)
        throw new Error('Failed to fetch partners')
    }

    // Fetch related data for each partner
    const partnershipsData: PartnershipData[] = await Promise.all(
        partners.map(async (partner) => {
            const [introductions, events, publications, statistics, quarterlyReports, monthlyCheckIns] = await Promise.all([
                client.from('partenariats_introductions').select('*').eq('partner_id', partner.id),
                client.from('partenariats_events').select('*').eq('partner_id', partner.id),
                client.from('partenariats_publications').select('*').eq('partner_id', partner.id),
                client.from('partenariats_statistics').select('*').eq('partner_id', partner.id),
                client.from('partenariats_quarterly_reports').select('*').eq('partner_id', partner.id),
                client.from('partenariats_monthly_check_ins').select('*').eq('partner_id', partner.id),
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
                    deletedAt: partner.deleted_at,
                    servicesSummary: partner.services_summary,
                    slug: partner.slug,
                },
                introductions: introductions.data?.map(mapIntroduction) || [],
                events: events.data?.map(mapEvent) || [],
                publications: publications.data?.map(mapPublication) || [],
                statistics: statistics.data || [],
                quarterlyReports: quarterlyReports.data?.map(mapQuarterlyReport) || [],
                monthlyCheckIns: monthlyCheckIns.data?.map(mapMonthlyCheckIn) || [],
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
    const { partner, introductions, events, publications, quarterlyReports, monthlyCheckIns } = partnershipData

    // Insert partner
    const { data: insertedPartner, error: partnerError } = await client
        .from('partenariats_partners')
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
            contact_name: partner.contactPerson?.name,
            contact_email: partner.contactPerson?.email,
            contact_hubspot_url: partner.contactPerson?.hubspotUrl,
            services_summary: partner.servicesSummary,
            slug: partner.slug || generateSlug(partner.name),
        })
        .select()
        .single()

    if (partnerError) {
        console.error('Error creating partner:', partnerError)
        throw new Error(`Failed to create partner: ${partnerError.message} (Code: ${partnerError.code || 'unknown'})`)
    }

    // Insert related data if provided
    if (introductions && introductions.length > 0) {
        await client.from('partenariats_introductions').insert(
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
        await client.from('partenariats_events').insert(
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
        await client.from('partenariats_publications').insert(
            publications.map((pub) => ({
                id: pub.id,
                partner_id: partner.id,
                publication_date: pub.publicationDate,
                platform: pub.platform,
                link: pub.links,
                stats_report_date: pub.statsReportDate,
                stats_report_url: pub.statsReportUrl,
                screenshot_urls: pub.screenshotUrls ? JSON.stringify(pub.screenshotUrls) : null,
                last_updated: pub.lastUpdated,
            }))
        )
    }

    if (quarterlyReports && quarterlyReports.length > 0) {
        await client.from('partenariats_quarterly_reports').insert(
            quarterlyReports.map((report) => ({
                id: report.id,
                partner_id: partner.id,
                report_date: report.reportDate,
                link: report.link,
            }))
        )
    }

    if (monthlyCheckIns && monthlyCheckIns.length > 0) {
        await client.from('partenariats_monthly_check_ins').insert(
            monthlyCheckIns.map((checkIn) => ({
                id: checkIn.id,
                partner_id: partner.id,
                check_in_date: checkIn.checkInDate,
                notes: checkIn.notes,
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
            .from('partenariats_partners')
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
                services_summary: updates.partner.servicesSummary,
                slug: updates.partner.slug || (updates.partner.name ? generateSlug(updates.partner.name) : undefined),
            })
            .eq('id', partnerId)

        if (error) {
            console.error('Error updating partner:', error)
            throw new Error('Failed to update partner')
        }
    }

    // Update introductions if provided
    if (updates.introductions) {
        const { error: deleteError } = await client.from('partenariats_introductions').delete().eq('partner_id', partnerId)
        if (deleteError) {
            console.error('Error deleting introductions:', deleteError)
            throw deleteError
        }

        if (updates.introductions.length > 0) {
            const { error: insertError } = await client.from('partenariats_introductions').insert(
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
            if (insertError) {
                console.error('Error inserting introductions:', insertError)
                throw insertError
            }
        }
    }

    // Update events if provided
    if (updates.events) {
        console.log('[UPDATE] Updating events for partner:', partnerId, 'Count:', updates.events.length)
        const { error: deleteError } = await client.from('partenariats_events').delete().eq('partner_id', partnerId)
        if (deleteError) {
            console.error('[UPDATE] Error deleting events:', deleteError)
            throw deleteError
        }
        console.log('[UPDATE] Successfully deleted existing events')

        if (updates.events.length > 0) {
            console.log('[UPDATE] Inserting', updates.events.length, 'events')
            const { error: insertError } = await client.from('partenariats_events').insert(
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
            if (insertError) {
                console.error('[UPDATE] Error inserting events:', insertError)
                throw insertError
            }
            console.log('[UPDATE] Successfully inserted events')
        }
    }

    // Update publications if provided
    if (updates.publications) {
        console.log('[UPDATE] Updating publications for partner:', partnerId, 'Count:', updates.publications.length)
        const { error: deleteError } = await client.from('partenariats_publications').delete().eq('partner_id', partnerId)
        if (deleteError) {
            console.error('[UPDATE] Error deleting publications:', deleteError)
            throw deleteError
        }
        console.log('[UPDATE] Successfully deleted existing publications')

        if (updates.publications.length > 0) {
            console.log('[UPDATE] Inserting', updates.publications.length, 'publications')
            const { error: insertError } = await client.from('partenariats_publications').insert(
                updates.publications.map((pub) => ({
                    id: pub.id,
                    partner_id: partnerId,
                    publication_date: pub.publicationDate,
                    platform: pub.platform,
                    link: pub.links,
                    stats_report_date: pub.statsReportDate,
                    stats_report_url: pub.statsReportUrl,
                    screenshot_urls: pub.screenshotUrls ? JSON.stringify(pub.screenshotUrls) : null,
                    last_updated: pub.lastUpdated,
                    deleted_at: pub.deletedAt,
                }))
            )
            if (insertError) {
                console.error('[UPDATE] Error inserting publications:', insertError)
                throw insertError
            }
            console.log('[UPDATE] Successfully inserted publications')
        }
    }

    // Update quarterly reports if provided
    if (updates.quarterlyReports) {
        const { error: deleteError } = await client.from('partenariats_quarterly_reports').delete().eq('partner_id', partnerId)
        if (deleteError) {
            console.error('Error deleting quarterly_reports:', deleteError)
            throw deleteError
        }

        if (updates.quarterlyReports.length > 0) {
            const { error: insertError } = await client.from('partenariats_quarterly_reports').insert(
                updates.quarterlyReports.map((report) => ({
                    id: report.id,
                    partner_id: partnerId,
                    report_date: report.reportDate,
                    link: report.link,
                    deleted_at: report.deletedAt,
                }))
            )
            if (insertError) {
                console.error('Error inserting quarterly_reports:', insertError)
                throw insertError
            }
        }
    }

    // Update monthly check-ins if provided
    if (updates.monthlyCheckIns) {
        await client.from('partenariats_monthly_check_ins').delete().eq('partner_id', partnerId)
        if (updates.monthlyCheckIns.length > 0) {
            await client.from('partenariats_monthly_check_ins').insert(
                updates.monthlyCheckIns.map((checkIn) => ({
                    id: checkIn.id,
                    partner_id: partnerId,
                    check_in_date: checkIn.checkInDate,
                    notes: checkIn.notes,
                    deleted_at: checkIn.deletedAt,
                }))
            )
        }
    }
}

// Global Events Functions

export async function getGlobalEvents(): Promise<GlobalEvent[]> {
    if (!supabase) return []
    const { data, error } = await supabase
        .from('partenariats_global_events')
        .select('*')
        .order('event_date', { ascending: false })

    if (error) {
        console.error('Error fetching global events:', error)
        throw new Error('Failed to fetch global events')
    }

    return data.map(mapGlobalEvent)
}

export async function createGlobalEvent(event: GlobalEvent): Promise<GlobalEvent> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase
        .from('partenariats_global_events')
        .insert({
            id: event.id,
            event_name: event.eventName,
            event_date: event.eventDate,
            event_location: event.eventLocation,
            description: event.description,
            invitations: event.invitations,
            created_at: event.createdAt,
            deleted_at: event.deletedAt
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating global event:', error)
        throw new Error('Failed to create global event')
    }

    return mapGlobalEvent(data)
}

export async function updateGlobalEvent(event: GlobalEvent): Promise<GlobalEvent> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase
        .from('partenariats_global_events')
        .update({
            event_name: event.eventName,
            event_date: event.eventDate,
            event_location: event.eventLocation,
            description: event.description,
            invitations: event.invitations,
            updated_at: event.updatedAt || new Date().toISOString()
        })
        .eq('id', event.id)
        .select()
        .single()

    if (error) {
        console.error('Error updating global event:', error)
        throw new Error('Failed to update global event')
    }

    return mapGlobalEvent(data)
}

export async function deleteGlobalEvent(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase
        .from('partenariats_global_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error deleting global event:', error)
        throw new Error('Failed to delete global event')
    }
}

// Partner Deletion & Restoration Functions

export async function softDeletePartner(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase
        .from('partenariats_partners')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error soft deleting partner:', error)
        throw new Error('Failed to soft delete partner')
    }
}

export async function restorePartner(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase
        .from('partenariats_partners')
        .update({ deleted_at: null })
        .eq('id', id)

    if (error) {
        console.error('Error restoring partner:', error)
        throw new Error('Failed to restore partner')
    }
}

export async function permanentDeletePartner(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized')

    // We rely on CASCADE delete in Supabase if configured, or manually delete related data
    // For safety, let's just delete the partner. 
    // If FK constraints are set to CASCADE, related records will be gone.
    const { error } = await supabase
        .from('partenariats_partners')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error permanently deleting partner:', error)
        throw new Error('Failed to permanently delete partner')
    }
}

export async function emptyRecycleBin(): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized')

    const { error } = await supabase
        .from('partenariats_partners')
        .delete()
        .not('deleted_at', 'is', null)

    if (error) {
        console.error('Error emptying recycle bin:', error)
        throw new Error('Failed to empty recycle bin')
    }
}

// Lightweight Partners Functions

export async function getLightweightPartners(): Promise<LightweightPartner[]> {
    if (!supabase) return []
    const { data, error } = await supabase
        .from('partenariats_lightweight_partners')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching lightweight partners:', error)
        throw new Error('Failed to fetch lightweight partners')
    }

    return data.map(mapLightweightPartner)
}

export async function createLightweightPartner(partner: LightweightPartner): Promise<LightweightPartner> {
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase
        .from('partenariats_lightweight_partners')
        .insert({
            id: partner.id,
            name: partner.name,
            email: partner.email,
            company: partner.company
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating lightweight partner:', error)
        throw new Error('Failed to create lightweight partner')
    }

    return mapLightweightPartner(data)
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
    // Parse link string into array (support comma or newline separated)
    let linksArray: string[] = [];
    if (data.link) {
        if (typeof data.link === 'string') {
            // Try to parse as JSON array first, otherwise split by newlines/commas
            try {
                const parsed = JSON.parse(data.link);
                linksArray = Array.isArray(parsed) ? parsed : [data.link];
            } catch {
                // Split by newlines or commas
                linksArray = data.link.split(/[\n,]/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
            }
        } else if (Array.isArray(data.link)) {
            linksArray = data.link;
        }
    }

    // Parse screenshot URLs from JSON string
    let screenshotUrlsArray: string[] = [];
    if (data.screenshot_urls) {
        try {
            const parsed = JSON.parse(data.screenshot_urls);
            screenshotUrlsArray = Array.isArray(parsed) ? parsed : [];
        } catch {
            screenshotUrlsArray = [];
        }
    }

    return {
        id: data.id,
        partnerId: data.partner_id,
        publicationDate: data.publication_date,
        platform: data.platform,
        links: linksArray,
        statsReportDate: data.stats_report_date,
        statsReportUrl: data.stats_report_url,
        screenshotUrls: screenshotUrlsArray,
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

function mapMonthlyCheckIn(data: any): MonthlyCheckIn {
    return {
        id: data.id,
        partnerId: data.partner_id,
        checkInDate: data.check_in_date,
        notes: data.notes,
        deletedAt: data.deleted_at,
    }
}

function mapGlobalEvent(data: any): GlobalEvent {
    return {
        id: data.id,
        eventName: data.event_name,
        eventDate: data.event_date,
        eventLocation: data.event_location,
        description: data.description,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at,
        invitations: data.invitations || []
    }
}

function mapLightweightPartner(data: any): LightweightPartner {
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company,
        isLightweight: true
    }
}

/**
 * Upload a screenshot to Supabase Storage
 */
export async function uploadScreenshot(file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading screenshot:', uploadError);
        throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
