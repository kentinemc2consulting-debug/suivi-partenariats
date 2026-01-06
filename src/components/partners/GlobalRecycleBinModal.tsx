'use client';

import { Fragment, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { X, RefreshCcw, Trash2, Building2, Users, Calendar, Linkedin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PartnershipData, Partner, QualifiedIntroduction, Event, Publication, QuarterlyReport, MonthlyCheckIn } from '@/types';

interface GlobalRecycleBinModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerships: PartnershipData[];
    onRestorePartner: (id: string) => Promise<void>;
    onPermanentDeletePartner: (id: string) => Promise<void>;
    onEmptyBin: () => Promise<void>;
    onRestoreItem: (partnershipId: string, type: string, id: string) => Promise<void>;
}

export default function GlobalRecycleBinModal({
    isOpen,
    onClose,
    partnerships,
    onRestorePartner,
    onPermanentDeletePartner,
    onEmptyBin,
    onRestoreItem
}: GlobalRecycleBinModalProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const deletedPartners = partnerships.filter(p => p.partner.deletedAt);

    // Collect all deleted sub-items across all partners
    const allDeletedItems: { partnershipId: string; partnerName: string; type: string; item: any; category: string }[] = [];

    partnerships.forEach(p => {
        p.introductions.filter(i => i.deletedAt).forEach(item =>
            allDeletedItems.push({ partnershipId: p.partner.id, partnerName: p.partner.name, type: 'introduction', item, category: 'Introductions' }));
        p.events.filter(e => e.deletedAt).forEach(item =>
            allDeletedItems.push({ partnershipId: p.partner.id, partnerName: p.partner.name, type: 'event', item, category: 'Événements' }));
        p.publications.filter(pub => pub.deletedAt).forEach(item =>
            allDeletedItems.push({ partnershipId: p.partner.id, partnerName: p.partner.name, type: 'publication', item, category: 'Publications' }));
        (p.quarterlyReports || []).filter(r => r.deletedAt).forEach(item =>
            allDeletedItems.push({ partnershipId: p.partner.id, partnerName: p.partner.name, type: 'report', item, category: 'Rapports' }));
        (p.monthlyCheckIns || []).filter(c => c.deletedAt).forEach(item =>
            allDeletedItems.push({ partnershipId: p.partner.id, partnerName: p.partner.name, type: 'checkIn', item, category: 'Points Mensuels' }));
    });

    const handleAction = async (id: string, action: () => Promise<void>) => {
        setActionLoading(id);
        try {
            await action();
        } finally {
            setActionLoading(null);
        }
    };

    const handleEmptyBin = async () => {
        if (!confirm('Êtes-vous sûr de vouloir vider la corbeille ? Cette action est irréversible.')) return;
        setActionLoading('empty');
        try {
            await onEmptyBin();
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-3xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[85vh]">
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10">
                                        <Trash2 className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-white">
                                            Gestion de la Corbeille
                                        </Dialog.Title>
                                        <p className="text-sm text-white/50">
                                            {deletedPartners.length} partenaire(s) et {allDeletedItems.length} élément(s) supprimé(s)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {(deletedPartners.length > 0 || allDeletedItems.length > 0) && (
                                        <Button
                                            variant="secondary"
                                            onClick={handleEmptyBin}
                                            disabled={actionLoading === 'empty'}
                                            className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {actionLoading === 'empty' ? 'Vidage...' : 'Vider la corbeille'}
                                        </Button>
                                    )}
                                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col p-6">
                                <Tab.Group>
                                    <Tab.List className="flex gap-1 p-1 mb-6 bg-black/20 rounded-xl">
                                        <Tab className={({ selected }) =>
                                            `flex-1 py-2.5 text-sm font-medium rounded-lg transition-all focus:outline-none ${selected ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`
                                        }>
                                            Partenaires ({deletedPartners.length})
                                        </Tab>
                                        <Tab className={({ selected }) =>
                                            `flex-1 py-2.5 text-sm font-medium rounded-lg transition-all focus:outline-none ${selected ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`
                                        }>
                                            Éléments ({allDeletedItems.length})
                                        </Tab>
                                    </Tab.List>

                                    <Tab.Panels className="flex-1 overflow-y-auto">
                                        <Tab.Panel className="space-y-4 focus:outline-none">
                                            {deletedPartners.length === 0 ? (
                                                <div className="text-center py-12 text-white/40">
                                                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>Aucun partenaire supprimé</p>
                                                </div>
                                            ) : (
                                                deletedPartners.map((p) => (
                                                    <div key={p.partner.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                <Building2 className="w-6 h-6 text-white/70" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-lg">{p.partner.name}</div>
                                                                <div className="text-sm text-red-300">Supprimé le {new Date(p.partner.deletedAt!).toLocaleDateString('fr-FR')}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => handleAction(p.partner.id, () => onRestorePartner(p.partner.id))}
                                                                disabled={!!actionLoading}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <RefreshCcw className={`w-4 h-4 ${actionLoading === p.partner.id ? 'animate-spin' : ''}`} />
                                                                Restaurer
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    if (confirm('Supprimer définitivement ce partenaire ?'))
                                                                        handleAction(p.partner.id + 'del', () => onPermanentDeletePartner(p.partner.id))
                                                                }}
                                                                disabled={!!actionLoading}
                                                                className="text-red-400 hover:text-red-300 border-red-500/20"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </Tab.Panel>

                                        <Tab.Panel className="space-y-4 focus:outline-none">
                                            {allDeletedItems.length === 0 ? (
                                                <div className="text-center py-12 text-white/40">
                                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>Aucun élément supprimé</p>
                                                </div>
                                            ) : (
                                                allDeletedItems.map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 rounded-lg bg-white/5">
                                                                <FileText className="w-5 h-5 text-white/70" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-white">
                                                                        {entry.type === 'introduction' ? entry.item.contactName :
                                                                            entry.type === 'event' ? entry.item.eventName :
                                                                                entry.type === 'publication' ? entry.item.platform :
                                                                                    entry.category}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                                                                        {entry.category}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-white/40">Partenaire: {entry.partnerName}</div>
                                                                <div className="text-xs text-red-300/60 mt-0.5">Supprimé le {new Date(entry.item.deletedAt!).toLocaleDateString('fr-FR')}</div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => handleAction(entry.item.id, () => onRestoreItem(entry.partnershipId, entry.type, entry.item.id))}
                                                            disabled={!!actionLoading}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <RefreshCcw className={`w-4 h-4 ${actionLoading === entry.item.id ? 'animate-spin' : ''}`} />
                                                            Restaurer
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end">
                                <Button variant="secondary" onClick={onClose}>
                                    Fermer
                                </Button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
