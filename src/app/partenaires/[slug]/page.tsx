'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PartnershipData, Publication, Partner, QualifiedIntroduction, Event, QuarterlyReport, MonthlyCheckIn, GlobalEvent } from '@/types';
import EditPartnerModal from '@/components/partenaires/EditPartnerModal';
import AddIntroductionModal from '@/components/partenaires/AddIntroductionModal';
import AddPublicationModal from '@/components/partenaires/AddPublicationModal';
import AddEventModal from '@/components/partenaires/AddEventModal';
import AddQuarterlyReportModal from '@/components/partenaires/AddQuarterlyReportModal';
import AddMonthlyCheckInModal from '@/components/partenaires/AddMonthlyCheckInModal';
import PublicationScreenshots from '@/components/partenaires/PublicationScreenshots';
import APIStatusModal from '@/components/diagnostics/APIStatusModal';
import { useToast } from '@/lib/toast';
import * as XLSX from 'xlsx';
import {
    Plus,
    Trash2,
    MapPin,
    ArrowLeft,
    AlertTriangle,
    FileText,
    Settings,
    Users,
    Calendar,
    TrendingUp,
    Edit,
    ExternalLink,
    Sparkles,
    Send,
    MoreVertical,
    Home
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ConfirmDeleteModal from '@/components/partenaires/ConfirmDeleteModal';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, toSafeDate } from '@/lib/date-utils';

export default function PartnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [partnership, setPartnership] = useState<PartnershipData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // New Modal States
    const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
    const [editingIntroduction, setEditingIntroduction] = useState<QualifiedIntroduction | null>(null);

    const [isPubModalOpen, setIsPubModalOpen] = useState(false);
    const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<QuarterlyReport | null>(null);

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [editingCheckIn, setEditingCheckIn] = useState<MonthlyCheckIn | null>(null);

    // Delete State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'introduction' | 'event' | 'publication' | 'report' | 'checkIn';
        id: string;
        title: string;
    }>({
        isOpen: false,
        type: 'introduction',
        id: '',
        title: ''
    });

    // AI Summarizer State
    const [poText, setPoText] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [isPoInputOpen, setIsPoInputOpen] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editedSummary, setEditedSummary] = useState('');
    const [invitedGlobalEvents, setInvitedGlobalEvents] = useState<GlobalEvent[]>([]);

    // API Status Modal
    const [isAPIStatusModalOpen, setIsAPIStatusModalOpen] = useState(false);

    // PDF Generation State
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);



    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleExportPDF = async () => {
        if (!partnership) return;
        setIsGeneratingPDF(true);

        try {
            const doc = new jsPDF();
            const partner = partnership.partner;

            // Helper function to convert image URL to base64
            const getDataUrl = (url: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg'));
                        } else {
                            reject(new Error('Canvas context not available'));
                        }
                    };
                    img.onerror = (error) => reject(error);
                    img.src = url;
                });
            };

            // 1. Header & Branding
            doc.setFillColor(0, 82, 84); // Teal #005254
            doc.rect(0, 0, 210, 40, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(partner.name, 14, 20);

            // Subtitle
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            let subtitle = `${partner.type === 'strategique' ? 'Partenaire Stratégique' : 'Ambassadeur'}`;
            if (partner.startDate) {
                subtitle += ` • Depuis le ${formatDate(partner.startDate)}`;
            }
            doc.text(subtitle, 14, 30);

            let yPos = 50;

            // Helper for Section Headers
            const addSectionHeader = (title: string, forceNewPage = false) => {
                if (yPos > 250 || forceNewPage) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setTextColor(60, 60, 60);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 14, yPos);
                yPos += 10;
            };

            // Helper for Tables
            const createTable = (head: string[], body: any[][]) => {
                autoTable(doc, {
                    startY: yPos,
                    head: [head],
                    body: body,
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
                    margin: { top: 20 },
                    pageBreak: 'auto'
                });

                // Update yPos for next element
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;
            };

            // --- 1. Introductions ---
            if (partnership.introductions && partnership.introductions.length > 0) {
                const activeIntros = partnership.introductions
                    .filter(i => !i.deletedAt)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (activeIntros.length > 0) {
                    addSectionHeader('Mises en relation');
                    const introData = activeIntros.map(i => [
                        formatDate(i.date),
                        i.contactName,
                        i.company,
                        i.status === 'signed' ? 'Signé' :
                            i.status === 'negotiating' ? 'En négo.' :
                                i.status === 'not_interested' ? 'Refusé' : 'En attente'
                    ]);
                    createTable(['Date', 'Contact', 'Entreprise', 'Statut'], introData);
                }
            }

            // --- 2. Événements ---
            if (partnership.events && partnership.events.length > 0) {
                const activeEvents = partnership.events
                    .filter(e => !e.deletedAt)
                    .sort((a, b) => {
                        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                        return dateB - dateA;
                    });

                if (activeEvents.length > 0) {
                    addSectionHeader('Événements');
                    const eventData = activeEvents.map(e => [
                        e.eventDate ? formatDate(e.eventDate) : '-',
                        e.eventName,
                        e.eventLocation || '-',
                        e.status === 'accepted' ? 'Accepté' : e.status === 'declined' ? 'Refusé' : 'En attente'
                    ]);
                    createTable(['Date', 'Événement', 'Lieu', 'Statut'], eventData);
                }
            }

            // --- 3. Publications ---
            let activePubs: Publication[] = [];
            if (partnership.publications && partnership.publications.length > 0) {
                // Filter and sort by date descending
                activePubs = partnership.publications
                    .filter(p => !p.deletedAt)
                    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());

                if (activePubs.length > 0) {
                    addSectionHeader('Publications');

                    // Pre-fetch images
                    const pubImages: { [key: string]: string } = {};
                    for (const pub of activePubs) {
                        if (pub.screenshotUrls && pub.screenshotUrls.length > 0) {
                            try {
                                // Take the first screenshot
                                const base64 = await getDataUrl(pub.screenshotUrls[0]);
                                pubImages[pub.id] = base64;
                            } catch (e) {
                                console.error('Failed to load image for pub', pub.id, e);
                            }
                        }
                    }

                    const pubData = activePubs.map(p => ({
                        date: formatDate(p.publicationDate),
                        platform: p.platform,
                        link: p.links && p.links.length > 0 ? 'Cliquez ici' : '',
                        visual: '',
                        id: p.id, // Hidden ID for lookup
                        url: p.links && p.links.length > 0 ? p.links[0] : null // URL for click
                    }));

                    autoTable(doc, {
                        startY: yPos,
                        columns: [
                            { header: 'Date', dataKey: 'date' },
                            { header: 'Plateforme', dataKey: 'platform' },
                            { header: 'Lien', dataKey: 'link' },
                            { header: 'Visuel', dataKey: 'visual' }
                        ],
                        body: pubData,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [0, 82, 84],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold'
                        },
                        styles: {
                            fontSize: 9,
                            cellPadding: 3,
                            valign: 'middle',
                            overflow: 'linebreak',
                            minCellHeight: 80 // Enforce minimum height for ALL rows
                        },
                        columnStyles: {
                            date: { cellWidth: 25 },
                            platform: { cellWidth: 30 },
                            link: { cellWidth: 30, textColor: [0, 0, 255], halign: 'center' }, // Blue text, centered
                            visual: { cellWidth: 95 } // Double size images
                        },
                        didDrawCell: (data) => {
                            // Handle Link Click
                            if (data.section === 'body' && data.column.dataKey === 'link') {
                                const rowData = data.row.raw as any;
                                if (rowData.url) {
                                    doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: rowData.url });
                                }
                            }

                            // Handle Visual Image
                            // Defensive check: ensure we are in the body and the correct visual column (index 3)
                            if (data.section === 'body' && data.column.dataKey === 'visual' && data.column.index === 3) {
                                const rowData = data.row.raw as any;
                                const image = pubImages[rowData.id];

                                if (image) {
                                    try {
                                        const imgProps = doc.getImageProperties(image);
                                        // Padding should match styles
                                        const padding = 3;
                                        const cellWidth = data.cell.width - (padding * 2);
                                        const cellHeight = data.cell.height - (padding * 2);

                                        // Skip if cell geometry is invalid (e.g. during calculation passes if any)
                                        if (cellWidth <= 0 || cellHeight <= 0) return;

                                        // Calculate dimensions to fit in cell (contain)
                                        let imgW = cellWidth;
                                        let imgH = (imgProps.height * imgW) / imgProps.width;

                                        if (imgH > cellHeight) {
                                            imgH = cellHeight;
                                            imgW = (imgProps.width * imgH) / imgProps.height;
                                        }

                                        // Center image
                                        const x = data.cell.x + padding + (cellWidth - imgW) / 2;
                                        const y = data.cell.y + padding + (cellHeight - imgH) / 2;

                                        // Extra safety: only draw if within reasonable page bounds
                                        const pageWidth = doc.internal.pageSize.width;
                                        if (x >= 0 && x + imgW <= pageWidth) {
                                            doc.addImage(image, 'JPEG', x, y, imgW, imgH);
                                        }
                                    } catch (e) {
                                        console.error('Error drawing image', e);
                                    }
                                }
                            }
                        },
                        margin: { top: 20 },
                        pageBreak: 'auto'
                    });

                    // Update yPos for next element
                    // @ts-ignore
                    yPos = doc.lastAutoTable.finalY + 15;
                }
            }

            // --- 4. Rapports Trimestriels ---
            if (partnership.quarterlyReports && partnership.quarterlyReports.length > 0) {
                const activeReports = partnership.quarterlyReports
                    .filter(r => !r.deletedAt)
                    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

                if (activeReports.length > 0) {
                    addSectionHeader('Rapports Trimestriels');
                    const reportData = activeReports.map(r => [
                        formatDate(r.reportDate),
                        r.link
                    ]);
                    createTable(['Date', 'Lien'], reportData);
                }
            }

            // --- 5. Points Mensuels ---
            if (partnership.monthlyCheckIns && partnership.monthlyCheckIns.length > 0) {
                const activeCheckIns = partnership.monthlyCheckIns
                    .filter(c => !c.deletedAt)
                    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

                if (activeCheckIns.length > 0) {
                    addSectionHeader('Points Mensuels');
                    const checkInData = activeCheckIns.map(c => [
                        formatDate(c.checkInDate),
                        c.notes || '-'
                    ]);
                    createTable(['Mois', 'Notes'], checkInData);
                }
            }

            // --- 6. Informations de Contact ---
            addSectionHeader('Informations complémentaires');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            let contactInfo = [];
            if (partner.contactPerson?.name) contactInfo.push(`Contact: ${partner.contactPerson.name}`);
            if (partner.contactPerson?.email) contactInfo.push(`Email: ${partner.contactPerson.email}`);
            if (partner.commissionClient) contactInfo.push(`Commission Client: ${partner.commissionClient}%`);
            if (partner.commissionConsulting) contactInfo.push(`Commission Consulting: ${partner.commissionConsulting}%`);

            contactInfo.forEach(line => {
                doc.text(line, 14, yPos);
                yPos += 7;
            });

            if (partner.companyHubspotUrl || partner.contactPerson?.hubspotUrl) {
                yPos += 3;
                doc.setTextColor(0, 100, 255);
                if (partner.companyHubspotUrl) {
                    doc.text('Lien HubSpot Société', 14, yPos);
                    yPos += 7;
                }
                if (partner.contactPerson?.hubspotUrl) {
                    doc.text('Lien HubSpot Contact', 14, yPos);
                    yPos += 7;
                }
            }

            // --- 7. Screenshots des Publications ---
            const pubsWithScreenshots = activePubs.filter(p => p.screenshotUrls && p.screenshotUrls.length > 0);


            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            const now = formatDate(new Date());
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Généré le ${now} • Suivi Partenariats - E=MC2 Consulting`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Page ${i} / ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
            }

            // Save
            const fileName = `${partnership.partner.name.replace(/\s+/g, '_')}_Rapport.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert("Erreur lors de la génération du PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Helper for updating partnership state
    const updatePartnershipState = (updates: Partial<PartnershipData>) => {
        setPartnership(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleDeleteIntent = (type: 'introduction' | 'event' | 'publication' | 'report' | 'checkIn', id: string, title: string) => {
        setDeleteConfirmation({
            isOpen: true,
            type,
            id,
            title
        });
    };

    const handleConfirmDelete = async () => {
        if (!partnership) return;
        const { type, id } = deleteConfirmation;
        const now = new Date().toISOString();

        try {
            let updates: Partial<PartnershipData> = {};

            if (type === 'introduction') {
                const newIntros = partnership.introductions.map(i =>
                    i.id === id ? { ...i, deletedAt: now } : i
                );
                updates = { introductions: newIntros };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, introductions: newIntros }),
                });
            } else if (type === 'event') {
                const newEvents = partnership.events.map(e =>
                    e.id === id ? { ...e, deletedAt: now } : e
                );
                updates = { events: newEvents };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, events: newEvents }),
                });
            } else if (type === 'publication') {
                const newPubs = partnership.publications.map(p =>
                    p.id === id ? { ...p, deletedAt: now } : p
                );
                updates = { publications: newPubs };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, publications: newPubs }),
                });
            } else if (type === 'report') {
                const newReports = (partnership.quarterlyReports || []).map(r =>
                    r.id === id ? { ...r, deletedAt: now } : r
                );
                updates = { quarterlyReports: newReports };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: newReports }),
                });
            } else if (type === 'checkIn') {
                const newCheckIns = (partnership.monthlyCheckIns || []).map(c =>
                    c.id === id ? { ...c, deletedAt: now } : c
                );
                updates = { monthlyCheckIns: newCheckIns };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, monthlyCheckIns: newCheckIns }),
                });
            }

            updatePartnershipState(updates);
            setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleRestore = async (type: 'introduction' | 'event' | 'publication' | 'report' | 'checkIn', id: string) => {
        if (!partnership) return;

        try {
            let updates: Partial<PartnershipData> = {};

            if (type === 'introduction') {
                const newIntros = partnership.introductions.map(i =>
                    i.id === id ? { ...i, deletedAt: undefined } : i
                );
                updates = { introductions: newIntros };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, introductions: newIntros }),
                });
            } else if (type === 'event') {
                const newEvents = partnership.events.map(e =>
                    e.id === id ? { ...e, deletedAt: undefined } : e
                );
                updates = { events: newEvents };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, events: newEvents }),
                });
            } else if (type === 'publication') {
                const newPubs = partnership.publications.map(p =>
                    p.id === id ? { ...p, deletedAt: undefined } : p
                );
                updates = { publications: newPubs };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, publications: newPubs }),
                });
            } else if (type === 'report') {
                const newReports = (partnership.quarterlyReports || []).map(r =>
                    r.id === id ? { ...r, deletedAt: undefined } : r
                );
                updates = { quarterlyReports: newReports };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: newReports }),
                });
            } else if (type === 'checkIn') {
                const newCheckIns = (partnership.monthlyCheckIns || []).map(c =>
                    c.id === id ? { ...c, deletedAt: undefined } : c
                );
                updates = { monthlyCheckIns: newCheckIns };
                await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, monthlyCheckIns: newCheckIns }),
                });
            }

            updatePartnershipState(updates);
        } catch (error) {
            console.error('Error restoring item:', error);
            alert('Erreur lors de la restauration');
        }
    };

    useEffect(() => {
        async function fetchPartnership() {
            try {
                const res = await fetch('/api/partenaires');
                const data: PartnershipData[] = await res.json();
                const found = data.find(p => p.partner.id === params.slug || p.partner.slug === params.slug);
                setPartnership(found || null);

                if (found) {
                    try {
                        const globalEventsRes = await fetch('/api/evenements-globaux');
                        if (globalEventsRes.ok) {
                            const data = await globalEventsRes.json();
                            const allGlobalEvents = data.globalEvents || [];
                            if (Array.isArray(allGlobalEvents)) {
                                const relatedEvents = allGlobalEvents.filter((event: GlobalEvent) => {
                                    if (!event.invitations || !Array.isArray(event.invitations)) {
                                        console.warn("Event with invalid invitations:", event);
                                        return false;
                                    }
                                    return event.invitations.some(inv => inv.partnerId === found.partner.id)
                                });
                                setInvitedGlobalEvents(relatedEvents);
                            } else {
                                console.error('Expected array of global events, received:', allGlobalEvents);
                                setInvitedGlobalEvents([]);
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching global events:', error);
                    }
                }
            } catch (error) {
                console.error('Error fetching partnership:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPartnership();
    }, [params.slug]);

    const getDaysRemaining = (endDate: string) => {
        const end = toSafeDate(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleUpdatePublicationDate = async (publicationId: string) => {
        alert('Fonctionnalité de mise à jour manuelle - À implémenter avec un formulaire');
    };

    const handleSavePartner = async (updatedPartner: Partner) => {
        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: partnership?.partner.id,
                    partner: updatedPartner
                }),
            });
            if (!res.ok) throw new Error('Failed to update partner');
            setPartnership(prev => prev ? { ...prev, partner: updatedPartner } : null);
            showToast('success', 'Modifications enregistrées');
        } catch (error) {
            console.error('Error updating partner:', error);
            showToast('error', 'Erreur lors de la sauvegarde du partenaire');
        }
    };

    // New Handlers
    const handleSaveIntroduction = async (intro: QualifiedIntroduction) => {
        if (!partnership) return;

        let updatedIntros = [...partnership.introductions];
        const index = updatedIntros.findIndex(i => i.id === intro.id);

        if (index >= 0) {
            updatedIntros[index] = intro;
        } else {
            updatedIntros = [...updatedIntros, intro];
        }

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, introductions: updatedIntros }),
            });
            if (!res.ok) throw new Error('Failed to save introduction');
            setPartnership(prev => prev ? { ...prev, introductions: updatedIntros } : null);
            showToast('success', 'Introduction enregistrée avec succès');
        } catch (error) {
            console.error('Error saving introduction:', error);
            showToast('error', 'Erreur lors de l\'enregistrement de l\'introduction');
        }
    };

    const handleUpdateIntroductionStatus = async (intro: QualifiedIntroduction, newStatus: 'pending' | 'negotiating' | 'signed' | 'not_interested') => {
        if (!partnership) return;

        // Optimistic update
        const updatedIntro = { ...intro, status: newStatus, contractSigned: newStatus === 'signed' };
        const updatedIntros = partnership.introductions.map(i => i.id === intro.id ? updatedIntro : i);

        // Update local state immediately
        setPartnership(prev => prev ? { ...prev, introductions: updatedIntros } : null);

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, introductions: updatedIntros }),
            });

            if (!res.ok) {
                throw new Error('Failed to update introduction status');
            }
            showToast('success', 'Statut mis à jour');
        } catch (error) {
            console.error('Error updating introduction status:', error);
            showToast('error', 'Erreur lors de la mise à jour du statut');
            // Revert state if needed
            const res = await fetch('/api/partenaires');
            const data: PartnershipData[] = await res.json();
            const found = data.find(p => p.partner.id === params.slug || p.partner.slug === params.slug);
            setPartnership(found || null);
        }
    };

    const handleSavePublication = async (pub: Publication) => {
        if (!partnership) return;

        let updatedPubs = [...partnership.publications];
        const index = updatedPubs.findIndex(p => p.id === pub.id);

        if (index >= 0) {
            updatedPubs[index] = pub;
        } else {
            updatedPubs = [...updatedPubs, pub];
        }

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, publications: updatedPubs }),
            });
            if (!res.ok) throw new Error('Failed to save publication');
            setPartnership(prev => prev ? { ...prev, publications: updatedPubs } : null);
            showToast('success', 'Publication enregistrée avec succès');
        } catch (error) {
            console.error('Error saving publication:', error);
            showToast('error', 'Erreur lors de l\'enregistrement de la publication');
        }
    };

    const handleSaveEvent = async (event: Event) => {
        if (!partnership) return;

        let updatedEvents = [...partnership.events];
        const index = updatedEvents.findIndex(e => e.id === event.id);

        if (index >= 0) {
            updatedEvents[index] = event;
        } else {
            updatedEvents = [...updatedEvents, event];
        }

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, events: updatedEvents }),
            });
            if (!res.ok) throw new Error('Failed to save event');
            setPartnership(prev => prev ? { ...prev, events: updatedEvents } : null);
            showToast('success', 'Événement enregistré avec succès');
        } catch (error) {
            console.error('Error saving event:', error);
            showToast('error', 'Erreur lors de l\'enregistrement de l\'événement');
        }
    };

    const handleUpdateEventStatus = async (event: Event, newStatus: 'pending' | 'accepted' | 'declined') => {
        if (!partnership) return;

        // Optimistic update
        const updatedEvent = { ...event, status: newStatus, attended: newStatus === 'accepted' };
        const updatedEvents = partnership.events.map(e => e.id === event.id ? updatedEvent : e);

        // Update local state immediately
        setPartnership(prev => prev ? { ...prev, events: updatedEvents } : null);

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, events: updatedEvents }),
            });

            if (!res.ok) {
                throw new Error('Failed to update event status');
            }
            showToast('success', 'Statut de l\'événement mis à jour');
        } catch (error) {
            console.error('Error updating event status:', error);
            showToast('error', 'Erreur lors de la mise à jour du statut');
            // Revert state if needed (could re-fetch or use previous state)
            const res = await fetch('/api/partenaires');
            const data: PartnershipData[] = await res.json();
            const found = data.find(p => p.partner.id === params.slug || p.partner.slug === params.slug);
            setPartnership(found || null);
        }
    };

    const handleSaveQuarterlyReport = async (report: QuarterlyReport) => {
        if (!partnership) return;

        let updatedReports = partnership.quarterlyReports ? [...partnership.quarterlyReports] : [];
        const index = updatedReports.findIndex(r => r.id === report.id);

        if (index >= 0) {
            updatedReports[index] = report;
        } else {
            updatedReports = [...updatedReports, report];
        }

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: updatedReports }),
            });
            if (!res.ok) throw new Error('Failed to save report');
            setPartnership(prev => prev ? { ...prev, quarterlyReports: updatedReports } : null);
            showToast('success', 'Rapport trimestriel enregistré avec succès');
        } catch (error) {
            console.error('Error saving report:', error);
            showToast('error', 'Erreur lors de l\'enregistrement du rapport');
        }
    };

    const handleSaveMonthlyCheckIn = async (checkIn: MonthlyCheckIn) => {
        if (!partnership) return;

        let updatedCheckIns = partnership.monthlyCheckIns ? [...partnership.monthlyCheckIns] : [];
        const index = updatedCheckIns.findIndex(c => c.id === checkIn.id);

        if (index >= 0) {
            updatedCheckIns[index] = checkIn;
        } else {
            updatedCheckIns = [...updatedCheckIns, checkIn];
        }

        try {
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, monthlyCheckIns: updatedCheckIns }),
            });
            if (!res.ok) throw new Error('Failed to save monthly check-in');
            setPartnership(prev => prev ? { ...prev, monthlyCheckIns: updatedCheckIns } : null);
            showToast('success', 'Point mensuel enregistré avec succès');
        } catch (error) {
            console.error('Error saving monthly check-in:', error);
            showToast('error', 'Erreur lors de l\'enregistrement du point mensuel');
        }
    };

    const handleExportExcel = async () => {
        if (!partnership) return;

        const wb = XLSX.utils.book_new();

        // 1. Introductions Qualifiées (exclude deleted items)
        const introsData = partnership.introductions
            .filter(i => !i.deletedAt)
            .map(i => ({
                "Date d'introduction": formatDate(i.date),
                "Nom et prénom": i.contactName,
                "Entreprise": i.company,
                "Contrat signé": i.contractSigned ? 'Oui' : 'Non'
            }));
        const wsIntros = XLSX.utils.json_to_sheet(introsData);
        XLSX.utils.book_append_sheet(wb, wsIntros, "Introductions qualifiées");

        // 2. Invitations évènements (exclude deleted items)
        const eventsData = partnership.events
            .filter(e => !e.deletedAt)
            .map(e => ({
                "Date de proposition": formatDate(e.proposalDate),
                "Date évènement": e.eventDate ? formatDate(e.eventDate) : 'N/A',
                "Nom évènement": e.eventName,
                "Présent à l'évènement": e.attended ? 'Oui' : 'Non'
            }));
        const wsEvents = XLSX.utils.json_to_sheet(eventsData);
        XLSX.utils.book_append_sheet(wb, wsEvents, "Invitations évènements");

        // 3. Publications (exclude deleted items)
        const pubsData = partnership.publications
            .filter(p => !p.deletedAt)
            .map(p => ({
                "Date publication": formatDate(p.publicationDate),
                "Plateforme": p.platform,
                "Lien": p.links ? p.links.join(', ') : '',
                "Date de rapport statistiques": p.statsReportDate ? formatDate(p.statsReportDate) : 'Non renseigné'
            }));
        const wsPubs = XLSX.utils.json_to_sheet(pubsData);
        XLSX.utils.book_append_sheet(wb, wsPubs, "Publications");

        // 4. Compte rendu trimestriel (exclude deleted items)
        const reportsData = (partnership.quarterlyReports || [])
            .filter(r => !r.deletedAt)
            .map(r => ({
                "Date de rendu": formatDate(r.reportDate),
            }));
        const wsReports = XLSX.utils.json_to_sheet(reportsData);
        XLSX.utils.book_append_sheet(wb, wsReports, "Compte rendu trimestriel");

        // 5. Points Mensuels (exclude deleted items)
        const checkInsData = (partnership.monthlyCheckIns || [])
            .filter(c => !c.deletedAt)
            .map(c => ({
                "Date du point": formatDate(c.checkInDate),
                "Notes": c.notes || 'N/A'
            }));
        const wsCheckIns = XLSX.utils.json_to_sheet(checkInsData);
        XLSX.utils.book_append_sheet(wb, wsCheckIns, "Points Mensuels");

        const fileName = `${partnership.partner.name.replace(/\\s+/g, '_')}_Suivi_Partenariat.xlsx`;

        try {
            const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

            const saveResponse = await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, fileData: excelBase64 })
            });

            const saveData = await saveResponse.json();
            if (saveData.success) {
                alert(`Excel sauvegardé : ${saveData.path}`);
            } else {
                throw new Error(saveData.error);
            }
        } catch (error) {
            console.error('Excel Export Failed:', error);
            alert("Erreur lors de l'export Excel");
        }
    };

    const handleSummarizePO = async () => {
        if (!poText.trim()) return;
        setIsAILoading(true);
        try {
            const res = await fetch('/api/ai/summarize-po', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ poContent: poText }),
            });
            const data = await res.json();
            if (data.summary) {
                // Update local state and save to Supabase
                const updatedPartner = { ...partnership!.partner, servicesSummary: data.summary };
                const resSave = await fetch('/api/partenaires', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership!.partner.id, partner: updatedPartner }),
                });
                if (resSave.ok) {
                    setPartnership(prev => prev ? { ...prev, partner: updatedPartner } : null);
                    setIsPoInputOpen(false);
                    setPoText('');
                } else {
                    alert('Erreur lors de la sauvegarde du résumé');
                }
            } else {
                throw new Error(data.error || 'Erreur inconnue');
            }
        } catch (error: any) {
            console.error('AI Summary Error:', error);
            alert(`Erreur IA : ${error.message}`);
        } finally {
            setIsAILoading(false);
        }
    };

    const handleUpdateSummary = async (newSummary: string) => {
        try {
            const updatedPartner = { ...partnership!.partner, servicesSummary: newSummary };
            const res = await fetch('/api/partenaires', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership!.partner.id, partner: updatedPartner }),
            });
            if (res.ok) {
                setPartnership(prev => prev ? { ...prev, partner: updatedPartner } : null);
            }
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    };

    const handleOpenAPIStatus = () => {
        setIsAPIStatusModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Chargement...</div>
            </div>
        );
    }

    if (!partnership) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-12 text-center">
                    <p className="text-white text-xl mb-4">Partenariat non trouvé</p>
                    <Button onClick={() => router.push('/')}>
                        Retour à l'accueil
                    </Button>
                </Card>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining(partnership.partner.endDate);
    let alertConfig = null;

    if (daysRemaining <= 15) {
        alertConfig = {
            color: 'bg-red-500/20 border-red-500/50 text-red-200',
            iconColor: 'text-red-400',
            message: `⚠️ Attention : Fin du partenariat dans ${daysRemaining} jours (J-${daysRemaining})`
        };
    } else if (daysRemaining <= 30) {
        alertConfig = {
            color: 'bg-orange-500/20 border-orange-500/50 text-orange-200',
            iconColor: 'text-orange-400',
            message: `🔸 Rappel : Dernier mois du partenariat (${daysRemaining} jours restants)`
        };
    } else if (daysRemaining <= 60) {
        alertConfig = {
            color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
            iconColor: 'text-yellow-400',
            message: `📅 Note : Fin du partenariat dans moins de 2 mois (${daysRemaining} jours)`
        };
    }

    const activeIntroductions = partnership.introductions.filter(i => !i.deletedAt);
    const activeEvents = partnership.events
        .filter(e => !e.deletedAt)
        .sort((a, b) => new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime());
    const activePublications = partnership.publications.filter(p => !p.deletedAt);
    const activeReports = (partnership.quarterlyReports || []).filter(r => !r.deletedAt);
    const activeCheckIns = (partnership.monthlyCheckIns || []).filter(c => !c.deletedAt);

    return (
        <main className="min-h-screen p-4 sm:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8">
                {alertConfig && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${alertConfig.color}`}>
                        <AlertTriangle className={`w-6 h-6 ${alertConfig.iconColor}`} />
                        <span className="font-semibold">{alertConfig.message}</span>
                    </div>
                )}

                {/* Header */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/partenaires')}
                            className="flex items-center gap-2 text-sm sm:text-base w-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Gestion des partenariats</span>
                        </Button>

                        {/* Desktop: All buttons visible */}
                        <div className="hidden sm:flex gap-2 flex-wrap">
                            <Button
                                variant="secondary"
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 text-sm"
                                title="Exporter en Excel"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleExportPDF}
                                disabled={isGeneratingPDF}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-sm"
                                title="Exporter en PDF"
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="hidden sm:inline">Génération...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4" />
                                        <span className="hidden sm:inline">PDF</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 text-sm"
                                title="Éditer le client"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Éditer</span>
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    if (confirm('Supprimer ce partenaire ? Il sera envoyé dans la corbeille.')) {
                                        try {
                                            const res = await fetch(`/api/partenaires?id=${partnership.partner.id}`, { method: 'DELETE' });
                                            if (res.ok) router.push('/partenaires');
                                        } catch (e) { console.error(e); }
                                    }
                                }}
                                className="flex items-center justify-center p-2 text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={handleOpenAPIStatus}
                                className="flex items-center justify-center p-2"
                                title="Tester les APIs"
                            >
                                <Sparkles className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/')}
                                className="flex items-center justify-center p-2"
                                title="Accueil"
                            >
                                <Home className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Mobile: Collapsible menu */}
                        <div className="sm:hidden flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/')}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
                                title="Accueil"
                            >
                                <Home className="w-5 h-5" />
                            </Button>

                            <Menu as="div" className="relative">
                                <Menu.Button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
                                    <MoreVertical className="w-5 h-5" />
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
                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleExportPDF}
                                                    disabled={isGeneratingPDF}
                                                    className={`${active ? 'bg-white/5' : ''} w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white transition-colors text-left border-t border-white/5 disabled:opacity-50`}
                                                >
                                                    {isGeneratingPDF ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Génération PDF...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="w-4 h-4" />
                                                            Exporter PDF
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => setIsEditModalOpen(true)}
                                                    className={`${active ? 'bg-white/5' : ''} w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white transition-colors text-left border-t border-white/5`}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Éditer
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleOpenAPIStatus}
                                                    className={`${active ? 'bg-white/5' : ''} w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white transition-colors text-left border-t border-white/5`}
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    Tester API
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Supprimer ce partenaire ? Il sera envoyé dans la corbeille.')) {
                                                            try {
                                                                const res = await fetch(`/api/partenaires?id=${partnership.partner.id}`, { method: 'DELETE' });
                                                                if (res.ok) router.push('/partenaires');
                                                            } catch (e) { console.error(e); }
                                                        }
                                                    }}
                                                    className={`${active ? 'bg-red-500/10' : ''} w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors text-left border-t border-white/5`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Supprimer
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display break-words">
                                    {partnership.partner.name}
                                </h1>
                                {partnership.partner.type && (
                                    <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border backdrop-blur-md shadow-sm whitespace-nowrap self-start ${partnership.partner.type === 'ambassadeur'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10'
                                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                                        }`}>
                                        {partnership.partner.type === 'ambassadeur' ? 'Ambassadeur' : 'Partenariat stratégique'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm sm:text-base lg:text-xl text-white/60 mt-2">
                                {partnership.partner.duration} • {partnership.partner.commissionClient || 0}% client • {partnership.partner.commissionConsulting || 0}% E=MC² Consulting
                            </p>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-xs sm:text-sm">
                                {partnership.partner.companyHubspotUrl && (
                                    <a
                                        href={partnership.partner.companyHubspotUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff7a59]/10 text-[#ff7a59] border border-[#ff7a59]/20 hover:bg-[#ff7a59]/20 transition-colors font-medium"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path d="M11.5 0C5.1 0 0 5.1 0 11.5S5.1 23 11.5 23 23 17.9 23 11.5 17.9 0 11.5 0zM15 14.2c-.4.4-1.1.4-1.5 0l-2.5-2.5c-.4-.4-.4-1.1 0-1.5.4-.4 1.1-.4 1.5 0l2.5 2.5c.4.4.4 1 0 1.5z" />
                                        </svg>
                                        <span className="hidden sm:inline">Fiche Entreprise</span>
                                        <span className="sm:hidden">Fiche</span>
                                    </a>
                                )}

                                {partnership.partner.contactPerson && (partnership.partner.contactPerson.name || partnership.partner.contactPerson.email) && (
                                    <div className="flex items-center gap-2 sm:gap-3 text-white/70 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex-wrap">
                                        {partnership.partner.contactPerson.name && (
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-white/50" />
                                                <span className="font-medium text-white">{partnership.partner.contactPerson.name}</span>
                                            </div>
                                        )}
                                        {partnership.partner.contactPerson.email && (
                                            <>
                                                {partnership.partner.contactPerson.name && <span className="text-white/20 hidden sm:inline">|</span>}
                                                <a href={`mailto:${partnership.partner.contactPerson.email}`} className="hover:text-white transition-colors break-all">
                                                    {partnership.partner.contactPerson.email}
                                                </a>
                                            </>
                                        )}
                                        {partnership.partner.contactPerson.hubspotUrl && (
                                            <>
                                                <span className="text-white/20 hidden sm:inline">|</span>
                                                <a
                                                    href={partnership.partner.contactPerson.hubspotUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#ff7a59] hover:text-[#ff9b7d] transition-colors"
                                                    title="Profil HubSpot Contact"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                        <path d="M11.5 0C5.1 0 0 5.1 0 11.5S5.1 23 11.5 23 23 17.9 23 11.5 17.9 0 11.5 0zM15 14.2c-.4.4-1.1.4-1.5 0l-2.5-2.5c-.4-.4-.4-1.1 0-1.5.4-.4 1.1-.4 1.5 0l2.5 2.5c.4.4.4 1 0 1.5z" />
                                                    </svg>
                                                </a>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold badge-premium self-start sm:self-auto ${partnership.partner.isActive
                            ? 'badge-success'
                            : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/30'
                            }`}>
                            {partnership.partner.isActive ? 'Actif' : 'Archivé'}
                        </div>
                    </div>
                </div >

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-fadeInUp">
                    <Card
                        className="p-6 stat-card-premium card-elevated cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => scrollToSection('introductions')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Introductions</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeIntroductions.length}
                        </div>
                    </Card>
                    <Card
                        className="p-6 stat-card-premium card-elevated cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => scrollToSection('events')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <Calendar className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Événements</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeEvents.length + invitedGlobalEvents.length}
                        </div>
                    </Card>
                    <Card
                        className="p-6 stat-card-premium card-elevated cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => scrollToSection('publications')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Publications</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activePublications.length}
                        </div>
                    </Card>
                    <Card
                        className="p-6 stat-card-premium card-elevated cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => scrollToSection('reports')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <FileText className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Rapports</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeReports.length}
                        </div>
                    </Card>
                    <Card
                        className="p-6 stat-card-premium card-elevated cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => scrollToSection('checkIns')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Points Mensuels</span>
                        </div>
                        <div className="text-4xl font-bold text-gradient-primary">
                            {activeCheckIns.length}
                        </div>
                    </Card>
                </div>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Prestations Section (AI powered) */}
                <section id="prestations" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                            </div>
                            Prestations
                        </h2>
                        {/* Desktop: Button in header */}
                        <Button
                            variant="secondary"
                            onClick={() => setIsPoInputOpen(!isPoInputOpen)}
                            className="hidden sm:flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-primary" />
                            {partnership.partner.servicesSummary ? 'Actualiser le résumé' : 'Générer avec l\'IA'}
                        </Button>
                    </div>

                    {isPoInputOpen && (
                        <Card className="p-6 border-primary/30 bg-primary/5 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-white mb-3">Coller le texte du bon de commande</h3>
                            <textarea
                                className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary/50 outline-none transition-all"
                                placeholder="Collez ici le descriptif des prestations du bon de commande..."
                                value={poText}
                                onChange={(e) => setPoText(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="secondary" onClick={() => setIsPoInputOpen(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSummarizePO}
                                    disabled={isAILoading || !poText.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {isAILoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Générer le résumé
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {partnership.partner.servicesSummary ? (
                        <>
                            <Card className="p-8 card-elevated relative group overflow-hidden">
                                {isEditingSummary ? (
                                    <div className="space-y-4">
                                        <textarea
                                            className="w-full bg-white/5 text-white border border-white/10 rounded-lg p-4 focus:outline-none focus:border-primary-400 min-h-[150px] resize-y"
                                            value={editedSummary}
                                            onChange={(e) => setEditedSummary(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="secondary" onClick={() => setIsEditingSummary(false)}>
                                                Annuler
                                            </Button>
                                            <Button variant="primary" onClick={() => {
                                                handleUpdateSummary(editedSummary);
                                                setIsEditingSummary(false);
                                            }}>
                                                Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={() => {
                                                    setEditedSummary(partnership.partner.servicesSummary || '');
                                                    setIsEditingSummary(true);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                title="Modifier le résumé"
                                            >
                                                <Edit className="w-4 h-4 text-white/50 hover:text-white" />
                                            </button>
                                        </div>
                                        <div className="prose prose-invert max-w-none text-white/80 leading-relaxed whitespace-pre-line">
                                            {partnership.partner.servicesSummary}
                                        </div>
                                    </>
                                )}
                            </Card>
                            {/* Mobile: Button below summary */}
                            <Button
                                variant="secondary"
                                onClick={() => setIsPoInputOpen(!isPoInputOpen)}
                                className="sm:hidden flex items-center gap-2 w-full justify-center"
                            >
                                <Sparkles className="w-4 h-4 text-primary" />
                                Actualiser le résumé
                            </Button>
                        </>
                    ) : !isPoInputOpen && (
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => setIsPoInputOpen(true)}
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                                <Sparkles className="w-12 h-12 text-white/10 mb-4 group-hover:text-primary/40 transition-colors" />
                                <p className="text-white/40 font-medium max-w-md">
                                    Collez le descriptif de vos bons de commande pour générer un résumé automatique des prestations.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="introductions" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                            </div>
                            Introductions Qualifiées
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditingIntroduction(null);
                                setIsIntroModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </Button>
                    </div>
                    {activeIntroductions.length > 0 ? (
                        <div className="grid gap-4">
                            {activeIntroductions.map((intro) => (
                                <Card key={intro.id} className="p-6 card-elevated">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
                                        <div className="flex-1 space-y-3">
                                            {/* Person Name - Prominent */}
                                            <h3 className="text-2xl font-bold text-white">{intro.contactName}</h3>

                                            {/* Company - Highlighted */}
                                            <p className="text-lg text-primary font-semibold">{intro.company}</p>

                                            {/* Introduction Date with Icon */}
                                            <div className="flex items-center gap-2 text-white/70 flex-nowrap">
                                                <Calendar className="w-4 h-4 shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                                    Introduit le {formatDate(intro.date, {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Status Dropdown */}
                                            <div className="relative">
                                                <select
                                                    value={intro.status || 'pending'}
                                                    onChange={(e) => handleUpdateIntroductionStatus(intro, e.target.value as 'pending' | 'negotiating' | 'signed' | 'not_interested')}
                                                    className={`
                                                        appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-semibold border-2 cursor-pointer outline-none transition-all
                                                        ${(intro.status === 'signed') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' : ''}
                                                        ${(intro.status === 'negotiating') ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' : ''}
                                                        ${(intro.status === 'not_interested') ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' : ''}
                                                        ${(intro.status === 'pending' || !intro.status) ? 'bg-white/10 text-white/60 border-white/10 hover:bg-white/20' : ''}
                                                    `}
                                                >
                                                    <option value="pending" className="bg-slate-900 text-gray-300">En attente</option>
                                                    <option value="negotiating" className="bg-slate-900 text-gray-300">En négociation</option>
                                                    <option value="signed" className="bg-slate-900 text-gray-300">Contrat signé</option>
                                                    <option value="not_interested" className="bg-slate-900 text-gray-300">Pas de suite</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className={`w-4 h-4 ${(intro.status === 'signed') ? 'text-emerald-400' : (intro.status === 'negotiating') ? 'text-blue-400' : (intro.status === 'not_interested') ? 'text-red-400' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {/* Desktop Actions */}
                                            <div className="hidden sm:flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setEditingIntroduction(intro);
                                                        setIsIntroModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDeleteIntent('introduction', intro.id, intro.contactName)}
                                                    className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                                </Button>
                                            </div>

                                            {/* Mobile Menu */}
                                            <Menu as="div" className="relative sm:hidden">
                                                <Menu.Button className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
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
                                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-xl z-50 focus:outline-none overflow-hidden">
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingIntroduction(intro);
                                                                        setIsIntroModalOpen(true);
                                                                    }}
                                                                    className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90`}
                                                                >
                                                                    <Edit className="w-4 h-4 text-white/60" />
                                                                    Modifier
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDeleteIntent('introduction', intro.id, intro.contactName)}
                                                                    className={`${active ? 'bg-red-500/10' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-red-400 border-t border-white/5`}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                                    Supprimer
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer" onClick={() => { setEditingIntroduction(null); setIsIntroModalOpen(true); }}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <Users className="w-12 h-12 text-white/10 mb-4 group-hover:text-primary/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6">Aucune introduction pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter une introduction
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="publications" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                            </div>
                            Publications
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditingPublication(null);
                                setIsPubModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </Button>
                    </div>
                    {activePublications.length > 0 ? (
                        <div className="grid gap-4">
                            {activePublications.map((pub) => (
                                <Card key={pub.id} className="p-6 card-elevated">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-bold text-white">{pub.platform}</h3>
                                                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                                                    {(pub.links ?? []).length} lien{(pub.links ?? []).length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-white/70">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    Publié le {formatDate(pub.publicationDate)}
                                                </span>
                                            </div>

                                            {/* Display all links */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {(pub.links ?? []).map((link, index) => (
                                                    <Button
                                                        key={index}
                                                        variant="primary"
                                                        onClick={() => window.open(link, '_blank')}
                                                        className="flex items-center gap-2 text-xs"
                                                        title={link}
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {(pub.links ?? []).length > 1 ? `Lien ${index + 1}` : 'Voir'}
                                                    </Button>
                                                ))}
                                            </div>

                                            {/* Description */}
                                            {pub.description && (
                                                <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-sm text-white/80 whitespace-pre-line">
                                                        {pub.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Screenshots Gallery */}
                                            <PublicationScreenshots screenshots={pub.screenshotUrls || []} />

                                            {(pub.lastUpdated || pub.statsReportDate) && (
                                                <div className="space-y-1">
                                                    {pub.lastUpdated && (
                                                        <p className="text-xs text-white/50">
                                                            Dernière mise à jour: {formatDate(pub.lastUpdated)}
                                                        </p>
                                                    )}
                                                    {pub.statsReportDate && (
                                                        <p className="text-xs text-white/50">
                                                            📅 Rapport stats: {formatDate(pub.statsReportDate)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            {/* Desktop Actions */}
                                            <div className="hidden sm:flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setEditingPublication(pub);
                                                        setIsPubModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDeleteIntent('publication', pub.id, `${pub.platform} (${formatDate(pub.publicationDate)})`)}
                                                    className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                                </Button>
                                            </div>

                                            {/* Mobile Menu */}
                                            <Menu as="div" className="relative sm:hidden">
                                                <Menu.Button className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
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
                                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-xl z-50 focus:outline-none overflow-hidden">
                                                        {/* Show all links */}
                                                        {(pub.links ?? []).map((link, index) => (
                                                            <Menu.Item key={index}>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => window.open(link, '_blank')}
                                                                        className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90 ${index > 0 ? 'border-t border-white/5' : ''}`}
                                                                    >
                                                                        <ExternalLink className="w-4 h-4 text-white/60" />
                                                                        {(pub.links ?? []).length > 1 ? `Lien ${index + 1}` : 'Voir'}
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        ))}
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingPublication(pub);
                                                                        setIsPubModalOpen(true);
                                                                    }}
                                                                    className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90 border-t border-white/5`}
                                                                >
                                                                    <Edit className="w-4 h-4 text-white/60" />
                                                                    Modifier
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDeleteIntent('publication', pub.id, `${pub.platform} (${formatDate(pub.publicationDate)})`)}
                                                                    className={`${active ? 'bg-red-500/10' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-red-400 border-t border-white/5`}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                                    Supprimer
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer" onClick={() => { setEditingPublication(null); setIsPubModalOpen(true); }}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-primary/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <FileText className="w-12 h-12 text-white/10 mb-4 group-hover:text-cyan-400/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6">Aucune publication pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter une publication
                                </Button>
                            </div>
                        </div>
                    )}
                </section >

                {/* Visual Separator */}
                < div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" ></div >

                <section id="events" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" />
                            </div>
                            Événements
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditingEvent(null);
                                setIsEventModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </Button>
                    </div>
                    {activeEvents.length > 0 ? (
                        <div className="grid gap-4">
                            {activeEvents.map((event) => {
                                // Try to find matching global event if ID is missing (robustness fallback)
                                const linkedGlobalEvent = invitedGlobalEvents.find(ge =>
                                    ge.id === event.globalEventId ||
                                    (ge.eventName === event.eventName) // Simplest matching by name
                                );
                                const targetId = event.globalEventId || linkedGlobalEvent?.id;

                                return (
                                    <Card key={event.id} className="p-4 sm:p-6 card-elevated">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                                                {/* Event Name - Clickable if linked to global event */}
                                                {targetId ? (
                                                    <h3
                                                        className="text-xl sm:text-2xl font-bold text-white break-words cursor-pointer hover:text-primary transition-colors flex items-center gap-2 group"
                                                        onClick={() => window.location.href = `/evenements-globaux/${targetId}`}
                                                        title="Voir l'événement global"
                                                    >
                                                        {event.eventName}
                                                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                    </h3>
                                                ) : (
                                                    <h3 className="text-xl sm:text-2xl font-bold text-white break-words">{event.eventName}</h3>
                                                )}

                                                {/* Dates Grid - Clear Labels */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <span className="text-xs text-white/50 uppercase tracking-wide">Date de proposition</span>
                                                        <p className="text-sm sm:text-base text-white font-medium mt-1">
                                                            {formatDate(event.proposalDate, {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {event.eventDate && (
                                                        <div>
                                                            <span className="text-xs text-white/50 uppercase tracking-wide">Date de l'événement</span>
                                                            <p className="text-sm sm:text-base text-white font-medium mt-1 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-primary" />
                                                                {formatDate(event.eventDate, {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {event.eventLocation && (
                                                        <div>
                                                            <span className="text-xs text-white/50 uppercase tracking-wide">Lieu</span>
                                                            <p className="text-sm sm:text-base text-white font-medium mt-1 flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-primary" />
                                                                {event.eventLocation}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                {/* Status Dropdown */}
                                                <div className="relative">
                                                    <select
                                                        value={event.status || 'pending'}
                                                        onChange={(e) => handleUpdateEventStatus(event, e.target.value as 'pending' | 'accepted' | 'declined')}
                                                        className={`
                                                        appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-semibold border-2 cursor-pointer outline-none transition-all
                                                        ${(event.status === 'accepted') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' : ''}
                                                        ${(event.status === 'declined') ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' : ''}
                                                        ${(event.status === 'pending' || !event.status) ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30' : ''}
                                                    `}
                                                    >
                                                        <option value="pending" className="bg-slate-900 text-gray-300">En attente</option>
                                                        <option value="accepted" className="bg-slate-900 text-gray-300">Accepté</option>
                                                        <option value="declined" className="bg-slate-900 text-gray-300">Refusé</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <svg className={`w-4 h-4 ${(event.status === 'accepted') ? 'text-emerald-400' : (event.status === 'declined') ? 'text-red-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {/* Desktop Actions */}
                                                <div className="hidden sm:flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setEditingEvent(event);
                                                            setIsEventModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleDeleteIntent('event', event.id, event.eventName)}
                                                        className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                                    </Button>
                                                </div>

                                                {/* Mobile Menu */}
                                                <Menu as="div" className="relative sm:hidden">
                                                    <Menu.Button className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                                        <MoreVertical className="w-5 h-5" />
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
                                                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-xl z-50 focus:outline-none overflow-hidden">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingEvent(event);
                                                                            setIsEventModalOpen(true);
                                                                        }}
                                                                        className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90`}
                                                                    >
                                                                        <Edit className="w-4 h-4 text-white/60" />
                                                                        Modifier
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleDeleteIntent('event', event.id, event.eventName)}
                                                                        className={`${active ? 'bg-red-500/10' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-red-400 border-t border-white/5`}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                                        Supprimer
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer" onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/20 to-primary/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <Calendar className="w-12 h-12 text-white/10 mb-4 group-hover:text-orange-400/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6">Aucun événement pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter un événement
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="reports" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                            </div>
                            Comptes Rendus Trimestriels
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditingReport(null);
                                setIsReportModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </Button>
                    </div>
                    {activeReports.length > 0 ? (
                        <div className="grid gap-4">
                            {activeReports.map((report) => (
                                <Card key={report.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Rapport du {formatDate(report.reportDate)}</h3>
                                            {report.link && (
                                                <a href={report.link} target="_blank" rel="noreferrer" className="text-sm text-primary-400 hover:text-primary-300 transition-colors mt-1 inline-block">
                                                    Voir le document
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-white/40" />
                                            {/* Desktop Actions */}
                                            <div className="hidden sm:flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setEditingReport(report);
                                                        setIsReportModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleDeleteIntent('report', report.id, `Rapport du ${formatDate(report.reportDate)}`)}
                                                    className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                                </Button>
                                            </div>

                                            {/* Mobile Menu */}
                                            <Menu as="div" className="relative sm:hidden">
                                                <Menu.Button className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
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
                                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-xl z-50 focus:outline-none overflow-hidden">
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingReport(report);
                                                                        setIsReportModalOpen(true);
                                                                    }}
                                                                    className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90`}
                                                                >
                                                                    <Edit className="w-4 h-4 text-white/60" />
                                                                    Modifier
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleDeleteIntent('report', report.id, `Rapport du ${formatDate(report.reportDate)}`)}
                                                                    className={`${active ? 'bg-red-500/10' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-red-400 border-t border-white/5`}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                                    Supprimer
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer hidden sm:flex" onClick={() => { setEditingReport(null); setIsReportModalOpen(true); }}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <FileText className="w-12 h-12 text-white/10 mb-4 group-hover:text-primary/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6">Aucun compte rendu pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter un compte rendu
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="checkIns" className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                            </div>
                            Points Mensuels
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditingCheckIn(null);
                                setIsCheckInModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </Button>
                    </div>
                    {activeCheckIns.length > 0 ? (
                        <div className="grid gap-4">
                            {activeCheckIns
                                .sort((a, b) => toSafeDate(b.checkInDate).getTime() - toSafeDate(a.checkInDate).getTime())
                                .map((checkIn) => (
                                    <Card key={checkIn.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white">
                                                    Point du {formatDate(checkIn.checkInDate, {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </h3>
                                                {checkIn.notes && (
                                                    <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap">{checkIn.notes}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-white/40" />
                                                {/* Desktop Actions */}
                                                <div className="hidden sm:flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setEditingCheckIn(checkIn);
                                                            setIsCheckInModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleDeleteIntent('checkIn', checkIn.id, `Point du ${formatDate(checkIn.checkInDate)}`)}
                                                        className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                                    </Button>
                                                </div>

                                                {/* Mobile Menu */}
                                                <Menu as="div" className="relative sm:hidden">
                                                    <Menu.Button className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                                        <MoreVertical className="w-5 h-5" />
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
                                                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[#0F172A] border border-white/10 rounded-xl shadow-xl z-50 focus:outline-none overflow-hidden">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingCheckIn(checkIn);
                                                                            setIsCheckInModalOpen(true);
                                                                        }}
                                                                        className={`${active ? 'bg-white/5' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-white/90`}
                                                                    >
                                                                        <Edit className="w-4 h-4 text-white/60" />
                                                                        Modifier
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleDeleteIntent('checkIn', checkIn.id, `Point du ${formatDate(checkIn.checkInDate)}`)}
                                                                        className={`${active ? 'bg-red-500/10' : ''} group flex w-full items-center gap-3 px-4 py-3 text-sm text-left text-red-400 border-t border-white/5`}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                                        Supprimer
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer hidden sm:flex" onClick={() => { setEditingCheckIn(null); setIsCheckInModalOpen(true); }}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                <Calendar className="w-12 h-12 text-white/10 mb-4 group-hover:text-primary/40 transition-colors" />
                                <p className="text-white/40 font-medium mb-6">Aucun point mensuel pour le moment</p>
                                <Button
                                    variant="secondary"
                                    className="pointer-events-none group-hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter un point mensuel
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                <EditPartnerModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    partner={partnership.partner}
                    onSave={handleSavePartner}
                />
                <AddIntroductionModal
                    isOpen={isIntroModalOpen}
                    onClose={() => setIsIntroModalOpen(false)}
                    onSave={handleSaveIntroduction}
                    initialData={editingIntroduction}
                    partnerId={partnership.partner.id}
                />
                <AddPublicationModal
                    isOpen={isPubModalOpen}
                    onClose={() => setIsPubModalOpen(false)}
                    onSave={handleSavePublication}
                    initialData={editingPublication}
                    partnerId={partnership.partner.id}
                />
                <AddEventModal
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                    onSave={handleSaveEvent}
                    initialData={editingEvent}
                    partnerId={partnership.partner.id}
                />
                <AddQuarterlyReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    onSave={handleSaveQuarterlyReport}
                    initialData={editingReport}
                    partnerId={partnership.partner.id}
                />
                <AddMonthlyCheckInModal
                    isOpen={isCheckInModalOpen}
                    onClose={() => setIsCheckInModalOpen(false)}
                    onSave={handleSaveMonthlyCheckIn}
                    initialData={editingCheckIn}
                    partnerId={partnership.partner.id}
                />

                <ConfirmDeleteModal
                    isOpen={deleteConfirmation.isOpen}
                    onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={handleConfirmDelete}
                    title="Confirmer la suppression"
                    message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.title}" ? Vous pourrez le restaurer depuis la corbeille.`}
                />
                <APIStatusModal
                    isOpen={isAPIStatusModalOpen}
                    onClose={() => setIsAPIStatusModalOpen(false)}
                />
            </div >

        </main >
    );
}
