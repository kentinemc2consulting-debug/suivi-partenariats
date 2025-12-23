import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    className = ''
}) => {
    return (
        <div className={`stat-card ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary-500/20 backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-primary-400" />
                </div>
                {trend && (
                    <div className={`text-sm font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </div>
                )}
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{title}</div>
        </div>
    );
};
