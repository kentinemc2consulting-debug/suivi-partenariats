'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NewPartnershipForm {
    name: string;
    startDate: string;
    endDate: string;
    commission: number;
    description: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
}

export default function NewPartnershipPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<NewPartnershipForm>({
        name: '',
        startDate: '',
        endDate: '',
        commission: 0,
        description: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate slug from name
            const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Create partnership object matching the JSON structure
            const newPartnership = {
                partner: {
                    id: slug,
                    name: formData.name,
                    duration: `${new Date(formData.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${new Date(formData.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    commission: formData.commission,
                    isActive: true
                },
                introductions: [],
                events: [],
                publications: [],
                statistics: [],
                quarterlyReports: []
            };

            const response = await fetch('/api/partenaires', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPartnership),
            });

            if (!response.ok) {
                throw new Error('Failed to create partnership');
            }

            // Redirect to homepage
            router.push('/');
        } catch (error) {
            console.error('Error creating partnership:', error);
            alert('Erreur lors de la création du partenariat');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'commission' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <main className="min-h-screen pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        ← Retour
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Nouveau Partenariat
                    </h1>
                    <p className="text-muted-foreground">
                        Ajoutez un nouveau partenariat d'entreprise
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                            Nom de l'entreprise *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="Ex: Audi, Le Bon Revenu..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-white mb-2">
                                Date de début *
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                required
                                value={formData.startDate}
                                onChange={handleChange}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-white mb-2">
                                Date de fin *
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                required
                                value={formData.endDate}
                                onChange={handleChange}
                                className="input w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="commission" className="block text-sm font-medium text-white mb-2">
                            Taux de commission (%) *
                        </label>
                        <input
                            type="number"
                            id="commission"
                            name="commission"
                            required
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.commission}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="Ex: 20"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="Description du partenariat..."
                        />
                    </div>

                    <div className="border-t border-border/50 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="contactName" className="block text-sm font-medium text-white mb-2">
                                    Nom du contact
                                </label>
                                <input
                                    type="text"
                                    id="contactName"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Nom et prénom"
                                />
                            </div>

                            <div>
                                <label htmlFor="contactEmail" className="block text-sm font-medium text-white mb-2">
                                    Email du contact
                                </label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="email@exemple.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-white mb-2">
                                    Téléphone du contact
                                </label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="btn btn-secondary flex-1"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Création...' : 'Créer le partenariat'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
