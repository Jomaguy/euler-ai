/**
 * Language Manager Component
 * 
 * Manages Python configuration for the IDE.
 */

// Constants
const EXTRA_CE = "EXTRA_CE";
const AUTHENTICATED_EXTRA_CE_BASE_URL = "https://judge0-extra-ce.p.sulu.sh";
const UNAUTHENTICATED_EXTRA_CE_BASE_URL = "https://extra-ce.judge0.com";

// Python configuration
const PYTHON_CONFIG = {
    flavor: EXTRA_CE,
    language_id: 25  // Python for ML (3.11.2)
};

// Export the base URLs
export const AUTHENTICATED_BASE_URL = {
    [EXTRA_CE]: AUTHENTICATED_EXTRA_CE_BASE_URL
};

export const UNAUTHENTICATED_BASE_URL = {
    [EXTRA_CE]: UNAUTHENTICATED_EXTRA_CE_BASE_URL
};

export function getLanguageConfig() {
    return PYTHON_CONFIG;
}

export function getApiBaseUrl() {
    return UNAUTHENTICATED_EXTRA_CE_BASE_URL;
} 