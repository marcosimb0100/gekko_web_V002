<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';

const confirm = useConfirm();
const router = useRouter();

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();

const appCliente = import.meta.env.VITE_APP_CLIENT;

const handleCerrarSesion = () => {
    confirm.require({
        message: 'Estas seguro de cerrar la sesion.',
        header: 'Cierre de sesion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            localStorage.clear();
            router.replace({ name: 'acceso' });
        }
    });
};
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <img src="@/assets/images/logo_empresa_cliente.png" alt="Logo Sociedad Ballfudr" width="40" />

                <span class="titulo" style="color: #6ac4ca">{{ appCliente }}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <!-- Modo claro / oscuro -->
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode" :title="isDarkTheme ? 'Modo claro' : 'Modo oscuro'">
                    <font-icon :icon="isDarkTheme ? 'moon' : 'sun'" :class="isDarkTheme ? 'icon-luna' : 'icon-sol'" />
                </button>

                <!-- Configurador de tema -->
                <!-- <div class="relative">
                    <button
                        v-styleclass="{
                            selector: '@next',
                            enterFromClass: 'hidden',
                            enterActiveClass: 'p-anchored-overlay-enter-active',
                            leaveToClass: 'hidden',
                            leaveActiveClass: 'p-anchored-overlay-leave-active',
                            hideOnOutsideClick: true
                        }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                        title="Configuración"
                    >
                        <font-icon icon="palette" />
                    </button>

                    <AppConfigurator />
                </div> -->
            </div>

            <!-- Menú responsive -->
            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{
                    selector: '@next',
                    enterFromClass: 'hidden',
                    enterActiveClass: 'p-anchored-overlay-enter-active',
                    leaveToClass: 'hidden',
                    leaveActiveClass: 'p-anchored-overlay-leave-active',
                    hideOnOutsideClick: true
                }"
                type="button"
            >
                <font-icon icon="ellipsis-vertical" />
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action topbar-primary" title="Calendario">
                        <font-icon icon="fa-solid fa-calendar-days" />
                        <span>Calendario</span>
                    </button>

                    <button type="button" class="layout-topbar-action topbar-primary" title="Notificacion">
                        <font-icon icon="fa-solid fa-bell" />
                        <span>Notificaciones</span>
                    </button>

                    <button type="button" class="layout-topbar-action topbar-primary" title="Perfil">
                        <font-icon icon="fa-solid fa-user" />
                        <span>Perfil</span>
                    </button>

                    <button type="button" class="layout-topbar-action topbar-primary" @click="handleCerrarSesion">
                        <font-icon icon="fa-solid fa-right-from-bracket" title="Salir" />
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-topbar .layout-topbar-action.topbar-primary {
    color: var(--p-primary-color) !important;
}

.layout-topbar .layout-topbar-action.topbar-primary svg {
    color: var(--p-primary-color) !important;
}

.layout-topbar .layout-topbar-action.topbar-primary span {
    color: var(--p-primary-color) !important;
}

.icon-sol {
    color: #fbbf24 !important;
}

.icon-luna {
    color: #ffffff !important;
}
</style>
