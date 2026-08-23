<script setup>
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import AppMenuItem from './AppMenuItem.vue';

const store = useStore();

const modelMenu = ref([]);
const nombreUsuario = ref(localStorage.getItem('nombre_completo') || 'Usuario');

const handleCargarMenu = async () => {
    const res = await store.dispatch('api/apiGetToken', {
        direccion: `/perfiles/menus_perfil`
    });

    if (res.estatus === 200) {
        modelMenu.value = res.datos?.menu_web ?? [];
    } else {
        modelMenu.value = [];
    }
};

onMounted(async () => {
    await handleCargarMenu();
});

const model = ref([
    {
        label: 'Inicio',
        path: '/principal',
        icon: 'fa-solid fa-list',
        items: [
            {
                label: 'Principal',
                icon: 'fa-solid fa-house',
                to: '/principal',
                class: 'icon-cyan'
            }
        ]
    },
    {
        label: 'Configuracion',
        path: 'configuracion',
        icon: 'fa-solid fa-list',
        items: [
            {
                label: 'Usuarios',
                icon: 'fa-solid fa-user',
                to: '/configuracion/usuarios',
                class: 'icon-cyan'
            },
            {
                label: 'Perfiles',
                icon: 'fa-solid fa-user-shield',
                to: '/configuracion/perfiles',
                class: 'icon-cyan'
            },
            {
                label: 'Asignar Perfil',
                icon: 'fa-solid fa-user-tag',
                to: '/configuracion/asignar_perfil',
                class: 'icon-cyan'
            },
            {
                label: 'Correo Notificaciones',
                icon: 'fa-solid fa-envelope',
                to: '/configuracion/correo_notificaciones',
                class: 'icon-cyan'
            }
        ]
    },
    {
        label: 'Catalogos',
        path: 'catalogos',
        icon: 'fa-solid fa-list',
        items: [
            {
                label: 'Empresas',
                icon: 'fa-solid fa-building',
                to: '/catalogos/empresas',
                class: 'icon-cyan'
            },
            {
                label: 'Promotores',
                icon: 'fa-solid fa-people-group',
                to: '/catalogos/promotores',
                class: 'icon-cyan'
            },
            {
                label: 'Clientes',
                icon: 'fa-solid fa-users-rays',
                to: '/catalogos/clientes',
                class: 'icon-cyan'
            },
            {
                label: 'Impuesto',
                icon: 'fa-solid fa-scale-balanced',
                to: '/catalogos/impuestos',
                class: 'icon-cyan'
            },
            {
                label: 'Catalogo Sat',
                icon: 'fa-solid fa-list-check',
                to: '/catalogos/catalogo_sat',
                class: 'icon-cyan'
            }
        ]
    },
    {
        label: 'Operaciones',
        path: 'operaciones',
        icon: 'fa-solid fa-list',
        items: [
            {
                label: 'Mesa de Control',
                icon: 'fa-solid fa-gauge',
                to: '/operaciones/mesa_control',
                class: 'icon-cyan'
            },
            {
                label: 'Solicitud Detallada',
                icon: 'fa-solid fa-magnifying-glass',
                to: '/operaciones/solicitud_detallada',
                class: 'icon-cyan'
            },
            {
                label: 'Solicitud de Pago',
                icon: 'fa-solid fa-file-invoice-dollar',
                to: '/operaciones/solicitud_pago',
                class: 'icon-cyan'
            }
        ]
    },
    {
        label: 'Administrador de CFDI',
        // path: '/administrador_cfdi',
        icon: 'fa-solid fa-list',
        items: [
            {
                label: 'Parametros',
                icon: 'fa-solid fa-gear',
                path: '/administrador_cfdi/parametros',
                class: 'icon-cyan',
                items: [
                    {
                        label: 'Empresas a Consultar',
                        icon: 'fa-solid fa-tachograph-digital',
                        path: '/administrador_cfdi/parametros',
                        to: '/administrador_cfdi/parametros/empresas_consultar',
                        class: 'icon-cyan'
                    }
                ]
            },
            {
                label: 'Operaciones CFDI',
                icon: 'fa-solid fa-cloud',
                path: '/administrador_cfdi/operaciones_cfdi',
                class: 'icon-cyan',
                items: [
                    {
                        label: 'Solicitud SAT',
                        icon: 'fa-hand-point-up',
                        path: '/administrador_cfdi/operaciones_cfdi',
                        to: '/administrador_cfdi/operaciones_cfdi/solicitud_sat',
                        class: 'icon-cyan'
                    },
                    {
                        label: 'Carga Masiva CFDI',
                        icon: 'fa-solid fa-file-upload',
                        path: '/administrador_cfdi/operaciones_cfdi',
                        to: '/administrador_cfdi/operaciones_cfdi/carga_masiva_cfdi',
                        class: 'icon-cyan'
                    },
                    {
                        label: 'Consultas SAT',
                        icon: 'fa-solid fa-cloud-arrow-down',
                        path: '/administrador_cfdi/operaciones_cfdi',
                        to: '/administrador_cfdi/operaciones_cfdi/consultas_sat',
                        class: 'icon-cyan'
                    }
                ]
            },
            {
                label: 'Reportes CFDI',
                icon: 'fa-solid fa-book-open-reader',
                path: '/administrador_cfdi/reportes_cfdi',
                class: 'icon-cyan',
                items: [
                    {
                        label: "CFDI's",
                        icon: 'fa-solid fa-file-code',
                        path: '/administrador_cfdi/reportes_cfdi',
                        to: '/administrador_cfdi/reportes_cfdi/cfdis',
                        class: 'icon-cyan'
                    },
                    {
                        label: 'Complementos Pagos',
                        icon: 'fa-solid fa-file-invoice-dollar',
                        path: '/administrador_cfdi/reportes_cfdi',
                        to: '/administrador_cfdi/reportes_cfdi/complementos_pagos',
                        class: 'icon-cyan'
                    },
                    {
                        label: "CFDI's Cancelados",
                        icon: 'fa-solid fa-file-circle-xmark',
                        path: '/administrador_cfdi/reportes_cfdi',
                        to: '/administrador_cfdi/reportes_cfdi/cfdis_cancelados',
                        class: 'icon-cyan'
                    }
                ]
            }
        ]
    }
]);
</script>

<template>
    <span class="usuario-menu">
        <font-icon icon="fa-solid fa-user" />
        Nombre del usuario
    </span>
    <ul class="layout-menu" style="border-top: 1px solid gray; margin-top: 10px">
        <template v-for="(item, i) in modelMenu" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped>
.usuario-menu {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 10px 15px;
    margin: 0 10px;

    font-weight: 600;
}

.layout-menu {
    border-top: 1px solid var(--p-surface-300);
    margin-top: 10px;
}
</style>
