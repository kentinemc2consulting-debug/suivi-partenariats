'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Publication } from '@/types';
import DatePicker from '@/components/ui/DatePicker';

interface AddPublicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pub: Publication) => Promise<void>;
    initialData?: Publication | null;
    partnerId: string;
}

export default function AddPublicationModal({ isOpen, onClose, onSave, initialData, partnerId }: AddPublicationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<{
        platform: string;
        link: string;
        publicationDate: string;
        statsReportDate?: string;
    }>({
        platform: 'LinkedIn',
        link: '',
        publicationDate: new Date().toISOString().split('T')[0],
        statsReportDate: ''
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                platform: initialData.platform,
                link: initialData.link,
                publicationDate: new Date(initialData.publicationDate).toISOString().split('T')[0],
                statsReportDate: initialData.statsReportDate ? new Date(initialData.statsReportDate).toISOString().split('T')[0] : ''
            });
        } else if (isOpen && !initialData) {
            setFormData({
                platform: 'LinkedIn',
                link: '',
                publicationDate: new Date().toISOString().split('T')[0],
                statsReportDate: ''
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
            const pub: Publication = {
                id: initialData?.id || crypto.randomUUID(),
                partnerId: partnerId,
                platform: formData.platform,
                link: formData.link,
                publicationDate: formData.publicationDate,
                statsReportDate: formData.statsReportDate || undefined, // Convert empty string to undefined
                lastUpdated: new Date().toISOString()
            };
            await onSave(pub);
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
                <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl glass-card border border-white/10 shadow-xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {initialData ? 'Modifier la Publication' : 'Ajouter une Publication'}
                        </Dialog.Title>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Plateforme</label>
                                <select
                                    name="platform"
                                    value={formData.platform}
                                    onChange={handleChange}
                                    className="input w-full"
                                >
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="YouTube">YouTube</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">Lien</label>
                                <input
                                    type="url"
                                    name="link"
                                    value={formData.link}
                                    onChange={handleChange}
                                    className="input w-full"
                                    required
                                    placeholder="https://..."
                                />
                            </div>
                            <DatePicker
                                label="Date de publication"
                                value={formData.publicationDate}
                                onChange={(date) => setFormData(prev => ({ ...prev, publicationDate: date }))}
                                required
                            />
                            <DatePicker
                                label="Date rapport stats (facultatif)"
                                value={formData.statsReportDate || ''}
                                onChange={(date) => setFormData(prev => ({ ...prev, statsReportDate: date }))}
                            />

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
