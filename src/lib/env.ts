/**
 * Environment Variable Validator
 * Validates Vite client-side environment variables safely at runtime.
 * Never expose sensitive backend keys (e.g. SUPABASE_SERVICE_ROLE_KEY) here.
 */

interface ClientEnv {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_PUBLISHABLE_KEY: string;
    VITE_API_URL: string;
    VITE_SITE_URL: string;
}

function getEnvVariable(key: string, defaultValue: string = ''): string {
    const value = (import.meta.env && import.meta.env[key]) ? String(import.meta.env[key]).trim() : '';
    return value || defaultValue;
}

export const env: ClientEnv = {
    VITE_SUPABASE_URL: getEnvVariable('VITE_SUPABASE_URL', 'https://bmwkuxahwsbeshowqlkq.supabase.co'),
    VITE_SUPABASE_PUBLISHABLE_KEY: getEnvVariable('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_9fM1opq1rzPsnbQv3o9Ciw_3L6pETqB'),
    VITE_API_URL: getEnvVariable('VITE_API_URL', 'https://murti-hub-5.onrender.com'),
    VITE_SITE_URL: getEnvVariable('VITE_SITE_URL', 'https://murti-hub-neon.vercel.app')
};

// Validate required environment configurations
export function validateClientEnv(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

    if (missing.length > 0 && import.meta.env?.DEV) {
        console.warn(`[MurtiHub Env Warning] Missing environment variables: ${missing.join(', ')}`);
    }

    return {
        isValid: missing.length === 0,
        missing
    };
}

export default env;
