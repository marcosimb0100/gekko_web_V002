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

        // ============================================================
        // LIBRO
        // ============================================================

        const workbook = XLSX.utils.book_new();

        // ============================================================
        // 1. RESUMEN
        // ============================================================

        const datosResumen = [
            {
                Concepto: 'Total facturado',

                Importe: Number(resumen.totalFacturado || 0)
            },

            {
                Concepto: 'Notas de crédito',

                Importe: Number(resumen.totalNotasCredito || 0)
            },

            {
                Concepto: 'Total neto',

                Importe: Number(resumen.totalNeto || 0)
            },

            {
                Concepto: 'Total pagado',

                Importe: Number(resumen.totalPagado || 0)
            },

            {
                Concepto: 'Saldo pendiente',

                Importe: Number(resumen.totalSaldo || 0)
            },

            {
                Concepto: 'Facturas conciliadas',

                Importe: Number(resumen.conciliadas || 0)
            },

            {
                Concepto: 'Facturas parciales',

                Importe: Number(resumen.parciales || 0)
            },

            {
                Concepto: 'Facturas sin pago',

                Importe: Number(resumen.sinPago || 0)
            },

            {
                Concepto: 'Facturas canceladas',

                Importe: Number(resumen.canceladas || 0)
            },

            {
                Concepto: 'Facturas sustituidas',

                Importe: Number(resumen.sustituidas || 0)
            },

            {
                Concepto: 'Con diferencia',

                Importe: Number(resumen.conDiferencia || 0)
            }
        ];

        const wsResumen = XLSX.utils.json_to_sheet(datosResumen);

        wsResumen['!cols'] = [
            {
                wch: 30
            },

            {
                wch: 20
            }
        ];

        XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

        // ============================================================
        // 2. ESTADO DE CUENTA
        // ============================================================

        const movimientos = [];

        catConciliacionFiltrada.value.forEach((factura) => {
            let saldoMovimiento = Number(factura.totalFactura || 0);

            // ====================================================
            // FACTURA
            // ====================================================

            movimientos.push({
                'UUID Factura': factura.uuidFactura,

                'Serie Factura': factura.serie,

                'Folio Factura': factura.folio,

                'RFC Receptor': factura.rfcReceptor,

                'Nombre Receptor': factura.nombreReceptor,

                'Fecha Movimiento': factura.fechaFactura,

                'Tipo Movimiento': 'FACTURA',

                'Serie/Folio Movimiento': [factura.serie, factura.folio].filter(Boolean).join('-'),

                'UUID Movimiento': factura.uuidFactura,

                Concepto: 'Factura',

                Parcialidad: '',

                Cargo: Number(factura.totalFactura || 0),

                Abono: 0,

                Saldo: saldoMovimiento,

                'Estado SAT': factura.estadoSat,

                'Estado Conciliación': factura.estadoConciliacion,

                'Tipo Relación': '',

                Aplica: 'Sí'
            });

            // ====================================================
            // CREAR LISTA DE MOVIMIENTOS DE NOTAS Y PAGOS
            // PARA ORDENAR POR FECHA
            // ====================================================

            const detalleMovimientos = [];

            // ====================================================
            // NOTAS DE CREDITO
            // ====================================================

            (factura.notasCredito || []).forEach((nota) => {
                detalleMovimientos.push({
                    tipo: 'NOTA DE CRÉDITO',

                    fecha: nota.fecha,

                    uuid: nota.uuid,

                    serie: nota.serie,

                    folio: nota.folio,

                    concepto: 'Nota de crédito',

                    parcialidad: '',

                    importe: Number(nota.total || 0),

                    estadoSat: nota.estadoSat,

                    tipoRelacion: nota.tipoRelacion,

                    aplica: Boolean(nota.aplicaConciliacion)
                });
            });

            // ====================================================
            // PAGOS
            // ====================================================

            (factura.pagos || []).forEach((pago) => {
                detalleMovimientos.push({
                    tipo: 'PAGO',

                    fecha: pago.fechaPago || pago.fechaEmision,

                    uuid: pago.uuidPago,

                    serie: pago.serie,

                    folio: pago.folio,

                    concepto: 'Complemento de pago',

                    parcialidad: pago.numParcialidad,

                    importe: Number(pago.impPagado || 0),

                    estadoSat: pago.estadoSat,

                    tipoRelacion: '',

                    aplica: Boolean(pago.aplicaConciliacion)
                });
            });

            // ====================================================
            // ORDEN CRONOLOGICO
            // ====================================================

            detalleMovimientos.sort((a, b) => {
                const fechaA = new Date(a.fecha || 0);

                const fechaB = new Date(b.fecha || 0);

                return fechaA - fechaB;
            });

            // ====================================================
            // GENERAR MOVIMIENTOS
            // ====================================================

            detalleMovimientos.forEach((movimiento) => {
                let abono = 0;

                if (movimiento.aplica) {
                    abono = movimiento.importe;

                    saldoMovimiento -= abono;

                    if (saldoMovimiento < 0) {
                        saldoMovimiento = 0;
                    }
                }

                movimientos.push({
                    'UUID Factura': factura.uuidFactura,

                    'Serie Factura': factura.serie,

                    'Folio Factura': factura.folio,

                    'RFC Receptor': factura.rfcReceptor,

                    'Nombre Receptor': factura.nombreReceptor,

                    'Fecha Movimiento': movimiento.fecha,

                    'Tipo Movimiento': movimiento.tipo,

                    'Serie/Folio Movimiento': [movimiento.serie, movimiento.folio].filter(Boolean).join('-'),

                    'UUID Movimiento': movimiento.uuid,

                    Concepto: movimiento.concepto,

                    Parcialidad: movimiento.parcialidad,

                    Cargo: 0,

                    Abono: abono,

                    Saldo: saldoMovimiento,

                    'Estado SAT': movimiento.estadoSat,

                    'Estado Conciliación': factura.estadoConciliacion,

                    'Tipo Relación': movimiento.tipoRelacion,

                    Aplica: movimiento.aplica ? 'Sí' : 'No'
                });
            });

            // ====================================================
            // SEPARADOR VISUAL
            // ====================================================

            movimientos.push({
                'UUID Factura': '',

                'Serie Factura': '',

                'Folio Factura': '',

                'RFC Receptor': '',

                'Nombre Receptor': '',

                'Fecha Movimiento': '',

                'Tipo Movimiento': '',

                'Serie/Folio Movimiento': '',

                'UUID Movimiento': '',

                Concepto: 'SALDO FINAL',

                Parcialidad: '',

                Cargo: 0,

                Abono: 0,

                Saldo: Number(factura.saldo || 0),

                'Estado SAT': '',

                'Estado Conciliación': factura.estadoConciliacion,

                'Tipo Relación': '',

                Aplica: ''
            });
        });

        const wsEstadoCuenta = XLSX.utils.json_to_sheet(movimientos);

        wsEstadoCuenta['!cols'] = [
            {
                wch: 38
            },

            {
                wch: 12
            },

            {
                wch: 12
            },

            {
                wch: 16
            },

            {
                wch: 35
            },

            {
                wch: 20
            },

            {
                wch: 20
            },

            {
                wch: 20
            },

            {
                wch: 38
            },

            {
                wch: 24
            },

            {
                wch: 12
            },

            {
                wch: 16
            },

            {
                wch: 16
            },

            {
                wch: 16
            },

            {
                wch: 16
            },

            {
                wch: 20
            },

            {
                wch: 15
            },

            {
                wch: 10
            }
        ];

        XLSX.utils.book_append_sheet(workbook, wsEstadoCuenta, 'Estado de Cuenta');

        // ============================================================
        // 3. PAGOS
        // ============================================================

        const pagos = [];

        catConciliacionFiltrada.value.forEach((factura) => {
            (factura.pagos || []).forEach((pago) => {
                pagos.push({
                    'UUID Factura': factura.uuidFactura,

                    'Serie Factura': factura.serie,

                    'Folio Factura': factura.folio,

                    'RFC Receptor': factura.rfcReceptor,

                    'Nombre Receptor': factura.nombreReceptor,

                    'UUID Pago': pago.uuidPago,

                    'Serie Pago': pago.serie,

                    'Folio Pago': pago.folio,

                    'Fecha Emisión': pago.fechaEmision,

                    'Fecha Pago': pago.fechaPago,

                    'Forma Pago': pago.formaDePagoP,

                    'Moneda Pago': pago.monedaP,

                    Parcialidad: pago.numParcialidad,

                    'Saldo Anterior': Number(pago.impSaldoAnt || 0),

                    'Importe Pagado': Number(pago.impPagado || 0),

                    'Saldo Insoluto': Number(pago.impSaldoInsoluto || 0),

                    'Monto Complemento': Number(pago.montoPago || 0),

                    'Estado SAT': pago.estadoSat,

                    'Aplica Conciliación': pago.aplicaConciliacion ? 'Sí' : 'No'
                });
            });
        });

        const wsPagos = XLSX.utils.json_to_sheet(pagos);

        XLSX.utils.book_append_sheet(workbook, wsPagos, 'Pagos');

        // ============================================================
        // 4. NOTAS DE CREDITO
        // ============================================================

        const notas = [];

        catConciliacionFiltrada.value.forEach((factura) => {
            (factura.notasCredito || []).forEach((nota) => {
                notas.push({
                    'UUID Factura': factura.uuidFactura,

                    'Serie Factura': factura.serie,

                    'Folio Factura': factura.folio,

                    'RFC Receptor': factura.rfcReceptor,

                    'Nombre Receptor': factura.nombreReceptor,

                    'UUID Nota': nota.uuid,

                    'Serie Nota': nota.serie,

                    'Folio Nota': nota.folio,

                    Fecha: nota.fecha,

                    'Tipo Relación': nota.tipoRelacion,

                    Moneda: nota.moneda,

                    'Total Nota': Number(nota.total || 0),

                    'Estado SAT': nota.estadoSat,

                    'Aplica Conciliación': nota.aplicaConciliacion ? 'Sí' : 'No'
                });
            });
        });

        const wsNotas = XLSX.utils.json_to_sheet(notas);

        XLSX.utils.book_append_sheet(workbook, wsNotas, 'Notas Credito');

        // ============================================================
        // 5. SUSTITUCIONES
        // ============================================================

        const sustituciones = [];

        catConciliacionFiltrada.value.forEach((factura) => {
            (factura.sustituciones || []).forEach((sustitucion) => {
                sustituciones.push({
                    'UUID Factura Original': factura.uuidFactura,

                    'Serie Original': factura.serie,

                    'Folio Original': factura.folio,

                    'UUID Sustituto': sustitucion.uuid,

                    'Serie Sustituto': sustitucion.serie,

                    'Folio Sustituto': sustitucion.folio,

                    'Fecha Sustituto': sustitucion.fecha,

                    Total: Number(sustitucion.total || 0),

                    'Estado SAT': sustitucion.estadoSat,

                    'Tipo Relación': sustitucion.tipoRelacion
                });
            });
        });

        const wsSustituciones = XLSX.utils.json_to_sheet(sustituciones);

        XLSX.utils.book_append_sheet(workbook, wsSustituciones, 'Sustituciones');

        // ============================================================
        // 6. RELACIONES
        // ============================================================

        const relaciones = [];

        catConciliacionFiltrada.value.forEach((factura) => {
            (factura.relaciones || []).forEach((relacion) => {
                relaciones.push({
                    'UUID Factura': factura.uuidFactura,

                    Serie: factura.serie,

                    Folio: factura.folio,

                    'Tipo Relación': relacion.tipoRelacion,

                    'UUID Origen': relacion.uuid,

                    'UUID Relacionado': relacion.uuidRelacionado
                });
            });
        });

        const wsRelaciones = XLSX.utils.json_to_sheet(relaciones);

        XLSX.utils.book_append_sheet(workbook, wsRelaciones, 'Relaciones CFDI');

        // ============================================================
        // GUARDAR
        // ============================================================

        XLSX.writeFile(workbook, `${frmFiltros.empresa}_Conciliacion_EstadoCuenta_${formatFechaLocal(frmFiltros.fechaInicial)}_${formatFechaLocal(frmFiltros.fechaFinal)}.xlsx`);
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
