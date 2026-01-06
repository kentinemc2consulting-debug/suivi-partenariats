import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { poContent } = await request.json();

        if (!poContent) {
            return NextResponse.json({ error: 'Contenu du bon de commande requis' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Clé API Gemini non configurée' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
            Tu es un assistant spécialisé dans l'analyse de bons de commande et de contrats de prestations de services.
            On va te donner le texte brut d'un bon de commande. 
            Ton rôle est de faire un résumé succinct et structuré des prestations comprises dans l'abonnement ou le contrat souscrit.
            
            Règles :
            1. Utilise des puces pour la liste des prestations.
            2. Sois concis.
            3. Si des limitations (ex: nombre de posts, durée) sont mentionnées, inclus-les.
            4. Réponds en français.
            
            Texte du bon de commande :
            ${poContent}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text });
    } catch (error: any) {
        console.error('Error in AI summarizer:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la génération du résumé' }, { status: 500 });
    }
}
