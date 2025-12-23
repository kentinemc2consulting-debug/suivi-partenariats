import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
    const baseClasses = 'glass-card';

    return (
        <div
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
