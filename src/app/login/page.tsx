'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check if user was just logged out
    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            setSuccessMessage('Vous avez été déconnecté avec succès');
            // Clear the query parameter from URL
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError('Email ou mot de passe incorrect');
                } else {
                    setError(error.message);
                }
                return;
            }

            router.push('/partenaires');
            router.refresh();
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-8 animate-fadeInUp">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-card mb-4">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Suivi Partenariats
                    </h1>
                    <p className="text-white/60">E=MC² Consulting</p>
                </div>

                {/* Login Form */}
                <div className="glass-card animate-scaleIn">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        Connexion
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <p className="text-sm text-green-400">{successMessage}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-full py-3 text-base font-semibold"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-white/40">
                        Accès réservé aux membres de l'équipe
                    </p>
                </div>
            </div>
        </div>
    );
}
