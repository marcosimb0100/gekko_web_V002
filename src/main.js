import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';

import { definePreset } from '@primeuix/themes';

import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';


// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(fas);


import '@/assets/styles.scss';
import '@/assets/tailwind.css';


const presetNombre =
    import.meta.env.VITE_PRIME_PRESET || 'Lara';

const primary =
    import.meta.env.VITE_PRIME_PRIMARY || 'cyan';

const surface =
    import.meta.env.VITE_PRIME_SURFACE || 'slate';


const presets = {
    Aura,
    Lara,
    Nora
};

const presetBase =
    presets[presetNombre] ?? Lara;


const presetSeleccionado = definePreset(
    presetBase,
    {
        semantic: {

            primary: {
                50: `{${primary}.50}`,
                100: `{${primary}.100}`,
                200: `{${primary}.200}`,
                300: `{${primary}.300}`,
                400: `{${primary}.400}`,
                500: `{${primary}.500}`,
                600: `{${primary}.600}`,
                700: `{${primary}.700}`,
                800: `{${primary}.800}`,
                900: `{${primary}.900}`,
                950: `{${primary}.950}`
            },

            colorScheme: {

                light: {
                    surface: {
                        0: '#ffffff',
                        50: `{${surface}.50}`,
                        100: `{${surface}.100}`,
                        200: `{${surface}.200}`,
                        300: `{${surface}.300}`,
                        400: `{${surface}.400}`,
                        500: `{${surface}.500}`,
                        600: `{${surface}.600}`,
                        700: `{${surface}.700}`,
                        800: `{${surface}.800}`,
                        900: `{${surface}.900}`,
                        950: `{${surface}.950}`
                    }
                },

                dark: {
                    surface: {
                        0: '#ffffff',
                        50: `{${surface}.50}`,
                        100: `{${surface}.100}`,
                        200: `{${surface}.200}`,
                        300: `{${surface}.300}`,
                        400: `{${surface}.400}`,
                        500: `{${surface}.500}`,
                        600: `{${surface}.600}`,
                        700: `{${surface}.700}`,
                        800: `{${surface}.800}`,
                        900: `{${surface}.900}`,
                        950: `{${surface}.950}`
                    }
                }

            }

        }
    }
);


const app = createApp(App);

app.use(router);

app.use(PrimeVue, {
    theme: {
        preset: presetSeleccionado,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

app.use(ToastService);
app.use(ConfirmationService);

app.component('font-icon', FontAwesomeIcon);

app.mount('#app');