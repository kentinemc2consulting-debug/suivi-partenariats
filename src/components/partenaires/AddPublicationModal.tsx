'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Publication } from '@/types';
import DatePicker from '@/components/ui/DatePicker';
import { uploadScreenshot } from '@/lib/supabase-service';

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
        links: string; // Raw textarea input (one link per line)
        description: string;
        publicationDate: string;
        statsReportDate?: string;
        statsReportUrl?: string;
        screenshotUrls?: string[]; // Existing URLs
    }>({
        platform: 'LinkedIn',
        links: '',
        description: '',
        publicationDate: new Date().toISOString().split('T')[0],
        statsReportDate: '',
        statsReportUrl: '',
        screenshotUrls: []
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedFiles([]);
            setPreviewUrls([]);
        }

        if (isOpen && initialData) {
            setFormData({
                platform: initialData.platform,
                links: (initialData.links || []).join('\n'),
                description: initialData.description || '',
                publicationDate: new Date(initialData.publicationDate).toISOString().split('T')[0],
                statsReportDate: initialData.statsReportDate ? new Date(initialData.statsReportDate).toISOString().split('T')[0] : '',
                statsReportUrl: initialData.statsReportUrl || '',
                screenshotUrls: initialData.screenshotUrls || []
            });
        } else if (isOpen && !initialData) {
            setFormData({
                platform: 'LinkedIn',
                links: '',
                description: '',
                publicationDate: new Date().toISOString().split('T')[0],
                statsReportDate: '',
                statsReportUrl: '',
                screenshotUrls: []
            });
        }
    }, [isOpen, initialData]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            // Revoke URL to prevent memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingScreenshot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            screenshotUrls: prev.screenshotUrls?.filter((_, i) => i !== index)
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Parse links from textarea (split by newlines, remove empty lines, trim whitespace)
            const linksArray = formData.links
                .split('\n')
                .map(link => link.trim())
                .filter(link => link.length > 0);

            if (linksArray.length === 0) {
                alert('Veuillez entrer au moins un lien');
                setIsLoading(false);
                return;
            }

            // Upload new files
            const uploadedUrls: string[] = [];
            for (const file of selectedFiles) {
                try {
                    const url = await uploadScreenshot(file);
                    uploadedUrls.push(url);
                } catch (error) {
                    console.error('Failed to upload file:', file.name, error);
                    alert(`Erreur lors de l'upload de ${file.name}`);
                }
            }

            // Combine existing URLs and new uploaded URLs
            const finalScreenshotUrls = [
                ...(formData.screenshotUrls || []),
                ...uploadedUrls
            ];

            const pub: Publication = {
                id: initialData?.id || crypto.randomUUID(),
                partnerId: partnerId,
                platform: formData.platform,
                links: linksArray,
                description: formData.description.trim() || undefined,
                publicationDate: formData.publicationDate,
                statsReportDate: formData.statsReportDate || undefined,
                statsReportUrl: formData.statsReportUrl?.trim() || undefined,
                screenshotUrls: finalScreenshotUrls.length > 0 ? finalScreenshotUrls : undefined,
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
                                <label className="block text-sm font-medium text-white/80 mb-1">
                                    Lien(s) - Un par ligne
                                </label>
                                <textarea
                                    name="links"
                                    value={formData.links}
                                    onChange={handleChange}
                                    className="input w-full min-h-[120px] resize-y font-mono text-sm"
                                    required
                                    placeholder="https://instagram.com/stories/...&#10;https://instagram.com/stories/...&#10;https://instagram.com/stories/..."
                                />
                                <p className="text-xs text-white/50 mt-1">
                                    {formData.links.split('\n').filter(l => l.trim()).length} lien(s) détecté(s)
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">
                                    Description (facultatif)
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="input w-full min-h-[80px] resize-y"
                                    placeholder="Ajoutez des informations supplémentaires sur cette publication..."
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
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-1">
                                    Lien vers rapport stats (facultatif)
                                </label>
                                <input
                                    type="url"
                                    name="statsReportUrl"
                                    value={formData.statsReportUrl || ''}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Screenshots du post (facultatif)
                                </label>

                                <div className="space-y-4">
                                    {/* File Input */}
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium">
                                                <Upload className="w-4 h-4" />
                                                Choisir des images
                                            </div>
                                        </label>
                                        <span className="text-xs text-white/50">
                                            {selectedFiles.length} fichier(s) sélectionné(s)
                                        </span>
                                    </div>

                                    {/* Preview Grid */}
                                    {(previewUrls.length > 0 || (formData.screenshotUrls && formData.screenshotUrls.length > 0)) && (
                                        <div className="grid grid-cols-3 gap-2 p-2 bg-black/20 rounded-lg border border-white/5 max-h-[200px] overflow-y-auto">
                                            {/* Existing URLs */}
                                            {formData.screenshotUrls?.map((url, idx) => (
                                                <div key={`existing-${idx}`} className="relative group aspect-square rounded overflow-hidden bg-black/40">
                                                    <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingScreenshot(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* New Files */}
                                            {previewUrls.map((url, idx) => (
                                                <div key={`new-${idx}`} className="relative group aspect-square rounded overflow-hidden bg-black/40 border-2 border-primary-500/50">
                                                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
