import { NextResponse } from 'next/server';
import { GlobalEvent, GlobalEventInvitation, PartnershipData } from '@/types';
import {
    getGlobalEvents,
    createGlobalEvent,
    updateGlobalEvent,
    deleteGlobalEvent,
    getAllPartnerships,
    updatePartnership,
    createLightweightPartner
} from '@/lib/supabase-service';

// GET - Consummer les événements globaux via Supabase
export async function GET() {
    try {
        const events = await getGlobalEvents();
        // Lightweight partners fetch logic could be added here if needed for the frontend
        return NextResponse.json({ globalEvents: events, lightweightPartners: [] });
    } catch (error) {
        console.error('Error reading global events:', error);
        return NextResponse.json({ globalEvents: [], lightweightPartners: [] }, { status: 500 });
    }
}

// POST - Créer un nouvel événement global via Supabase
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newEvent: GlobalEvent = {
            id: crypto.randomUUID(),
            eventName: body.eventName,
            eventDate: body.eventDate,
            eventLocation: body.eventLocation,
            description: body.description,
            createdAt: new Date().toISOString(),
            invitations: []
        };

        const created = await createGlobalEvent(newEvent);
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Error creating global event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

// PUT - Mettre à jour un événement global (info ou invitations) via Supabase
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        // 1. Récupérer l'événement existant depuis Supabase
        const events = await getGlobalEvents(); // Optimisation possible: getGlobalEventById
        const currentEvent = events.find(e => e.id === body.id);

        if (!currentEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const updatedEvent: GlobalEvent = {
            ...currentEvent,
            eventName: body.eventName ?? currentEvent.eventName,
            eventDate: body.eventDate ?? currentEvent.eventDate,
            eventLocation: body.eventLocation ?? currentEvent.eventLocation,
            description: body.description ?? currentEvent.description,
            updatedAt: new Date().toISOString()
        };

        // 2. Mise à jour des invitations
        if (body.invitations !== undefined) {
            const previousInvitations = currentEvent.invitations || [];
            updatedEvent.invitations = body.invitations;

            // Récupérer les partenaires seulement si on doit synchroniser
            // (Note: Ceci peut être lourd si beaucoup de partenaires, optimisation future possible)
            const partnersData = await getAllPartnerships();

            // Synchronisation avec les fiches partenaires
            for (const invitation of body.invitations as GlobalEventInvitation[]) {
                const previousInvitation = previousInvitations.find(i => i.partnerId === invitation.partnerId);

                // Synchroniser si nouvelle invitation ou si le statut/notes a changé
                if (!previousInvitation ||
                    previousInvitation.status !== invitation.status ||
                    previousInvitation.notes !== invitation.notes ||
                    JSON.stringify(previousInvitation.guests) !== JSON.stringify(invitation.guests)) {

                    const partnerToUpdate = partnersData.find(p => p.partner.id === invitation.partnerId);

                    if (partnerToUpdate) {
                        // Appliquer les changements à l'objet local
                        syncInvitationToPartnerObject(updatedEvent, invitation, partnerToUpdate);

                        // Sauvegarder les changements du partenaire dans Supabase
                        await updatePartnership(partnerToUpdate.partner.id, { events: partnerToUpdate.events });
                    }
                }
            }
        }

        // 3. Ajout d'un partenaire léger si fourni
        if (body.lightweightPartner) {
            await createLightweightPartner(body.lightweightPartner);
        }

        // 4. Sauvegarder l'événement mis à jour
        const savedEvent = await updateGlobalEvent(updatedEvent);

        return NextResponse.json(savedEvent);
    } catch (error) {
        console.error('Error updating global event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

// DELETE - Supprimer un événement global (soft delete) via Supabase
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
        }

        await deleteGlobalEvent(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting global event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}

// Helper: Modifie l'objet PartnershipData en mémoire avant sauvegarde
function syncInvitationToPartnerObject(
    globalEvent: GlobalEvent,
    invitation: GlobalEventInvitation,
    partnership: PartnershipData
): void {
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
