import { z } from 'zod';

/**
 * Zod Input Validation Schemas for Murti Hub
 * Enforces OWASP input validation standards on all client forms.
 */

// 1. Authentication Schemas
export const loginSchema = z.object({
    email: z.string().trim().email({ message: 'Please provide a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long.' })
});

export const registerSchema = z.object({
    email: z.string().trim().email({ message: 'Please provide a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
    fullName: z.string().trim().min(2, { message: 'Full name must be at least 2 characters.' }),
    phone: z.string().trim().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
        message: 'Please provide a valid 10-digit mobile number.'
    }).optional().or(z.literal(''))
});

export const passwordResetSchema = z.object({
    email: z.string().trim().email({ message: 'Please enter your registered email address.' })
});

export const passwordResetConfirmSchema = z.object({
    token: z.string().min(10, { message: 'A valid reset token is required.' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' })
});

/**
 * Validates redirect URLs to prevent Open Redirect vulnerabilities.
 * Ensures the destination is strictly a relative internal path.
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback: string = '/'): string {
    if (!target || typeof target !== 'string') return fallback;
    const clean = target.trim();
    if (clean.startsWith('/') && !clean.startsWith('//') && !clean.includes('://')) {
        return clean;
    }
    return fallback;
}

// 2. Checkout & Order Schemas
export const checkoutSchema = z.object({
    fullName: z.string().trim().min(2, { message: 'Full name is required.' }),
    phone: z.string().trim().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
        message: 'A valid 10-digit Indian phone number is required for shipping updates.'
    }),
    email: z.string().trim().email({ message: 'A valid email address is required for your invoice.' }).optional().or(z.literal('')),
    addressLine1: z.string().trim().min(5, { message: 'Please enter a complete street address.' }),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(2, { message: 'City name is required.' }),
    state: z.string().trim().min(2, { message: 'State is required.' }),
    pincode: z.string().trim().regex(/^\d{6}$/, { message: 'Enter a valid 6-digit Indian PIN code.' }),
    notes: z.string().trim().max(500, { message: 'Special instructions cannot exceed 500 characters.' }).optional()
});

// 3. Inquiry & Bulk Quote Schemas
export const inquirySchema = z.object({
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
    phone: z.string().trim().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
        message: 'Please provide a valid 10-digit mobile number.'
    }),
    inquiryType: z.enum(['general', 'custom_sculpture', 'bulk_quote', 'temple_mandir']).default('general'),
    productTitle: z.string().trim().optional(),
    message: z.string().trim().min(10, { message: 'Inquiry details must be at least 10 characters long.' })
});

export const bulkQuoteSchema = z.object({
    name: z.string().trim().min(2, { message: 'Name is required.' }),
    organization: z.string().trim().optional(),
    email: z.string().trim().email({ message: 'A valid business/personal email is required.' }),
    phone: z.string().trim().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, {
        message: 'A valid 10-digit mobile number is required.'
    }),
    quantity: z.number().int().min(2, { message: 'Bulk quotes start from a minimum of 2 pieces.' }),
    dimensions: z.string().trim().optional(),
    message: z.string().trim().min(10, { message: 'Please describe your temple or corporate requirements.' })
});

// 4. Product / Murti Creation & Edit Schema
export const productSchema = z.object({
    title: z.string().trim().min(3, { message: 'Murti title must be at least 3 characters.' }),
    deity: z.string().trim().min(2, { message: 'Deity name is required.' }),
    price: z.number().min(0, { message: 'Price must be greater than or equal to 0.' }),
    old_price: z.number().min(0).optional().nullable(),
    off_text: z.string().trim().optional(),
    material: z.string().trim().default('Pure White Makrana Marble'),
    dimensions: z.string().trim().min(2, { message: 'Dimensions specification is required.' }),
    weight: z.string().trim().optional(),
    stock_status: z.enum(['in_stock', 'made_to_order', 'out_of_stock']).default('in_stock'),
    rating_mode: z.enum(['enabled', 'read_only', 'hidden']).default('enabled'),
    description: z.string().trim().min(10, { message: 'Description must be at least 10 characters.' })
});

// 5. File Upload Validation (MIME type and size limit)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageUpload(file: File): { isValid: boolean; error?: string } {
    if (!file) {
        return { isValid: false, error: 'No file selected.' };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            isValid: false,
            error: 'Unsupported image type. Only JPEG, PNG, WebP, and AVIF are allowed.'
        };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            isValid: false,
            error: 'Image file size exceeds the 5 MB limit. Please optimize the image before uploading.'
        };
    }
    return { isValid: true };
}
