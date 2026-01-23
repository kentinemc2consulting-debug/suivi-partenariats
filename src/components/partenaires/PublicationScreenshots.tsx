'use client';

import { useState } from 'react';
import { ChevronDown, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicationScreenshotsProps {
    screenshots: string[];
}

export default function PublicationScreenshots({ screenshots }: PublicationScreenshotsProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!screenshots || screenshots.length === 0) return null;

    return (
        <div className="mt-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors mb-2 group focus:outline-none select-none"
            >
                <ImageIcon className="w-3 h-3 group-hover:text-primary transition-colors" />
                <span className="font-medium">Screenshots du post</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
                </motion.div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 group-hover:bg-white/10 transition-colors">
                    {screenshots.length}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-2">
                            {screenshots.map((url, idx) => (
                                <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-all hover:scale-105 group/img relative"
                                >
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors z-10" />
                                    <img
                                        src={url}
                                        alt={`Screenshot ${idx + 1}`}
                                        className="w-full h-32 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23666" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
