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
        timeout_error: "Délai d'attente dépassé"
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
        timeout_error: "Request timed out"
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
        return;
    }

    EH.state.isLoading = true;
    const startTime = performance.now();

    const contentDiv = document.querySelector(EH.selectors.content);
    if (!contentDiv) {
        console.error('Content container not found:', EH.selectors.content);
        return;
    }
    if (!page) return;
    if (!contentDiv) return;

    try {
        contentDiv.innerHTML = `
            <div class="eh-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${translations[EH.state.currentLang].loading}</span>
            </div>`;

        const basePage = page.replace('.html', '');
        const filePath = `pages/${basePage}_${EH.state.currentLang}.html`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const fetchOptions = {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        };

        const response = await fetch(filePath, { 
            ...fetchOptions,
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Load failed:', response.status, response.statusText);
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        contentDiv.innerHTML = html;
        updateActiveTab(basePage);
        metrics.pageLoads++;
        metrics.loadTimes.push(performance.now() - startTime);
        EH.state.currentPage = page;

    } catch (error) {
        metrics.errors++;
        logError(error, 'pageLoad');
        const errorMessage = error.name === 'AbortError' 
            ? translations[EH.state.currentLang].timeout_error 
            : error.message;
            
        contentDiv.innerHTML = `
            <div class="eh-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${translations[EH.state.currentLang].error_message}: ${errorMessage}</p>
                <button onclick="retryLoad('${page}')">${translations[EH.state.currentLang].retry}</button>
            </div>`;
        throw error;
    } finally {
        EH.state.isLoading = false;
        metrics.loadTimes.push(performance.now() - startTime);
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

        // Load default content
        const defaultTab = document.getElementById('defaultOpen');
        if (defaultTab) {
            ehPagecontentload(defaultTab.dataset.page);
        } else {
            throw new Error('Default tab not found');
        }
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