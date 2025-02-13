/**
 * Error Chat Button Component
 * 
 * Manages the "Ask Chat?" button that appears when there's a compilation error,
 * allowing users to easily ask for help with errors.
 */

import * as ChatManager from "./ChatManager.js";
import * as Composer from "../composer/Composer.js";

// Add styles
const styles = document.createElement('style');
styles.textContent = `
    .ask-chat-box {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #2d2d2d;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .ask-chat-option {
        padding: 6px 12px;
        cursor: pointer;
        color: #d4d4d4;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        white-space: nowrap;
    }
    
    .ask-chat-option:hover {
        background: #3c3c3c;
    }
`;
document.head.appendChild(styles);

// Update error analysis for Python
const ERROR_ANALYSIS_PROMPT = `As a Python debugging assistant, analyze this error:
1. Identify Python-specific syntax or runtime issues
2. Suggest Python-based solutions
3. Explain common Python pitfalls
4. Provide idiomatic Python fixes`;

/**
 * Creates an "Ask Chat" button when there's a compilation error
 * @param {string} errorMessage - The error message to add to chat
 * @param {HTMLElement} editorElement - The editor element to append the button to
 */
export function create(errorMessage, editorElement) {
    // Validate parameters
    if (!editorElement) {
        console.error('Editor element is required to create error chat button');
        return;
    }

    // Remove any existing ask chat button
    const existingButton = document.querySelector('.ask-chat-box');
    if (existingButton) {
        existingButton.remove();
    }

    const box = document.createElement('div');
    box.className = 'ask-chat-box';

    // Add chat option
    const askChatOption = document.createElement('div');
    askChatOption.className = 'ask-chat-option';
    askChatOption.textContent = 'Ask in Chat';
    askChatOption.onclick = () => {
        ChatManager.addErrorToChat(errorMessage);
    };

    // Add composer option
    const askComposerOption = document.createElement('div');
    askComposerOption.className = 'ask-chat-option';
    askComposerOption.textContent = 'Ask in Composer';
    askComposerOption.onclick = () => {
        Composer.addErrorToComposer(errorMessage);
    };

    // Assemble the box
    box.appendChild(askChatOption);
    box.appendChild(askComposerOption);

    // Add the box to the editor container
    editorElement.style.position = 'relative';
    editorElement.appendChild(box);
    
    // Show the box with a fade-in effect
    setTimeout(() => {
        box.style.opacity = '1';
    }, 100);
}

/**
 * Removes the error chat button if it exists
 */
export function remove() {
    const box = document.querySelector('.ask-chat-box');
    if (box) {
        box.remove();
    }
} 