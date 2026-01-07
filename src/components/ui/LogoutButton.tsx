'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { LogOut } from 'lucide-react';
import { Button } from './Button';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <Button
            variant="secondary"
            onClick={handleLogout}
            className="gap-2"
        >
            <LogOut className="w-4 h-4" />
            Déconnexion
        </Button>
    );
}
