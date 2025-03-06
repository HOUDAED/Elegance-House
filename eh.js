// Constants and state management
const EH = {
    state: {
        isLoading: false,
        currentLang: 'fr',
        theme: 'light'
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
    }
};

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
        select_english: "Anglais"
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
        select_english: "English"
    }
};

// Update loading content function to use translations
async function ehPagecontentload(page) {
    const contentDiv = document.querySelector(EH.selectors.content);
    const lang = EH.state.currentLang;
    
    try {
        // Show loading state
        contentDiv.innerHTML = `
            <div class="eh-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${translations[lang].loading}</span>
            </div>`;

        const basePage = page.replace('.html', '');
        const filePath = `pages/${basePage}_${lang}.html`;
        
        const response = await fetch(filePath); // Add this line
        if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Update active tab state
        updateActiveTab(basePage);

    } catch (error) {
        console.error('Loading error:', error);
        contentDiv.innerHTML = `
            <div class="eh-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${translations[lang].error_message}: ${error.message}</p>
                <button onclick="retryLoad('${page}')">${translations[lang].retry}</button>
            </div>`;
    }
}

// Mobile menu handlers
function initializeMobileMenu() {
    const mobileMenu = document.querySelector('.eh-mobile-menu');
    const menuToggle = document.querySelector('.eh-menu-toggle');
    const closeButton = document.querySelector('.eh-mobile-close');
    const mobileLinks = document.querySelectorAll('.eh-mobile-links a');

    // Toggle menu
    menuToggle?.addEventListener('click', () => {
        mobileMenu?.classList.add('active');
        mobileMenu?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Close menu
    const closeMenu = () => {
        mobileMenu?.classList.remove('active');
        mobileMenu?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore scrolling
    };

    closeButton?.addEventListener('click', closeMenu);

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu?.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });

    // Handle mobile links
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            ehPagecontentload(page);
            closeMenu();
        });
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
    EH.state.currentTab = file;
    document.querySelectorAll(EH.selectors.tabLinks).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === file);
        tab.setAttribute('aria-current', tab.dataset.page === file);
    });
}

// Retry loading on error
function retryLoad(file) {
    ehPagecontentload(file);
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
    initializeMobileMenu();
    initializeTheme();
    initializeLanguage();
    initializeTabs(); // Add this line

    // Load default tab
    const defaultTab = document.getElementById('defaultOpen');
    if (defaultTab) {
        const defaultPage = defaultTab.dataset.page;
        ehPagecontentload(defaultPage);
    }
});