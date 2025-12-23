'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Users, Handshake, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RelationsPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-6">
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </Button>

                    <div>
                        <h1 className="text-5xl font-bold text-white font-display flex items-center gap-4">
                            <Users className="w-12 h-12 text-blue-400" />
                            Gestion des <span className="text-gradient">Relations</span>
                        </h1>
                        <p className="text-xl text-white/70 mt-4">
                            Centralisez vos contacts stratégiques et l'historique de vos échanges.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Relations */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-blue-500/20">
                                <Handshake className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Contacts Clés</h2>
                                <p className="text-white/60">Décideurs et influenceurs</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                                        <div>
                                            <div className="font-medium text-white">Directeur Innovation {i}</div>
                                            <div className="text-sm text-white/40">Entreprise Partenaire {i}</div>
                                        </div>
                                    </div>
                                    <Button variant="secondary">Contacter</Button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Interactions */}
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-purple-500/20">
                                <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Derniers Échanges</h2>
                                <p className="text-white/60">Historique des conversations</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-white/80">Réunion de suivi mensuel</span>
                                        <span className="text-xs text-white/40">Il y a {i}j</span>
                                    </div>
                                    <p className="text-sm text-white/60 line-clamp-2">
                                        Discussion sur les objectifs du T{i} et alignement sur la roadmap produit...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    );
}
