import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ==========================================================
    // FILTROS DATATABLE
    // ==========================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // ==========================================================
    // DATA
    // ==========================================================

    const tablaConsultasSat = ref([]);

    const tablaConsultasFiltradas = ref([]);

    const empresas = ref([]);

    const empresaFiltro = ref('TODAS');

    const fechaInicial = ref(null);

    const fechaFinal = ref(null);

    const hoy = new Date();

    // ==========================================================
    // LOADING
    // ==========================================================

    const cargandoConsultas = ref(false);

    const cargandoVerificacion = ref(false);

    const cargandoDescarga = ref(false);

    const cargandoProceso = ref(false);

    // ==========================================================
    // FECHAS INICIALES
    // ==========================================================

    const handleFechasIniciales = () => {
        const fecha = new Date();

        fechaInicial.value = new Date(fecha.getFullYear(), fecha.getMonth(), 1);

        fechaFinal.value = new Date();
    };

    // ==========================================================
    // FORMATO FECHA YYYY-MM-DD
    // ==========================================================

    const handleFechaYmd = (fecha) => {
        if (!fecha) {
            return '';
        }

        const year = fecha.getFullYear();

        const month = String(fecha.getMonth() + 1).padStart(2, '0');

        const day = String(fecha.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // ==========================================================
    // FORMATO FECHA MOSTRAR
    // ==========================================================

    const handleFechaTexto = (fecha) => {
        if (!fecha) {
            return '-';
        }

        try {
            const texto = String(fecha);

            if (texto.length >= 10) {
                return texto.substring(0, 10);
            }

            return texto;
        } catch {
            return '-';
        }
    };

    // ==========================================================
    // CONSTRUIR CATALOGO EMPRESAS
    // ==========================================================

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

    // ==========================================================
    // DETERMINAR SI ES UNA CONSULTA SAT REAL
    // ==========================================================

    const handleEsConsultaSat = (item) => {
        return Boolean(item.fecha_aplicacion || item.inicio_fecha_sat || item.fin_fecha_sat || item.id_respuesta_sat || item.estatus_aplicacion);
    };

    // ==========================================================
    // APLICAR FILTROS
    // ==========================================================

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
            })

            .sort((a, b) => {
                const fechaA = new Date(a.fecha_aplicacion || 0);

                const fechaB = new Date(b.fecha_aplicacion || 0);

                return fechaB - fechaA;
            });
    };

    // ==========================================================
    // CARGAR CONSULTAS
    // ==========================================================

    const handleCargarConsultas = async () => {
        if (cargandoConsultas.value) {
            return;
        }

        cargandoConsultas.value = true;

        try {
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
        } catch (error) {
            console.error(error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al consultar las solicitudes SAT.',

                life: 3000
            });
        } finally {
            cargandoConsultas.value = false;
        }
    };

    // ==========================================================
    // CONSULTAR
    // ==========================================================

    const handleConsultar = () => {
        handleAplicarFiltros();
    };

    // ==========================================================
    // VALIDAR BOTON CONSULTAR
    // ==========================================================

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

    // ==========================================================
    // LIMPIAR BUSQUEDA GLOBAL
    // ==========================================================

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // ==========================================================
    // RESUMEN
    // ==========================================================

    const resumen = computed(() => {
        const datos = tablaConsultasFiltradas.value;

        let proceso = 0;

        let descargadas = 0;

        let procesadas = 0;

        let errores = 0;

        datos.forEach((item) => {
            const estatusNumero = Number(item.estatus ?? -1);

            const estatusTexto = String(item.estatus_aplicacion ?? '').toLowerCase();

            // ------------------------------------------
            // EN PROCESO
            // ------------------------------------------

            if ([0, 1, 2, 3].includes(estatusNumero)) {
                proceso++;
            }

            // ------------------------------------------
            // DESCARGADO
            // ------------------------------------------

            if (estatusNumero === 7) {
                descargadas++;
            }

            // ------------------------------------------
            // PROCESADO
            // ------------------------------------------

            if (estatusNumero === 8) {
                procesadas++;
            }

            // ------------------------------------------
            // ERROR
            // ------------------------------------------

            if ([4, 5, 6, 9, 10, 11].includes(estatusNumero) || estatusTexto.includes('error') || estatusTexto.includes('rechaz')) {
                errores++;
            }
        });

        return {
            total: datos.length,

            proceso: proceso,

            descargadas: descargadas,

            procesadas: procesadas,

            errores: errores
        };
    });

    // ==========================================================
    // NUMERO PAQUETES
    // ==========================================================

    const handleNumeroPaquetes = (item) => {
        const paquetes = item.paquetes;

        if (Array.isArray(paquetes)) {
            return paquetes.length;
        }

        if (typeof paquetes === 'string') {
            return paquetes
                .split(',')
                .map((paquete) => paquete.trim())
                .filter(Boolean).length;
        }

        return 0;
    };

    // ==========================================================
    // CLASE TIPO DESCARGA
    // ==========================================================

    const handleClaseTipoDescarga = (item) => {
        const tipo = String(item.tipo_descarga ?? '').toLowerCase();

        if (tipo.includes('metadata') || tipo.includes('cancelado')) {
            return 'tipo-metadata';
        }

        if (tipo.includes('recibido')) {
            return 'tipo-recibido';
        }

        if (tipo.includes('emitido')) {
            return 'tipo-emitido';
        }

        return 'tipo-default';
    };

    // ==========================================================
    // CLASE ESTATUS
    // ==========================================================

    const handleClaseEstatus = (item) => {
        const estatusNumero = Number(item.estatus ?? -1);

        if (estatusNumero === 8) {
            return 'estatus-completado';
        }

        if (estatusNumero === 7) {
            return 'estatus-descargado';
        }

        if ([0, 1, 2, 3].includes(estatusNumero)) {
            return 'estatus-proceso';
        }

        if ([4, 5, 6, 9, 10, 11].includes(estatusNumero)) {
            return 'estatus-error';
        }

        const estatusTexto = String(item.estatus_aplicacion ?? '').toLowerCase();

        if (estatusTexto.includes('complet')) {
            return 'estatus-completado';
        }

        if (estatusTexto.includes('descarg')) {
            return 'estatus-descargado';
        }

        if (estatusTexto.includes('proceso')) {
            return 'estatus-proceso';
        }

        if (estatusTexto.includes('error') || estatusTexto.includes('rechaz')) {
            return 'estatus-error';
        }

        return 'estatus-default';
    };

    // ==========================================================
    // ICONO ESTATUS
    // ==========================================================

    const handleIconoEstatus = (item) => {
        const estatusNumero = Number(item.estatus ?? -1);

        if (estatusNumero === 8) {
            return 'pi pi-check-circle';
        }

        if (estatusNumero === 7) {
            return 'pi pi-cloud-download';
        }

        if ([0, 1, 2, 3].includes(estatusNumero)) {
            return 'pi pi-spin pi-spinner';
        }

        if ([4, 5, 6, 9, 10, 11].includes(estatusNumero)) {
            return 'pi pi-times-circle';
        }

        return 'pi pi-clock';
    };

    // ==========================================================
    // VERIFICAR SAT
    // ==========================================================

    const handleVerificarConsultas = async () => {
        if (cargandoVerificacion.value) {
            return;
        }

        cargandoVerificacion.value = true;

        try {
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
        } catch (error) {
            console.error(error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al verificar las solicitudes SAT.',

                life: 3000
            });
        } finally {
            cargandoVerificacion.value = false;
        }
    };

    // ==========================================================
    // DESCARGAR SAT
    // ==========================================================

    const handleDescargarConsultas = async () => {
        if (cargandoDescarga.value) {
            return;
        }

        cargandoDescarga.value = true;

        try {
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
        } catch (error) {
            console.error(error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al descargar los paquetes SAT.',

                life: 3000
            });
        } finally {
            cargandoDescarga.value = false;
        }
    };

    // ==========================================================
    // PROCESAR CFDI
    // ==========================================================

    const handleProcesarConsultas = async () => {
        if (cargandoProceso.value) {
            return;
        }

        cargandoProceso.value = true;

        try {
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
        } catch (error) {
            console.error(error);

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al procesar los CFDI.',

                life: 3000
            });
        } finally {
            cargandoProceso.value = false;
        }
    };

    // ==========================================================
    // INIT
    // ==========================================================

    const handleInit = async () => {
        handleFechasIniciales();

        await handleCargarConsultas();
    };

    handleInit();

    // ==========================================================
    // RETURN
    // ==========================================================

    return {
        tablaConsultasFiltradas,

        filtros,

        empresas,
        empresaFiltro,

        fechaInicial,
        fechaFinal,

        hoy,

        resumen,

        cargandoConsultas,
        cargandoVerificacion,
        cargandoDescarga,
        cargandoProceso,

        botonConsultarDeshabilitado,

        handleConsultar,
        handleCargarConsultas,

        handleLimpiarFiltro,

        handleVerificarConsultas,
        handleDescargarConsultas,
        handleProcesarConsultas,

        handleClaseEstatus,
        handleIconoEstatus,

        handleClaseTipoDescarga,

        handleNumeroPaquetes,

        handleFechaTexto
    };
};

export default useProceso;
