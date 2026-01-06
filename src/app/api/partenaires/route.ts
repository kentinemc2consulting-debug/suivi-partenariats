import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PartnershipData } from '@/types';
import { getAllPartnerships, createPartnership, updatePartnership, softDeletePartner, restorePartner, permanentDeletePartner, emptyRecycleBin } from '@/lib/supabase-service';

const PARTNERS_FILE = path.join(process.cwd(), 'src/data/partners.json');
const USE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
    try {
        if (USE_SUPABASE) {
            // Use Supabase
            const partners = await getAllPartnerships();
            return NextResponse.json(partners);
        } else {
            // Fallback to JSON file
            const fileContents = await fs.readFile(PARTNERS_FILE, 'utf8');
            const partners: PartnershipData[] = JSON.parse(fileContents);
            return NextResponse.json(partners);
        }
    } catch (error) {
        console.error('Error reading partners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch partners', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const newPartnership: PartnershipData = await request.json();

        if (USE_SUPABASE) {
            // Use Supabase
            const created = await createPartnership(newPartnership);
            return NextResponse.json(created, { status: 201 });
        } else {
            // Fallback to JSON file
            const fileContents = await fs.readFile(PARTNERS_FILE, 'utf8');
            const partners: PartnershipData[] = JSON.parse(fileContents);
            partners.push(newPartnership);
            await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            return NextResponse.json(newPartnership, { status: 201 });
        }
    } catch (error) {
        console.error('Error creating partnership:', error);
        return NextResponse.json(
            { error: 'Failed to create partnership', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        console.log('[API PUT] Updating partner:', id);
        console.log('[API PUT] USE_SUPABASE:', USE_SUPABASE);

        if (!id) {
            return NextResponse.json(
                { error: 'Partner ID is required' },
                { status: 400 }
            );
        }

        if (USE_SUPABASE) {
            // Use Supabase
            try {
                await updatePartnership(id, updates);
                console.log('[API PUT] Success with Supabase');
                return NextResponse.json({ success: true }, { status: 200 });
            } catch (err) {
                console.error('[API PUT] Supabase Update Error:', err);
                throw err;
            }
        } else {
            // Fallback to JSON file
            const fileContents = await fs.readFile(PARTNERS_FILE, 'utf8');
            const partners: PartnershipData[] = JSON.parse(fileContents);
            const partnerIndex = partners.findIndex(p => p.partner.id === id);

            if (partnerIndex === -1) {
                return NextResponse.json(
                    { error: 'Partner not found' },
                    { status: 404 }
                );
            }

            partners[partnerIndex] = {
                ...partners[partnerIndex],
                ...updates
            };

            await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            console.log('[API PUT] Success with JSON File');
            return NextResponse.json(partners[partnerIndex], { status: 200 });
        }

    } catch (error) {
        console.error('Error updating partnership:', error);
        return NextResponse.json(
            { error: 'Failed to update partnership', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action'); // 'permanent', 'empty' or undefined (soft)

        if (action === 'empty') {
            if (USE_SUPABASE) {
                await emptyRecycleBin();
            }
            return NextResponse.json({ success: true });
        }

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        if (USE_SUPABASE) {
            if (action === 'permanent') {
                await permanentDeletePartner(id);
            } else {
                await softDeletePartner(id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE partner:', error);
        return NextResponse.json(
            { error: 'Failed to delete partner', details: error.message || String(error) },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action'); // 'restore'

        if (action === 'restore' && id) {
            if (USE_SUPABASE) {
                await restorePartner(id);
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action or ID' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in PATCH partner:', error);
        return NextResponse.json(
            { error: 'Failed to patch partner', details: error.message || String(error) },
            { status: 500 }
        );
    }
}
