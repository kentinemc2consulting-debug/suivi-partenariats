'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Event } from '@/types';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Event) => Promise<void>;
    initialData?: Event | null;
    partnerId: string;
}

export default function AddEventModal({ isOpen, onClose, onSave, initialData, partnerId }: AddEventModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventName: '',
        eventLocation: '',
        proposalDate: new Date().toISOString().split('T')[0],
        eventDate: '',
        status: 'pending' as 'pending' | 'accepted' | 'declined'
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                eventName: initialData.eventName,
                eventLocation: initialData.eventLocation || '',
                proposalDate: new Date(initialData.proposalDate).toISOString().split('T')[0],
                eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
                status: initialData.status || (initialData.attended ? 'accepted' : 'pending')
            });
        } else if (isOpen && !initialData) {
            setFormData({
                eventName: '',
                eventLocation: '',
                proposalDate: new Date().toISOString().split('T')[0],
                eventDate: '',
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
            const event: Event = {
                id: initialData?.id || crypto.randomUUID(),
                partnerId: partnerId,
                ...formData,
                attended: formData.status === 'accepted',
                status: formData.status as 'pending' | 'accepted' | 'declined'
            };
            await onSave(event);
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
                            {initialData ? 'Modifier l\'Événement' : 'Ajouter un Événement'}
                        </Dialog.Title>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Nom de l'événement</label>
                                <input
                                    type="text"
                                    name="eventName"
                                    value={formData.eventName}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                    placeholder="Ex: Soirée de gala"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Lieu de l'événement</label>
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={formData.eventLocation}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Ex: Paris"
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
                                    <option value="accepted">Accepté</option>
                                    <option value="declined">Refusé</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Date de proposition</label>
                                <input
                                    type="text" placeholder="AAAA-MM-JJ ou JJ/MM/AAAA"
                                    name="proposalDate"
                                    value={formData.proposalDate}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Date de l'événement (Optionnel)</label>
                                <input
                                    type="text" placeholder="AAAA-MM-JJ ou JJ/MM/AAAA"
                                    name="eventDate"
                                    value={formData.eventDate}
                                    onChange={handleChange}
                                    className="input w-full"
                                />
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
