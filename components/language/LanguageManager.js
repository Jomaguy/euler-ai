/**
 * Language Manager Component
 * 
 * Manages Python configuration for the IDE.
 */

// Constants
const EXTRA_CE = "EXTRA_CE";
const UNAUTHENTICATED_EXTRA_CE_BASE_URL = "https://extra-ce.judge0.com";

// Python configuration
const PYTHON_CONFIG = {
    flavor: EXTRA_CE,
    language_id: 25  // Python for ML (3.11.2)
};

export function getLanguageConfig() {
    return PYTHON_CONFIG;
}

export function getApiBaseUrl() {
    return UNAUTHENTICATED_EXTRA_CE_BASE_URL;
} 