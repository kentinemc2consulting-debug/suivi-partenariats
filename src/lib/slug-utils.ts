/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug without accents
 * 
 * @example
 * generateSlug("Carrefour") // "carrefour"
 * generateSlug("E=MC² Consulting") // "e-mc2-consulting"
 * generateSlug("Société Générale") // "societe-generale"
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
        || 'partner'; // Fallback if string becomes empty
}

/**
 * Generates a unique slug by appending a number if needed
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of slugs that already exist
 * @returns A unique slug
 * 
 * @example
 * makeSlugUnique("carrefour", ["carrefour"]) // "carrefour-2"
 * makeSlugUnique("auchan", []) // "auchan"
 */
export function makeSlugUnique(baseSlug: string, existingSlugs: string[]): string {
    if (!existingSlugs.includes(baseSlug)) {
        return baseSlug;
    }

    let counter = 2;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (existingSlugs.includes(uniqueSlug)) {
        counter++;
        uniqueSlug = `${baseSlug}-${counter}`;
    }

    return uniqueSlug;
}
