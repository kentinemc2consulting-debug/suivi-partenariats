'use client';

import Link from 'next/link';
import { partnerships } from '@/data/partnerships';

export default function PartnerGrid() {
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
                Partenariats
            </h1>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Gérez tous vos partenariats d'entreprise en un seul endroit
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
                {partnerships.map((partner) => (
                    <Link
                        key={partner.slug}
                        href={`/partenaires/${partner.slug}`}
                        className="glass-card group cursor-pointer block"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {/* Removed Partenaire label */}
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                                {partner.name}
                            </h3>
                            <svg
                                className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="text-center">
                <Link
                    href="/new-partnership"
                    className="btn btn-primary inline-flex items-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nouveau Partenariat
                </Link>
            </div>
        </div>
    );
}

