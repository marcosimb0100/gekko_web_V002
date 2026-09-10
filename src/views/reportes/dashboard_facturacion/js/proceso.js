import { computed, onMounted, reactive, ref } from 'vue';

import { useStore } from 'vuex';

import { useToast } from 'primevue/usetoast';

import * as XLSX from 'xlsx';

// ============================================================
// PRIMER DIA MES
// ============================================================

const fechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(1);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// HOY
// ============================================================

const fechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// PROCESO
// ============================================================

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ========================================================
    // FORMULARIO
    // ========================================================

    const frmFiltros = reactive({
        empresa: null,

        fechaInicial: fechaInicialDefault(),

        fechaFinal: fechaFinalDefault()
    });

    const fechaActual = new Date();

    // ========================================================
    // EMPRESAS
    // ========================================================

    const empresas = ref([]);

    // ========================================================
    // RESULTADO
    // ========================================================

    const registros = ref([]);

    const resumen = ref({
        cantidadCfdi: 0,

        facturado: '0.00',

        pagado: '0.00',

        saldoPendiente: '0.00',

        solicitudesPendientes: 0,

        solicitudesRechazadas: 0,

        solicitudesTimbradas: 0,

        porcentajePagado: 0
    });

    // ========================================================
    // ESTADOS
    // ========================================================

    const cargando = ref(false);

    const exportando = ref(false);

    // ========================================================
    // BUSQUEDA
    // ========================================================

    const buscar = ref('');

    // ========================================================
    // FECHA API
    // ========================================================

    const formatFechaApi = (fecha) => {
        if (!fecha) {
            return '';
        }

        const valor = new Date(fecha);

        const year = valor.getFullYear();

        const month = String(valor.getMonth() + 1).padStart(2, '0');

        const day = String(valor.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // ========================================================
    // MONEDA
    // ========================================================

    const formatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(Number.isFinite(numero) ? numero : 0);
    };

    // ========================================================
    // PORCENTAJE
    // ========================================================

    const formatoPorcentaje = (valor) => {
        const numero = Number(valor ?? 0);

        return (Number.isFinite(numero) ? numero : 0).toFixed(1) + '%';
    };

    // ========================================================
    // NOTIFICACION
    // ========================================================

    const notificar = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity,
            summary,
            detail,
            life: 3500
        });
    };

    // ========================================================
    // EMPRESAS
    // ========================================================

    const handleEmpresas = async () => {
        try {
            const response = await store.dispatch('api/apiGetToken', {
                direccion: '/reportes/empresas'
            });

            if (response.estatus !== 200) {
                empresas.value = [];

                notificar('error', response.mensaje || 'No fue posible consultar las empresas.');

                return;
            }

            empresas.value = response.datos?.empresas ?? response.datos?.datos?.empresas ?? [];
        } catch (error) {
            console.error('EMPRESAS:', error);

            empresas.value = [];

            notificar('error', 'Ocurrió un error al ' + 'consultar las empresas.');
        }
    };

    // ========================================================
    // CONSULTAR
    // ========================================================

    const handleConsultar = async () => {
        if (!frmFiltros.fechaInicial) {
            notificar('warn', 'Selecciona la fecha inicial.');

            return;
        }

        if (!frmFiltros.fechaFinal) {
            notificar('warn', 'Selecciona la fecha final.');

            return;
        }

        if (frmFiltros.fechaFinal < frmFiltros.fechaInicial) {
            notificar('warn', 'La fecha final no puede ' + 'ser menor a la fecha inicial.');

            return;
        }

        cargando.value = true;

        try {
            const payload = {
                fechaInicial: formatFechaApi(frmFiltros.fechaInicial),

                fechaFinal: formatFechaApi(frmFiltros.fechaFinal),

                company_id: frmFiltros.empresa?._id ?? ''
            };

            const response = await store.dispatch('api/apiPostToken', {
                direccion: '/reportes/dashboard_facturacion',

                datosJson: payload
            });

            if (response.estatus !== 200) {
                registros.value = [];

                handleResetResumen();

                notificar('error', response.mensaje || 'No fue posible consultar ' + 'el dashboard.');

                return;
            }

            const datos = response.datos?.datos ?? response.datos ?? {};

            registros.value = Array.isArray(datos.empresas) ? datos.empresas : [];

            resumen.value = {
                cantidadCfdi: datos.resumen?.cantidadCfdi ?? 0,

                facturado: datos.resumen?.facturado ?? '0.00',

                pagado: datos.resumen?.pagado ?? '0.00',

                saldoPendiente: datos.resumen?.saldoPendiente ?? '0.00',

                solicitudesPendientes: datos.resumen?.solicitudesPendientes ?? 0,

                solicitudesRechazadas: datos.resumen?.solicitudesRechazadas ?? 0,

                solicitudesTimbradas: datos.resumen?.solicitudesTimbradas ?? 0,

                porcentajePagado: datos.resumen?.porcentajePagado ?? 0
            };
        } catch (error) {
            console.error('DASHBOARD:', error);

            registros.value = [];

            handleResetResumen();

            notificar('error', 'Ocurrió un error al consultar ' + 'el dashboard de facturación.');
        } finally {
            cargando.value = false;
        }
    };

    // ========================================================
    // RESET RESUMEN
    // ========================================================

    const handleResetResumen = () => {
        resumen.value = {
            cantidadCfdi: 0,

            facturado: '0.00',

            pagado: '0.00',

            saldoPendiente: '0.00',

            solicitudesPendientes: 0,

            solicitudesRechazadas: 0,

            solicitudesTimbradas: 0,

            porcentajePagado: 0
        };
    };

    // ========================================================
    // LIMPIAR
    // ========================================================

    const handleLimpiar = async () => {
        frmFiltros.empresa = null;

        frmFiltros.fechaInicial = fechaInicialDefault();

        frmFiltros.fechaFinal = fechaFinalDefault();

        buscar.value = '';

        registros.value = [];

        handleResetResumen();

        await handleConsultar();
    };

    // ========================================================
    // REGISTROS FILTRADOS
    // ========================================================

    const registrosFiltrados = computed(() => {
        const texto = String(buscar.value ?? '')
            .trim()
            .toLowerCase();

        if (!texto) {
            return registros.value;
        }

        return registros.value.filter((item) => {
            const valores = [item.empresa, item.rfc, item.facturado, item.pagado, item.saldoPendiente, item.solicitudesPendientes, item.solicitudesRechazadas, item.solicitudesTimbradas, item.porcentajePagado];

            return valores.some((valor) =>
                String(valor ?? '')
                    .toLowerCase()
                    .includes(texto)
            );
        });
    });

    // ========================================================
    // EXPORTAR EXCEL
    // ========================================================

    const handleExportarExcel = async () => {
        if (registrosFiltrados.value.length === 0) {
            notificar('warn', 'No existen datos para exportar.', 'Excel');

            return;
        }

        exportando.value = true;

        try {
            const datosExcel = registrosFiltrados.value.map((item) => ({
                Empresa: item.empresa ?? '',

                RFC: item.rfc ?? '',

                CFDI: Number(item.cantidadCfdi ?? 0),

                Facturado: Number(item.facturado ?? 0),

                Pagado: Number(item.pagado ?? 0),

                'Saldo pendiente': Number(item.saldoPendiente ?? 0),

                'Solicitudes pendientes': Number(item.solicitudesPendientes ?? 0),

                'Solicitudes rechazadas': Number(item.solicitudesRechazadas ?? 0),

                'Solicitudes timbradas': Number(item.solicitudesTimbradas ?? 0),

                '% Pagado': Number(item.porcentajePagado ?? 0)
            }));

            // ==============================================
            // TOTALES
            // ==============================================

            datosExcel.push({
                Empresa: 'TOTALES',

                RFC: '',

                CFDI: Number(resumen.value.cantidadCfdi ?? 0),

                Facturado: Number(resumen.value.facturado ?? 0),

                Pagado: Number(resumen.value.pagado ?? 0),

                'Saldo pendiente': Number(resumen.value.saldoPendiente ?? 0),

                'Solicitudes pendientes': Number(resumen.value.solicitudesPendientes ?? 0),

                'Solicitudes rechazadas': Number(resumen.value.solicitudesRechazadas ?? 0),

                'Solicitudes timbradas': Number(resumen.value.solicitudesTimbradas ?? 0),

                '% Pagado': Number(resumen.value.porcentajePagado ?? 0)
            });

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            hoja['!cols'] = [
                {
                    wch: 38
                },

                {
                    wch: 16
                },

                {
                    wch: 10
                },

                {
                    wch: 18
                },

                {
                    wch: 18
                },

                {
                    wch: 18
                },

                {
                    wch: 22
                },

                {
                    wch: 22
                },

                {
                    wch: 22
                },

                {
                    wch: 14
                }
            ];

            hoja['!autofilter'] = {
                ref: `A1:J${datosExcel.length + 1}`
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'Dashboard Facturación');

            const fechaInicial = formatFechaApi(frmFiltros.fechaInicial);

            const fechaFinal = formatFechaApi(frmFiltros.fechaFinal);

            XLSX.writeFile(libro, 'Dashboard_Facturacion_' + fechaInicial + '_' + fechaFinal + '.xlsx');

            notificar('success', 'Reporte Excel generado correctamente.', 'Excel');
        } catch (error) {
            console.error('EXCEL:', error);

            notificar('error', 'No fue posible generar el Excel.', 'Excel');
        } finally {
            exportando.value = false;
        }
    };

    // ========================================================
    // CLASE PORCENTAJE
    // ========================================================

    const clasePorcentaje = (porcentaje) => {
        const valor = Number(porcentaje ?? 0);

        if (valor >= 90) {
            return 'avance-alto';
        }

        if (valor >= 50) {
            return 'avance-medio';
        }

        return 'avance-bajo';
    };

    // ========================================================
    // INIT
    // ========================================================

    onMounted(async () => {
        await handleEmpresas();

        await handleConsultar();
    });

    // ========================================================
    // RETURN
    // ========================================================

    return {
        frmFiltros,

        fechaActual,

        empresas,

        registros,

        registrosFiltrados,

        resumen,

        buscar,

        cargando,

        exportando,

        handleConsultar,

        handleLimpiar,

        handleExportarExcel,

        formatoMoneda,

        formatoPorcentaje,

        clasePorcentaje
    };
};

export default useProceso;
