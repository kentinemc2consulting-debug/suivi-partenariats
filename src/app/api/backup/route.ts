import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

// Helper to convert array of objects to CSV string
function toCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + (row[header] ?? '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceReplicaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey; // Use service role if available for full access, else anon (might fit if policies allow)

        if (!supabaseUrl || !serviceReplicaKey) {
            return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceReplicaKey);
        const zip = new JSZip();

        const tables = [
            'partenariats_partners',
            'partenariats_introductions',
            'partenariats_events',
            'partenariats_publications',
            'partenariats_quarterly_reports',
            'partenariats_monthly_check_ins',
            'partenariats_global_events',
            'partenariats_lightweight_partners',
            // 'partenariats_statistics' // Table removed previously
        ];

        for (const table of tables) {
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.error(`Error fetching table ${table}:`, error);
                zip.file(`${table}_error.txt`, `Error fetching data: ${error.message}`);
                continue;
            }

            const csvContent = toCSV(data || []);
            zip.file(`${table}.csv`, csvContent);
        }

        const zipContent = await zip.generateAsync({ type: 'blob' });
        const arrayBuffer = await zipContent.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = `backup_partenariats_${new Date().toISOString().split('T')[0]}.zip`;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Backup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
