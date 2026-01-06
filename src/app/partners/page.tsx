'use client';

import { useEffect, useState } from 'react';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PartnershipData } from '@/types';
import { Briefcase, Plus, Filter, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddPartnerModal from '@/components/partners/AddPartnerModal';
import GlobalRecycleBinModal from '@/components/partners/GlobalRecycleBinModal';

export default function PartnersPage() {
    const router = useRouter();
    const [partnerships, setPartnerships] = useState<PartnershipData[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

    const fetchPartnerships = async () => {
        try {
            const res = await fetch('/api/partners');
            const data = await res.json();
            setPartnerships(data);
        } catch (error) {
            console.error('Error fetching partnerships:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartnerships();
    }, []);

    const handleAddPartner = async (newPartnership: PartnershipData) => {
        try {
            const res = await fetch('/api/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPartnership),
            });
            if (res.ok) {
                await fetchPartnerships();
            }
        } catch (error) {
            console.error('Error adding partner:', error);
        }
    };

    const handleRestorePartner = async (id: string) => {
        try {
            const res = await fetch(`/api/partners?action=restore&id=${id}`, { method: 'PATCH' });
            if (res.ok) await fetchPartnerships();
        } catch (error) {
            console.error('Error restoring partner:', error);
        }
    };

    const handlePermanentDeletePartner = async (id: string) => {
        try {
            const res = await fetch(`/api/partners?action=permanent&id=${id}`, { method: 'DELETE' });
            if (res.ok) await fetchPartnerships();
        } catch (error) {
            console.error('Error permanently deleting partner:', error);
        }
    };

    const handleEmptyBin = async () => {
        try {
            const res = await fetch(`/api/partners?action=empty`, { method: 'DELETE' });
            if (res.ok) await fetchPartnerships();
        } catch (error) {
            console.error('Error emptying bin:', error);
        }
    };

    const handleRestoreItem = async (partnershipId: string, type: string, itemId: string) => {
        const p = partnerships.find(p => p.partner.id === partnershipId);
        if (!p) return;

        let updates: any = {};
        if (type === 'introduction') updates.introductions = p.introductions.map(i => i.id === itemId ? { ...i, deletedAt: undefined } : i);
        if (type === 'event') updates.events = p.events.map(e => e.id === itemId ? { ...e, deletedAt: undefined } : e);
        if (type === 'publication') updates.publications = p.publications.map(pub => pub.id === itemId ? { ...pub, deletedAt: undefined } : pub);
        if (type === 'report') updates.quarterlyReports = (p.quarterlyReports || []).map(r => r.id === itemId ? { ...r, deletedAt: undefined } : r);
        if (type === 'checkIn') updates.monthlyCheckIns = (p.monthlyCheckIns || []).map(c => c.id === itemId ? { ...c, deletedAt: undefined } : c);

        try {
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnershipId, ...updates }),
            });
            if (res.ok) await fetchPartnerships();
        } catch (error) {
            console.error('Error restoring item:', error);
        }
    };

    const activePartnerships = partnerships.filter(p => !p.partner.deletedAt);
    const deletedPartnerships = partnerships.filter(p => p.partner.deletedAt);

    const filteredPartnerships = activePartnerships.filter(p => {
        if (filter === 'active') return p.partner.isActive;
        if (filter === 'archived') return !p.partner.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl font-medium flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    Chargement...
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-6">
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour au tableau de bord
                    </Button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl font-bold text-white font-display flex items-center gap-4">
                                <Briefcase className="w-12 h-12 text-primary-400" />
                                Gestion des <span className="text-gradient">Partenariats</span>
                            </h1>
                            <p className="text-xl text-white/70 mt-4">
                                {filteredPartnerships.length} partenariat{filteredPartnerships.length > 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            variant="accent"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Nouveau partenariat
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setIsRecycleBinOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            Corbeille
                        </Button>
                    </div>
                </div>

                <AddPartnerModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddPartner}
                />

                <GlobalRecycleBinModal
                    isOpen={isRecycleBinOpen}
                    onClose={() => setIsRecycleBinOpen(false)}
                    partnerships={partnerships}
                    onRestorePartner={handleRestorePartner}
                    onPermanentDeletePartner={handlePermanentDeletePartner}
                    onEmptyBin={handleEmptyBin}
                    onRestoreItem={handleRestoreItem}
                />

                {/* Filters */}
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-white/60" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'active'
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                Actifs
                            </button>
                            <button
                                onClick={() => setFilter('archived')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'archived'
                                    ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/20'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                Archivés
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Partnerships Grid */}
                {filteredPartnerships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPartnerships.map((partnership) => (
                            <PartnerCard
                                key={partnership.partner.id}
                                partner={partnership.partner}
                                onClick={() => router.push(`/partners/${partnership.partner.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="p-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <Briefcase className="w-12 h-12 text-white/10" />
                            <p className="text-white/40 text-lg">
                                Aucun partenariat trouvé pour ce filtre
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}
