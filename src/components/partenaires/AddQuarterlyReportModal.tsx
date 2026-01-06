import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuarterlyReport } from '@/types';
import DatePicker from '@/components/ui/DatePicker';

interface AddQuarterlyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (report: QuarterlyReport) => Promise<void>;
    initialData?: QuarterlyReport | null;
    partnerId: string;
}

export default function AddQuarterlyReportModal({ isOpen, onClose, onSave, initialData, partnerId }: AddQuarterlyReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        link: '',
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                reportDate: new Date(initialData.reportDate).toISOString().split('T')[0],
                link: initialData.link || ''
            });
        } else if (isOpen && !initialData) {
            setFormData({
                reportDate: new Date().toISOString().split('T')[0],
                link: '',
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const report: QuarterlyReport = {
            id: initialData?.id || crypto.randomUUID(),
            partnerId: partnerId,
            reportDate: formData.reportDate,
            link: formData.link,
        };

        try {
            await onSave(report);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[90vh] shadow-xl">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <Dialog.Title className="text-xl font-bold text-white">
                                    {initialData ? 'Modifier le Compte Rendu' : 'Ajouter un Compte Rendu Trimestriel'}
                                </Dialog.Title>
                                <button onClick={onClose} className="text-white/60 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <DatePicker
                                        label="Date de rendu"
                                        value={formData.reportDate}
                                        onChange={(date) => setFormData(prev => ({ ...prev, reportDate: date }))}
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Lien (facultatif)</label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                            placeholder="https://..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="secondary" onClick={onClose}>
                                            Annuler
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={loading}>
                                            {loading ? 'Sauvegarde...' : (initialData ? 'Enregistrer' : 'Ajouter')}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
