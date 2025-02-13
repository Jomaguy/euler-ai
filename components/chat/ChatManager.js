/**
 * Chat Manager Component
 * 
 * Manages the AI chat functionality, including:
 * - Chat UI creation and management
 * - Message handling
 * - Gemini API integration
 */

const GEMINI_API_KEY = "AIzaSyAaS8BakefjrV1T3H3obrkQPJwmFjRpWFs";

// State variables
let layout;

// Separate context management
let currentProblem = null;  // Store current problem context
const MAX_MESSAGES = 4;     // Store last 4 messages for context window
let messageHistory = [];    // Store recent messages

// Initial system prompt without problem context
const SYSTEM_PROMPT = `You are a Python programming tutor helping users solve Project Euler problems. 

Your role is to:
1. Guide users in writing Python code to solve the problem
2. Use the Socratic method - ask questions to lead users to solutions
3. When reviewing code, suggest Python-specific improvements
4. Encourage Python best practices and efficient algorithms
5. Help debug Python code when users encounter errors

Keep responses concise and focused on Python implementation. Instead of giving direct answers, guide users with targeted questions about their code and approach.`;

// Add this at the beginning of the file, after the imports
const chatStyles = document.createElement('style');
chatStyles.textContent = `
    .chat-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
    }

    .chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .message {
        padding: 8px 12px;
        border-radius: 4px;
        max-width: 85%;
        color: #ffffff;  /* Make text white */
    }

    .user-message {
        background: #0e639c;
        align-self: flex-end;
    }

    .ai-message {
        background: #2d2d2d;
        align-self: flex-start;
    }

    .error {
        background: #4d2d2d;
        color: #f44336;
        align-self: center;
    }

    .chat-input-container {
        padding: 10px;
        border-top: 1px solid #3c3c3c;
        background: #1e1e1e;
    }

    .chat-input {
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

    .button-row {
        display: flex;
        justify-content: flex-end;
    }

    .chat-submit {
        padding: 6px 12px;
        background: #0e639c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .chat-submit:hover {
        background: #1177bb;
    }

    .chat-submit:disabled {
        background: #4d4d4d;
        cursor: not-allowed;
    }
`;

// Add this line right after the style definition
document.head.appendChild(chatStyles);

/**
 * Creates the chat UI components
 * @param {HTMLElement} container - The container element for the chat
 */
function createChatUI(container) {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'chat-messages';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-input-container';
    
    const input = document.createElement('textarea');
    input.className = 'chat-input';
    input.placeholder = 'Type your message...';
    input.rows = 1;

    // Auto-resize function
    function autoResize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    }

    // Add input event listener for auto-resize
    input.addEventListener('input', autoResize);
    
    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-row';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'chat-submit';
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
    inputContainer.appendChild(buttonRow);
    buttonRow.appendChild(submitButton);
    
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(inputContainer);
    
    container.appendChild(chatContainer);
}

/**
 * Builds the context for the API call
 * @param {string} currentMessage - The new message to send
 * @returns {Array} The full context array for the API
 */
function buildApiContext(currentMessage) {
    const context = [];
    
    // Add system prompt with problem context if we have a problem
    if (currentProblem) {
        context.push({
            role: 'user',  // Changed from 'system' to 'user' as Gemini expects
            parts: [{
                text: `Context: You are a programming tutor helping with Project Euler Problem ${currentProblem.id}: ${currentProblem.title}.\n\nProblem: ${currentProblem.description}\n\n${SYSTEM_PROMPT}`
            }]
        });
    }
    
    // Add recent message history - Gemini only accepts 'user' and 'model' roles
    messageHistory.forEach(msg => {
        context.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        });
    });
    
    // Add current message
    context.push({
        role: 'user',
        parts: [{ text: currentMessage }]
    });
    
    return context;
}

/**
 * Sends a message to the Gemini API
 */
async function sendMessage() {
    const input = document.querySelector('.chat-input');
    const messagesContainer = document.querySelector('.chat-messages');
    const submitButton = document.querySelector('.chat-submit');
    
    const message = input.value.trim();
    if (!message) return;

    if (!GEMINI_API_KEY) {
        addMessageToChat('Error: Gemini API key not found', 'error');
        return;
    }

    // Add user message to chat
    addMessageToChat(`User: ${message}`, 'user-message');
    
    // Add user message to conversation history
    messageHistory.push({ role: 'user', content: message });

    // Clear input and reset
    input.value = '';
    input.style.height = 'auto';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Thinking...';
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: buildApiContext(message)
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Add AI response to conversation history
        messageHistory.push({ role: 'assistant', content: aiResponse });
        
        // Add AI response to chat
        addMessageToChat(`Gemini: ${aiResponse}`, 'ai-message');

        // Limit conversation history
        if (messageHistory.length > MAX_MESSAGES) {
            messageHistory = messageHistory.slice(-MAX_MESSAGES);
        }
    } catch (error) {
        addMessageToChat(`Error: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

/**
 * Adds a message to the chat UI
 * @param {string} message - The message text
 * @param {string} className - The CSS class for the message
 */
function addMessageToChat(message, className) {
    const messagesContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
}

/**
 * Initializes the chat manager
 * @param {GoldenLayout} layoutInstance - The GoldenLayout instance
 */
export function initialize(layoutInstance) {
    layout = layoutInstance;
    
    // Register the chat component with the layout
    layout.registerComponent("chat", function(container, state) {
        createChatUI(container.getElement()[0]);
    });
}

/**
 * Gets the chat input element
 * @returns {HTMLElement} The chat input element
 */
export function getChatInput() {
    return document.querySelector('.chat-input');
}

/**
 * Focuses the chat input and switches to the chat panel
 */
export function focusChat() {
    const chatPanel = layout.root.getItemsById("chat")[0];
    if (chatPanel?.parent?.header?.parent) {
        chatPanel.parent.header.parent.setActiveContentItem(chatPanel);
    }
    
    const chatInput = getChatInput();
    if (chatInput) {
        chatInput.focus();
    }
}

/**
 * Adds code to the chat input
 * @param {string} code - The code to add to chat
 */
export function addCodeToChat(code) {
    const chatInput = getChatInput();
    if (chatInput) {
        const existingText = chatInput.value;
        const codeBlock = "\`\`\`\n" + code + "\n\`\`\`\n";
        chatInput.value = existingText + (existingText ? "\n" : "") + codeBlock;
        
        // Trigger the auto-resize
        chatInput.dispatchEvent(new Event('input'));
        
        // Focus the chat
        focusChat();
    }
}

/**
 * Adds an error message to the chat input
 * @param {string} errorMessage - The error message to add
 */
export function addErrorToChat(errorMessage) {
    const chatInput = getChatInput();
    if (chatInput) {
        // Format the error message for the chat
        const formattedMessage = `I got the following error in my code:\n\`\`\`\n${errorMessage}\n\`\`\`\nCan you help me fix this?`;
        
        // Set the chat input value
        chatInput.value = formattedMessage;
        chatInput.dispatchEvent(new Event('input'));
        
        // Focus the chat
        focusChat();
    }
}

// Update problem context function
export function updateProblemContext(problem) {
    currentProblem = problem;  // Store problem
    messageHistory = [];       // Reset message history with new problem
} 