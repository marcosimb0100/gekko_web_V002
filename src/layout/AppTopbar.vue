<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useConfirm } from 'primevue/useconfirm';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import ActualizacionSat from '@/components/actualizacion_sat/ActualizacionSat.vue';
import EstadoConexion from '@/components/realtime/EstadoConexion.vue';
import CampanaNotificaciones from '@/components/notificaciones/Notificaciones.vue';
import ChatPrivado from '@/components/chat/ChatPrivado.vue';
import CalendarioPagos from '@/components/pagos_programados/CalendarioPagos.vue';
import { desconectarSocket } from '@/helpers/socket';

const confirm = useConfirm();
const store = useStore();
const toast = useToast();
let cerrandoSesion = false;
const router = useRouter();

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();

const appCliente = import.meta.env.VITE_APP_CLIENT;

const handleCerrarSesion = () => {
    confirm.require({
        message: 'Estas seguro de cerrar la sesion.',
        header: 'Cierre de sesion',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            if (cerrandoSesion) return;
            cerrandoSesion = true;
            try {
                const res = await store.dispatch('api/apiCerrarSesionWeb');
                if (![200, 401].includes(res.estatus)) throw new Error(res.mensaje || 'No fue posible cerrar la sesion. Intenta nuevamente.');
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Sesion', detail: error.message, life: 5000 });
                cerrandoSesion = false;
                return;
            }
            desconectarSocket();
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
                <img src="@/assets/images/logo_empresa_cliente.png" alt="Logo" width="40" />

                <span class="titulo" style="color: #6ac4ca">{{ appCliente }}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <ActualizacionSat />
            <EstadoConexion />
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
                    <CalendarioPagos />

                    <CampanaNotificaciones />

                    <ChatPrivado />

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
