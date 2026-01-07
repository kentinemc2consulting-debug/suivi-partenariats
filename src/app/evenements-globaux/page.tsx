'use client';

import { Fragment, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GlobalData, GlobalEvent, InvitationStatus } from '@/types';
import { Calendar, Plus, ArrowLeft, ArrowRight, Users, CheckCircle, XCircle, Clock, Download, MoreVertical, Edit, Trash2 } from 'lucide-react';
import CreateGlobalEventModal from '@/components/evenements-globaux/CreateGlobalEventModal';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GlobalEventsPage() {
    const router = useRouter();
    const [globalData, setGlobalData] = useState<GlobalData>({ globalEvents: [], lightweightPartners: [] });
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [selectedEventToEdit, setSelectedEventToEdit] = useState<GlobalEvent | undefined>(undefined);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchGlobalData();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeMenuId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenuId]);

    const fetchGlobalData = async () => {
        try {
            const res = await fetch('/api/evenements-globaux');
            const data = await res.json();
            setGlobalData(data);
        } catch (error) {
            console.error('Error fetching global data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (eventData: Partial<GlobalEvent>) => {
        try {
            const method = eventData.id ? 'PUT' : 'POST';
            const res = await fetch('/api/evenements-globaux', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            if (!res.ok) throw new Error('Failed to save event');

            const savedEvent = await res.json();

            if (eventData.id) {
                await fetchGlobalData(); // Refresh list on edit
            } else {
                router.push(`/evenements-globaux/${savedEvent.id}`); // Navigate on create
            }

            setIsCreateModalOpen(false);
            setSelectedEventToEdit(undefined);
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erreur lors de la sauvegarde de l\'événement');
        }
    };

    const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        try {
            const res = await fetch(`/api/evenements-globaux?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete event');

            fetchGlobalData();
            setActiveMenuId(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erreur lors de la suppression de l\'événement');
        }
    };

    const handleEditClick = (event: GlobalEvent, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedEventToEdit(event);
        setIsCreateModalOpen(true);
        setActiveMenuId(null);
    };

    const handleCreateClick = () => {
        setSelectedEventToEdit(undefined);
        setIsCreateModalOpen(true);
    };

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    const generatePDF = (event: GlobalEvent, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation when clicking download
        e.stopPropagation();

        const doc = new jsPDF();

        // 1. Header & Branding
        doc.setFillColor(0, 82, 84); // Teal #005254
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(event.eventName, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        let subtitle = '';
        if (event.eventDate) {
            subtitle += new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        if (event.eventLocation) {
            subtitle += (subtitle ? ' - ' : '') + event.eventLocation;
        }
        doc.text(subtitle, 14, 30);

        if (event.description) {
            doc.setFontSize(9);
            doc.setTextColor(180, 180, 180);
            doc.text(event.description, 14, 38, { maxWidth: 180 });
        }

        // 2. Stats Summary
        const stats = {
            total: event.invitations.length,
            accepted: event.invitations.filter(i => i.status === 'accepted').length,
            pending: event.invitations.filter(i => i.status === 'pending' || i.status === 'proposed').length,
            declined: event.invitations.filter(i => i.status === 'declined').length
        };

        let yPos = 50;
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Résumé', 14, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total invités: ${stats.total}`, 14, yPos);
        doc.setTextColor(34, 197, 94);
        doc.text(`Acceptés: ${stats.accepted}`, 60, yPos);
        doc.setTextColor(249, 115, 22);
        doc.text(`En attente: ${stats.pending}`, 100, yPos);
        doc.setTextColor(239, 68, 68);
        doc.text(`Refusés: ${stats.declined}`, 140, yPos);

        // 3. Table
        const getStatusLabel = (status: InvitationStatus) => {
            switch (status) {
                case 'accepted': return 'Accepté';
                case 'declined': return 'Refusé';
                case 'pending': return 'En attente';
                case 'proposed': return 'Proposé';
            }
        };

        const tableData = event.invitations.map(inv => [
            inv.partnerName,
            getStatusLabel(inv.status),
            inv.guests ? inv.guests.join(', ') : '-',
            inv.notes || '-'
        ]);

        autoTable(doc, {
            startY: yPos + 10,
            head: [['Partenaire', 'Statut', 'Invités', 'Notes']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 82, 84], // Teal header
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 },
                3: { cellWidth: 'auto' }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 1) {
                    const status = data.cell.raw;
                    if (status === 'Accepté') data.cell.styles.textColor = [34, 197, 94];
                    if (status === 'Refusé') data.cell.styles.textColor = [239, 68, 68];
                    if (status === 'En attente' || status === 'Proposé') data.cell.styles.textColor = [249, 115, 22];
                }
            }
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Généré le ${now} • Suivi Partenariats - E=MC2 Consulting`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} / ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        doc.save(`Event-${event.eventName.replace(/\s+/g, '-')}.pdf`);
    };

    const activeEvents = globalData.globalEvents.filter(e => !e.deletedAt);

    const getEventStats = (event: GlobalEvent) => {
        const accepted = event.invitations.filter(i => i.status === 'accepted').length;
        const declined = event.invitations.filter(i => i.status === 'declined').length;
        const pending = event.invitations.filter(i => i.status === 'pending' || i.status === 'proposed').length;
        const total = event.invitations.length;

        return { accepted, declined, pending, total };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Chargement...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-sm sm:text-base w-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Retour à l'accueil</span>
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleCreateClick}
                            className="hidden sm:flex items-center gap-2 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4" />
                            Créer un événement
                        </Button>
                    </div>

                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                            </div>
                            Événements Globaux
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/60 mt-2">
                            Gérez vos événements et suivez les invitations de tous vos partenaires
                        </p>

                        {/* Mobile only: Create button below description */}
                        <Button
                            variant="primary"
                            onClick={handleCreateClick}
                            className="sm:hidden flex items-center gap-2 text-sm mt-4 w-full justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            Créer un événement
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Événements Actifs</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeEvents.length}
                        </div>
                    </Card>

                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-green-400/10">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Acceptations Totales</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeEvents.reduce((sum, e) => sum + e.invitations.filter(i => i.status === 'accepted').length, 0)}
                        </div>
                    </Card>

                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-orange-400/10">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">En Attente</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeEvents.reduce((sum, e) => sum + e.invitations.filter(i => i.status === 'pending' || i.status === 'proposed').length, 0)}
                        </div>
                    </Card>
                </div>

                {/* Events List */}
                <div className="space-y-4">
                    {activeEvents.length > 0 ? (
                        activeEvents.map((event) => {
                            const stats = getEventStats(event);
                            const acceptanceRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

                            return (
                                <Link key={event.id} href={`/evenements-globaux/${event.id}`} className="block">
                                    <Card className="p-4 sm:p-6 hover:bg-white/[0.03] transition-colors cursor-pointer group relative overflow-visible">
                                        {/* Mobile: Menu in top right corner */}
                                        <div className="sm:hidden absolute top-4 right-4 z-20">
                                            <button
                                                onClick={(e) => toggleMenu(event.id, e)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {activeMenuId === event.id && (
                                                <div
                                                    ref={menuRef}
                                                    className="absolute top-12 right-0 w-48 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            router.push(`/evenements-globaux/${event.id}`);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                        Gérer
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleEditClick(event, e)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left border-t border-white/5"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteEvent(event.id, e)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left border-t border-white/5"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative z-10">
                                            <div className="flex-1 min-w-0 pr-12 sm:pr-0">
                                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">{event.eventName}</h3>

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/60 mb-3 sm:mb-4">
                                                    {event.eventDate && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(event.eventDate).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    )}
                                                    {event.eventLocation && (
                                                        <span>📍 {event.eventLocation}</span>
                                                    )}
                                                </div>

                                                {event.description && (
                                                    <p className="text-sm sm:text-base text-white/60 mb-3 sm:mb-4 line-clamp-2">{event.description}</p>
                                                )}

                                                {/* Stats Badges */}
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10">
                                                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white/60" />
                                                        <span className="text-xs sm:text-sm text-white">{stats.total} invitations</span>
                                                    </div>

                                                    {stats.accepted > 0 && (
                                                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                                                            <span className="text-xs sm:text-sm text-green-300">{stats.accepted} accepté{stats.accepted > 1 ? 's' : ''}</span>
                                                        </div>
                                                    )}

                                                    {stats.declined > 0 && (
                                                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                                                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                                                            <span className="text-xs sm:text-sm text-red-300">{stats.declined} refusé{stats.declined > 1 ? 's' : ''}</span>
                                                        </div>
                                                    )}

                                                    {stats.pending > 0 && (
                                                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                                                            <span className="text-xs sm:text-sm text-orange-300">{stats.pending} en attente</span>
                                                        </div>
                                                    )}

                                                    {stats.total > 0 && (
                                                        <div className="text-xs sm:text-sm text-white/40">
                                                            Taux d'acceptation: {acceptanceRate}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Desktop: Buttons on the right */}
                                            <div className="hidden sm:flex items-center gap-2 relative flex-shrink-0">
                                                <Button variant="secondary" className="pointer-events-none text-sm sm:text-base">
                                                    Gérer →
                                                </Button>

                                                <button
                                                    onClick={(e) => toggleMenu(event.id, e)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenuId === event.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute top-12 right-0 w-48 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={(e) => handleEditClick(event, e)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteEvent(event.id, e)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left border-t border-white/5"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="relative group cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-16 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <Calendar className="w-16 h-16 text-white/10 mb-4 group-hover:text-primary/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6 text-lg">Aucun événement global pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Créer votre premier événement
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal */}
                <CreateGlobalEventModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleSaveEvent}
                    eventToEdit={selectedEventToEdit}
                />
            </div>
        </main>
    );
}
