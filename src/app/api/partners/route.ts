import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PartnershipData } from '@/types';
import { getAllPartnerships, createPartnership, updatePartnership } from '@/lib/supabase-service';

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
            { error: 'Failed to fetch partners' },
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
            { error: 'Failed to create partnership' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Partner ID is required' },
                { status: 400 }
            );
        }

        if (USE_SUPABASE) {
            // Use Supabase
            await updatePartnership(id, updates);
            return NextResponse.json({ success: true }, { status: 200 });
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
            return NextResponse.json(partners[partnerIndex], { status: 200 });
        }

    } catch (error) {
        console.error('Error updating partnership:', error);
        return NextResponse.json(
            { error: 'Failed to update partnership' },
            { status: 500 }
        );
    }
}
