/**
 * Utility functions for safe date handling
 */

/**
 * Safely converts a date to YYYY-MM-DD format
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
            const [day, month, year] = dateInput.split('/');
            date = new Date(`${year}-${month}-${day}`);
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
 * Validates if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
}
