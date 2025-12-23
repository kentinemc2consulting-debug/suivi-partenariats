'use client';

import React from 'react';
import { Partner, QualifiedIntroduction, Event, Publication } from '@/types';
import {
    Calendar,
    Briefcase,
    MapPin,
    FileText,
    TrendingUp,
    Target,
    Zap,
    Award,
    Globe,
    Link as LinkIcon,
    Linkedin
} from 'lucide-react';

interface PartnerReportTemplateProps {
    partner: Partner;
    introductions: QualifiedIntroduction[];
    events: Event[];
    publications: Publication[];
}

export const PartnerReportTemplate = React.forwardRef<HTMLDivElement, PartnerReportTemplateProps>(
    ({ partner, introductions, events, publications }, ref) => {
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const PageHeader = ({ title }: { title?: string }) => (
            <div className="relative z-10 flex justify-between items-end mb-10 pb-8" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6" style={{ backgroundColor: '#6366f1', borderRadius: '4px' }} />
                        <h1 className="text-3xl font-bold tracking-tighter" style={{ margin: 0, color: '#ffffff' }}>
                            {partner.name}
                        </h1>
                    </div>
                    <div className="flex flex-col gap-1" style={{ paddingLeft: '18px' }}>
                        {title && (
                            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#818cf8', margin: '0 0 4px 0' }}>
                                {title}
                            </p>
                        )}
                        {partner.type && (
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                                Type : <span style={{ color: partner.type === 'ambassadeur' ? '#a855f7' : '#3b82f6' }}>{partner.type === 'ambassadeur' ? 'Ambassadeur' : 'Partenariat stratégique'}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Rapport du</div>
                    <div className="text-lg font-medium" style={{ color: '#ffffff' }}>{today}</div>
                </div>
            </div>
        );

        const PageFooter = () => (
            <div className="relative z-10 pt-8 mt-auto" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>E=MC2 Consulting</p>
            </div>
        );

        return (
            <div ref={ref} className="flex flex-col gap-0" style={{ backgroundColor: '#000000' }}>
                {/* PAGE 1: RÉSUMÉ & MÉTRIQUES CLÉS */}
                <div
                    className="pdf-page w-[210mm] h-[297mm] p-16 flex flex-col relative overflow-hidden"
                    style={{ backgroundColor: '#050505', color: '#ffffff', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                >
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px]" style={{ borderRadius: '9999px', filter: 'blur(80px)', background: 'rgba(99, 102, 241, 0.08)' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px]" style={{ borderRadius: '9999px', filter: 'blur(80px)', background: 'rgba(45, 212, 191, 0.06)' }} />

                    <PageHeader title="Rapport d'Activités" />

                    {/* Dashboard KPIs */}
                    <div className="relative z-10 grid grid-cols-3 gap-6 mb-12">
                        {/* Intros Card */}
                        <div className="relative p-10 flex flex-col items-center text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1.5rem' }}>
                            <div className="p-3 mb-6" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', borderRadius: '0.75rem' }}>
                                <Target className="w-6 h-6" style={{ color: '#818cf8' }} />
                            </div>
                            <div className="text-5xl font-black leading-none mb-3" style={{ color: '#ffffff' }}>{introductions.length}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: '#818cf8' }}>Introductions Qualifiées</div>
                        </div>

                        {/* Events Card */}
                        <div className="relative p-10 flex flex-col items-center text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1.5rem' }}>
                            <div className="p-3 mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: '0.75rem' }}>
                                <Calendar className="w-6 h-6" style={{ color: '#34d399' }} />
                            </div>
                            <div className="text-5xl font-black leading-none mb-3" style={{ color: '#ffffff' }}>{events.length}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: '#34d399' }}>Évènements</div>
                        </div>

                        {/* Publications Card */}
                        <div className="relative p-10 flex flex-col items-center text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1.5rem' }}>
                            <div className="p-3 mb-6" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderRadius: '0.75rem' }}>
                                <Globe className="w-6 h-6" style={{ color: '#fbbf24' }} />
                            </div>
                            <div className="text-5xl font-black leading-none mb-3" style={{ color: '#ffffff' }}>{publications.length}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: '#fbbf24' }}>Publications</div>
                        </div>
                    </div>

                    {/* Recent Activity Grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-8 flex-1">
                        {/* Introductions Section */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5" style={{ color: '#818cf8' }} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#ffffff' }}>Introductions Qualifiées</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                {introductions.slice(0, 6).map(intro => (
                                    <div key={intro.id} className="p-5 flex justify-between items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1rem' }}>
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-xs uppercase tracking-tight" style={{ color: '#ffffff' }}>{intro.company}</div>
                                            <div className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{intro.contactName}</div>
                                        </div>
                                        <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest"
                                            style={{
                                                borderRadius: '4px',
                                                backgroundColor: intro.status === 'signed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: intro.status === 'signed' ? '#4ade80' : 'rgba(255, 255, 255, 0.4)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                            {intro.status === 'signed' ? 'Contrat' : 'En cours'}
                                        </div>
                                    </div>
                                ))}
                                {introductions.length > 6 && (
                                    <div className="text-[10px] italic text-center" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>+{introductions.length - 6} autres introductions</div>
                                )}
                            </div>
                        </div>

                        {/* Events Preview Section */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <Award className="w-5 h-5" style={{ color: '#34d399' }} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#ffffff' }}>Évènements</h3>
                            </div>
                            <div className="flex flex-col gap-3">
                                {events.slice(0, 6).map(event => (
                                    <div key={event.id} className="p-5 flex justify-between items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1rem' }}>
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-xs uppercase tracking-tight truncate max-w-[150px]" style={{ color: '#ffffff' }}>{event.eventName}</div>
                                            <div className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{event.eventLocation || 'NC'}</div>
                                        </div>
                                        <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest"
                                            style={{
                                                borderRadius: '4px',
                                                backgroundColor: event.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: event.status === 'accepted' ? '#4ade80' : 'rgba(255, 255, 255, 0.4)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                            {event.status === 'accepted' ? 'Confirmé' : 'Proposé'}
                                        </div>
                                    </div>
                                ))}
                                {events.length > 6 && (
                                    <div className="text-[10px] italic text-center" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>+{events.length - 6} autres évènements</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <PageFooter />
                </div>

                {/* PAGE 2: DÉTAILS ÉVÉNEMENTS & PUBLICATIONS */}
                <div
                    className="pdf-page w-[210mm] h-[297mm] p-16 flex flex-col relative overflow-hidden"
                    style={{ backgroundColor: '#050505', color: '#ffffff', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                >
                    <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px]" style={{ borderRadius: '9999px', filter: 'blur(80px)', background: 'rgba(245, 158, 11, 0.05)' }} />

                    <PageHeader title="Détails des Actions" />

                    {/* Full Events List */}
                    <div className="relative z-10 mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>Liste des évènements proposés</h3>
                            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)' }} />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {events.map(event => (
                                <div key={event.id} className="p-4 flex justify-between items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0.75rem' }}>
                                    <div className="flex flex-col gap-1">
                                        <div className="font-bold text-xs uppercase tracking-tight" style={{ color: '#ffffff' }}>{event.eventName}</div>
                                        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.eventLocation || 'A distance'}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.proposalDate).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest" style={{ color: event.status === 'accepted' ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
                                        {event.status === 'accepted' ? 'Validé' : 'En attente'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LinkedIn Publications with Links */}
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: '#60a5fa' }}>Publications LinkedIn</h3>
                            <div className="h-[1px] flex-1" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }} />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {publications.map(pub => (
                                <div key={pub.id} className="p-5 flex justify-between items-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '1rem' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                            <Linkedin className="w-5 h-5" style={{ color: '#60a5fa' }} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-xs uppercase tracking-tight" style={{ color: '#ffffff' }}>Publication {pub.platform}</div>
                                            <div className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{new Date(pub.publicationDate).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={pub.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 text-[10px] font-bold uppercase tracking-tight flex items-center gap-2"
                                            style={{ backgroundColor: '#0077b5', color: 'white', borderRadius: '9999px', textDecoration: 'none' }}
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            Voir le post
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <PageFooter />
                </div>
            </div>
        );
    }
);

PartnerReportTemplate.displayName = 'PartnerReportTemplate';
