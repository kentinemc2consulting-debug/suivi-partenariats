'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, TrendingUp, Users, Loader2, Calendar } from 'lucide-react';
import { PartnershipData } from '@/types';

export default function Home() {
    const [partnerships, setPartnerships] = useState<PartnershipData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPartners() {
            try {
                const res = await fetch('/api/partenaires');
                const data = await res.json();
                setPartnerships(data);
            } catch (error) {
                console.error('Error fetching partners:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPartners();
    }, []);

    const activePartnerships = partnerships.filter(p => p.partner.isActive && !p.partner.deletedAt);

    return (
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5 -z-10" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] -z-10 animate-pulse delay-1000" />

            <div className="container mx-auto px-4 z-10 py-20">
                <div className="max-w-6xl mx-auto text-center space-y-12">
                    {/* Hero Content */}
                    <div className="space-y-6 animate-fadeInUp">
                        <h1 className="text-6xl md:text-7xl font-bold text-gradient-primary-animated font-display tracking-tight leading-tight">
                            Suivi Partenariats
                        </h1>
                        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
                            Plateforme centralisée pour la gestion et le suivi de vos relations stratégiques.
                        </p>
                    </div>

                    {/* Partner Buttons - Dynamic Rendering */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-white/40 text-sm font-medium">Chargement des partenaires...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            {activePartnerships.length > 0 ? (
                                activePartnerships.map((p) => (
                                    <Link key={p.partner.id} href={`/partenaires/${p.partner.id}`} className="block group">
                                        <div className="premium-partner-button relative overflow-hidden min-h-[140px] flex flex-col justify-center items-center text-center p-8">
                                            <span className="text-2xl font-bold text-white tracking-tight group-hover:scale-110 transition-transform duration-300">
                                                {p.partner.name}
                                            </span>
                                            {p.partner.type && (
                                                <span className={`mt-4 text-[11px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full border backdrop-blur-md shadow-sm transition-all duration-300 ${p.partner.type === 'ambassadeur'
                                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10'
                                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                                                    }`}>
                                                    {p.partner.type === 'ambassadeur' ? 'Ambassadeur' : 'Partenariat stratégique'}
                                                </span>
                                            )}

                                            {/* Subtle background glow on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-12">
                                    <p className="text-white/40 text-lg">Aucun partenariat actif trouvé.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/evenements-globaux"
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full text-lg font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Événements Globaux</span>

                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                        </Link>

                        <Link
                            href="/partenaires"
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full text-lg font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                        >
                            <span>Gestion Globale</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                        </Link>
                    </div>

                    <p className="text-sm text-white/20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        E=MC² Consulting • v2.0
                    </p>
                </div>
            </div>
        </main>
    );
}
