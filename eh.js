/**
 * Elegance House - Main JavaScript
 * Version: 1.0.0
 * Copyright (c) 2025 Elegance House
 * License: MIT
 */

// Constants and state management
const EH = {
    state: {
        isLoading: false,
        currentLang: 'fr',
        theme: 'light',
        currentTab: null,  // Add this to track current tab
        currentPage: null,
        loadingTimeout: 5000, // 5 seconds timeout
    },
    selectors: {
        content: '#ehPagecontent',
        mobileMenu: '.eh-mobile-menu',
        menuToggle: '.eh-menu-toggle',
        closeButton: '.eh-mobile-close',
        tabLinks: '.eh_tablink',
        themeToggle: '.eh-theme-toggle',
        langToggle: '.eh-lang-toggle',
        // Add these new selectors
        langSelectMobile: '.eh-lang-select-mobile',
        mobileLinks: '.eh-mobile-links a',
        mobileThemeLabel: '.eh-theme-toggle-mobile span',
        mobileLangLabel: '.eh-lang-mobile span:first-child'
    },
    listeners: new Map(),
    addListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        
        const key = `${element.tagName}-${event}`;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push({ element, event, handler });
    },
    cleanup() {
        this.listeners.forEach(listeners => {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
    }
};

function closeMenu() {
    const mobileMenu = document.querySelector(EH.selectors.mobileMenu);
    mobileMenu?.classList.remove('active');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Translations object
const translations = {
    fr: {
        search_placeholder: "Rechercher...",
        nav_new: "Nouveau",
        nav_products: "Produits",
        nav_formation: "Formation",
        nav_promotion: "Promotion",
        nav_contact: "Contact",
        theme_toggle: "Changer le thème",
        mode_dark: "Mode sombre",
        language: "Langue",
        close: "Fermer",
        loading: "Chargement en cours...",
        error_message: "Erreur de chargement",
        retry: "Réessayer",
        select_french: "Français",
        select_english: "Anglais",
        timeout_error: "Délai d'attente dépassé",
        footer_about: "À propos",
        footer_story: "Notre Histoire",
        footer_values: "Nos Valeurs",
        footer_artisans: "Nos Artisans",
        footer_support: "Support",
        footer_shipping: "Livraison",
        footer_returns: "Retours",
        footer_size_guide: "Guide des Tailles",
        footer_privacy: "Confidentialité",
        footer_terms: "Conditions",
        footer_tagline: "Votre destination mode pour le tissu africain moderne",
        footer_crafted: "Créé avec passion à Paris",
        // Section content translations
        footer_story_title: "Notre Histoire",
        footer_values_title: "Nos Valeurs",
        footer_shipping_title: "Livraison",
        footer_returns_title: "Retours"
    },
    en: {
        search_placeholder: "Search...",
        nav_new: "New",
        nav_products: "Products",
        nav_formation: "Training",
        nav_promotion: "Deals",
        nav_contact: "Contact",
        theme_toggle: "Toggle theme",
        mode_dark: "Dark mode",
        language: "Language",
        close: "Close",
        loading: "Loading...",
        error_message: "Loading error",
        retry: "Retry",
        select_french: "French",
        select_english: "English",
        timeout_error: "Request timed out",
        footer_about: "About",
        footer_story: "Our Story",
        footer_values: "Our Values",
        footer_artisans: "Our Artisans",
        footer_support: "Support",
        footer_shipping: "Shipping",
        footer_returns: "Returns",
        footer_size_guide: "Size Guide",
        footer_privacy: "Privacy",
        footer_terms: "Terms",
        footer_tagline: "Your fashion destination for modern African fabric",
        footer_crafted: "Crafted with passion in Paris",
        // Section content translations
        footer_story_title: "Our Story",
        footer_values_title: "Our Values",
        footer_shipping_title: "Shipping",
        footer_returns_title: "Returns"
    }
};

const metrics = {
    pageLoads: 0,
    errors: 0,
    loadTimes: []
};

// Update loading content function to use translations
async function ehPagecontentload(page) {
    if (EH.state.isLoading) {
        console.log('Already loading, please wait...');
        return false;
    }

    console.log('Loading page:', page); // Debug log
    EH.state.isLoading = true;
    const contentDiv = document.querySelector(EH.selectors.content);

    if (!page || !contentDiv) {
        console.error('Missing page or content div');
        EH.state.isLoading = false;
        return false;
    }

    try {
        // Show loading state
        contentDiv.innerHTML = `
            <div class="eh-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${translations[EH.state.currentLang].loading}</span>
            </div>`;

        const lang = EH.state.currentLang;
        const filePath = `pages/${page}_${lang}.html`;
        console.log('Loading file:', filePath);

        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        contentDiv.innerHTML = html;

        // If this is the product page, initialize category handlers
        if (page === 'product') {
            await initializeProductCategories(lang);
        }

        updateActiveTab(page);
        EH.state.currentPage = page;
        return true;

    } catch (error) {
        console.error('Load error:', error);
        logError(error, 'pageLoad');
        contentDiv.innerHTML = `
            <div class="eh-error">
                <p>${translations[EH.state.currentLang].error_message}</p>
                <button onclick="retryLoad('${page}')" class="eh-retry-btn">
                    ${translations[EH.state.currentLang].retry}
                </button>
            </div>`;
        return false;
    } finally {
        EH.state.isLoading = false;
    }
}

// Add this function for better error handling
async function safeScrollToContent(contentDiv) {
    try {
        // First attempt smooth scroll
        await contentDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
    } catch (error) {
        // Fallback for older browsers
        try {
            window.scrollTo({
                top: Math.max(0, contentDiv.offsetTop - 100),
                left: 0,
                behavior: 'smooth'
            });
        } catch (scrollError) {
            // Ultimate fallback
            window.scrollTo(0, Math.max(0, contentDiv.offsetTop - 100));
        }
    }
}

// Update handleFooterContent function
async function handleFooterContent(page) {
    const contentDiv = document.querySelector(EH.selectors.content);
    const lang = EH.state.currentLang;
    
    if (!contentDiv || !page) {
        console.error('Missing required elements');
        return;
    }

    try {
        // Reset navigation state
        document.querySelectorAll('.eh_tablink').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-current', 'false');
        });

        // Show loading state with fade
        contentDiv.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 150));
        
        contentDiv.innerHTML = `
            <div class="eh-loading" role="alert" aria-live="polite">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${translations[lang].loading}</span>
            </div>`;
        contentDiv.style.opacity = '1';

        // Fetch content
        const response = await fetch(`pages/${page}_${lang}.html`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const content = await response.text();
        
        // Update content with transition
        contentDiv.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 150));
        
        contentDiv.innerHTML = content;
        contentDiv.style.opacity = '1';

        // Scroll to content
        await safeScrollToContent(contentDiv);

        // Update page state
        EH.state.currentPage = page;

    } catch (error) {
        console.error('Error loading footer content:', error);
        contentDiv.innerHTML = `
            <div class="eh-error" role="alert">
                <p>${translations[lang].error_message}</p>
                <button onclick="handleFooterContent('${page}')" class="eh-retry-btn">
                    ${translations[lang].retry}
                </button>
            </div>`;
    }
}

async function initializeProductCategories(lang) {
    const categories = document.querySelectorAll('.eh-category');
    const productContent = document.getElementById('productContent');

    if (!categories.length || !productContent) {
        throw new Error('Product elements not found');
    }

    categories.forEach(category => {
        const categoryName = category.dataset.category;
        if (!categoryName) return;

        category.addEventListener('click', async () => {
            // Update active states
            categories.forEach(c => c.classList.remove('active'));
            category.classList.add('active');

            try {
                // Show loading
                productContent.innerHTML = `
                    <div class="eh-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>${translations[lang].loading}</span>
                    </div>`;

                // Load category content
                const categoryPath = `pages/product_${lang}/${categoryName}_${lang}.html`;
                console.log('Loading category:', categoryPath);

                const response = await fetch(categoryPath);
                if (!response.ok) throw new Error(`Failed to load ${categoryName}`);

                const content = await response.text();
                productContent.innerHTML = content;

            } catch (error) {
                console.error('Category load error:', error);
                productContent.innerHTML = `
                    <div class="eh-error">
                        <p>${translations[lang].error_loading}</p>
                        <button onclick="this.closest('.eh-category').click()" class="eh-retry-btn">
                            ${translations[lang].retry}
                        </button>
                    </div>`;
            }
        });
    });

    // Load asooke by default
    const defaultCategory = Array.from(categories)
        .find(cat => cat.dataset.category === 'asooke');
        
    if (defaultCategory) {
        console.log('Loading default category: asooke');
        defaultCategory.click();
    }
}

// Fix mobile menu initialization
function initializeMobileMenu() {
    const menuToggle = document.querySelector(EH.selectors.menuToggle);
    const mobileMenu = document.querySelector(EH.selectors.mobileMenu);
    const closeButton = document.querySelector(EH.selectors.closeButton);
    const mobileLinks = document.querySelectorAll(EH.selectors.mobileLinks);
    
    // Create and add overlay if it doesn't exist
    let overlay = document.querySelector('.eh-mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'eh-mobile-overlay';
        document.body.appendChild(overlay);
    }

    function openMenu() {
        mobileMenu?.classList.add('active');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileMenu?.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
        mobileMenu?.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
        mobileMenu?.setAttribute('aria-hidden', 'true');
    }

    // Remove existing listeners before adding new ones
    menuToggle?.removeEventListener('click', openMenu);
    closeButton?.removeEventListener('click', closeMenu);
    overlay?.removeEventListener('click', closeMenu);

    // Add new listeners
    menuToggle?.addEventListener('click', openMenu);
    closeButton?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    // Handle mobile links
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            if (page) {
                ehPagecontentload(page);
                closeMenu();
            }
        });
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu?.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('eh-theme') || 'light';
    setTheme(savedTheme);

    // Desktop theme toggle
    document.querySelector(EH.selectors.themeToggle)?.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Mobile theme toggle
    document.querySelector('.eh-theme-toggle-mobile')?.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
        theme = 'light';
    }
    
    // Update DOM and state
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('eh-theme', theme);
    EH.state.theme = theme;

    // Update theme icons visibility
    const isDark = theme === 'dark';
    document.querySelectorAll('.light-icon').forEach(icon => {
        icon.style.display = isDark ? 'none' : 'inline-block';
    });
    document.querySelectorAll('.dark-icon').forEach(icon => {
        icon.style.display = isDark ? 'inline-block' : 'none';
    });

    // Update mobile theme text
    const mobileThemeLabel = document.querySelector(EH.selectors.mobileThemeLabel);
    if (mobileThemeLabel) {
        const lang = EH.state.currentLang;
        mobileThemeLabel.textContent = translations[lang].mode_dark;
    }
}

// Update language function
function updateLanguage(lang) {
    if (!translations[lang]) {
        console.error(`Invalid language: ${lang}`);
        lang = 'fr'; // Fallback to French
    }
    
    // Update state and document
    EH.state.currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('eh-lang', lang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang]?.[key]) {
            if (element.tagName === 'INPUT') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Update mobile specific elements
    const mobileThemeLabel = document.querySelector(EH.selectors.mobileThemeLabel);
    const mobileLangLabel = document.querySelector(EH.selectors.mobileLangLabel);
    const langSelectMobile = document.querySelector(EH.selectors.langSelectMobile);

    if (mobileThemeLabel) {
        mobileThemeLabel.textContent = translations[lang].mode_dark;
    }
    if (mobileLangLabel) {
        mobileLangLabel.textContent = translations[lang].language + ':';
    }
    if (langSelectMobile) {
        langSelectMobile.value = lang;
        // Update mobile select options
        langSelectMobile.innerHTML = `
            <option value="fr">${lang === 'fr' ? 'Français' : 'French'}</option>
            <option value="en">${lang === 'fr' ? 'Anglais' : 'English'}</option>
        `;
        langSelectMobile.value = lang;
    }

    // Update language display
    document.querySelectorAll('.current-lang').forEach(el => {
        el.textContent = lang.toUpperCase();
    });

    // Reload current content
    const currentTab = document.querySelector('.eh_tablink.active');
    if (currentTab) {
        ehPagecontentload(currentTab.dataset.page);
    }
}

// Language handling
function initializeLanguage() {
    const savedLang = localStorage.getItem('eh-lang') || 'fr';
    updateLanguage(savedLang);
    
    // Desktop language toggle
    const langToggle = document.querySelector(EH.selectors.langToggle);
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const newLang = EH.state.currentLang === 'fr' ? 'en' : 'fr';
            updateLanguage(newLang);
        });
    }

    // Mobile language select
    const langSelectMobile = document.querySelector(EH.selectors.langSelectMobile);
    if (langSelectMobile) {
        langSelectMobile.addEventListener('change', (e) => {
            updateLanguage(e.target.value);
        });
    }
}

// Tab handling
function updateActiveTab(file) {
    if (!file) return;
    
    EH.state.currentTab = file;
    const tabs = document.querySelectorAll(EH.selectors.tabLinks);
    
    tabs.forEach(tab => {
        const isActive = tab.dataset.page === file;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-current', isActive ? 'page' : 'false');
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

// Retry loading on error
function retryLoad(file) {
    if (!file) {
        console.error('No file specified for retry');
        return;
    }

    ehPagecontentload(file).catch(error => {
        logError(error, 'retryLoad');
    });
}

// Add tab click handlers
function initializeTabs() {
    document.querySelectorAll(EH.selectors.tabLinks).forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const page = tab.dataset.page;
            ehPagecontentload(page);
        });
    });
}

// Modify the event listener initialization in document.addEventListener('DOMContentLoaded')
function initializeFooterLinks() {
    document.querySelectorAll('.eh-footer-section a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            handleFooterContent(page);
            
            // Close mobile menu if open
            const mobileMenu = document.querySelector('.eh-mobile-menu');
            if (mobileMenu?.classList.contains('active')) {
                closeMenu();
            }
        });
    });
}

function initializeBackToTop() {
    // Create button element
    const backToTop = document.createElement('button');
    backToTop.className = 'eh-back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.setAttribute('aria-label', 'Retour en haut');
    document.body.appendChild(backToTop);

    // Show/hide button based on scroll position
    function toggleBackToTop() {
        const scrolled = window.scrollY;
        backToTop.classList.toggle('visible', scrolled > 300);
    }

    // Smooth scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Event listeners
    window.addEventListener('scroll', toggleBackToTop);
    backToTop.addEventListener('click', scrollToTop);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    try {
        // First, check essential elements
        const contentDiv = document.querySelector(EH.selectors.content);
        if (!contentDiv) {
            throw new Error('Content container not found');
        }

        // Initialize in correct order
        initializeTheme();      // Theme first to prevent flash
        initializeLanguage();   // Language second for translations
        initializeMobileMenu(); // Menu third for interaction
        initializeTabs();       // Tabs last for navigation
        initializeFooterLinks(); // Add this line
        initializeBackToTop();

        // Load default content
        const defaultTab = document.getElementById('defaultOpen');
        if (defaultTab) {
            ehPagecontentload(defaultTab.dataset.page);
        } else {
            throw new Error('Default tab not found');
        }

        // Add footer links handling
        document.querySelectorAll('.eh-footer-section a[data-page]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                await ehPagecontentload(page);
            });
        });

    } catch (error) {
        logError(error, 'initialization');
        console.error('Initialization failed:', error);
    }
});

function logError(error, context) {
    const errorInfo = {
        context,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        currentLang: EH.state.currentLang,
        currentTab: EH.state.currentTab
    };
    console.error('Error:', errorInfo);
}
