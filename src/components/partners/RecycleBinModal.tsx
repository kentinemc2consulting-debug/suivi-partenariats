'use client';

import { Fragment, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { X, RefreshCcw, Trash2, FileText, Calendar, Users, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PartnershipData, QualifiedIntroduction, Event, Publication, QuarterlyReport } from '@/types';
import { Card } from '@/components/ui/Card';

interface RecycleBinModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnership: PartnershipData;
    onRestore: (type: 'introduction' | 'event' | 'publication' | 'report', id: string) => Promise<void>;
}

export default function RecycleBinModal({ isOpen, onClose, partnership, onRestore }: RecycleBinModalProps) {
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const deletedIntroductions = partnership.introductions.filter(i => i.deletedAt);
    const deletedEvents = partnership.events.filter(e => e.deletedAt);
    const deletedPublications = partnership.publications.filter(p => p.deletedAt);
    const deletedReports = (partnership.quarterlyReports || []).filter(r => r.deletedAt);

    const totalDeleted = deletedIntroductions.length + deletedEvents.length + deletedPublications.length + deletedReports.length;

    const handleRestore = async (type: 'introduction' | 'event' | 'publication' | 'report', id: string) => {
        setRestoringId(id);
        await onRestore(type, id);
        setRestoringId(null);
    };

    const categories = [
        {
            id: 'introductions',
            name: 'Introductions',
            icon: Users,
            count: deletedIntroductions.length,
            items: deletedIntroductions,
            renderItem: (item: QualifiedIntroduction) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div>
                        <div className="font-medium text-white">{item.contactName}</div>
                        <div className="text-sm text-white/60">{item.company}</div>
                        <div className="text-xs text-red-300 mt-1">Supprimé le {new Date(item.deletedAt!).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => handleRestore('introduction', item.id)}
                        disabled={restoringId === item.id}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="sr-only sm:not-sr-only">Restaurer</span>
                    </Button>
                </div>
            )
        },
        {
            id: 'events',
            name: 'Événements',
            icon: Calendar,
            count: deletedEvents.length,
            items: deletedEvents,
            renderItem: (item: Event) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div>
                        <div className="font-medium text-white">{item.eventName}</div>
                        <div className="text-sm text-white/60">Proposé le {new Date(item.proposalDate).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-red-300 mt-1">Supprimé le {new Date(item.deletedAt!).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => handleRestore('event', item.id)}
                        disabled={restoringId === item.id}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="sr-only sm:not-sr-only">Restaurer</span>
                    </Button>
                </div>
            )
        },
        {
            id: 'publications',
            name: 'Publications',
            icon: Linkedin,
            count: deletedPublications.length,
            items: deletedPublications,
            renderItem: (item: Publication) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div>
                        <div className="font-medium text-white">{item.platform}</div>
                        <div className="text-sm text-white/60">{new Date(item.publicationDate).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-red-300 mt-1">Supprimé le {new Date(item.deletedAt!).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => handleRestore('publication', item.id)}
                        disabled={restoringId === item.id}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="sr-only sm:not-sr-only">Restaurer</span>
                    </Button>
                </div>
            )
        },
        {
            id: 'reports',
            name: 'Rapports',
            icon: FileText,
            count: deletedReports.length,
            items: deletedReports,
            renderItem: (item: QuarterlyReport) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div>
                        <div className="font-medium text-white">Rapport du {new Date(item.reportDate).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-red-300 mt-1">Supprimé le {new Date(item.deletedAt!).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => handleRestore('report', item.id)}
                        disabled={restoringId === item.id}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="sr-only sm:not-sr-only">Restaurer</span>
                    </Button>
                </div>
            )
        }
    ];

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
                        <Dialog.Panel className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[80vh]">
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/10">
                                        <Trash2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-white">
                                            Corbeille
                                        </Dialog.Title>
                                        <p className="text-sm text-white/50">
                                            {totalDeleted} élément{totalDeleted > 1 ? 's' : ''} supprimé{totalDeleted > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <Tab.Group>
                                    <Tab.List className="flex gap-1 p-1 m-6 bg-black/20 rounded-xl">
                                        {categories.map((category) => (
                                            <Tab
                                                key={category.id}
                                                className={({ selected }) =>
                                                    `flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all focus:outline-none ${selected
                                                        ? 'bg-white/10 text-white shadow'
                                                        : 'text-white/50 hover:bg-white/[0.12] hover:text-white'
                                                    }`
                                                }
                                            >
                                                <category.icon className="w-4 h-4" />
                                                <span className="hidden sm:inline">{category.name}</span>
                                                {category.count > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                                                        {category.count}
                                                    </span>
                                                )}
                                            </Tab>
                                        ))}
                                    </Tab.List>

                                    <Tab.Panels className="flex-1 overflow-y-auto px-6 pb-6">
                                        {categories.map((category) => (
                                            <Tab.Panel key={category.id} className="space-y-4 focus:outline-none">
                                                {category.count === 0 ? (
                                                    <div className="text-center py-12 text-white/40">
                                                        <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                        <p>Aucun élément supprimé dans cette catégorie</p>
                                                    </div>
                                                ) : (
                                                    category.items.map((item: any) => category.renderItem(item))
                                                )}
                                            </Tab.Panel>
                                        ))}
                                    </Tab.Panels>
                                </Tab.Group>
                            </div>

                            <div className="p-4 border-t border-white/10 flex justify-end">
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
