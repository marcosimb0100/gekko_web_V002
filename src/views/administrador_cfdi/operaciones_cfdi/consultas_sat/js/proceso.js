import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const tablaConsultasSat = ref([]);
    const tablaConsultasFiltradas = ref([]);

    const empresas = ref([]);
    const empresaFiltro = ref('TODAS');

    const fechaInicial = ref(null);
    const fechaFinal = ref(null);

    const hoy = new Date();

    // ---------------------------------------------------------
    // FECHAS INICIALES
    // ---------------------------------------------------------

    const handleFechasIniciales = () => {
        const fecha = new Date();

        fechaInicial.value = new Date(fecha.getFullYear(), fecha.getMonth(), 1);

        fechaFinal.value = new Date();
    };

    // ---------------------------------------------------------
    // FORMATO FECHA
    // ---------------------------------------------------------

    const handleFechaYmd = (fecha) => {
        if (!fecha) {
            return '';
        }

        const year = fecha.getFullYear();

        const month = String(fecha.getMonth() + 1).padStart(2, '0');

        const day = String(fecha.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // ---------------------------------------------------------
    // CONSTRUIR CATALOGO EMPRESAS
    // ---------------------------------------------------------

    const handleConstruirEmpresas = () => {
        const mapa = new Map();

        tablaConsultasSat.value.forEach((item) => {
            if (!item.rfc) {
                return;
            }

            if (!mapa.has(item.rfc)) {
                mapa.set(item.rfc, {
                    rfc: item.rfc,

                    nombre: item.razon_social_nombre_completo ? `${item.rfc} - ${item.razon_social_nombre_completo}` : item.rfc
                });
            }
        });

        empresas.value = [
            {
                rfc: 'TODAS',
                nombre: 'TODAS LAS EMPRESAS'
            },
            ...Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
        ];
    };

    // ---------------------------------------------------------
    // DETERMINAR SI REALMENTE ES UNA CONSULTA SAT
    // ---------------------------------------------------------

    const handleEsConsultaSat = (item) => {
        /*
         * Esto evita mostrar los registros que solamente
         * contienen empresa/RFC pero todavía no tienen
         * una consulta SAT realizada.
         */

        return Boolean(item.fecha_aplicacion || item.inicio_fecha_sat || item.fin_fecha_sat || item.id_consulta_sat || item.id_request_sat || item.estatus_aplicacion);
    };

    // ---------------------------------------------------------
    // APLICAR FILTROS
    // ---------------------------------------------------------

    const handleAplicarFiltros = () => {
        const inicio = handleFechaYmd(fechaInicial.value);

        const fin = handleFechaYmd(fechaFinal.value);

        tablaConsultasFiltradas.value = tablaConsultasSat.value
            .filter((item) => handleEsConsultaSat(item))
            .filter((item) => {
                if (empresaFiltro.value === 'TODAS') {
                    return true;
                }

                return item.rfc === empresaFiltro.value;
            })
            .filter((item) => {
                /*
                 * Tomamos fecha de aplicación como
                 * fecha principal de la consulta.
                 */

                const fecha = item.fecha_aplicacion?.substring(0, 10);

                if (!fecha) {
                    return false;
                }

                if (inicio && fecha < inicio) {
                    return false;
                }

                if (fin && fecha > fin) {
                    return false;
                }

                return true;
            });
    };

    // ---------------------------------------------------------
    // CARGAR CONSULTAS
    // ---------------------------------------------------------

    const handleCargarConsultas = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/consultas_sat`
        });

        if (res.estatus !== 200) {
            tablaConsultasSat.value = [];
            tablaConsultasFiltradas.value = [];
            empresas.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        tablaConsultasSat.value = res.datos?.consultasSat ?? [];

        handleConstruirEmpresas();

        handleAplicarFiltros();
    };

    // ---------------------------------------------------------
    // CONSULTAR
    // ---------------------------------------------------------

    const handleConsultar = () => {
        handleAplicarFiltros();
    };

    // ---------------------------------------------------------
    // VALIDACION
    // ---------------------------------------------------------

    const botonConsultarDeshabilitado = computed(() => {
        if (!empresaFiltro.value) {
            return true;
        }

        if (!fechaInicial.value) {
            return true;
        }

        if (!fechaFinal.value) {
            return true;
        }

        if (fechaInicial.value > fechaFinal.value) {
            return true;
        }

        return false;
    });

    // ---------------------------------------------------------
    // BUSQUEDA GLOBAL
    // ---------------------------------------------------------

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // ---------------------------------------------------------
    // VERIFICAR SAT
    // ---------------------------------------------------------

    const handleVerificarConsultas = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/verificar_consultas_sat`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        await handleCargarConsultas();
    };

    // ---------------------------------------------------------
    // DESCARGAR SAT
    // ---------------------------------------------------------

    const handleDescargarConsultas = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/descarga_consultas_sat`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        await handleCargarConsultas();
    };

    // ---------------------------------------------------------
    // PROCESAR CFDI
    // ---------------------------------------------------------

    const handleProcesarConsultas = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/procesar_cfdi_sat`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        await handleCargarConsultas();
    };

    // ---------------------------------------------------------
    // ESTATUS
    // ---------------------------------------------------------

    const handleClaseEstatus = (item) => {
        const estatus = String(item.estatus_aplicacion ?? '').toLowerCase();

        if (estatus.includes('complet')) {
            return 'estatus-completado';
        }

        if (estatus.includes('proceso')) {
            return 'estatus-proceso';
        }

        if (estatus.includes('error') || estatus.includes('rechaz')) {
            return 'estatus-error';
        }

        return 'estatus-default';
    };

    // ---------------------------------------------------------
    // INIT
    // ---------------------------------------------------------

    const handleInit = async () => {
        handleFechasIniciales();

        await handleCargarConsultas();
    };

    handleInit();

    return {
        tablaConsultasFiltradas,

        filtros,

        empresas,
        empresaFiltro,

        fechaInicial,
        fechaFinal,
        hoy,

        botonConsultarDeshabilitado,

        handleConsultar,

        handleLimpiarFiltro,

        handleVerificarConsultas,
        handleDescargarConsultas,
        handleProcesarConsultas,

        handleClaseEstatus
    };
};

export default useProceso;
