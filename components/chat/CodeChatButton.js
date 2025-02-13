/**
 * Code Chat Button Component
 * 
 * Manages the "Add to Chat" button that appears when code is selected,
 * allowing users to easily add code snippets to the chat.
 */

import * as ChatManager from "./ChatManager.js";
import * as Composer from "../composer/Composer.js";

let currentSelection = '';
let addToChatBox = null;

// Update the system prompt to be Python-specific
const SYSTEM_PROMPT = `You are a Python programming assistant. Help users write and improve their Python code for solving Project Euler problems. Focus on:
1. Python best practices and idioms
2. Efficient algorithms
3. Clean, readable code
4. Mathematical insights when relevant`;

/**
 * Creates and sets up the "Add to Chat" button functionality
 * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance
 * @param {HTMLElement} container - The container element
 */
export function initialize(editor, container) {
    // Create and add the "Add to Chat" dropdown container
    addToChatBox = document.createElement('div');
    addToChatBox.className = 'add-to-chat-box';
    addToChatBox.style.position = 'fixed';
    addToChatBox.style.zIndex = '9999';
    
    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'add-to-chat-menu';
    
    // Add chat option
    const addToChatOption = document.createElement('div');
    addToChatOption.className = 'add-to-chat-option';
    addToChatOption.textContent = 'Add to Chat';
    addToChatOption.onclick = () => {
        if (currentSelection) {
            ChatManager.addCodeToChat(currentSelection);
            addToChatBox.style.display = 'none';
        }
    };
    
    // Add composer option
    const addToComposerOption = document.createElement('div');
    addToComposerOption.className = 'add-to-chat-option';
    addToComposerOption.textContent = 'Add to Composer';
    addToComposerOption.onclick = () => {
        if (currentSelection) {
            Composer.addCodeToComposer(currentSelection);
            addToChatBox.style.display = 'none';
        }
    };
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .add-to-chat-box {
            background: #2d2d2d;
            border: 1px solid #3c3c3c;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            overflow: hidden;
        }
        
        .add-to-chat-option {
            padding: 6px 12px;
            cursor: pointer;
            color: #d4d4d4;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
        
        .add-to-chat-option:hover {
            background: #3c3c3c;
        }
    `;
    document.head.appendChild(styles);
    
    // Assemble the menu
    menu.appendChild(addToChatOption);
    menu.appendChild(addToComposerOption);
    addToChatBox.appendChild(menu);
    document.body.appendChild(addToChatBox);

    // Add selection change handler
    editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getSelection();
        if (selection) {
            const selectedText = editor.getModel().getValueInRange(selection);
            if (selectedText && selectedText.trim()) {
                currentSelection = selectedText;
                
                // Get the selection coordinates
                const endPos = editor.getScrolledVisiblePosition(selection.getEndPosition());
                
                if (endPos) {
                    const editorPos = container.getElement()[0].getBoundingClientRect();
                    const left = endPos.left + editorPos.left;
                    const top = endPos.top + editorPos.top + 20; // Position below the selection
                    
                    // Update button position
                    addToChatBox.style.left = `${left}px`;
                    addToChatBox.style.top = `${top}px`;
                    addToChatBox.style.display = 'block';
                }
            } else {
                currentSelection = '';
                addToChatBox.style.display = 'none';
            }
        }
    });

    // Return cleanup function
    return () => {
        if (addToChatBox) {
            addToChatBox.remove();
            addToChatBox = null;
        }
    };
} 