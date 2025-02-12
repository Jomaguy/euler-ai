/**
 * Composer Component
 * 
 * A comprehensive code modification and review system that combines AI-powered suggestions
 * with interactive diff visualization and code review capabilities.
 * 
 * Key Features:
 * 1. Chat Interface:
 *    - AI-powered code suggestions using Gemini API
 *    - Message history tracking
 *    - Code snippet sharing
 * 
 * 2. Diff Management:
 *    - Real-time diff visualization
 *    - Side-by-side and inline diff views
 *    - Syntax highlighting and decorations
 *    - Active/inactive state management
 * 
 * 3. Code Review System:
 *    - Interactive review modal
 *    - Dual view modes (side-by-side/inline)
 *    - Source code editing with diff decorations
 *    - Floating review button for quick access
 * 
 * 4. Version Control:
 *    - Apply/Revert functionality
 *    - Change history tracking
 *    - Status indicators for actions
 *    - Preview state management
 * 
 * 5. UI Components:
 *    - Chat message container
 *    - Diff preview with action buttons
 *    - Review modal with toggle views
 *    - Status indicators and legends
 *    - Responsive layout management
 */

/**
 * External Dependencies and State Management
 * ----------------------------------------
 * This section initializes the core dependencies and state variables
 * required for the Composer component's functionality.
 */

// Import editor management utilities for Monaco integration
import * as EditorManager from '../editor/EditorManager.js';

// Import diff utilities for code comparison functionality
// Using ESM import for the diff library to maintain browser compatibility
import { createTwoFilesPatch, parsePatch } from 'https://cdn.jsdelivr.net/npm/diff@5.1.0/lib/index.mjs';

// API key for Gemini AI integration
// Used for generating code suggestions and modifications
const GEMINI_API_KEY = "AIzaSyAaS8BakefjrV1T3H3obrkQPJwmFjRpWFs";

/**
 * Global State Variables
 * ---------------------
 * These variables maintain the component's state across different functions
 * and features. They are initialized as null/empty and populated during setup.
 */

// Reference to the main Monaco editor instance
let mainEditor = null;

// Reference to the GoldenLayout instance for managing UI layout
let layout = null;

// Conversation history array with initial system prompt
// Maintains the context of the AI conversation
let conversationHistory = [
    {
        role: 'system',
        content: 'You are a programming tutor who uses the Socratic method. Keep your responses concise and focused. Instead of giving direct answers, guide users through problems with targeted questions. Limit explanations to 2-3 sentences when possible. When reviewing code, ask specific questions about potential issues or improvements. Your goal is to help users discover solutions through self-reflection and critical thinking.'
    }
];

// Tracks the currently active diff preview
// Used to manage state when multiple diffs are present
let currentActivePreview = null;

// Add chat styles
const chatStyles = document.createElement('style');
chatStyles.textContent = `
    .composer-chat-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        color: #d4d4d4;
    }
    
    .composer-chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .composer-chat-input-container {
        padding: 10px;
        border-top: 1px solid #3c3c3c;
        background: #1e1e1e;
    }
    
    .composer-chat-input {
        width: 100%;
        min-height: 40px;
        max-height: 200px;
        padding: 8px;
        background: #2d2d2d;
        color: #d4d4d4;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        font-family: inherit;
        resize: none;
        margin-bottom: 8px;
    }
    
    .composer-chat-submit {
        padding: 6px 12px;
        background: #0e639c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
    }
    
    .composer-chat-submit:hover {
        background: #1177bb;
    }
    
    .composer-chat-submit:disabled {
        background: #4d4d4d;
        cursor: not-allowed;
    }
    
    .composer-message {
        padding: 8px 12px;
        border-radius: 4px;
        max-width: 85%;
        word-break: break-word;
    }
    
    .composer-user-message {
        background: #0e639c;
        align-self: flex-end;
    }
    
    .composer-ai-message {
        background: #2d2d2d;
        align-self: flex-start;
    }
    
    .composer-error {
        background: #4d2d2d;
        color: #f44336;
        align-self: center;
    }

    .composer-diff-preview {
        background: #1e1e1e;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        margin: 10px 0;
        overflow: hidden;
        height: 70vh;
        min-height: 400px;
        display: flex;
        flex-direction: column;
    }

    .composer-diff-preview.inactive {
        opacity: 0.7;
    }

    .composer-diff-preview.inactive .composer-diff-header {
        background: #252525;
    }

    .composer-diff-preview.inactive .composer-diff-content {
        pointer-events: none;
    }

    .composer-diff-header {
        padding: 8px;
        border-bottom: 1px solid #3c3c3c;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #2d2d2d;
        position: sticky;
        top: 0;
        z-index: 1;
        flex-shrink: 0;
    }

    .composer-diff-legend {
        display: flex;
        gap: 15px;
        font-size: 12px;
    }

    .composer-diff-legend span::before {
        content: '●';
        margin-right: 4px;
    }

    .added-legend::before {
        color: #4CAF50;
    }

    .removed-legend::before {
        color: #f44336;
    }

    .composer-diff-content {
        padding: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        overflow-x: auto;
        flex-grow: 1;
        background: #1e1e1e;
        height: calc(100% - 80px);
        overflow-y: scroll;
        min-height: 0;
    }

    .composer-diff-line {
        padding: 4px 8px;
        white-space: pre;
        font-family: 'JetBrains Mono', monospace;
        line-height: 1.6;
    }

    .composer-diff-line.added {
        background: rgba(76, 175, 80, 0.2);
        border-left: 3px solid #4CAF50;
    }

    .composer-diff-line.removed {
        background: rgba(244, 67, 54, 0.2);
        border-left: 3px solid #f44336;
    }

    .composer-diff-actions {
        padding: 8px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        border-top: 1px solid #3c3c3c;
        background: #2d2d2d;
        position: sticky;
        bottom: 0;
        z-index: 1;
        flex-shrink: 0;
    }

    .composer-diff-actions button {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 12px;
    }

    .composer-diff-actions button.view-source {
        background: #0e639c;
        color: white;
    }

    .composer-diff-actions button.view-source:hover {
        background: #1177bb;
    }

    .composer-diff-actions button.accept {
        background: #4CAF50;
        color: white;
    }

    .composer-diff-actions button.accept:hover {
        background: #45a049;
    }

    .composer-diff-actions button.accept.revert {
        background: #0e639c;
    }

    .composer-diff-actions button.accept.revert:hover {
        background: #1177bb;
    }

    .composer-diff-actions button.reject {
        background: #f44336;
        color: white;
    }

    .composer-diff-actions button.reject:hover {
        background: #da190b;
    }

    /* Source editor diff styles */
    .diff-line-addition {
        background: rgba(76, 175, 80, 0.2) !important;
    }
    
    .diff-line-deletion {
        background: rgba(244, 67, 54, 0.2) !important;
        opacity: 0.7 !important;
    }
    
    .diff-gutter-addition {
        border-left: 3px solid #4CAF50 !important;
        margin-left: 3px;
    }
    
    .diff-gutter-deletion {
        border-left: 3px solid #f44336 !important;
        margin-left: 3px;
    }

    /* Status indicator styles */
    .composer-diff-status {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: 'JetBrains Mono', monospace;
        margin-right: auto;
    }

    .composer-diff-status.accepted {
        background: rgba(76, 175, 80, 0.2);
        color: #4CAF50;
    }

    .composer-diff-status.rejected {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
    }

    /* Disabled button styles */
    .composer-diff-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Floating review button styles */
    .floating-review-button {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        background: #0e639c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .floating-review-button:hover {
        background: #1177bb;
    }

    /* Review modal styles */
    .review-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .review-modal {
        background: #1e1e1e;
        border-radius: 6px;
        width: 90vw;
        height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
    }

    .review-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: #1e1e1e;
        border-bottom: 1px solid #333;
    }

    .review-modal-title {
        font-size: 18px;
        font-weight: 500;
        color: #fff;
    }

    .review-modal-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .review-modal-close:hover {
        opacity: 1;
    }

    .review-modal-toggle {
        background: #0e639c;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 16px;
    }

    .review-modal-toggle:hover {
        background: #1177bb;
    }

    .review-modal-content.side-by-side {
        display: flex;
        gap: 12px;
        padding: 24px;
        flex: 1;
        min-height: 0;
    }

    .review-modal-content.inline {
        display: none;
        padding: 24px;
        flex: 1;
        min-height: 0;
    }

    .review-editor-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
    }

    .review-editor-title {
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        margin-bottom: 8px;
        padding: 0 16px;
    }

    .review-editor {
        flex: 1;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        min-height: 0;
        height: 100%;
    }
`;
document.head.appendChild(chatStyles);

/**
 * Adds a message to the composer chat UI
 * @param {string} message - The message text
 * @param {string} className - The CSS class for the message
 */
function addMessageToChat(message, className) {
    const messagesContainer = document.querySelector('.composer-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `composer-message ${className}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Cleans up the diff output by removing unnecessary lines and comments
 * @param {Object} diff - The diff object to clean
 * @returns {Object} The cleaned diff object
 */
function cleanDiffOutput(diff) {
    diff.hunks.forEach(hunk => {
        hunk.lines = hunk.lines
            .filter(line => !line.includes('\\ No newline at end of file'))
            .map(line => {
                if (line.includes('```') || line.includes("I've") || line.includes('maintained')) {
                    return line.split('```')[0].split("I've")[0].trim();
                }
                return line;
            });
    });
    return diff;
}

/**
 * Generates a diff between current and proposed code
 * @param {string} currentCode - The current source code
 * @param {string} proposedCode - The proposed code changes
 * @returns {Object} The diff object
 */
function generateDiff(currentCode, proposedCode) {
    if (!currentCode.endsWith('\n')) currentCode += '\n';
    if (!proposedCode.endsWith('\n')) proposedCode += '\n';
    
    const diff = createTwoFilesPatch('current', 'proposed', currentCode, proposedCode, '', '', { context: 2 });
    return cleanDiffOutput(parsePatch(diff)[0]);
}

/**
 * Creates a complete file view with diff markers
 * @param {string} originalCode - The original source code
 * @param {Object} diff - The diff object
 * @returns {string} The complete file view with diff markers
 */
function createCompleteFileView(originalCode, diff) {
    const lines = originalCode.split('\n');
    const result = [];
    let currentLine = 0;
    
    diff.hunks.forEach(hunk => {
        const hunkStart = hunk.oldStart - 1;
        
        while (currentLine < hunkStart) {
            result.push(lines[currentLine]);
            currentLine++;
        }
        
        hunk.lines.forEach(line => {
            if (line.startsWith('-')) {
                result.push('-' + lines[currentLine]);
                currentLine++;
            } else if (line.startsWith('+')) {
                result.push('+' + line.substring(1));
            } else {
                result.push(lines[currentLine]);
                currentLine++;
            }
        });
    });
    
    while (currentLine < lines.length) {
        result.push(lines[currentLine]);
        currentLine++;
    }
    
    return result.join('\n');
}

/**
 * Prepares the diff view for display in the source editor
 * @param {string} originalCode - The original source code
 * @param {Object} diff - The diff object
 * @returns {string} The formatted diff view
 */
function prepareSourceDiffView(originalCode, diff) {
    const lines = originalCode.split('\n');
    const result = [];
    let currentLine = 0;
    
    diff.hunks.forEach(hunk => {
        // Add unchanged lines before the hunk
        while (currentLine < hunk.oldStart - 1) {
            result.push(lines[currentLine]);
            currentLine++;
        }
        
        // Add the hunk lines with diff markers
        hunk.lines.forEach(line => {
            if (line.startsWith('-')) {
                result.push('-' + lines[currentLine]);
                currentLine++;
            } else if (line.startsWith('+')) {
                result.push('+' + line.substring(1));
            } else {
                result.push(lines[currentLine]);
                currentLine++;
            }
        });
    });
    
    // Add remaining unchanged lines
    while (currentLine < lines.length) {
        result.push(lines[currentLine]);
        currentLine++;
    }
    
    return result.join('\n');
}

/**
 * Applies diff decorations to the source editor
 * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance
 * @param {string} content - The content with diff markers
 * @returns {string[]} Array of decoration IDs
 */
function applyDiffDecorations(editor, content) {
    const lines = content.split('\n');
    const decorations = [];
    let lineNumber = 1;
    
    // Track which lines are deletion lines (to make them read-only)
    const deletionLines = new Set();
    
    lines.forEach(line => {
        if (line.startsWith('+')) {
            decorations.push({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'diff-line-addition',
                    glyphMarginClassName: 'diff-gutter-addition'
                }
            });
        } else if (line.startsWith('-')) {
            decorations.push({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'diff-line-deletion',
                    glyphMarginClassName: 'diff-gutter-deletion'
                }
            });
            deletionLines.add(lineNumber);
        }
        lineNumber++;
    });

    // Add event listener to prevent editing of deletion lines
    editor.onKeyDown(e => {
        const selections = editor.getSelections();
        if (!selections) return;
        
        const isInDeletionLine = selections.some(selection => {
            if (!selection) return false;
            const startLine = selection.startLineNumber;
            const endLine = selection.endLineNumber;
            // Check if any line in the selection is a deletion line
            for (let line = startLine; line <= endLine; line++) {
                if (deletionLines.has(line)) return true;
            }
            return false;
        });

        if (isInDeletionLine) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    return editor.deltaDecorations([], decorations);
}

/**
 * Creates and shows the review modal with side-by-side diff view
 * @param {string} originalCode - The original source code
 * @param {string} proposedCode - The proposed code changes
 */
function createReviewModal(originalCode, proposedCode) {
    let isInlineView = false;
    let sideBySideEditor = null;
    let inlineEditor = null;
    
    // Create modal elements
    const overlay = document.createElement('div');
    overlay.className = 'review-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'review-modal-header';
    
    const title = document.createElement('div');
    title.className = 'review-modal-title';
    title.textContent = 'Review Changes';

    const toggleViewButton = document.createElement('button');
    toggleViewButton.className = 'review-modal-toggle';
    toggleViewButton.textContent = 'Toggle Inline View';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'review-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        overlay.remove();
    };
    
    header.appendChild(title);
    header.appendChild(toggleViewButton);
    header.appendChild(closeButton);
    
    // Create both view containers
    const sideBySideContent = document.createElement('div');
    sideBySideContent.className = 'review-modal-content side-by-side';
    
    const inlineContent = document.createElement('div');
    inlineContent.className = 'review-modal-content inline';
    inlineContent.style.display = 'none';

    // Create side-by-side view
    const originalContainer = document.createElement('div');
    originalContainer.className = 'review-editor-container';
    
    const originalTitle = document.createElement('div');
    originalTitle.className = 'review-editor-title';
    originalTitle.textContent = 'Original Code';
    
    const originalEditorDiv = document.createElement('div');
    originalEditorDiv.className = 'review-editor';
    
    originalContainer.appendChild(originalTitle);
    originalContainer.appendChild(originalEditorDiv);
    
    const proposedContainer = document.createElement('div');
    proposedContainer.className = 'review-editor-container';
    
    const proposedTitle = document.createElement('div');
    proposedTitle.className = 'review-editor-title';
    proposedTitle.textContent = 'Proposed Changes';
    
    const proposedEditorDiv = document.createElement('div');
    proposedEditorDiv.className = 'review-editor';
    
    proposedContainer.appendChild(proposedTitle);
    proposedContainer.appendChild(proposedEditorDiv);
    
    sideBySideContent.appendChild(originalContainer);
    sideBySideContent.appendChild(proposedContainer);

    // Create inline view container
    const inlineEditorDiv = document.createElement('div');
    inlineEditorDiv.className = 'review-editor';
    inlineContent.appendChild(inlineEditorDiv);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(sideBySideContent);
    modal.appendChild(inlineContent);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Initialize side-by-side editors
    const originalEditor = monaco.editor.create(originalEditorDiv, {
        value: originalCode,
        language: 'javascript',
        theme: 'vs-dark',
        readOnly: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderSideBySide: false,
        fontFamily: 'JetBrains Mono',
        fontSize: 13
    });

    // Generate diff view for the right editor
    const diff = generateDiff(originalCode, proposedCode);
    const diffView = [];
    let currentLine = 0;
    const originalLines = originalCode.split('\n');
    
    diff.hunks.forEach(hunk => {
        // Add unchanged lines before the hunk
        while (currentLine < hunk.oldStart - 1) {
            diffView.push(originalLines[currentLine]);
            currentLine++;
        }
        
        // Add the hunk lines with diff markers
        hunk.lines.forEach(line => {
            if (line.startsWith('-')) {
                diffView.push(line); // Keep the '-' marker
                currentLine++;
            } else if (line.startsWith('+')) {
                diffView.push(line); // Keep the '+' marker
            } else {
                diffView.push(line);
                currentLine++;
            }
        });
    });
    
    // Add remaining unchanged lines
    while (currentLine < originalLines.length) {
        diffView.push(originalLines[currentLine]);
        currentLine++;
    }

    const proposedEditor = monaco.editor.create(proposedEditorDiv, {
        value: diffView.join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
        readOnly: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderSideBySide: false,
        fontFamily: 'JetBrains Mono',
        fontSize: 13
    });

    // Initialize inline editor with the same diff view
    inlineEditor = monaco.editor.create(inlineEditorDiv, {
        value: diffView.join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
        readOnly: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderSideBySide: false,
        fontFamily: 'JetBrains Mono',
        fontSize: 13
    });

    // Apply decorations function
    const applyEditorDecorations = (editor, lines) => {
        const decorations = [];
        lines.forEach((line, index) => {
            if (line.startsWith('+')) {
                decorations.push({
                    range: new monaco.Range(index + 1, 1, index + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'diff-line-addition',
                        linesDecorationsClassName: 'diff-gutter-addition'
                    }
                });
            } else if (line.startsWith('-')) {
                decorations.push({
                    range: new monaco.Range(index + 1, 1, index + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'diff-line-deletion',
                        linesDecorationsClassName: 'diff-gutter-deletion'
                    }
                });
            }
        });
        editor.deltaDecorations([], decorations);
    };

    // Apply decorations to both editors
    applyEditorDecorations(proposedEditor, diffView);
    applyEditorDecorations(inlineEditor, diffView);

    // Toggle view handler
    toggleViewButton.onclick = () => {
        isInlineView = !isInlineView;
        sideBySideContent.style.display = isInlineView ? 'none' : 'flex';
        inlineContent.style.display = isInlineView ? 'block' : 'none';
        toggleViewButton.textContent = isInlineView ? 'Show Side by Side' : 'Show Inline';
        
        // Trigger layout update for the visible editor
        if (isInlineView) {
            inlineEditor.layout();
        } else {
            originalEditor.layout();
            proposedEditor.layout();
        }
    };
    
    // Clean up when modal is closed
    overlay.addEventListener('remove', () => {
        originalEditor.dispose();
        proposedEditor.dispose();
        inlineEditor.dispose();
    });
}

/**
 * Sends a message to the Gemini API
 */
async function sendMessage() {
    const input = document.querySelector('.composer-chat-input');
    const submitButton = document.querySelector('.composer-chat-submit');
    
    const message = input.value.trim();
    if (!message) return;

    if (!GEMINI_API_KEY) {
        addMessageToChat('Error: Gemini API key not found', 'composer-error');
        return;
    }

    // Add user message to chat
    addMessageToChat(message, 'composer-user-message');
    
    // Add user message to conversation history
    conversationHistory.push({ role: 'user', content: message });

    // Clear input and reset
    input.value = '';
    input.style.height = 'auto';

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Thinking...';
        
        // Get current source code
        const currentCode = mainEditor.getValue();
        
        // Create prompt with code context
        const prompt = `As a code modification assistant, analyze this request and suggest specific code changes. Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nRequest: ${message}\n\nProvide your response in this format:\n1. Brief explanation of changes\n2. Complete modified code block (include ALL code, not just changes)\n3. Note any potential issues or considerations`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Add AI response to conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        // Extract code block from response
        const codeMatch = aiResponse.match(/```[\s\S]*?\n([\s\S]*?)```/);
        if (codeMatch) {
            const proposedCode = codeMatch[1];
            const diff = generateDiff(currentCode, proposedCode);
            
            // Show the diff preview
            const previewContainer = document.createElement('div');
            previewContainer.className = 'composer-diff-preview';
            
            // Disable previous preview before setting the new one
            disablePreviousPreview();
            currentActivePreview = previewContainer;
            
            // Add diff header
            const header = document.createElement('div');
            header.className = 'composer-diff-header';
            header.innerHTML = `
                <div>Proposed Changes</div>
                <div class="composer-diff-legend">
                    <span class="added-legend">Added</span>
                    <span class="removed-legend">Removed</span>
                </div>
            `;
            previewContainer.appendChild(header);
            
            // Add diff content
            const content = document.createElement('div');
            content.className = 'composer-diff-content';
            
            // Add the diff lines
            diff.hunks.forEach(hunk => {
                hunk.lines.forEach(line => {
                    const lineDiv = document.createElement('div');
                    lineDiv.className = 'composer-diff-line';
                    if (line.startsWith('+')) {
                        lineDiv.className += ' added';
                    } else if (line.startsWith('-')) {
                        lineDiv.className += ' removed';
                    }
                    lineDiv.textContent = line;
                    content.appendChild(lineDiv);
                });
            });
            
            previewContainer.appendChild(content);
            
            // Add accept/reject buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'composer-diff-actions';
            
            const viewInSourceButton = document.createElement('button');
            viewInSourceButton.className = 'view-source';
            viewInSourceButton.textContent = 'View in Source';
            let isInSourceView = false;  // Track the current view state
            let originalCode = null;  // Store original code
            let decorations = [];     // Store decorations
            
            viewInSourceButton.onclick = () => {
                if (!isInSourceView) {
                    // Switch to source view
                    originalCode = mainEditor.getValue();
                    const diffView = prepareSourceDiffView(originalCode, diff);
                    mainEditor.setValue(diffView);
                    decorations = applyDiffDecorations(mainEditor, diffView);
                    
                    // Create and add floating review button
                    const reviewButton = document.createElement('button');
                    reviewButton.className = 'floating-review-button';
                    reviewButton.textContent = 'Review Changes';
                    reviewButton.onclick = () => {
                        createReviewModal(originalCode, proposedCode);
                    };
                    
                    // Add the button to the source editor container
                    const sourceContainer = layout.root.getItemsById("source")[0].container.getElement()[0];
                    sourceContainer.style.position = 'relative';  // Ensure proper positioning
                    sourceContainer.appendChild(reviewButton);
                    
                    // Update button state
                    viewInSourceButton.textContent = 'View in Editor';
                    isInSourceView = true;
                    
                    // Update accept button handler for source view
                    acceptButton.onclick = () => {
                        if (!isReverted) {
                            // Store original state before applying changes
                            originalCodeState = mainEditor.getValue();
                            
                            const lines = diffView.split('\n')
                                .filter(line => !line.startsWith('-'))
                                .map(line => line.startsWith('+') ? line.substring(1) : line);
                            
                            mainEditor.setValue(lines.join('\n'));
                            mainEditor.deltaDecorations(decorations, []);
                            
                            // Change button to revert state
                            acceptButton.textContent = 'Revert';
                            acceptButton.classList.add('revert');
                            isReverted = true;
                            
                            // Disable other buttons
                            viewInSourceButton.disabled = true;
                            rejectButton.disabled = true;
                            
                            // Add visual feedback
                            const statusDiv = document.createElement('div');
                            statusDiv.className = 'composer-diff-status accepted';
                            statusDiv.textContent = '✓ Changes Applied';
                            buttonsContainer.insertBefore(statusDiv, viewInSourceButton);
                            
                            addMessageToChat('Changes applied successfully.', 'composer-ai-message');
                        } else {
                            // Revert changes
                            mainEditor.setValue(originalCodeState);
                            decorations = applyDiffDecorations(mainEditor, diffView);
                            
                            // Change button back to apply state
                            acceptButton.textContent = 'Apply';
                            acceptButton.classList.remove('revert');
                            isReverted = false;
                            
                            // Re-enable other buttons
                            viewInSourceButton.disabled = false;
                            rejectButton.disabled = false;
                            
                            // Remove status message if it exists
                            const statusDiv = buttonsContainer.querySelector('.composer-diff-status');
                            if (statusDiv) {
                                statusDiv.remove();
                            }
                            
                            addMessageToChat('Changes reverted.', 'composer-ai-message');
                        }
                    };
                    
                    // Update reject button handler for source view
                    rejectButton.onclick = () => {
                        mainEditor.setValue(originalCode);
                        mainEditor.deltaDecorations(decorations, []);
                        
                        // Remove the floating review button
                        const sourceContainer = layout.root.getItemsById("source")[0].container.getElement()[0];
                        const reviewButton = sourceContainer.querySelector('.floating-review-button');
                        if (reviewButton) {
                            reviewButton.remove();
                        }
                        
                        // Disable all buttons
                        viewInSourceButton.disabled = true;
                        acceptButton.disabled = true;
                        rejectButton.disabled = true;
                        
                        // Add visual feedback
                        const statusDiv = document.createElement('div');
                        statusDiv.className = 'composer-diff-status rejected';
                        statusDiv.textContent = '✕ Changes Rejected';
                        buttonsContainer.insertBefore(statusDiv, viewInSourceButton);
                        
                        addMessageToChat('Changes rejected.', 'composer-ai-message');
                    };
                    
                    // Switch to source editor panel
                    const sourcePanel = layout.root.getItemsById("source")[0];
                    if (sourcePanel?.parent?.header?.parent) {
                        sourcePanel.parent.header.parent.setActiveContentItem(sourcePanel);
                    }
                } else {
                    // Switch back to composer view
                    mainEditor.setValue(originalCode);
                    mainEditor.deltaDecorations(decorations, []);
                    
                    // Remove the floating review button
                    const sourceContainer = layout.root.getItemsById("source")[0].container.getElement()[0];
                    const reviewButton = sourceContainer.querySelector('.floating-review-button');
                    if (reviewButton) {
                        reviewButton.remove();
                    }
                    
                    // Update button state
                    viewInSourceButton.textContent = 'View in Source';
                    isInSourceView = false;
                    
                    // Restore original accept button handler
                    acceptButton.onclick = () => {
                        mainEditor.setValue(proposedCode);
                        addMessageToChat('Changes applied successfully.', 'composer-ai-message');
                    };
                    
                    // Restore original reject button handler
                    rejectButton.onclick = () => {
                        addMessageToChat('Changes rejected.', 'composer-ai-message');
                    };
                    
                    // Switch back to composer panel
                    const composerPanel = layout.root.getItemsById("composer")[0];
                    if (composerPanel?.parent?.header?.parent) {
                        composerPanel.parent.header.parent.setActiveContentItem(composerPanel);
                    }
                }
            };
            
            const acceptButton = document.createElement('button');
            acceptButton.className = 'accept';
            acceptButton.textContent = 'Apply';
            
            // Store original code state
            let isReverted = false;
            let originalCodeState = null;
            
            acceptButton.onclick = () => {
                if (!isReverted) {
                    // Applying changes
                    originalCodeState = mainEditor.getValue();
                    mainEditor.setValue(proposedCode);
                    
                    // Change button to revert state
                    acceptButton.textContent = 'Revert';
                    acceptButton.classList.add('revert');
                    isReverted = true;
                    
                    // Disable other buttons
                    viewInSourceButton.disabled = true;
                    rejectButton.disabled = true;
                    
                    // Add visual feedback
                    const statusDiv = document.createElement('div');
                    statusDiv.className = 'composer-diff-status accepted';
                    statusDiv.textContent = '✓ Changes Applied';
                    buttonsContainer.insertBefore(statusDiv, viewInSourceButton);
                    
                    addMessageToChat('Changes applied successfully.', 'composer-ai-message');
                } else {
                    // Reverting changes
                    mainEditor.setValue(originalCodeState);
                    
                    // Change button back to apply state
                    acceptButton.textContent = 'Apply';
                    acceptButton.classList.remove('revert');
                    isReverted = false;
                    
                    // Re-enable other buttons
                    viewInSourceButton.disabled = false;
                    rejectButton.disabled = false;
                    
                    // Remove status message if it exists
                    const statusDiv = buttonsContainer.querySelector('.composer-diff-status');
                    if (statusDiv) {
                        statusDiv.remove();
                    }
                    
                    addMessageToChat('Changes reverted.', 'composer-ai-message');
                }
            };
            
            const rejectButton = document.createElement('button');
            rejectButton.className = 'reject';
            rejectButton.textContent = 'Reject';
            rejectButton.onclick = () => {
                // Disable all buttons
                viewInSourceButton.disabled = true;
                acceptButton.disabled = true;
                rejectButton.disabled = true;
                
                // Add visual feedback
                const statusDiv = document.createElement('div');
                statusDiv.className = 'composer-diff-status rejected';
                statusDiv.textContent = '✕ Changes Rejected';
                buttonsContainer.insertBefore(statusDiv, viewInSourceButton);
                
                // Add rejection message to chat
                addMessageToChat('Changes rejected.', 'composer-ai-message');
            };
            
            buttonsContainer.appendChild(viewInSourceButton);
            buttonsContainer.appendChild(acceptButton);
            buttonsContainer.appendChild(rejectButton);
            
            // Add buttons container to preview container
            previewContainer.appendChild(buttonsContainer);
            
            // Add the preview to the chat
            const messagesContainer = document.querySelector('.composer-chat-messages');
            messagesContainer.appendChild(previewContainer);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Add AI response to chat
        addMessageToChat(aiResponse.replace(/```[\s\S]*?```/g, '').trim(), 'composer-ai-message');

    } catch (error) {
        addMessageToChat(`Error: ${error.message}`, 'composer-error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
}

/**
 * Creates the chat UI components
 * @param {HTMLElement} container - The container element for the chat
 */
function createChatUI(container) {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'composer-chat-container';
    
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'composer-chat-messages';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'composer-chat-input-container';
    
    const input = document.createElement('textarea');
    input.className = 'composer-chat-input';
    input.placeholder = 'Type your message...';

    // Auto-resize function
    function autoResize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    }

    // Add input event listener for auto-resize
    input.addEventListener('input', autoResize);
    
    const submitButton = document.createElement('button');
    submitButton.className = 'composer-chat-submit';
    submitButton.textContent = 'Submit';
    
    // Set up event handlers
    submitButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Assemble the UI
    inputContainer.appendChild(input);
    inputContainer.appendChild(submitButton);
    
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(inputContainer);
    
    container.appendChild(chatContainer);
}

/**
 * Sets up the composer component
 * @param {GoldenLayout.Container} container - The GoldenLayout container
 */
export function setupComposer(container) {
    console.log('Setting up Composer component...');
    
    // Store layout reference
    layout = container.layoutManager;
    
    // Get main editor reference
    mainEditor = EditorManager.getSourceEditor();
    console.log('Main editor reference:', !!mainEditor);
    
    const composerContainer = document.createElement('div');
    composerContainer.id = 'composer-container';
    composerContainer.style.cssText = `
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: 'JetBrains Mono', monospace;
        overflow: hidden;
    `;

    // Create and add the chat UI
    createChatUI(composerContainer);

    // Add the container to the GoldenLayout container
    container.getElement().append(composerContainer);
}

/**
 * Adds code to the composer chat input
 * @param {string} code - The code to add to chat
 */
export function addCodeToComposer(code) {
    const input = document.querySelector('.composer-chat-input');
    if (input) {
        const existingText = input.value;
        const codeBlock = "\`\`\`\n" + code + "\n\`\`\`\n";
        input.value = existingText + (existingText ? "\n" : "") + codeBlock;
        
        // Trigger the auto-resize
        input.dispatchEvent(new Event('input'));
        
        // Focus the composer and switch to its panel
        focusComposer();
    }
}

/**
 * Adds an error message to the composer chat input
 * @param {string} errorMessage - The error message to add
 */
export function addErrorToComposer(errorMessage) {
    const input = document.querySelector('.composer-chat-input');
    if (input) {
        // Format the error message for the chat
        const formattedMessage = `I got the following error in my code:\n\`\`\`\n${errorMessage}\n\`\`\`\nCan you help me fix this?`;
        
        // Set the chat input value
        input.value = formattedMessage;
        input.dispatchEvent(new Event('input'));
        
        // Focus the composer and switch to its panel
        focusComposer();
    }
}

/**
 * Focuses the composer chat input
 */
export function focusComposer() {
    const input = document.querySelector('.composer-chat-input');
    if (input) {
        // Get the composer panel and switch to it
        const composerPanel = layout.root.getItemsById("composer")[0];
        if (composerPanel?.parent?.header?.parent) {
            composerPanel.parent.header.parent.setActiveContentItem(composerPanel);
        }
        
        // Focus the input
        input.focus();
    }
}

function disablePreviousPreview() {
    if (currentActivePreview) {
        // Add inactive class to the preview container
        currentActivePreview.classList.add('inactive');
        
        // Disable all buttons in the previous preview
        const buttons = currentActivePreview.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            
            // Remove any event listeners by cloning and replacing the button
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Add a visual indicator that this diff is no longer active
        const header = currentActivePreview.querySelector('.composer-diff-header');
        if (header && !header.querySelector('.composer-diff-inactive')) {
            const inactiveLabel = document.createElement('div');
            inactiveLabel.className = 'composer-diff-inactive';
            inactiveLabel.textContent = '(Previous Version)';
            inactiveLabel.style.fontSize = '12px';
            inactiveLabel.style.color = '#666';
            header.appendChild(inactiveLabel);
        }
        
        // Remove any stored state or references
        currentActivePreview.removeAttribute('data-original-code');
        currentActivePreview.removeAttribute('data-proposed-code');
    }
} 