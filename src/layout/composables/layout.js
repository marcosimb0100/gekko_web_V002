// import { computed, reactive } from 'vue';

// const layoutConfig = reactive({
//     preset: 'Aura',
//     primary: 'emerald',
//     surface: null,
//     darkTheme: false,
//     menuMode: 'static'
// });

// const layoutState = reactive({
//     staticMenuInactive: false,
//     overlayMenuActive: false,
//     profileSidebarVisible: false,
//     configSidebarVisible: false,
//     sidebarExpanded: false,
//     menuHoverActive: false,
//     activeMenuItem: null,
//     activePath: null
// });

// export function useLayout() {
//     const toggleDarkMode = () => {
//         if (!document.startViewTransition) {
//             executeDarkModeToggle();

//             return;
//         }

//         document.startViewTransition(() => executeDarkModeToggle(event));
//     };

//     const executeDarkModeToggle = () => {
//         layoutConfig.darkTheme = !layoutConfig.darkTheme;
//         document.documentElement.classList.toggle('app-dark');
//     };

//     const toggleMenu = () => {
//         if (isDesktop()) {
//             if (layoutConfig.menuMode === 'static') {
//                 layoutState.staticMenuInactive = !layoutState.staticMenuInactive;
//             }

//             if (layoutConfig.menuMode === 'overlay') {
//                 layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
//             }
//         } else {
//             layoutState.mobileMenuActive = !layoutState.mobileMenuActive;
//         }
//     };

//     const toggleConfigSidebar = () => {
//         layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
//     };

//     const hideMobileMenu = () => {
//         layoutState.mobileMenuActive = false;
//     };

//     const changeMenuMode = (event) => {
//         layoutConfig.menuMode = event.value;
//         layoutState.staticMenuInactive = false;
//         layoutState.mobileMenuActive = false;
//         layoutState.sidebarExpanded = false;
//         layoutState.menuHoverActive = false;
//         layoutState.anchored = false;
//     };

//     const isDarkTheme = computed(() => layoutConfig.darkTheme);
//     const isDesktop = () => window.innerWidth > 991;

//     const hasOpenOverlay = computed(() => layoutState.overlayMenuActive);

//     return {
//         layoutConfig,
//         layoutState,
//         isDarkTheme,
//         toggleDarkMode,
//         toggleConfigSidebar,
//         toggleMenu,
//         hideMobileMenu,
//         changeMenuMode,
//         isDesktop,
//         hasOpenOverlay
//     };
// }



import { computed, reactive } from 'vue';

const layoutConfig = reactive({
    preset: import.meta.env.VITE_THEME_PRESET || 'Aura',
    primary: import.meta.env.VITE_THEME_PRIMARY || 'emerald',
    surface: import.meta.env.VITE_THEME_SURFACE || null,
    darkTheme: import.meta.env.VITE_DARK_THEME === 'true',
    menuMode: import.meta.env.VITE_MENU_MODE || 'static'
});

const layoutState = reactive({
    staticMenuInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    sidebarExpanded: false,
    menuHoverActive: false,
    activeMenuItem: null,
    activePath: null
});

export function useLayout() {
    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
            return;
        }

        document.startViewTransition(() => executeDarkModeToggle());
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
    };

    const toggleMenu = () => {
        if (isDesktop()) {
            if (layoutConfig.menuMode === 'static') {
                layoutState.staticMenuInactive = !layoutState.staticMenuInactive;
            }

            if (layoutConfig.menuMode === 'overlay') {
                layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
            }
        } else {
            layoutState.mobileMenuActive = !layoutState.mobileMenuActive;
        }
    };

    const toggleConfigSidebar = () => {
        layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
    };

    const hideMobileMenu = () => {
        layoutState.mobileMenuActive = false;
    };

    const changeMenuMode = (event) => {
        layoutConfig.menuMode = event.value;
        layoutState.staticMenuInactive = false;
        layoutState.mobileMenuActive = false;
        layoutState.sidebarExpanded = false;
        layoutState.menuHoverActive = false;
        layoutState.anchored = false;
    };

    const isDarkTheme = computed(() => layoutConfig.darkTheme);
    const isDesktop = () => window.innerWidth > 991;

    const hasOpenOverlay = computed(() => layoutState.overlayMenuActive);

    return {
        layoutConfig,
        layoutState,
        isDarkTheme,
        toggleDarkMode,
        toggleConfigSidebar,
        toggleMenu,
        hideMobileMenu,
        changeMenuMode,
        isDesktop,
        hasOpenOverlay
    };
}