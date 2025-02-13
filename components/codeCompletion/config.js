/**
 * Code Completion Configuration
 * 
 * Central configuration for AI-powered code completion features.
 * Uses Google's Gemini API for intelligent code suggestions.
 */

export const CodeCompletionConfig = {
    enabled: true,
    maxTokens: 50,
    temperature: 0.1,
    debounceMs: 2000,        // 2 second debounce
    minTriggerLength: 8,     // Require more context before triggering
    minTimeBetweenRequests: 3000, // 3 seconds between requests
    triggerCharacters: ['.', '(', '[', '{', '"', "'", '_', ':'], // Extended triggers for better completion
    
    // Gemini API Configuration
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    apiKey: 'AIzaSyAaS8BakefjrV1T3H3obrkQPJwmFjRpWFs',
    
    // Rate Limiting Configuration
    rateLimit: {
        maxRequests: {
            inline: 3,      // Increased since it's the only type now
        },
        timeWindowMs: 4000,  // 4 second window
        minBackoffMs: 1000,   // Reduced to 1 second for better responsiveness
        maxBackoffMs: 5000,   // 5 seconds maximum backoff
        consecutiveFailuresBeforeBackoff: 3
    },

    // Language-specific settings - Python only
    languageSettings: {
        python: {
            indentSize: 4,
            autoIndentTriggers: [':'],
            blockStart: ':',
            blockEnd: ''
        }
    },

    // Retry Configuration
    retry: {
        maxAttempts: 3,
        backoffMs: 1000,  // Start with 1 second
        maxBackoffMs: 5000,  // Max 5 seconds
        jitterMs: 500  // Add random jitter up to 500ms
    },
    
    // Error messages
    errorMessages: {
        overloaded: "Code completion temporarily unavailable (API overloaded)",
        maxRetries: "Code completion unavailable after retries",
        generic: "Code completion error"
    }
}; 