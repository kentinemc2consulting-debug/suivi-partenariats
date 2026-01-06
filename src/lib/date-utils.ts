/**
 * Utility functions for safe date handling
 */

/**
 * Safely converts a date input to YYYY-MM-DD format
 * Handles both DD/MM/YYYY and YYYY-MM-DD formats
 */
export function toDateString(dateInput: string | Date | null | undefined): string {
    if (!dateInput) {
        return new Date().toISOString().split('T')[0];
    }

    let date: Date;

    if (typeof dateInput === 'string') {
        // Try DD/MM/YYYY format first
        if (dateInput.includes('/')) {
            const parts = dateInput.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                // Create date as YYYY-MM-DD
                date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            } else {
                date = new Date(dateInput);
            }
        } else {
            // Assume YYYY-MM-DD format
            date = new Date(dateInput);
        }
    } else {
        date = dateInput;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
}

/**
 * Safely format a date for display
 * Handles invalid dates gracefully
 */
export function formatDate(dateInput: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!dateInput) return 'Invalid Date';

    try {
        let date: Date;

        if (typeof dateInput === 'string') {
            // Handle DD/MM/YYYY format
            if (dateInput.includes('/')) {
                const parts = dateInput.split('/');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                } else {
                    date = new Date(dateInput);
                }
            } else {
                date = new Date(dateInput);
            }
        } else {
            date = dateInput;
        }

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString('fr-FR', options || {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Validates if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
}
