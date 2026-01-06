'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QualifiedIntroduction } from '@/types';

interface AddIntroductionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (intro: QualifiedIntroduction) => Promise<void>;
    initialData?: QualifiedIntroduction | null;
    partnerId: string;
}

export default function AddIntroductionModal({ isOpen, onClose, onSave, initialData, partnerId }: AddIntroductionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        contactName: '',
        company: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending' as 'pending' | 'negotiating' | 'signed' | 'not_interested'
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                contactName: initialData.contactName,
                company: initialData.company,
                date: new Date(initialData.date).toISOString().split('T')[0],
                status: initialData.status || (initialData.contractSigned ? 'signed' : 'pending')
            });
        } else if (isOpen && !initialData) {
            setFormData({
                contactName: '',
                company: '',
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const intro: QualifiedIntroduction = {
                id: initialData?.id || crypto.randomUUID(),
                partnerId: partnerId,
                ...formData,
                contractSigned: formData.status === 'signed',
                status: formData.status as 'pending' | 'negotiating' | 'signed' | 'not_interested'
            };
            await onSave(intro);
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
                        <Dialog.Title className="text-xl font-bold text-white">
                            {initialData ? 'Modifier l\'Introduction' : 'Ajouter une Introduction'}
                        </Dialog.Title>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Nom du contact</label>
                                <input
                                    type="text"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                    placeholder="Ex: Jean Dupont"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Entreprise</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                    placeholder="Ex: Entreprise XYZ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Date</label>
                                <input
                                    type="text"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="AAAA-MM-JJ ou JJ/MM/AAAA"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Statut</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="input w-full"
                                >
                                    <option value="pending">En attente</option>
                                    <option value="negotiating">En négociation</option>
                                    <option value="signed">Contrat signé</option>
                                    <option value="not_interested">Pas de suite</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                                    Annuler
                                </Button>
                                <Button type="submit" variant="primary" disabled={isLoading}>
                                    {isLoading ? 'Sauvegarde...' : (initialData ? 'Enregistrer' : 'Ajouter')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
