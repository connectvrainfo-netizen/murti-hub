/**
 * Robust WhatsApp phone number normalization and URL builder utility.
 *
 * WhatsApp wa.me links REQUIRE the phone number to be in full international format
 * WITHOUT +, brackets, spaces, or hyphens (e.g. '917020676423' for India).
 * 
 * If a store admin enters a 10-digit Indian number like '70206 76423',
 * this utility automatically prepends India's country code '91' to prevent WhatsApp
 * from treating it as an invalid or foreign (e.g. +7 Russian) number.
 */

export const DEFAULT_WHATSAPP_NUMBER = '+91 70206 76423';
export const DEFAULT_WHATSAPP_INTL = '917020676423';

/**
 * Normalizes any phone number into an international digits-only string for wa.me links.
 * Example inputs -> Outputs:
 * - '70206 76423' -> '917020676423'
 * - '7020676423' -> '917020676423'
 * - '+91 70206 76423' -> '917020676423'
 * - '07020676423' -> '917020676423'
 * - '917020676423' -> '917020676423'
 */
export function formatWhatsAppNumberForLink(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
        return DEFAULT_WHATSAPP_INTL;
    }

    let digits = rawPhone.replace(/[^\d]/g, '');

    // Guarantee that old dummy/test placeholder 9876543210 NEVER reaches WhatsApp
    if (digits.includes('9876543210') || digits === '9876543210' || digits === '919876543210') {
        return DEFAULT_WHATSAPP_INTL;
    }

    // Handle leading zero common in Indian STD/mobile dialling (e.g. 07020676423)
    if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.slice(1);
    }

    // Standard 10-digit Indian mobile number: prepend India country code 91
    if (digits.length === 10) {
        return `91${digits}`;
    }

    // Already has 91 country code (12 digits)
    if (digits.length === 12 && digits.startsWith('91')) {
        return digits;
    }

    // If empty or unexpectedly short, fallback to default store number
    if (digits.length < 10) {
        return DEFAULT_WHATSAPP_INTL;
    }

    return digits;
}

/**
 * Normalizes any phone number into a clean human-readable display string.
 * Example: '70206 76423' or '917020676423' -> '+91 70206 76423'
 */
export function formatWhatsAppNumberForDisplay(rawPhone) {
    const intlDigits = formatWhatsAppNumberForLink(rawPhone);
    if (intlDigits.startsWith('91') && intlDigits.length === 12) {
        return `+91 ${intlDigits.slice(2, 7)} ${intlDigits.slice(7)}`;
    }
    return `+${intlDigits}`;
}

/**
 * Builds a complete wa.me link with encoded text.
 */
export function buildWhatsAppLink(rawPhone, message = '') {
    const cleanNumber = formatWhatsAppNumberForLink(rawPhone);
    if (!message) {
        return `https://wa.me/${cleanNumber}`;
    }
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
