import { useToast } from 'primevue/usetoast';

import { computed, onMounted, reactive, ref } from 'vue';

import { useStore } from 'vuex';

import * as XLSX from 'xlsx';

const getFechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(1);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

const getFechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(23, 59, 59, 999);

    return fecha;
};

const frmFiltrosInit = () => ({
    empresa: '',

    tipo: 1,

    estadoSat: '',

    estadoConciliacion: '',

    rfcContraparte: '',

    fechaInicial: getFechaInicialDefault(),

    fechaFinal: getFechaFinalDefault()
});

const resumenInit = () => ({
    totalFacturado: '0',

    totalNotasCredito: '0',

    totalNeto: '0',

    totalPagado: '0',

    totalSaldo: '0',

    conciliadas: 0,

    parciales: 0,

    sinPago: 0,

    canceladas: 0,

    sustituidas: 0,

    conDiferencia: 0
});

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ============================================================
    // VARIABLES
    // ============================================================

    const fechaActual = new Date();

    const frmFiltros = reactive(frmFiltrosInit());

    const resumen = reactive(resumenInit());

    const catCompaniasSat = ref([]);

    const catConciliacion = ref([]);

    const expandedRows = ref({});

    const ctrlBuscar = ref('');

    const consultaRealizada = ref(false);

    const cargando = ref(false);

    // ============================================================
    // CATALOGOS
    // ============================================================

    const catTipo = [
        {
            id: 1,

            description: 'Emitidos'
        },

        {
            id: 2,

            description: 'Recibidos'
        }
    ];

    const catEstadoSat = [
        {
            id: 'Vigente',

            description: 'Vigente'
        },

        {
            id: 'Cancelado',

            description: 'Cancelado'
        }
    ];

    const catEstadoConciliacion = [
        {
            id: 'Conciliada',

            description: 'Conciliada'
        },

        {
            id: 'Parcial',

            description: 'Parcial'
        },

        {
            id: 'Sin pago',

            description: 'Sin pago'
        },

        {
            id: 'Cancelada',

            description: 'Cancelada'
        },

        {
            id: 'Sustituida',

            description: 'Sustituida'
        },

        {
            id: 'Con diferencia',

            description: 'Con diferencia'
        }
    ];

    // ============================================================
    // VALIDACION BOTON
    // ============================================================

    const botonConsultarDeshabilitado = computed(() => {
        if (!frmFiltros.empresa) {
            return true;
        }

        if (!frmFiltros.tipo) {
            return true;
        }

        if (!frmFiltros.fechaInicial || !frmFiltros.fechaFinal) {
            return true;
        }

        const inicial = new Date(frmFiltros.fechaInicial);

        const final = new Date(frmFiltros.fechaFinal);

        if (final < inicial) {
            return true;
        }

        return false;
    });

    // ============================================================
    // BUSQUEDA
    // ============================================================

    const catConciliacionFiltrada = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catConciliacion.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catConciliacion.value.filter((item) => {
            const valores = [item.estadoConciliacion, item.estadoSat, item.uuidFactura, item.serie, item.folio, item.rfcEmisor, item.nombreEmisor, item.rfcReceptor, item.nombreReceptor, item.metodoPago, item.moneda, ...(item.banderas || [])];

            return valores.filter(Boolean).join(' ').toLowerCase().includes(buscar);
        });
    });

    // ============================================================
    // CARGAR EMPRESAS
    // ============================================================

    const handleCargarCompaniasSat = async () => {
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/operacion_sat/companias_descarga_cfdi_sat'
            });

            if (res.estatus === 200) {
                catCompaniasSat.value = res.datos?.companias ?? [];
            } else {
                catCompaniasSat.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res.mensaje || 'No fue posible consultar empresas.',

                    life: 3500
                });
            }
        } catch (error) {
            console.error('Error empresas:', error);

            catCompaniasSat.value = [];
        }
    };

    // ============================================================
    // RFC
    // ============================================================

    const handleRFC = () => {
        frmFiltros.rfcContraparte = String(frmFiltros.rfcContraparte || '')
            .toUpperCase()
            .replace(/[^A-Z0-9Ñ&]/g, '');
    };

    // ============================================================
    // FECHA PARA API
    // ============================================================

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (numero) => String(numero).padStart(2, '0');

        return `${fecha.getFullYear()}-` + `${pad(fecha.getMonth() + 1)}-` + `${pad(fecha.getDate())}`;
    };

    // ============================================================
    // CONSULTAR
    // ============================================================

    const handleConsultar = async () => {
        if (botonConsultarDeshabilitado.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Complete correctamente los filtros.',

                life: 3000
            });

            return;
        }

        cargando.value = true;

        expandedRows.value = {};

        try {
            const payload = {
                rfc: frmFiltros.empresa,

                tipo: frmFiltros.tipo,

                estadoSat: frmFiltros.estadoSat || '',

                estadoConciliacion: frmFiltros.estadoConciliacion || '',

                rfcContraparte: frmFiltros.rfcContraparte || '',

                fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

                fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
            };

            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/reportes_cfdi/conciliacion',

                datosJson: payload
            });

            if (res.estatus !== 200) {
                catConciliacion.value = [];

                Object.assign(resumen, resumenInit());

                consultaRealizada.value = true;

                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res.mensaje || 'Error al consultar conciliación.',

                    life: 3500
                });

                return;
            }

            catConciliacion.value = res.datos?.conciliacion ?? [];

            Object.assign(resumen, resumenInit(), res.datos?.resumen ?? {});

            consultaRealizada.value = true;

            toast.add({
                severity: 'success',

                summary: 'Notificación',

                detail: res.mensaje || 'Consulta realizada correctamente.',

                life: 2500
            });
        } catch (error) {
            console.error('Error conciliación:', error);

            catConciliacion.value = [];

            Object.assign(resumen, resumenInit());

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al consultar la conciliación.',

                life: 3500
            });
        } finally {
            cargando.value = false;
        }
    };

    // ============================================================
    // LIMPIAR
    // ============================================================

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        Object.assign(resumen, resumenInit());

        catConciliacion.value = [];

        ctrlBuscar.value = '';

        expandedRows.value = {};

        consultaRealizada.value = false;
    };

    // ============================================================
    // EXPANDIR TODO
    // ============================================================

    const handleExpandirTodo = () => {
        const rows = {};

        catConciliacionFiltrada.value.forEach((item) => {
            rows[item.uuidFactura] = true;
        });

        expandedRows.value = rows;
    };

    // ============================================================
    // CONTRAER TODO
    // ============================================================

    const handleContraerTodo = () => {
        expandedRows.value = {};
    };

    // ============================================================
    // FORMATO MONEDA
    // ============================================================

    const handleFormatMX = (value) => {
        const numero = Number(value || 0);

        return numero.toLocaleString('es-MX', {
            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        });
    };

    // ============================================================
    // FORMATO FECHA
    // ============================================================

    const handleFormatFecha = (value) => {
        if (!value) {
            return '';
        }

        return String(value).replace('T', ' ').substring(0, 19);
    };

    // ============================================================
    // SEVERIDAD SAT
    // ============================================================

    const handleSeverityEstadoSAT = (estado) => {
        const valor = String(estado || '').toLowerCase();

        if (valor === 'vigente') {
            return 'success';
        }

        if (valor === 'cancelado') {
            return 'danger';
        }

        return 'secondary';
    };

    // ============================================================
    // SEVERIDAD CONCILIACION
    // ============================================================

    const handleSeverityConciliacion = (estado) => {
        switch (String(estado || '').toLowerCase()) {
            case 'conciliada':
                return 'success';

            case 'parcial':
                return 'warn';

            case 'sin pago':
                return 'secondary';

            case 'cancelada':
                return 'danger';

            case 'sustituida':
                return 'info';

            case 'con diferencia':
                return 'danger';

            default:
                return 'secondary';
        }
    };

    // ============================================================
    // CLASE SALDO
    // ============================================================

    const handleClaseSaldo = (saldo) => {
        const numero = Number(saldo || 0);

        if (numero <= 0.01) {
            return 'saldo-cero';
        }

        return 'saldo-pendiente';
    };

    // ============================================================
    // EXPORTAR EXCEL
    // ============================================================

    const handleExportarExcel = () => {
        if (!catConciliacionFiltrada.value.length) {
            return;
        }

        const data = catConciliacionFiltrada.value.map((item) => ({
            'Estado Conciliación': item.estadoConciliacion,

            'Estado SAT': item.estadoSat,

            Serie: item.serie,

            Folio: item.folio,

            'UUID Factura': item.uuidFactura,

            'Fecha Factura': item.fechaFactura,

            'Fecha Timbrado': item.fechaTimbrado,

            'RFC Emisor': item.rfcEmisor,

            'Nombre Emisor': item.nombreEmisor,

            'RFC Receptor': item.rfcReceptor,

            'Nombre Receptor': item.nombreReceptor,

            'Método Pago': item.metodoPago,

            'Forma Pago': item.formaPago,

            Moneda: item.moneda,

            'Total Factura': Number(item.totalFactura || 0),

            'Notas Crédito': Number(item.totalNotasCredito || 0),

            'Total Neto': Number(item.totalNeto || 0),

            'Total Pagado': Number(item.totalPagado || 0),

            Saldo: Number(item.saldo || 0),

            'Número Pagos': item.numeroPagos,

            'Última Parcialidad': item.ultimaParcialidad,

            'Saldo Último Complemento': Number(item.saldoUltimoComplemento || 0),

            Diferencia: Number(item.diferencia || 0),

            Alertas: (item.banderas || []).join(', '),

            'Notas Relacionadas': (item.notasCredito || []).length,

            Sustituciones: (item.sustituciones || []).length,

            'Relaciones CFDI': (item.relaciones || []).length
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Conciliacion');

        XLSX.writeFile(workbook, `${frmFiltros.empresa}_Conciliacion_${formatFechaLocal(frmFiltros.fechaInicial)}_${formatFechaLocal(frmFiltros.fechaFinal)}.xlsx`);
    };

    // ============================================================
    // INIT
    // ============================================================

    onMounted(async () => {
        await handleCargarCompaniasSat();
    });

    return {
        // VARIABLES

        fechaActual,

        frmFiltros,

        resumen,

        catCompaniasSat,

        catConciliacion,

        catConciliacionFiltrada,

        expandedRows,

        ctrlBuscar,

        consultaRealizada,

        cargando,

        // CATALOGOS

        catTipo,

        catEstadoSat,

        catEstadoConciliacion,

        // COMPUTED

        botonConsultarDeshabilitado,

        // METODOS

        handleRFC,

        handleConsultar,

        handleCancelar,

        handleExpandirTodo,

        handleContraerTodo,

        handleFormatMX,

        handleFormatFecha,

        handleSeverityEstadoSAT,

        handleSeverityConciliacion,

        handleClaseSaldo,

        handleExportarExcel
    };
};

export default useProceso;
