import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GlobalData, GlobalEvent, GlobalEventInvitation, PartnershipData } from '@/types';

const GLOBAL_DATA_PATH = path.join(process.cwd(), 'src/data/globalData.json');
const PARTNERS_DATA_PATH = path.join(process.cwd(), 'src/data/partners.json');

async function readGlobalData(): Promise<GlobalData> {
    const data = await fs.readFile(GLOBAL_DATA_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writeGlobalData(data: GlobalData): Promise<void> {
    await fs.writeFile(GLOBAL_DATA_PATH, JSON.stringify(data, null, 2));
}

async function readPartnersData(): Promise<PartnershipData[]> {
    const data = await fs.readFile(PARTNERS_DATA_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writePartnersData(data: PartnershipData[]): Promise<void> {
    await fs.writeFile(PARTNERS_DATA_PATH, JSON.stringify(data, null, 2));
}

// GET - Récupérer tous les événements globaux
export async function GET() {
    try {
        const globalData = await readGlobalData();
        return NextResponse.json(globalData);
    } catch (error) {
        console.error('Error reading global data:', error);
        return NextResponse.json({ globalEvents: [], lightweightPartners: [] }, { status: 500 });
    }
}

// POST - Créer un nouvel événement global
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const globalData = await readGlobalData();

        const newEvent: GlobalEvent = {
            id: crypto.randomUUID(),
            eventName: body.eventName,
            eventDate: body.eventDate,
            eventLocation: body.eventLocation,
            description: body.description,
            createdAt: new Date().toISOString(),
            invitations: []
        };

        globalData.globalEvents.push(newEvent);
        await writeGlobalData(globalData);

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error('Error creating global event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

// PUT - Mettre à jour un événement global (info ou invitations)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const globalData = await readGlobalData();
        const partnersData = await readPartnersData();

        const eventIndex = globalData.globalEvents.findIndex(e => e.id === body.id);
        if (eventIndex === -1) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Mise à jour de l'événement
        if (body.eventName !== undefined) globalData.globalEvents[eventIndex].eventName = body.eventName;
        if (body.eventDate !== undefined) globalData.globalEvents[eventIndex].eventDate = body.eventDate;
        if (body.eventLocation !== undefined) globalData.globalEvents[eventIndex].eventLocation = body.eventLocation;
        if (body.description !== undefined) globalData.globalEvents[eventIndex].description = body.description;

        // Mise à jour des invitations
        if (body.invitations !== undefined) {
            const previousInvitations = globalData.globalEvents[eventIndex].invitations;
            globalData.globalEvents[eventIndex].invitations = body.invitations;

            // Synchronisation avec les fiches partenaires
            for (const invitation of body.invitations as GlobalEventInvitation[]) {
                const previousInvitation = previousInvitations.find(i => i.partnerId === invitation.partnerId);

                // Synchroniser si nouvelle invitation ou si le statut/notes a changé
                // On synchronise quel que soit le statut (proposed, pending, accepted, declined)
                if (!previousInvitation ||
                    previousInvitation.status !== invitation.status ||
                    previousInvitation.notes !== invitation.notes ||
                    JSON.stringify(previousInvitation.guests) !== JSON.stringify(invitation.guests)) {
                    await syncInvitationToPartner(globalData.globalEvents[eventIndex], invitation, partnersData);
                }
            }

            await writePartnersData(partnersData);
        }

        // Ajout d'un partenaire léger si fourni
        if (body.lightweightPartner) {
            const exists = globalData.lightweightPartners.find(p => p.id === body.lightweightPartner.id);
            if (!exists) {
                globalData.lightweightPartners.push(body.lightweightPartner);
            }
        }

        globalData.globalEvents[eventIndex].updatedAt = new Date().toISOString();
        await writeGlobalData(globalData);

        return NextResponse.json(globalData.globalEvents[eventIndex]);
    } catch (error) {
        console.error('Error updating global event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

// DELETE - Supprimer un événement global (soft delete)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
        }

        const globalData = await readGlobalData();
        const eventIndex = globalData.globalEvents.findIndex(e => e.id === id);

        if (eventIndex === -1) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        globalData.globalEvents[eventIndex].deletedAt = new Date().toISOString();
        await writeGlobalData(globalData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting global event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}

// Fonction de synchronisation : créer/mettre à jour un événement dans la fiche partenaire
async function syncInvitationToPartner(
    globalEvent: GlobalEvent,
    invitation: GlobalEventInvitation,
    partnersData: PartnershipData[]
): Promise<void> {
    // Vérifier si c'est un vrai partenaire (pas un lightweight)
    const partnerIndex = partnersData.findIndex(p => p.partner.id === invitation.partnerId);
    if (partnerIndex === -1) return; // Si c'est un lightweight, on ne synchronise pas

    const partnership = partnersData[partnerIndex];

    // Chercher si un événement lié existe déjà
    const existingEventIndex = partnership.events.findIndex(e => e.globalEventId === globalEvent.id);

    const partnerEvent = {
        id: existingEventIndex >= 0 ? partnership.events[existingEventIndex].id : crypto.randomUUID(),
        partnerId: invitation.partnerId,
        proposalDate: invitation.proposalDate,
        eventDate: globalEvent.eventDate,
        eventName: globalEvent.eventName,
        eventLocation: globalEvent.eventLocation,
        status: invitation.status as 'pending' | 'accepted' | 'declined',
        globalEventId: globalEvent.id,
        isSyncedFromGlobal: true
    };

    if (existingEventIndex >= 0) {
        partnership.events[existingEventIndex] = partnerEvent;
    } else {
        partnership.events.push(partnerEvent);
    }
}
