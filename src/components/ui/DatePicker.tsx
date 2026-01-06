'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function DatePicker({
    value,
    onChange,
    label,
    placeholder = 'JJ/MM/AAAA',
    required = false,
    className = ''
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                setDisplayValue(`${day}/${month}/${year}`);
                setCurrentMonth(date);
            }
        }
    }, [value]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setDisplayValue(input);

        // Try to parse DD/MM/YYYY or YYYY-MM-DD
        if (input.includes('/')) {
            const parts = input.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                const date = new Date(isoDate);
                if (!isNaN(date.getTime())) {
                    onChange(isoDate);
                }
            }
        } else if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
            onChange(input);
        }
    };

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        onChange(isoDate);
        setIsOpen(false);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isSelectedDate = (date: Date | null) => {
        if (!date || !value) return false;
        const selectedDate = new Date(value);
        return (
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-white/80 mb-1">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            <div className="relative" ref={containerRef}>
                <div className="relative">
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        required={required}
                        className="input w-full pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>

                {isOpen && (
                    <div className="absolute z-50 mt-2 bg-gray-800 border border-white/10 rounded-lg shadow-xl p-4 min-w-[280px]">
                        {/* Month/Year Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={goToPreviousMonth}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="text-white font-medium">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </div>
                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs text-white/50 font-medium py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(currentMonth).map((date, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => date && handleDateSelect(date)}
                                    disabled={!date}
                                    className={`
                                        p-2 text-sm rounded transition-all
                                        ${!date ? 'invisible' : ''}
                                        ${isSelectedDate(date) ? 'bg-blue-500 text-white font-semibold' : ''}
                                        ${isToday(date) && !isSelectedDate(date) ? 'bg-white/10 text-white font-medium' : ''}
                                        ${!isSelectedDate(date) && !isToday(date) ? 'text-white/70 hover:bg-white/10' : ''}
                                    `}
                                >
                                    {date?.getDate()}
                                </button>
                            ))}
                        </div>

                        {/* Today Button */}
                        <button
                            type="button"
                            onClick={() => handleDateSelect(new Date())}
                            className="w-full mt-3 py-2 text-sm text-blue-400 hover:bg-white/10 rounded transition-colors"
                        >
                            Aujourd'hui
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
