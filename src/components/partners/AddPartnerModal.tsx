'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Partner, PartnershipData } from '@/types';

interface AddPartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPartnership: PartnershipData) => Promise<void>;
}

const INITIAL_PARTNER: Partner = {
    id: '',
    name: '',
    logo: '',
    duration: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    commission: 20,
    commissionClient: 20,
    commissionConsulting: 20,
    isActive: true,
    type: 'strategique'
};

export default function AddPartnerModal({ isOpen, onClose, onSave }: AddPartnerModalProps) {
    const [formData, setFormData] = useState<Partner>(INITIAL_PARTNER);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...INITIAL_PARTNER,
                id: crypto.randomUUID()
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }).replace('.', '');
            setFormData(prev => ({
                ...prev,
                duration: `${fmt(start)} - ${fmt(end)}`
            }));
        }
    }, [formData.startDate, formData.endDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'commissionClient' || name === 'commissionConsulting') {
            const numValue = value === '' ? 0 : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) :
                    type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                        name === 'isActive' ? value === 'true' : value
            }));
        }
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contactPerson: {
                name: prev.contactPerson?.name || '',
                email: prev.contactPerson?.email || '',
                hubspotUrl: prev.contactPerson?.hubspotUrl || '',
                [name]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const newPartnership: PartnershipData = {
                partner: formData,
                introductions: [],
                events: [],
                publications: [],
                statistics: [],
                quarterlyReports: [],
                monthlyCheckIns: []
            };
            await onSave(newPartnership);
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full rounded-2xl glass-card border border-white/10 shadow-xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">Ajouter un Partenaire</Dialog.Title>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Nom de l'entreprise</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                    placeholder="ex: E=MC2 Consulting"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Affichage Période (Texte libre)</label>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="ex: sept 2025 - mars 2026"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Commission Client (%)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        name="commissionClient"
                                        value={formData.commissionClient || ''}
                                        onChange={handleChange}
                                        className="input w-full"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Commission Conseil (%)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        name="commissionConsulting"
                                        value={formData.commissionConsulting || ''}
                                        onChange={handleChange}
                                        className="input w-full"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Type de Partenariat</label>
                                    <select
                                        name="type"
                                        value={formData.type || 'strategique'}
                                        onChange={handleChange}
                                        className="input w-full"
                                    >
                                        <option value="ambassadeur">Ambassadeur</option>
                                        <option value="strategique">Partenariat stratégique</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-semibold text-white/90">Informations Contact & HubSpot (facultatif)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">Nom du Contact</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.contactPerson?.name || ''}
                                            onChange={handleContactChange}
                                            className="input w-full"
                                            placeholder="Prénom Nom"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">Email Contact</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.contactPerson?.email || ''}
                                            onChange={handleContactChange}
                                            className="input w-full"
                                            placeholder="email@exemple.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">Lien HubSpot Entreprise</label>
                                        <input
                                            type="url"
                                            name="companyHubspotUrl"
                                            value={formData.companyHubspotUrl || ''}
                                            onChange={handleChange}
                                            className="input w-full"
                                            placeholder="https://app.hubspot.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">Lien HubSpot Contact</label>
                                        <input
                                            type="url"
                                            name="hubspotUrl"
                                            value={formData.contactPerson?.hubspotUrl || ''}
                                            onChange={handleContactChange}
                                            className="input w-full"
                                            placeholder="https://app.hubspot.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button type="submit" variant="primary" disabled={isLoading}>
                                    {isLoading ? 'Création...' : 'Créer le partenaire'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
