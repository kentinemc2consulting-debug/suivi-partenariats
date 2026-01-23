import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const results: any = {
        supabase: {
            status: 'unknown',
            message: '',
            details: {}
        },
        gemini: {
            status: 'unknown',
            message: '',
            details: {}
        }
    };

    // Test Supabase
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            results.supabase.status = 'error';
            results.supabase.message = 'Configuration manquante';
            results.supabase.details = {
                error: 'Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env.local'
            };
        } else {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Test 1: Connection test with simple query
            const { data, error } = await supabase.from('partenariats_partners').select('id').limit(1);

            if (error) {
                results.supabase.status = 'error';
                results.supabase.message = error.message;
                results.supabase.details = {
                    error: error.message,
                    hint: error.hint || 'Vérifiez que les tables existent et que les politiques RLS sont configurées',
                    code: error.code
                };
            } else {
                // Test 2: Count tables
                const tables = ['partenariats_partners', 'partenariats_introductions', 'partenariats_events', 'partenariats_publications', 'partenariats_quarterly_reports', 'partenariats_monthly_check_ins', 'partenariats_global_events', 'partenariats_lightweight_partners'];
                const tableStatus: any = {};

                for (const table of tables) {
                    const { count, error: tableError } = await supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true });

                    tableStatus[table] = tableError ? `❌ ${tableError.message}` : `✅ ${count || 0} lignes`;
                }

                results.supabase.status = 'success';
                results.supabase.message = 'Connexion réussie';
                results.supabase.details = {
                    url: supabaseUrl,
                    tables: tableStatus
                };
            }
        }
    } catch (error: any) {
        results.supabase.status = 'error';
        results.supabase.message = error.message || 'Erreur inconnue';
        results.supabase.details = {
            error: error.message,
            stack: error.stack
        };
    }

    // Test Gemini API
    try {
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            results.gemini.status = 'warning';
            results.gemini.message = 'Clé API non configurée';
            results.gemini.details = {
                hint: 'Ajoutez GEMINI_API_KEY dans .env.local pour activer les fonctionnalités IA'
            };
        } else {
            // Simple test: check if key format is valid
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;

            const response = await fetch(testUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates) {
                results.gemini.status = 'success';
                results.gemini.message = 'API fonctionnelle';
                results.gemini.details = {
                    model: 'gemini-2.0-flash-exp',
                    keyPrefix: geminiKey.substring(0, 10) + '...'
                };
            } else {
                results.gemini.status = 'error';
                results.gemini.message = data.error?.message || 'Erreur API';
                results.gemini.details = {
                    error: data.error?.message || 'La clé API est invalide',
                    hint: 'Vérifiez que votre clé GEMINI_API_KEY est correcte et active sur https://makersuite.google.com/app/apikey'
                };
            }
        }
    } catch (error: any) {
        results.gemini.status = 'error';
        results.gemini.message = error.message || 'Erreur inconnue';
        results.gemini.details = {
            error: error.message
        };
    }

    return NextResponse.json(results);
}
