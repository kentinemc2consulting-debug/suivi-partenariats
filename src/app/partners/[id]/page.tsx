'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PartnershipData, Publication, Partner, QualifiedIntroduction, Event, QuarterlyReport } from '@/types';
import EditPartnerModal from '@/components/partners/EditPartnerModal';
import AddIntroductionModal from '@/components/partners/AddIntroductionModal';
import AddPublicationModal from '@/components/partners/AddPublicationModal';
import AddEventModal from '@/components/partners/AddEventModal';
import AddQuarterlyReportModal from '@/components/partners/AddQuarterlyReportModal';
import * as XLSX from 'xlsx';
import {
    Plus,
    Trash2,
    MapPin,
    ArrowUp,
    ArrowLeft,
    AlertTriangle,
    FileText,
    Settings,
    Users,
    Calendar,
    TrendingUp,
    Edit,
    ExternalLink
} from 'lucide-react';
import ConfirmDeleteModal from '@/components/partners/ConfirmDeleteModal';
import RecycleBinModal from '@/components/partners/RecycleBinModal';
import { PartnerReportTemplate } from '@/components/partners/PartnerReportTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';


export default function PartnerDetailPage() {
    const params = useParams();
    const router = useRouter();
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

    // Delete & Recycle Bin State
    const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'introduction' | 'event' | 'publication' | 'report';
        id: string;
        title: string;
    }>({
        isOpen: false,
        type: 'introduction',
        id: '',
        title: ''
    });

    // PDF Generation State
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Scroll to Top State
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            // Give time for any background rendering
            await new Promise(resolve => setTimeout(resolve, 800));

            if (reportRef.current) {
                console.log('Found report container, capturing pages...');

                // Find all pages within the template
                const pages = reportRef.current.querySelectorAll('.pdf-page');

                if (pages.length === 0) {
                    throw new Error("No pages found to export");
                }

                // Initialize PDF
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = 210;
                const pdfHeight = 297;

                for (let i = 0; i < pages.length; i++) {
                    const pageElement = pages[i] as HTMLElement;

                    // Capture individual page
                    const canvas = await html2canvas(pageElement, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#050505',
                        logging: false,
                        windowWidth: 794, // Standard A4 width at 96 DPI
                        width: 794,
                        onclone: (clonedDoc) => {
                            // Ensure the cloned element is visible and positioned correctly
                            const element = clonedDoc.querySelector(`.pdf-page:nth-child(${i + 1})`) as HTMLElement;
                            if (element) {
                                element.style.display = 'block';
                                element.style.visibility = 'visible';
                            }
                        }
                    });

                    const imgData = canvas.toDataURL('image/png', 1.0);

                    // Add to PDF
                    if (i > 0) {
                        pdf.addPage();
                    }

                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                }

                // Save locally
                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                const fileName = `${partnership.partner.name.replace(/\s+/g, '_')}_Rapport_Activite.pdf`;

                const saveResponse = await fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName, fileData: pdfBase64 })
                });

                const saveData = await saveResponse.json();
                if (saveData.success) {
                    alert(`PDF sauvegardé : ${saveData.path}`);
                } else {
                    throw new Error(saveData.error);
                }
            }
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert("Erreur lors de la génération du PDF multi-pages");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Helper for updating partnership state
    const updatePartnershipState = (updates: Partial<PartnershipData>) => {
        setPartnership(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleDeleteIntent = (type: 'introduction' | 'event' | 'publication' | 'report', id: string, title: string) => {
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
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, introductions: newIntros }),
                });
            } else if (type === 'event') {
                const newEvents = partnership.events.map(e =>
                    e.id === id ? { ...e, deletedAt: now } : e
                );
                updates = { events: newEvents };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, events: newEvents }),
                });
            } else if (type === 'publication') {
                const newPubs = partnership.publications.map(p =>
                    p.id === id ? { ...p, deletedAt: now } : p
                );
                updates = { publications: newPubs };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, publications: newPubs }),
                });
            } else if (type === 'report') {
                const newReports = (partnership.quarterlyReports || []).map(r =>
                    r.id === id ? { ...r, deletedAt: now } : r
                );
                updates = { quarterlyReports: newReports };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: newReports }),
                });
            }

            updatePartnershipState(updates);
            setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleRestore = async (type: 'introduction' | 'event' | 'publication' | 'report', id: string) => {
        if (!partnership) return;

        try {
            let updates: Partial<PartnershipData> = {};

            if (type === 'introduction') {
                const newIntros = partnership.introductions.map(i =>
                    i.id === id ? { ...i, deletedAt: undefined } : i
                );
                updates = { introductions: newIntros };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, introductions: newIntros }),
                });
            } else if (type === 'event') {
                const newEvents = partnership.events.map(e =>
                    e.id === id ? { ...e, deletedAt: undefined } : e
                );
                updates = { events: newEvents };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, events: newEvents }),
                });
            } else if (type === 'publication') {
                const newPubs = partnership.publications.map(p =>
                    p.id === id ? { ...p, deletedAt: undefined } : p
                );
                updates = { publications: newPubs };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, publications: newPubs }),
                });
            } else if (type === 'report') {
                const newReports = (partnership.quarterlyReports || []).map(r =>
                    r.id === id ? { ...r, deletedAt: undefined } : r
                );
                updates = { quarterlyReports: newReports };
                await fetch('/api/partners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: newReports }),
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
                const res = await fetch('/api/partners');
                const data: PartnershipData[] = await res.json();
                const found = data.find(p => p.partner.id === params.id);
                setPartnership(found || null);
            } catch (error) {
                console.error('Error fetching partnership:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPartnership();
    }, [params.id]);

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleUpdatePublicationDate = async (publicationId: string) => {
        alert('Fonctionnalité de mise à jour manuelle - À implémenter avec un formulaire');
    };

    const handleSavePartner = async (updatedPartner: Partner) => {
        try {
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: partnership?.partner.id,
                    partner: updatedPartner
                }),
            });
            if (!res.ok) throw new Error('Failed to update partner');
            setPartnership(prev => prev ? { ...prev, partner: updatedPartner } : null);
            alert('Modifications enregistrées');
        } catch (error) {
            console.error('Error updating partner:', error);
            alert('Erreur lors de la sauvegarde');
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
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, introductions: updatedIntros }),
            });
            if (!res.ok) throw new Error('Failed to save introduction');
            setPartnership(prev => prev ? { ...prev, introductions: updatedIntros } : null);
        } catch (error) {
            console.error('Error saving introduction:', error);
            alert('Erreur lors de la sauvegarde');
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
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, publications: updatedPubs }),
            });
            if (!res.ok) throw new Error('Failed to save publication');
            setPartnership(prev => prev ? { ...prev, publications: updatedPubs } : null);
        } catch (error) {
            console.error('Error saving publication:', error);
            alert('Erreur lors de la sauvegarde');
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
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, events: updatedEvents }),
            });
            if (!res.ok) throw new Error('Failed to save event');
            setPartnership(prev => prev ? { ...prev, events: updatedEvents } : null);
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erreur lors de la sauvegarde');
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
            const res = await fetch('/api/partners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: partnership.partner.id, quarterlyReports: updatedReports }),
            });
            if (!res.ok) throw new Error('Failed to save report');
            setPartnership(prev => prev ? { ...prev, quarterlyReports: updatedReports } : null);
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleExportExcel = async () => {
        if (!partnership) return;

        const wb = XLSX.utils.book_new();

        // 1. Introductions Qualifiées (exclude deleted items)
        const introsData = partnership.introductions
            .filter(i => !i.deletedAt)
            .map(i => ({
                "Date d'introduction": new Date(i.date).toLocaleDateString('fr-FR'),
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
                "Date de proposition": new Date(e.proposalDate).toLocaleDateString('fr-FR'),
                "Date évènement": e.eventDate ? new Date(e.eventDate).toLocaleDateString('fr-FR') : 'N/A',
                "Nom évènement": e.eventName,
                "Présent à l'évènement": e.attended ? 'Oui' : 'Non'
            }));
        const wsEvents = XLSX.utils.json_to_sheet(eventsData);
        XLSX.utils.book_append_sheet(wb, wsEvents, "Invitations évènements");

        // 3. Publications (exclude deleted items)
        const pubsData = partnership.publications
            .filter(p => !p.deletedAt)
            .map(p => ({
                "Date publication": new Date(p.publicationDate).toLocaleDateString('fr-FR'),
                "Plateforme": p.platform,
                "Lien": p.link,
                "Date de rapport statistiques": p.statsReportDate ? new Date(p.statsReportDate).toLocaleDateString('fr-FR') : 'Non renseigné'
            }));
        const wsPubs = XLSX.utils.json_to_sheet(pubsData);
        XLSX.utils.book_append_sheet(wb, wsPubs, "Publications");

        // 4. Compte rendu trimestriel (exclude deleted items)
        const reportsData = (partnership.quarterlyReports || [])
            .filter(r => !r.deletedAt)
            .map(r => ({
                "Date de rendu": new Date(r.reportDate).toLocaleDateString('fr-FR'),
            }));
        const wsReports = XLSX.utils.json_to_sheet(reportsData);
        XLSX.utils.book_append_sheet(wb, wsReports, "Compte rendu trimestriel");

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
    const activeEvents = partnership.events.filter(e => !e.deletedAt);
    const activePublications = partnership.publications.filter(p => !p.deletedAt);
    const activeReports = (partnership.quarterlyReports || []).filter(r => !r.deletedAt);

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {alertConfig && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${alertConfig.color}`}>
                        <AlertTriangle className={`w-6 h-6 ${alertConfig.iconColor}`} />
                        <span className="font-semibold">{alertConfig.message}</span>
                    </div>
                )}

                {/* Header */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à l'accueil
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setIsRecycleBinOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Corbeille
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleExportExcel}
                                className="flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Excel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleExportPDF}
                                disabled={isGeneratingPDF}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Génération...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4" />
                                        PDF Export
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Éditer le client
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl font-bold text-white font-display flex items-center gap-4">
                                {partnership.partner.name}
                                {partnership.partner.type && (
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${partnership.partner.type === 'ambassadeur'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10'
                                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                                        }`}>
                                        {partnership.partner.type === 'ambassadeur' ? 'Ambassadeur' : 'Partenariat stratégique'}
                                    </span>
                                )}
                            </h1>
                            <p className="text-xl text-white/60 mt-2">
                                {partnership.partner.duration} • {partnership.partner.commissionClient || 0}% client • {partnership.partner.commissionConsulting || 0}% E=MC² Consulting
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
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
                                        Fiche Entreprise
                                    </a>
                                )}

                                {partnership.partner.contactPerson && (partnership.partner.contactPerson.name || partnership.partner.contactPerson.email) && (
                                    <div className="flex items-center gap-3 text-white/70 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                        {partnership.partner.contactPerson.name && (
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-white/50" />
                                                <span className="font-medium text-white">{partnership.partner.contactPerson.name}</span>
                                            </div>
                                        )}
                                        {partnership.partner.contactPerson.email && (
                                            <>
                                                {partnership.partner.contactPerson.name && <span className="text-white/20">|</span>}
                                                <a href={`mailto:${partnership.partner.contactPerson.email}`} className="hover:text-white transition-colors">
                                                    {partnership.partner.contactPerson.email}
                                                </a>
                                            </>
                                        )}
                                        {partnership.partner.contactPerson.hubspotUrl && (
                                            <>
                                                <span className="text-white/20">|</span>
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
                        <div className={`px-6 py-3 rounded-full text-lg font-semibold badge-premium ${partnership.partner.isActive
                            ? 'badge-success'
                            : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/30'
                            }`}>
                            {partnership.partner.isActive ? 'Actif' : 'Archivé'}
                        </div>
                    </div>
                </div >

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeInUp">
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
                            {activeEvents.length}
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
                </div>


                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="introductions" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="w-7 h-7 text-primary" />
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
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            {/* Person Name - Prominent */}
                                            <h3 className="text-2xl font-bold text-white">{intro.contactName}</h3>

                                            {/* Company - Highlighted */}
                                            <p className="text-lg text-primary font-semibold">{intro.company}</p>

                                            {/* Introduction Date with Icon */}
                                            <div className="flex items-center gap-2 text-white/70">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    Introduit le {new Date(intro.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {intro.status === 'signed' && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium badge-success">
                                                    Contrat signé
                                                </div>
                                            )}
                                            {intro.status === 'negotiating' && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                    En négociation
                                                </div>
                                            )}
                                            {intro.status === 'not_interested' && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium bg-red-500/20 text-red-400 border-red-500/30">
                                                    Pas de suite
                                                </div>
                                            )}
                                            {(intro.status === 'pending' || !intro.status) && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium bg-white/10 text-white/60 border-white/10">
                                                    En attente
                                                </div>
                                            )}
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <FileText className="w-7 h-7 text-cyan-400" />
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
                                            <h3 className="text-2xl font-bold text-white">{pub.platform}</h3>

                                            <div className="flex items-center gap-2 text-white/70">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    Publié le {new Date(pub.publicationDate).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>

                                            {(pub.lastUpdated || pub.statsReportDate) && (
                                                <div className="space-y-1">
                                                    {pub.lastUpdated && (
                                                        <p className="text-xs text-white/50">
                                                            Dernière mise à jour: {new Date(pub.lastUpdated).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    )}
                                                    {pub.statsReportDate && (
                                                        <p className="text-xs text-white/50">
                                                            📅 Rapport stats: {new Date(pub.statsReportDate).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
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
                                                onClick={() => handleDeleteIntent('publication', pub.id, `${pub.platform} (${new Date(pub.publicationDate).toLocaleDateString('fr-FR')})`)}
                                                className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                            >
                                                <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                            </Button>
                                            <Button
                                                variant="primary"
                                                onClick={() => window.open(pub.link, '_blank')}
                                                className="flex items-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Voir
                                            </Button>
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
                </section>

                {/* Visual Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <section id="events" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Calendar className="w-7 h-7 text-orange-400" />
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
                            {activeEvents.map((event) => (
                                <Card key={event.id} className="p-6 card-elevated">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-4">
                                            {/* Event Name - Prominent */}
                                            <h3 className="text-2xl font-bold text-white">{event.eventName}</h3>

                                            {/* Dates Grid - Clear Labels */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-white/50 uppercase tracking-wide">Date de proposition</span>
                                                    <p className="text-white font-medium mt-1">
                                                        {new Date(event.proposalDate).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                {event.eventDate && (
                                                    <div>
                                                        <span className="text-xs text-white/50 uppercase tracking-wide">Date de l'événement</span>
                                                        <p className="text-white font-medium mt-1 flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-primary" />
                                                            {new Date(event.eventDate).toLocaleDateString('fr-FR', {
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
                                                        <p className="text-white font-medium mt-1 flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-primary" />
                                                            {event.eventLocation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Status Badge */}
                                            {event.status === 'accepted' && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium badge-success">
                                                    Accepté
                                                </div>
                                            )}
                                            {event.status === 'declined' && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium bg-red-500/20 text-red-400 border-red-500/30">
                                                    Refusé
                                                </div>
                                            )}
                                            {(event.status === 'pending' || !event.status) && (
                                                <div className="px-4 py-2 rounded-full text-sm font-semibold badge-premium bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                    En attente
                                                </div>
                                            )}
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
                                    </div>
                                </Card>
                            ))}
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-400/10">
                                <FileText className="w-7 h-7 text-cyan-400" />
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
                                            <h3 className="text-lg font-semibold text-white">Rapport du {new Date(report.reportDate).toLocaleDateString('fr-FR')}</h3>
                                            {report.link && (
                                                <a href={report.link} target="_blank" rel="noreferrer" className="text-sm text-primary-400 hover:text-primary-300 transition-colors mt-1 inline-block">
                                                    Voir le document
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-white/40" />
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
                                                onClick={() => handleDeleteIntent('report', report.id, `Rapport du ${new Date(report.reportDate).toLocaleDateString('fr-FR')}`)}
                                                className="hover:bg-red-500/10 hover:border-red-500/30 group"
                                            >
                                                <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer" onClick={() => { setEditingReport(null); setIsReportModalOpen(true); }}>
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

                <ConfirmDeleteModal
                    isOpen={deleteConfirmation.isOpen}
                    onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={handleConfirmDelete}
                    title="Confirmer la suppression"
                    message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.title}" ? Vous pourrez le restaurer depuis la corbeille.`}
                />

                {
                    partnership && (
                        <RecycleBinModal
                            isOpen={isRecycleBinOpen}
                            onClose={() => setIsRecycleBinOpen(false)}
                            partnership={partnership}
                            onRestore={handleRestore}
                        />
                    )
                }

                {/* Hidden Template for PDF Generation */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <PartnerReportTemplate
                        ref={reportRef}
                        partner={partnership.partner}
                        introductions={activeIntroductions}
                        events={activeEvents}
                        publications={activePublications}
                    />
                </div>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-8 right-8 p-4 rounded-full bg-primary-500 text-white shadow-2xl shadow-primary-500/40 transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                title="Retour en haut"
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </main>
    );
}
