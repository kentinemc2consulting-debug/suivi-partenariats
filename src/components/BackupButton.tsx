'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BackupButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleBackup = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/backup');

            if (!response.ok) {
                throw new Error('Backup failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_partenariats_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Erreur lors du téléchargement de la sauvegarde');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="secondary"
            onClick={handleBackup}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            title="Télécharger une sauvegarde complète (CSV)"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Sauvegarde complète
        </Button>
    );
}
