// ==================== CONFIGURATION ====================
const CONFIG = {
    RAZORPAY_KEY: 'rzp_live_RdAlLXHFtwztJo',
    MIN_AMOUNT: 10,
    MAX_AMOUNT: 1000000,
    DEFAULT_AMOUNT: 100,
    LOADING_DELAY: 700,
    CONFETTI_COUNT: 30
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
    // Sanitize input to prevent XSS
    sanitizeInput(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate name (only letters and spaces)
    isValidName(name) {
        const nameRegex = /^[A-Za-z\s]{2,100}$/;
        return nameRegex.test(name.trim());
    },

    // Validate amount
    isValidAmount(amount) {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) &&
            numAmount >= CONFIG.MIN_AMOUNT &&
            numAmount <= CONFIG.MAX_AMOUNT;
    },

    // Format currency
    formatCurrency(amount) {
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    },

    // Toggle body scroll
    toggleBodyScroll(disable) {
        document.body.style.overflow = disable ? 'hidden' : '';
    }
};

// ==================== FORM VALIDATION ====================
const FormValidator = {
    validateField(field, validationFn, errorMsg) {
        const value = field.value.trim();
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        formGroup.classList.remove('error', 'success');

        if (!value || !validationFn(value)) {
            formGroup.classList.add('error');
            if (errorMsg) {
                errorElement.textContent = errorMsg;
            }
            return false;
        }

        formGroup.classList.add('success');
        return true;
    },

    validateCheckbox(checkbox) {
        const formGroup = checkbox.closest('.form-group');
        formGroup.classList.remove('error');

        if (!checkbox.checked) {
            formGroup.classList.add('error');
            return false;
        }

        return true;
    },

    validateAmount(amountField) {
        return this.validateField(
            amountField,
            Utils.isValidAmount,
            `Please enter an amount between ${Utils.formatCurrency(CONFIG.MIN_AMOUNT)} and ${Utils.formatCurrency(CONFIG.MAX_AMOUNT)}`
        );
    },

    validateName(nameField) {
        return this.validateField(
            nameField,
            Utils.isValidName,
            'Please enter a valid name (2-100 characters, letters only)'
        );
    },

    validateEmail(emailField) {
        return this.validateField(
            emailField,
            Utils.isValidEmail,
            'Please enter a valid email address'
        );
    },

    clearValidation(formGroup) {
        formGroup.classList.remove('error', 'success');
    }
};

// ==================== MODAL MANAGER ====================
const ModalManager = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            Utils.toggleBodyScroll(true);
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            Utils.toggleBodyScroll(false);
        }
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        Utils.toggleBodyScroll(false);
    }
};

// ==================== CONFETTI ANIMATION ====================
const ConfettiManager = {
    create() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;

        container.innerHTML = '';
        const colors = ['#22A88D', '#5BC2E7', '#8DC63F', '#9DD14E'];

        for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];

            const angle = (Math.PI * 2 * i) / CONFIG.CONFETTI_COUNT;
            const distance = 80 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            confetti.style.setProperty('--tx', `${tx}px`);
            confetti.style.setProperty('--ty', `${ty}px`);
            confetti.style.animationDelay = `${Math.random() * 0.3}s`;

            container.appendChild(confetti);
        }
    }
};

// ==================== RAZORPAY PAYMENT ====================
const PaymentManager = {
    initiate(amount, name, email) {
        if (typeof Razorpay === 'undefined') {
            alert('Payment system is currently unavailable. Please try again later.');
            console.error('Razorpay SDK not loaded');
            return;
        }

        const amountInPaise = Math.round(amount * 100);

        const options = {
            key: CONFIG.RAZORPAY_KEY,
            amount: amountInPaise,
            currency: 'INR',
            name: 'Gigglers Academy',
            description: 'Support Quality Education for Kids',
            image: 'logo.png',
            handler: (response) => this.handleSuccess(response, amount),
            prefill: {
                name: Utils.sanitizeInput(name),
                email: Utils.sanitizeInput(email),
                contact: ''
            },
            notes: {
                purpose: 'Donation for Educational Content',
                contributor_name: Utils.sanitizeInput(name),
                contributor_email: Utils.sanitizeInput(email)
            },
            theme: {
                color: '#8DC63F'
            },
            modal: {
                ondismiss: () => this.handleDismiss()
            }
        };

        try {
            const razorpay = new Razorpay(options);
            razorpay.on('payment.failed', (response) => this.handleFailure(response));
            razorpay.open();
        } catch (error) {
            console.error('Payment initialization error:', error);
            alert('Failed to initialize payment. Please try again.');
        }
    },

    handleSuccess(response, amount) {
        console.log('Payment successful:', response);

        ModalManager.close('paymentModal');

        // Update success modal
        document.getElementById('successAmount').textContent = Utils.formatCurrency(amount);
        document.getElementById('paymentId').textContent = `Payment ID: ${response.razorpay_payment_id}`;

        // Show success modal
        setTimeout(() => {
            ModalManager.open('successModal');
            ConfettiManager.create();
        }, 300);
    },

    handleFailure(response) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
        ModalManager.close('paymentModal');
    },

    handleDismiss() {
        console.log('Payment cancelled by user');
        ModalManager.close('paymentModal');
    }
};

// ==================== DOM ELEMENTS ====================
const elements = {
    // Modals
    paymentModal: document.getElementById('paymentModal'),
    successModal: document.getElementById('successModal'),

    // Form elements
    paymentForm: document.getElementById('paymentForm'),
    donationAmount: document.getElementById('donationAmount'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),

    // Buttons
    supportButton: document.getElementById('supportButton'),
    closePaymentModal: document.getElementById('closePaymentModal'),
    closeSuccessModal: document.getElementById('closeSuccessModal'),
    cancelPayment: document.getElementById('cancelPayment'),
    proceedPayment: document.getElementById('proceedPayment'),
    closeSuccess: document.getElementById('closeSuccess'),
    quickAmountBtns: document.querySelectorAll('.quick-amount-btn'),

    // UI elements
    loadingScreen: document.getElementById('loadingScreen'),
    scrollProgress: document.getElementById('scrollProgress'),
    backToTop: document.getElementById('backToTop'),
    hamburger: document.getElementById('hamburger'),
    navLinks: document.getElementById('navLinks')
};

// ==================== QUICK AMOUNT SELECTION ====================
function setupQuickAmounts() {
    elements.quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            elements.quickAmountBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const amount = this.getAttribute('data-amount');
            elements.donationAmount.value = amount;

            // Clear any validation errors
            FormValidator.clearValidation(elements.donationAmount.closest('.form-group'));
        });
    });
}

// ==================== AMOUNT INPUT HANDLER ====================
function setupAmountInput() {
    elements.donationAmount.addEventListener('input', function () {
        const amount = parseInt(this.value);

        // Update quick amount buttons
        elements.quickAmountBtns.forEach(btn => {
            const btnAmount = parseInt(btn.getAttribute('data-amount'));
            btn.classList.toggle('active', btnAmount === amount);
        });

        // Clear validation on input
        if (this.value) {
            FormValidator.clearValidation(this.closest('.form-group'));
        }
    });

    // Validate on blur
    elements.donationAmount.addEventListener('blur', function () {
        if (this.value) {
            FormValidator.validateAmount(this);
        }
    });
}

// ==================== FORM VALIDATION SETUP ====================
function setupFormValidation() {
    // Real-time validation
    elements.userName.addEventListener('blur', function () {
        if (this.value) {
            FormValidator.validateName(this);
        }
    });

    elements.userEmail.addEventListener('blur', function () {
        if (this.value) {
            FormValidator.validateEmail(this);
        }
    });

    // Clear validation on input
    [elements.userName, elements.userEmail].forEach(field => {
        field.addEventListener('input', function () {
            FormValidator.clearValidation(this.closest('.form-group'));
        });
    });
}

// ==================== FORM SUBMISSION ====================
function setupFormSubmission() {
    elements.paymentForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate all fields
        const isAmountValid = FormValidator.validateAmount(elements.donationAmount);
        const isNameValid = FormValidator.validateName(elements.userName);
        const isEmailValid = FormValidator.validateEmail(elements.userEmail);
        const termsCheckbox = document.getElementById('termsConsent');
        const isTermsAccepted = FormValidator.validateCheckbox(termsCheckbox);

        if (!isAmountValid || !isNameValid || !isEmailValid || !isTermsAccepted) {
            // Focus on first error
            const firstError = this.querySelector('.form-group.error .form-input, .form-group.error input[type="checkbox"]');
            if (firstError) {
                firstError.focus();
            }
            return;
        }

        // Disable submit button
        elements.proceedPayment.classList.add('loading');
        elements.proceedPayment.disabled = true;

        // Get values
        const amount = parseFloat(elements.donationAmount.value);
        const name = elements.userName.value.trim();
        const email = elements.userEmail.value.trim();

        // Initiate payment
        try {
            PaymentManager.initiate(amount, name, email);
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            // Re-enable submit button
            setTimeout(() => {
                elements.proceedPayment.classList.remove('loading');
                elements.proceedPayment.disabled = false;
            }, 1000);
        }
    });
}

// ==================== MODAL EVENT LISTENERS ====================
function setupModalListeners() {
    // Open payment modal
    elements.supportButton.addEventListener('click', () => {
        ModalManager.open('paymentModal');
    });

    // Close buttons
    elements.closePaymentModal.addEventListener('click', () => {
        ModalManager.close('paymentModal');
    });

    elements.closeSuccessModal.addEventListener('click', () => {
        ModalManager.close('successModal');
    });

    elements.cancelPayment.addEventListener('click', () => {
        ModalManager.close('paymentModal');
    });

    elements.closeSuccess.addEventListener('click', () => {
        ModalManager.close('successModal');
    });

    // Close modals when clicking overlay
    [elements.paymentModal, elements.successModal].forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                ModalManager.close(this.id);
            }
        });
    });

    // ESC key to close modals
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            ModalManager.closeAll();
        }
    });
}

// ==================== UI FEATURES ====================
function setupUIFeatures() {
    // Loading screen
    window.addEventListener('load', function () {
        setTimeout(() => {
            elements.loadingScreen.classList.add('hidden');
        }, CONFIG.LOADING_DELAY);
    });

    // Scroll progress bar
    window.addEventListener('scroll', function () {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / scrollHeight) * 100;
        elements.scrollProgress.style.width = Math.min(scrolled, 100) + '%';

        // Back to top button visibility
        elements.backToTop.classList.toggle('visible', window.scrollY > 300);
    });

    // Back to top
    elements.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Hamburger menu
    elements.hamburger.addEventListener('click', function () {
        const isOpen = elements.navLinks.classList.toggle('active');
        this.classList.toggle('active');
        this.setAttribute('aria-expanded', isOpen);
        Utils.toggleBodyScroll(isOpen);
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            elements.navLinks.classList.remove('active');
            elements.hamburger.classList.remove('active');
            elements.hamburger.setAttribute('aria-expanded', 'false');
            Utils.toggleBodyScroll(false);
        });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', function (e) {
        if (!elements.navLinks.contains(e.target) &&
            !elements.hamburger.contains(e.target) &&
            elements.navLinks.classList.contains('active')) {
            elements.navLinks.classList.remove('active');
            elements.hamburger.classList.remove('active');
            elements.hamburger.setAttribute('aria-expanded', 'false');
            Utils.toggleBodyScroll(false);
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 90;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==================== INITIALIZATION ====================
function init() {
    try {
        setupQuickAmounts();
        setupAmountInput();
        setupFormValidation();
        setupFormSubmission();
        setupModalListeners();
        setupUIFeatures();
        initCookieConsent();

        console.log('Gigglers Academy website initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== COOKIE CONSENT ====================
function initCookieConsent() {
    const cookieConsent = document.getElementById('cookieConsent');
    const consent = localStorage.getItem('cookieConsent');

    if (!consent) {
        // Show banner after 1 second
        setTimeout(() => {
            cookieConsent.classList.add('show');
        }, 1000);
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieConsent').classList.remove('show');

    // Initialize analytics here if needed
    // Example: initGoogleAnalytics();
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookieConsent').classList.remove('show');
}