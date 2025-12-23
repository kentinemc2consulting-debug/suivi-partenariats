'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PerformancesPage() {
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
                            <TrendingUp className="w-12 h-12 text-primary-400" />
                            Performances <span className="text-gradient">& Analytics</span>
                        </h1>
                        <p className="text-xl text-white/70 mt-4">
                            Suivez l'impact et la croissance de vos partenariats en temps réel.
                        </p>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white/80">Revenu Global</h3>
                            <BarChart3 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-4xl font-bold text-white">124k €</div>
                        <div className="text-sm text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +12% ce mois
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white/80">Commissions</h3>
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-4xl font-bold text-white">28.5k €</div>
                        <div className="text-sm text-blue-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +8% ce mois
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white/80">ROI Moyen</h3>
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-4xl font-bold text-white">320%</div>
                        <div className="text-sm text-white/60">
                            Stable
                        </div>
                    </Card>
                </div>

                <div className="h-96 rounded-2xl glass-card flex items-center justify-center border border-white/5 bg-white/5">
                    <p className="text-white/40">Graphique détaillé des performances (À venir)</p>
                </div>
            </div>
        </main>
    );
}
