/**
 * Layout Manager Component
 * 
 * Manages the IDE's layout configuration and initialization.
 * Orchestrates the initialization of other components and handles window resizing.
 */

import { IS_PUTER } from "../../core/environment/PuterIntegration.js";
import * as EditorManager from "../editor/EditorManager.js";
import * as CompilerManager from "../compiler/CompilerManager.js";
import * as ChatManager from "../chat/ChatManager.js";
import { setupComposer } from "../composer/Composer.js";

// State variables
let layout;
let $runBtn;
let $statusLine;

// Layout Configuration
const layoutConfig = {
    settings: {
        showPopoutIcon: false,
        reorderEnabled: true
    },
    content: [{
        type: "row",
        content: [{
            type: "column",
            width: 70,
            content: [{
                type: "component",
                height: 30,
                componentName: "description",
                id: "description",
                title: "Problem Description",
                isClosable: false,
                componentState: {
                    readOnly: true
                }
            }, {
                type: "component",
                height: 40,
                componentName: "source",
                id: "source",
                title: "Source Code",
                isClosable: false,
                componentState: {
                    readOnly: false
                }
            }, {
                type: "component",
                height: 30,
                componentName: "stdout",
                id: "stdout",
                title: "Output",
                isClosable: false,
                componentState: {
                    readOnly: true
                }
            }]
        }, {
            type: "column",
            width: 30,
            content: [{
                type: "stack",
                content: [{
                    type: "component",
                    componentName: "chat",
                    id: "chat",
                    title: "Chat",
                    isClosable: false,
                    componentState: {
                        readOnly: false
                    }
                }, {
                    type: "component",
                    componentName: "composer",
                    id: "composer",
                    title: "Composer",
                    isClosable: false,
                    componentState: {
                        readOnly: false
                    }
                }]
            }]
        }]
    }]
};

// Default content
export const DEFAULT_LANGUAGE_ID = 25; // Python 3.11.2 (only supported language)

/**
 * Sets default values for editors and status
 */
async function setDefaults() {
    // Get problem ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('problem') || '1';
    
    // Load problem data
    const problem = await loadProblem(problemId);
    if (!problem) {
        return;
    }

    // Update page title with problem info
    document.title = `Euler.ai - Problem ${problem.id}: ${problem.title}`;
    
    EditorManager.setFontSizeForAllEditors(EditorManager.getFontSize());
    EditorManager.setSourceValue(`# Project Euler - Problem ${problem.id}\n# ${problem.title}`);
    EditorManager.setStdoutValue("");
    EditorManager.setDescriptionValue(`# ${problem.title}\n\n## Problem ${problem.id}\n\n${problem.description}`);
    
    ChatManager.updateProblemContext(problem);
    
    $statusLine.html("");
    // Always use Python
    EditorManager.setLanguage('python');
}

/**
 * Clears editor contents
 */
function clear() {
    EditorManager.clearEditors();
    $statusLine.html("");
}

/**
 * Updates the site content height based on navigation height
 */
function refreshSiteContentHeight() {
    const navigationHeight = document.getElementById("judge0-site-navigation")?.offsetHeight || 0;
    const siteContent = document.getElementById("judge0-site-content");
    if (siteContent) {
        siteContent.style.height = `${window.innerHeight}px`;
        siteContent.style.paddingTop = `${navigationHeight}px`;
    }
}

/**
 * Updates the layout size
 */
function refreshLayoutSize() {
    refreshSiteContentHeight();
    layout.updateSize();
}

/**
 * Initializes the layout and all components
 */
export async function initialize() {
    // Set up window resize handler
    window.addEventListener("resize", refreshLayoutSize);

    // Initialize UI components
    $("#select-language").dropdown();
    $("[data-content]").popup({
        lastResort: "left center"
    });

    refreshSiteContentHeight();

    // Initialize run button and status line
    $runBtn = $("#run-btn");
    $statusLine = $("#judge0-status-line");

    // Set up keyboard shortcuts
    $(document).on("keydown", "body", function (e) {
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case "Enter": // Ctrl+Enter, Cmd+Enter
                    e.preventDefault();
                    CompilerManager.run();
                    break;
                case "+": // Ctrl+Plus
                case "=": // Some layouts use '=' for '+'
                    e.preventDefault();
                    EditorManager.increaseFontSize();
                    break;
                case "-": // Ctrl+Minus
                    e.preventDefault();
                    EditorManager.decreaseFontSize();
                    break;
                case "0": // Ctrl+0
                    e.preventDefault();
                    EditorManager.resetFontSize();
                    break;
            }
        }
    });

    // Set up platform-specific key hints
    let superKey = "⌘";
    if (!/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
        superKey = "Ctrl";
    }

    [$runBtn].forEach(btn => {
        btn.attr("data-content", `${superKey}${btn.attr("data-content")}`);
    });

    // Initialize Monaco editor and layout
    require(["vs/editor/editor.main"], function () {
        layout = new GoldenLayout(layoutConfig, $("#judge0-site-content"));
        
        // Initialize all managers
        EditorManager.initializeEditors(layout);
        ChatManager.initialize(layout);
        
        // Register the composer component
        layout.registerComponent("composer", function(container, state) {
            setupComposer(container);
        });

        layout.on("initialised", function () {
            setDefaults();
            refreshLayoutSize();
            window.top.postMessage({ event: "initialised" }, "*");

            CompilerManager.initialize($runBtn, $statusLine, layout);
            $runBtn.click(CompilerManager.run);

            // Add compiler event listeners
            window.addEventListener('compiler-error', (e) => {
                CompilerManager.handleError(e.detail);
            });

            window.addEventListener('compiler-success', (e) => {
                CompilerManager.handleSuccess(e.detail);
            });
        });

        layout.init();
    });

    // Handle Puter integration
    if (IS_PUTER) {
        puter.ui.onLaunchedWithItems(async function (items) {
            // Disabled
        });
    }
}

// Add new problem loading functionality
async function loadProblem(problemId) {
    try {
        const response = await fetch(`/data/problems/problem${problemId}.json`);
        if (!response.ok) {
            throw new Error(`Problem ${problemId} not found`);
        }
        const problem = await response.json();
        return problem;
    } catch (error) {
        console.error('Error loading problem:', error);
        // Add better error handling
        EditorManager.setDescriptionValue(`# Error Loading Problem\n\nUnable to load Problem ${problemId}. Redirecting to Problem 1...`);
        // Redirect to problem 1 after a short delay
        setTimeout(() => {
            window.location.href = 'editor.html?problem=1';
        }, 2000);
        return null;
    }
} 