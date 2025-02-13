/**
 * Success Modal Component
 * 
 * Displays a congratulatory modal when a Project Euler problem
 * is solved correctly. Handles its own rendering and animations.
 */

export class SuccessModal {
    constructor() {
        this.modal = null;
        this.escListener = null;
        this.initialize();
    }

    initialize() {
        // Create modal element
        this.modal = document.createElement('div');
        this.modal.className = 'success-modal';
        
        // Set initial HTML structure
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">🎉 Congratulations!</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Content will be dynamically inserted -->
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(this.modal);
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Add styles
        this.addStyles();
    }

    setupEventListeners() {
        // Close button click
        const closeButton = this.modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => this.hide());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show(problem, answer) {
        // Update modal content
        this.modal.querySelector('.modal-body').innerHTML = `
            <div class="success-emoji">🏆</div>
            <div class="success-message">
                <h3>Problem Solved!</h3>
                <p>You've successfully solved Problem ${problem.id}: ${problem.title}</p>
                <div class="answer-display">
                    Your answer: ${answer}
                </div>
            </div>
        `;

        // Show modal with animation
        this.modal.classList.add('show');

        // Add escape key listener
        this.escListener = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escListener);
    }

    hide() {
        this.modal.classList.remove('show');
        
        // Remove escape key listener
        if (this.escListener) {
            document.removeEventListener('keydown', this.escListener);
            this.escListener = null;
        }
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .success-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .success-modal.show {
                display: flex;
                opacity: 1;
            }

            .modal-content {
                background: #1e1e1e;
                border-radius: 8px;
                padding: 24px;
                margin: auto;
                width: 90%;
                max-width: 500px;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .success-modal.show .modal-content {
                transform: translateY(0);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-title {
                color: #fff;
                margin: 0;
                font-size: 1.5em;
                font-family: 'JetBrains Mono', monospace;
            }

            .modal-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .modal-close:hover {
                opacity: 1;
            }

            .modal-body {
                color: #d4d4d4;
                line-height: 1.5;
                font-family: 'JetBrains Mono', monospace;
            }

            .success-emoji {
                font-size: 48px;
                text-align: center;
                margin-bottom: 20px;
            }

            .success-message {
                text-align: center;
            }

            .answer-display {
                background: #2d2d2d;
                padding: 12px;
                border-radius: 4px;
                margin-top: 15px;
                font-family: 'JetBrains Mono', monospace;
                text-align: left;
            }
        `;
        document.head.appendChild(styles);
    }
} 