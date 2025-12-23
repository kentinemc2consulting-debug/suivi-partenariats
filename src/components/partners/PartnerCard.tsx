import React from 'react';
import { Card } from '@/components/ui/Card';
import { Partner } from '@/types';
import { Calendar, Percent, Building2 } from 'lucide-react';

interface PartnerCardProps {
    partner: Partner;
    onClick?: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick }) => {
    return (
        <Card hover className="p-6 cursor-pointer" onClick={onClick}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {partner.logo ? (
                        <img src={partner.logo} alt={partner.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-bold text-white">{partner.name}</h3>
                        <p className="text-sm text-white/60">{partner.duration}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${partner.isActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                    {partner.isActive ? 'Actif' : 'Archivé'}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4 text-accent-400" />
                    <span className="text-sm">
                        {new Date(partner.startDate).toLocaleDateString('fr-FR')} - {new Date(partner.endDate).toLocaleDateString('fr-FR')}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {partner.type && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md ${partner.type === 'ambassadeur'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}>
                            {partner.type === 'ambassadeur' ? 'Ambassadeur' : 'Partenariat stratégique'}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
};
