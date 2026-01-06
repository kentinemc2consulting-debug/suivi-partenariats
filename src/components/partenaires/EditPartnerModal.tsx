'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Partner } from '@/types';
import { formatDate } from '@/lib/date-utils';
import DatePicker from '@/components/ui/DatePicker';

interface EditPartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    partner: Partner;
    onSave: (updatedPartner: Partner) => Promise<void>;
}

export default function EditPartnerModal({ isOpen, onClose, partner, onSave }: EditPartnerModalProps) {
    const [formData, setFormData] = useState<Partner>(partner);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
            const startStr = formatDate(formData.startDate, options).replace('.', '');
            const endStr = formatDate(formData.endDate, options).replace('.', '');

            if (startStr !== 'Invalid Date' && endStr !== 'Invalid Date') {
                setFormData(prev => ({
                    ...prev,
                    duration: `${startStr} - ${endStr}`
                }));
            }
        }
    }, [formData.startDate, formData.endDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Handle commission fields specially to allow empty values
        if (name === 'commissionClient' || name === 'commissionConsulting') {
            const numValue = value === '' ? 0 : Number(value);
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
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
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

            {/* Full-screen container to center the panel */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full rounded-2xl glass-card border border-white/10 shadow-xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">Éditer le Partenaire</Dialog.Title>
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
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DatePicker
                                    label="Date de début"
                                    value={formData.startDate}
                                    onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                                    required
                                />
                                <DatePicker
                                    label="Date de fin"
                                    value={formData.endDate}
                                    onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                                    required
                                />
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Type de Partenariat</label>
                                <select
                                    name="type"
                                    value={formData.type || ''}
                                    onChange={handleChange}
                                    className="input w-full"
                                >
                                    <option value="">Non défini</option>
                                    <option value="ambassadeur">Ambassadeur</option>
                                    <option value="strategique">Partenariat stratégique</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Statut</label>
                                    <select
                                        name="isActive"
                                        value={String(formData.isActive)}
                                        onChange={handleChange}
                                        className="input w-full"
                                    >
                                        <option value="true">Actif</option>
                                        <option value="false">Archivé</option>
                                    </select>
                                </div>
                            </div>

                            {/* Contact & HubSpot Info */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-semibold text-white/90">Informations Contact & HubSpot</h3>

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

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button type="submit" variant="primary" disabled={isLoading}>
                                    {isLoading ? 'Sauvegarde...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
