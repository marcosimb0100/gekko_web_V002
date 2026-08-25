import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import permisoRutas from './permisosRutas';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import(/* webpackChunkName: "notfound" */ '../views/NotFound.vue')
        },
        {
            path: '/acceso',
            name: 'acceso',
            component: () => import(/* webpackChunkName: "acceso" */ '../views/acceso/Acceso.vue')
        },

        // =====================================================
        // ACCESO CLIENTE - SIN LAYOUT
        // =====================================================

        {
            path: '/clientes/acceso/:clientId',
            name: 'cliente_acceso',
            component: () => import('../views/clientes_solicitudes/acceso/AccesoCliente.vue')
        },

        {
            path: '/clientes/portal/:clientId',
            name: 'cliente_portal',
            component: () => import('../views/clientes_solicitudes/portal/PortalCliente.vue')
        },

        {
            path: '/',
            redirect: '/acceso',
            name: 'app',
            component: AppLayout,
            children: [
                {
                    path: '/principal',
                    name: 'bienvenida_principal',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "bienvenida_principal" */ '../views/inicio/principal/Principal.vue')
                },

                {
                    path: '/configuracion/usuarios',
                    name: 'configuracion_usuarios',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "configuracion_usuarios" */ '../views/configuracion/usuarios/Usuarios.vue')
                },
                {
                    path: '/configuracion/perfiles',
                    name: 'configuracion_perfiles',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "configuracion_perfiles" */ '../views/configuracion/perfiles/Perfiles.vue')
                },
                {
                    path: '/configuracion/asignar_perfil',
                    name: 'configuracion_asignar_perfil',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "configuracion_asignar_perfil" */ '../views/configuracion/asignar_perfil/AsignarPerfil.vue')
                },
                {
                    path: '/configuracion/correo_notificaciones',
                    name: 'configuracion_correo_notificaciones',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "configuracion_correo_notificaciones" */ '../views/configuracion/correo_notificaciones/CorreoNotificaciones.vue')
                },

                {
                    path: '/catalogos/empresas',
                    name: 'catalogos_empresas',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "catalogos_empresas" */ '../views/catalogos/empresas/Empresas.vue')
                },
                {
                    path: '/catalogos/promotores',
                    name: 'catalogos_promotores',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "catalogos_promotores" */ '../views/catalogos/promotores/Promotores.vue')
                },
                {
                    path: '/catalogos/clientes',
                    name: 'catalogos_clientes',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "catalogos_clientes" */ '../views/catalogos/clientes/Clientes.vue')
                },
                {
                    path: '/catalogos/impuestos',
                    name: 'catalogos_impuestos',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "catalogos_impuestos" */ '../views/catalogos/impuestos/Impuestos.vue')
                },
                {
                    path: '/catalogos/catalogo_sat',
                    name: 'catalogos_catalogo_sat',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "catalogos_catalogo_sat" */ '../views/catalogos/catalogo_sat/CatalogoSat.vue')
                },

                {
                    path: '/operaciones/mesa_control',
                    name: 'operaciones_mesa_control',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "operaciones_mesa_control" */ '../views/operaciones/mesa_control/MesaControl.vue')
                },
                {
                    path: '/operaciones/solicitud_detallada',
                    name: 'operaciones_solicitud_detallada',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "operaciones_solicitud_detallada" */ '../views/operaciones/solicitud_detallada/SolicitudDetallada.vue')
                },
                {
                    path: '/operaciones/solicitud_pago',
                    name: 'operaciones_solicitud_pago',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "operaciones_solicitud_pago" */ '../views/operaciones/solicitud_pago/SolicitudPago.vue')
                },

                {
                    path: '/administrador_cfdi/parametros/empresas_consultar',
                    name: 'administrador_cfdi_parametros_empresas_consultar',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_parametros_empresas_consultar" */ '../views/administrador_cfdi/parametros/empresas_consultar/EmpresasConsultar.vue')
                },
                {
                    path: '/administrador_cfdi/operaciones_cfdi/solicitud_sat',
                    name: 'administrador_cfdi_operaciones_cfdi_solicitud_sat',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_operaciones_cfdi_solicitud_sat" */ '../views/administrador_cfdi/operaciones_cfdi/solicitud_sat/SolicitudSat.vue')
                },
                {
                    path: '/administrador_cfdi/operaciones_cfdi/carga_masiva_cfdi',
                    name: 'administrador_cfdi_operaciones_cfdi_carga_masiva_cfdi',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_operaciones_cfdi_carga_masiva_cfdi" */ '../views/administrador_cfdi/operaciones_cfdi/carga_masiva_cfdi/CargaMasivaCfdi.vue')
                },
                {
                    path: '/administrador_cfdi/operaciones_cfdi/consultas_sat',
                    name: 'administrador_cfdi_operaciones_cfdi_consultas_sat',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_operaciones_cfdi_consultas_sat" */ '../views/administrador_cfdi/operaciones_cfdi/consultas_sat/ConsultasSat.vue')
                },
                {
                    path: '/administrador_cfdi/reportes_cfdi/cfdis',
                    name: 'administrador_cfdi_reportes_cfdi_cfdis',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_reportes_cfdi_cfdis" */ '../views/administrador_cfdi/reportes_cfdi/cfdis/Cfdis.vue')
                },
                {
                    path: '/administrador_cfdi/reportes_cfdi/complementos_pagos',
                    name: 'administrador_cfdi_reportes_cfdi_complementos_pagos',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_reportes_cfdi_complementos_pagos" */ '../views/administrador_cfdi/reportes_cfdi/complementos_pagos/ComplementosPagos.vue')
                },
                {
                    path: '/administrador_cfdi/reportes_cfdi/cfdis_cancelados',
                    name: 'administrador_cfdi_reportes_cfdi_cfdis_cancelados',
                    beforeEnter: permisoRutas,
                    component: () => import(/* webpackChunkName: "administrador_cfdi_reportes_cfdi_cfdis_cancelados" */ '../views/administrador_cfdi/reportes_cfdi/cfdis_cancelados/CfdisCancelados.vue')
                }
            ]
        }
    ]
});

export default router;
