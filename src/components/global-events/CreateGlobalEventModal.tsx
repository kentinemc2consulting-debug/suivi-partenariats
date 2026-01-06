import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlobalEvent } from '@/types';

interface CreateGlobalEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<GlobalEvent>) => Promise<void>;
    eventToEdit?: GlobalEvent;
}

export default function CreateGlobalEventModal({ isOpen, onClose, onSave, eventToEdit }: CreateGlobalEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventName: '',
        eventDate: '',
        eventLocation: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setFormData({
                    eventName: eventToEdit.eventName,
                    eventDate: eventToEdit.eventDate || '',
                    eventLocation: eventToEdit.eventLocation || '',
                    description: eventToEdit.description || ''
                });
            } else {
                setFormData({
                    eventName: '',
                    eventDate: '',
                    eventLocation: '',
                    description: ''
                });
            }
        }
    }, [isOpen, eventToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const eventData: Partial<GlobalEvent> = {
            eventName: formData.eventName,
            eventDate: formData.eventDate || undefined,
            eventLocation: formData.eventLocation || undefined,
            description: formData.description || undefined
        };

        if (eventToEdit) {
            eventData.id = eventToEdit.id;
        }

        try {
            await onSave(eventData);
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
                        <Dialog.Panel className="w-full max-w-md glass-card rounded-2xl border border-white/10 flex flex-col max-h-[90vh] shadow-xl">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <Dialog.Title className="text-xl font-bold text-white">
                                    {eventToEdit ? 'Modifier l\'événement' : 'Créer un Événement Global'}
                                </Dialog.Title>
                                <button onClick={onClose} className="text-white/60 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Nom de l'événement *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.eventName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                                            placeholder="ex: Conférence Tech 2026"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Date de l'événement</label>
                                        <input
                                            type="date"
                                            value={formData.eventDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Lieu</label>
                                        <input
                                            type="text"
                                            value={formData.eventLocation}
                                            onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                                            placeholder="ex: Paris, Station F"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Description de l'événement..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 resize-none"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="secondary" onClick={onClose}>
                                            Annuler
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={loading}>
                                            {loading ? 'Enregistrement...' : (eventToEdit ? 'Enregistrer' : 'Créer l\'événement')}
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
