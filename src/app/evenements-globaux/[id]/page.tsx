'use client';

import { Fragment, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Menu, Transition } from '@headlessui/react';
import { GlobalEvent, GlobalData, PartnershipData, GlobalEventInvitation, LightweightPartner, InvitationStatus } from '@/types';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Users, Calendar, MoreVertical, ChevronDown, Download } from 'lucide-react';
import AddInvitationModal from '@/components/evenements-globaux/AddInvitationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GlobalEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<GlobalEvent | null>(null);
    const [partners, setPartners] = useState<PartnershipData[]>([]);
    const [lightweightPartners, setLightweightPartners] = useState<LightweightPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddInvitationModalOpen, setIsAddInvitationModalOpen] = useState(false);
    const [editingInvitation, setEditingInvitation] = useState<GlobalEventInvitation | undefined>(undefined);

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const [globalRes, partnersRes] = await Promise.all([
                fetch('/api/evenements-globaux'),
                fetch('/api/partenaires')
            ]);

            const globalData: GlobalData = await globalRes.json();
            const partnersData: PartnershipData[] = await partnersRes.json();

            const foundEvent = globalData.globalEvents.find(e => e.id === params.id);
            setEvent(foundEvent || null);
            setPartners(partnersData);
            setLightweightPartners(globalData.lightweightPartners);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: InvitationStatus) => {
        switch (status) {
            case 'accepted': return 'Accepté';
            case 'declined': return 'Refusé';
            case 'pending': return 'En attente';
            case 'proposed': return 'Proposé';
        }
    };

    const generatePDF = () => {
        if (!event) return;

        const doc = new jsPDF();

        // 1. Header & Branding
        doc.setFillColor(0, 82, 84); // Teal #005254
        doc.rect(0, 0, 210, 40, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(event.eventName, 14, 20);

        // Subtitle (Date & Location)
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
        doc.setTextColor(34, 197, 94); // Green
        doc.text(`Acceptés: ${stats.accepted}`, 60, yPos);
        doc.setTextColor(249, 115, 22); // Orange
        doc.text(`En attente: ${stats.pending}`, 100, yPos);
        doc.setTextColor(239, 68, 68); // Red
        doc.text(`Refusés: ${stats.declined}`, 140, yPos);

        // 3. Table
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
                0: { fontStyle: 'bold', cellWidth: 50 }, // Partner Name
                1: { cellWidth: 30 }, // Status
                2: { cellWidth: 50 }, // Guests
                3: { cellWidth: 'auto' } // Notes
            },
            didParseCell: function (data) {
                // Colorize Status column text
                if (data.section === 'body' && data.column.index === 1) {
                    const status = data.cell.raw;
                    if (status === 'Accepté') data.cell.styles.textColor = [34, 197, 94];
                    if (status === 'Refusé') data.cell.styles.textColor = [239, 68, 68];
                    if (status === 'En attente' || status === 'Proposé') data.cell.styles.textColor = [249, 115, 22];
                }
            }
        });

        // Footer
        // Footer
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

    const handleSaveInvitation = async (invitation: GlobalEventInvitation, lightweightPartner?: LightweightPartner) => {
        if (!event) return;

        try {
            let updatedInvitations: GlobalEventInvitation[];

            if (editingInvitation) {
                // Update existing invitation
                updatedInvitations = event.invitations.map(inv =>
                    inv.partnerId === invitation.partnerId ? invitation : inv
                );
            } else {
                // Add new invitation
                updatedInvitations = [...event.invitations, invitation];
            }

            const res = await fetch('/api/evenements-globaux', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: event.id,
                    invitations: updatedInvitations,
                    lightweightPartner
                })
            });

            if (!res.ok) throw new Error('Failed to save invitation');

            await fetchData();
            setEditingInvitation(undefined); // Reset editing state
        } catch (error) {
            console.error('Error saving invitation:', error);
            alert('Erreur lors de l\'enregistrement de l\'invitation');
        }
    };

    const handleEditInvitation = (invitation: GlobalEventInvitation) => {
        setEditingInvitation(invitation);
        setIsAddInvitationModalOpen(true);
    };

    const handleUpdateInvitationStatus = async (invitationId: string, newStatus: InvitationStatus) => {
        if (!event) return;

        try {
            const updatedInvitations = event.invitations.map(inv =>
                inv.partnerId === invitationId
                    ? { ...inv, status: newStatus, responseDate: newStatus !== 'proposed' ? new Date().toISOString() : inv.responseDate }
                    : inv
            );

            const res = await fetch('/api/evenements-globaux', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: event.id,
                    invitations: updatedInvitations
                })
            });

            if (!res.ok) throw new Error('Failed to update invitation');

            await fetchData();
        } catch (error) {
            console.error('Error updating invitation:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleRemoveInvitation = async (partnerId: string) => {
        if (!event || !confirm('Supprimer cette invitation ?')) return;

        try {
            const updatedInvitations = event.invitations.filter(inv => inv.partnerId !== partnerId);

            const res = await fetch('/api/evenements-globaux', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: event.id,
                    invitations: updatedInvitations
                })
            });

            if (!res.ok) throw new Error('Failed to remove invitation');

            await fetchData();
        } catch (error) {
            console.error('Error removing invitation:', error);
            alert('Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Chargement...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-12 text-center">
                    <p className="text-white text-xl mb-4">Événement non trouvé</p>
                    <Button onClick={() => router.push('/evenements-globaux')}>
                        Retour aux événements
                    </Button>
                </Card>
            </div>
        );
    }

    const stats = {
        total: event.invitations.length,
        accepted: event.invitations.filter(i => i.status === 'accepted').length,
        declined: event.invitations.filter(i => i.status === 'declined').length,
        pending: event.invitations.filter(i => i.status === 'pending' || i.status === 'proposed').length
    };

    const getStatusColor = (status: InvitationStatus) => {
        switch (status) {
            case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'declined': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'pending': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'proposed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/evenements-globaux')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux événements
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={generatePDF}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Exporter PDF
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => setIsAddInvitationModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Inviter un partenaire
                        </Button>
                    </div>
                </div>

                {/* Event Info */}
                <Card className="p-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-white">{event.eventName}</h1>

                        <div className="flex flex-wrap items-center gap-4 text-white/60">
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
                            <p className="text-white/70 text-lg">{event.description}</p>
                        )}
                    </div>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-white/70 text-sm">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.total}</div>
                    </Card>

                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-white/70 text-sm">Accepté</span>
                        </div>
                        <div className="text-3xl font-bold text-green-400">{stats.accepted}</div>
                    </Card>

                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock className="w-5 h-5 text-orange-400" />
                            <span className="text-white/70 text-sm">En attente</span>
                        </div>
                        <div className="text-3xl font-bold text-orange-400">{stats.pending}</div>
                    </Card>

                    <Card className="p-6 stat-card-premium">
                        <div className="flex items-center gap-3 mb-3">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-white/70 text-sm">Refusé</span>
                        </div>
                        <div className="text-3xl font-bold text-red-400">{stats.declined}</div>
                    </Card>
                </div>

                {/* Invitations List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Invitations</h2>

                    {event.invitations.length > 0 ? (
                        <div className="space-y-3">
                            {[...event.invitations].sort((a, b) => a.partnerName.localeCompare(b.partnerName)).map((invitation) => (
                                <Card key={invitation.partnerId} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white">{invitation.partnerName}</h3>
                                            <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                                                <span>Proposé le {new Date(invitation.proposalDate).toLocaleDateString('fr-FR')}</span>
                                                {invitation.responseDate && (
                                                    <span>• Réponse le {new Date(invitation.responseDate).toLocaleDateString('fr-FR')}</span>
                                                )}
                                            </div>

                                            {invitation.guests && invitation.guests.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <div className="text-sm text-white/40 mr-1">Invités :</div>
                                                    {invitation.guests.map((guest, idx) => (
                                                        <span key={idx} className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/5">
                                                            {guest}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {invitation.notes && (
                                                <p className="text-sm text-white/50 mt-2">{invitation.notes}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <select
                                                    value={invitation.status}
                                                    onChange={(e) => handleUpdateInvitationStatus(invitation.partnerId, e.target.value as InvitationStatus)}
                                                    className={`appearance-none pl-4 pr-10 py-1.5 rounded-full text-sm border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 ${getStatusColor(invitation.status)}`}
                                                >
                                                    <option value="proposed">Proposé</option>
                                                    <option value="pending">En attente</option>
                                                    <option value="accepted">Accepté</option>
                                                    <option value="declined">Refusé</option>
                                                </select>
                                                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-70 ${invitation.status === 'accepted' ? 'text-green-300' : invitation.status === 'declined' ? 'text-red-300' : invitation.status === 'pending' ? 'text-orange-300' : 'text-blue-300'}`} />
                                            </div>

                                            <Menu as="div" className="relative">
                                                <Menu.Button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Menu.Button>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-[#1A1A1A] border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100] overflow-hidden">
                                                        <div className="p-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleEditInvitation(invitation)}
                                                                        className={`${active ? 'bg-white/10 text-white' : 'text-white/70'
                                                                            } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                        Modifier
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleRemoveInvitation(invitation.partnerId)}
                                                                        className={`${active ? 'bg-red-500/20 text-red-400' : 'text-red-400/70'
                                                                            } group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors mt-1`}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Supprimer
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 mb-4">Aucune invitation pour le moment</p>
                            <Button onClick={() => {
                                setEditingInvitation(undefined);
                                setIsAddInvitationModalOpen(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Inviter un partenaire
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Modal */}
                <AddInvitationModal
                    isOpen={isAddInvitationModalOpen}
                    onClose={() => {
                        setIsAddInvitationModalOpen(false);
                        setEditingInvitation(undefined);
                    }}
                    onSave={handleSaveInvitation}
                    existingPartners={partners}
                    lightweightPartners={lightweightPartners}
                    event={event}
                    editingInvitation={editingInvitation}
                />
            </div>
        </main>
    );
}
