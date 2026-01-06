'use client';

import { Dialog } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    isLoading?: boolean;
}

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false
}: ConfirmDeleteModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-sm w-full rounded-2xl glass-card p-6 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-full bg-red-500/20 text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <Dialog.Title className="text-xl font-bold text-white">
                            {title}
                        </Dialog.Title>
                    </div>

                    <p className="text-white/70 mb-8">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {isLoading ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
