'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        const newToast: Toast = { id, type, message };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl
                            animate-slideInRight
                            ${toast.type === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                : toast.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                            }
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {toast.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {toast.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}

                        <p className="flex-1 text-sm font-medium">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
