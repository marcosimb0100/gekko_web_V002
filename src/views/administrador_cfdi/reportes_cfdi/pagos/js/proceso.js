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

    filtrarPor: 'emision',

    estadoSat: '',

    rfcContraparte: '',

    fechaInicial: getFechaInicialDefault(),

    fechaFinal: getFechaFinalDefault()
});

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    const fechaActual = new Date();

    const frmFiltros = reactive(frmFiltrosInit());

    const catCompaniasSat = ref([]);

    const catPagos = ref([]);

    const ctrlBuscar = ref('');

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

    const catFiltrarPor = [
        {
            id: 'emision',
            description: 'Fecha emisión'
        },

        {
            id: 'pago',
            description: 'Fecha pago'
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

    // ============================================================
    // VALIDACIONES
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

        if (frmFiltros.fechaFinal < frmFiltros.fechaInicial) {
            return true;
        }

        return false;
    });

    // ============================================================
    // BUSQUEDA
    // ============================================================

    const catPagosFiltrados = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catPagos.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catPagos.value.filter((item) => {
            return [item.uuid, item.uuidRel, item.rfcEmisor, item.nombreEmisor, item.rfcReceptor, item.nombreReceptor, item.serie, item.folio, item.numOperacion, item.cuentaOrigen, item.cuentaDestino]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(buscar);
        });
    });

    // ============================================================
    // EMPRESAS
    // ============================================================

    const handleCargarCompaniasSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: '/operacion_sat/companias_descarga_cfdi_sat'
        });

        if (res.estatus === 200) {
            catCompaniasSat.value = res.datos?.companias ?? [];
        } else {
            catCompaniasSat.value = [];
        }
    };

    // ============================================================
    // FECHA API
    // ============================================================

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (n) => String(n).padStart(2, '0');

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

        const payload = {
            rfc: frmFiltros.empresa,

            tipo: frmFiltros.tipo,

            filtrarPor: frmFiltros.filtrarPor,

            estadoSat: frmFiltros.estadoSat || '',

            rfcContraparte: frmFiltros.rfcContraparte || '',

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: '/reportes_cfdi/pagos',

            datosJson: payload
        });

        if (res.estatus !== 200) {
            catPagos.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });

            return;
        }

        catPagos.value = res.datos?.pagos ?? [];

        toast.add({
            severity: 'success',

            summary: 'Notificación',

            detail: res.mensaje,

            life: 3000
        });
    };

    // ============================================================
    // LIMPIAR
    // ============================================================

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        catPagos.value = [];

        ctrlBuscar.value = '';
    };

    // ============================================================
    // FORMATO
    // ============================================================

    const handleFormatMX = (value) => {
        return Number(value || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleFormatFecha = (value) => {
        if (!value) {
            return '';
        }

        return String(value).replace('T', ' ').substring(0, 19);
    };

    const handleSeverityEstado = (estado) => {
        if (String(estado).toLowerCase() === 'vigente') {
            return 'success';
        }

        if (String(estado).toLowerCase() === 'cancelado') {
            return 'danger';
        }

        return 'secondary';
    };

    // ============================================================
    // APLICAR FORMATO MONEDA A COLUMNAS DE EXCEL
    // ============================================================

    const aplicarFormatoMoneda = (worksheet, columnas) => {
        if (!worksheet || !worksheet['!ref']) {
            return;
        }

        const rango = XLSX.utils.decode_range(worksheet['!ref']);

        for (let fila = 1; fila <= rango.e.r; fila++) {
            columnas.forEach((columna) => {
                const referencia = XLSX.utils.encode_cell({
                    r: fila,
                    c: columna
                });

                const celda = worksheet[referencia];

                if (!celda) {
                    return;
                }

                const numero = Number(celda.v);

                if (Number.isNaN(numero)) {
                    return;
                }

                celda.v = numero;

                celda.t = 'n';

                celda.z = '$#,##0.00';
            });
        }
    };

    // ============================================================
    // EXPORTAR EXCEL
    // ============================================================

    const handleExportarExcel = () => {
        if (!catPagosFiltrados.value.length) {
            return;
        }

        // ============================================================
        // DATA
        // ============================================================

        const data = catPagosFiltrados.value.map((item) => ({
            'Verificado ó Asoc.': item.verificadoAsoc,

            'Estado SAT': item.estadoSat,

            Version: item.version,

            TipoComprobante: item.tipoComprobante,

            'Fecha Emision': item.fechaEmision,

            Serie: item.serie,

            Folio: item.folio,

            UUID: item.uuid,

            'RFC Emisor': item.rfcEmisor,

            'Nombre Emisor': item.nombreEmisor,

            'RFC Receptor': item.rfcReceptor,

            'Nombre Receptor': item.nombreReceptor,

            UsoCFDI: item.usoCFDI,

            FechaPago: item.fechaPago,

            FormaDePagoP: item.formaDePagoP,

            MonedaP: item.monedaP,

            Monto: Number(item.monto || 0),

            UUIDRel: item.uuidRel,

            'Num Operacion': item.numOperacion,

            'Cuenta Destino': item.cuentaDestino,

            'Cuenta Origen': item.cuentaOrigen,

            RfcEmisorCtaDestino: item.rfcEmisorCtaDestino,

            RfcEmisorCtaOrigen: item.rfcEmisorCtaOrigen,

            NomBancoOrdExtranjero: item.nomBancoOrdExtranjero,

            TipoCadPago: item.tipoCadPago,

            CadPago: item.cadPago,

            Conceptos: item.conceptos,

            'Archivo XML': item.archivoXML,

            Total: Number(item.total || 0)
        }));

        // ============================================================
        // CREAR HOJA
        // ============================================================

        const worksheet = XLSX.utils.json_to_sheet(data);

        // ============================================================
        // ANCHO DE COLUMNAS
        // ============================================================

        worksheet['!cols'] = [
            {
                wch: 18
            },

            {
                wch: 14
            },

            {
                wch: 10
            },

            {
                wch: 16
            },

            {
                wch: 20
            },

            {
                wch: 10
            },

            {
                wch: 12
            },

            {
                wch: 38
            },

            {
                wch: 16
            },

            {
                wch: 35
            },

            {
                wch: 16
            },

            {
                wch: 35
            },

            {
                wch: 12
            },

            {
                wch: 20
            },

            {
                wch: 16
            },

            {
                wch: 12
            },

            {
                wch: 18
            },

            {
                wch: 38
            },

            {
                wch: 20
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
                wch: 22
            },

            {
                wch: 28
            },

            {
                wch: 16
            },

            {
                wch: 35
            },

            {
                wch: 40
            },

            {
                wch: 35
            },

            {
                wch: 18
            }
        ];

        // ============================================================
        // FORMATO MONEDA
        //
        // Los índices empiezan en 0.
        //
        // Q  = Monto -> índice 16
        // AC = Total -> índice 28
        // ============================================================

        aplicarFormatoMoneda(worksheet, [16, 28]);

        // ============================================================
        // LIBRO
        // ============================================================

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');

        // ============================================================
        // GUARDAR
        // ============================================================

        XLSX.writeFile(workbook, `${frmFiltros.empresa}_Pagos_${formatFechaLocal(frmFiltros.fechaInicial)}_${formatFechaLocal(frmFiltros.fechaFinal)}.xlsx`);
    };

    // ============================================================
    // INIT
    // ============================================================

    onMounted(async () => {
        await handleCargarCompaniasSat();
    });

    return {
        fechaActual,

        frmFiltros,

        catCompaniasSat,

        catPagos,

        catPagosFiltrados,

        catTipo,

        catFiltrarPor,

        catEstadoSat,

        ctrlBuscar,

        botonConsultarDeshabilitado,

        handleConsultar,

        handleCancelar,

        handleFormatMX,

        handleFormatFecha,

        handleSeverityEstado,

        handleExportarExcel
    };
};

export default useProceso;
