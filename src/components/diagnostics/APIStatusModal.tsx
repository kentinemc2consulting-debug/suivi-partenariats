import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface APIStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function APIStatusModal({ isOpen, onClose }: APIStatusModalProps) {
    const [loading, setLoading] = useState(false);
    const [diagnostics, setDiagnostics] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            runDiagnostics();
        }
    }, [isOpen]);

    const runDiagnostics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/diagnostics');
            const data = await res.json();
            setDiagnostics(data);
        } catch (error) {
            console.error('Diagnostics error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-400" />;
            case 'error':
                return <XCircle className="w-6 h-6 text-red-400" />;
            case 'warning':
                return <AlertCircle className="w-6 h-6 text-orange-400" />;
            default:
                return <Loader className="w-6 h-6 text-white/40 animate-spin" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-500/10 border-green-500/30';
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'warning':
                return 'bg-orange-500/10 border-orange-500/30';
            default:
                return 'bg-white/5 border-white/10';
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
                        <Dialog.Panel className="w-full max-w-3xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <Dialog.Title className="text-2xl font-bold text-white">
                                    État des services
                                </Dialog.Title>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={runDiagnostics}
                                        disabled={loading}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                                        title="Actualiser"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="text-white/60 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6">
                                {loading && !diagnostics ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : diagnostics ? (
                                    <>
                                        {/* Supabase Status */}
                                        <div className={`p-6 rounded-xl border ${getStatusColor(diagnostics.supabase.status)}`}>
                                            <div className="flex items-start gap-4">
                                                {getStatusIcon(diagnostics.supabase.status)}
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-white mb-2">Supabase Database</h3>
                                                    <p className="text-white/80 mb-4">{diagnostics.supabase.message}</p>

                                                    {diagnostics.supabase.details.url && (
                                                        <div className="mb-4">
                                                            <p className="text-sm text-white/60 mb-1">URL:</p>
                                                            <code className="text-xs bg-black/30 px-3 py-1 rounded text-white/80">
                                                                {diagnostics.supabase.details.url}
                                                            </code>
                                                        </div>
                                                    )}

                                                    {diagnostics.supabase.details.tables && (
                                                        <div>
                                                            <p className="text-sm text-white/60 mb-2">Tables:</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries(diagnostics.supabase.details.tables).map(([table, status]: any) => (
                                                                    <div key={table} className="text-xs bg-black/20 px-3 py-2 rounded">
                                                                        <span className="text-white/60">{table}:</span>{' '}
                                                                        <span className="text-white/90">{status}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {diagnostics.supabase.details.error && (
                                                        <div className="mt-4 p-4 bg-black/30 rounded-lg">
                                                            <p className="text-sm font-semibold text-red-300 mb-2">Erreur:</p>
                                                            <p className="text-sm text-white/80 mb-2">{diagnostics.supabase.details.error}</p>
                                                            {diagnostics.supabase.details.hint && (
                                                                <p className="text-sm text-orange-300">💡 {diagnostics.supabase.details.hint}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gemini Status */}
                                        <div className={`p-6 rounded-xl border ${getStatusColor(diagnostics.gemini.status)}`}>
                                            <div className="flex items-start gap-4">
                                                {getStatusIcon(diagnostics.gemini.status)}
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-white mb-2">Gemini AI API</h3>
                                                    <p className="text-white/80 mb-4">{diagnostics.gemini.message}</p>

                                                    {diagnostics.gemini.details.model && (
                                                        <div className="mb-4">
                                                            <p className="text-sm text-white/60 mb-1">Modèle:</p>
                                                            <code className="text-xs bg-black/30 px-3 py-1 rounded text-white/80">
                                                                {diagnostics.gemini.details.model}
                                                            </code>
                                                        </div>
                                                    )}

                                                    {diagnostics.gemini.details.error && (
                                                        <div className="mt-4 p-4 bg-black/30 rounded-lg">
                                                            <p className="text-sm font-semibold text-red-300 mb-2">Erreur:</p>
                                                            <p className="text-sm text-white/80 mb-2">{diagnostics.gemini.details.error}</p>
                                                            {diagnostics.gemini.details.hint && (
                                                                <p className="text-sm text-orange-300">💡 {diagnostics.gemini.details.hint}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {diagnostics.gemini.details.hint && !diagnostics.gemini.details.error && (
                                                        <div className="mt-4 p-4 bg-black/30 rounded-lg">
                                                            <p className="text-sm text-orange-300">💡 {diagnostics.gemini.details.hint}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            <div className="flex justify-end gap-3 p-6 border-t border-white/10 shrink-0">
                                <Button variant="secondary" onClick={onClose}>
                                    Fermer
                                </Button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
