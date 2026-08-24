import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const useProceso = () => {
    const router = useRouter();
    const store = useStore();

    // =========================================================
    // USUARIO
    // =========================================================

    const nombreUsuario = ref(localStorage.getItem('nombre_completo') || 'Usuario');

    const fotoUsuario = ref(null);

    // =========================================================
    // FECHA
    // =========================================================

    const fechaActual = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // =========================================================
    // ACCESOS RÁPIDOS
    // =========================================================

    const accesosRapidos = ref([
        {
            titulo: 'Mesa de Control',
            descripcion: 'Consulta y seguimiento de operaciones.',
            icono: 'fa-solid fa-gauge',
            ruta: '/operaciones/mesa_control'
        },
        {
            titulo: 'Solicitud SAT',
            descripcion: 'Genera solicitudes de descarga al SAT.',
            icono: 'fa-solid fa-cloud-arrow-up',
            ruta: '/administrador_cfdi/operaciones_cfdi/solicitud_sat'
        },
        {
            titulo: 'Consultas SAT',
            descripcion: 'Consulta el estado de solicitudes realizadas.',
            icono: 'fa-solid fa-cloud-arrow-down',
            ruta: '/administrador_cfdi/operaciones_cfdi/consultas_sat'
        },
        {
            titulo: 'CFDI',
            descripcion: 'Consulta los comprobantes fiscales.',
            icono: 'fa-solid fa-file-invoice',
            ruta: '/administrador_cfdi/reportes_cfdi/cfdis'
        },
        {
            titulo: 'Complementos de Pago',
            descripcion: 'Consulta complementos de pago CFDI.',
            icono: 'fa-solid fa-file-invoice-dollar',
            ruta: '/administrador_cfdi/reportes_cfdi/complementos_pagos'
        },
        {
            titulo: 'CFDI Cancelados',
            descripcion: 'Consulta los comprobantes cancelados.',
            icono: 'fa-solid fa-file-circle-xmark',
            ruta: '/administrador_cfdi/reportes_cfdi/cfdis_cancelados'
        }
    ]);

    // =========================================================
    // NAVEGACIÓN
    // =========================================================

    const handleIrRuta = (ruta) => {
        router.push(ruta);
    };

    // =========================================================
    // FOTO USUARIO
    // =========================================================

    const handleCargarFotoUsuario = async () => {
        /*
         * Aquí necesitamos el _id del usuario logueado.
         *
         * Cuando lo tengamos en localStorage podemos hacer:
         *
         * const idUsuario = localStorage.getItem('_id');
         *
         * const res = await store.dispatch('api/apiGetblob', {
         *     direccion: `/usuarios/foto/${idUsuario}`
         * });
         *
         * if (
         *     res.estatus === 200 &&
         *     res.data instanceof Blob
         * ) {
         *     fotoUsuario.value =
         *         URL.createObjectURL(res.data);
         * }
         */
    };

    // =========================================================
    // INICIAL
    // =========================================================

    const handleInit = async () => {
        await handleCargarFotoUsuario();
    };

    handleInit();

    return {
        nombreUsuario,
        fotoUsuario,
        fechaActual,

        accesosRapidos,

        handleIrRuta
    };
};

export default useProceso;
