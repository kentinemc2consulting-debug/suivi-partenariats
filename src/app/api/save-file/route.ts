import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    console.log('API /api/save-file called');
    try {
        const body = await req.json();
        const { fileName, fileData } = body; // fileData is base64 string

        console.log(`Received request to save: ${fileName}, data length: ${fileData?.length}`);

        if (!fileName || !fileData) {
            console.error('Missing fileName or fileData');
            return NextResponse.json(
                { error: 'Missing fileName or fileData' },
                { status: 400 }
            );
        }

        const projectRoot = process.cwd();
        const downloadsDir = path.join(projectRoot, 'downloads');
        console.log(`Downloads directory: ${downloadsDir}`);

        // Ensure downloads dir exists
        if (!fs.existsSync(downloadsDir)) {
            console.log('Creating downloads directory...');
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, fileName);
        console.log(`Writing to file: ${filePath}`);

        // Remove base64 header if present (e.g., "data:application/pdf;base64,")
        const base64Data = fileData.replace(/^data:.*,/, '');

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log('File written successfully.');

        return NextResponse.json({
            success: true,
            path: filePath,
            message: `Fichier sauvegardé avec succès dans : ${filePath}`
        });
    } catch (error) {
        console.error('File Save Failed:', error);
        return NextResponse.json(
            { error: 'Failed to save file: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
