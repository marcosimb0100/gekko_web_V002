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

    const catFacturas = ref([]);

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

    const fechaInicialValida = computed(() => {
        if (!frmFiltros.fechaInicial) {
            return false;
        }

        const fecha = new Date(frmFiltros.fechaInicial);

        const hoy = new Date();

        fecha.setHours(0, 0, 0, 0);

        hoy.setHours(0, 0, 0, 0);

        return fecha <= hoy;
    });

    const fechaFinalValida = computed(() => {
        if (!frmFiltros.fechaFinal) {
            return false;
        }

        const final = new Date(frmFiltros.fechaFinal);

        const inicial = new Date(frmFiltros.fechaInicial);

        const hoy = new Date();

        final.setHours(0, 0, 0, 0);

        inicial.setHours(0, 0, 0, 0);

        hoy.setHours(0, 0, 0, 0);

        if (final > hoy) {
            return false;
        }

        if (final < inicial) {
            return false;
        }

        return true;
    });

    const botonConsultarDeshabilitado = computed(() => {
        if (!frmFiltros.empresa) {
            return true;
        }

        if (!frmFiltros.tipo) {
            return true;
        }

        if (!fechaInicialValida.value) {
            return true;
        }

        if (!fechaFinalValida.value) {
            return true;
        }

        return false;
    });

    // ============================================================
    // BUSCADOR
    // ============================================================

    const catFacturasFiltradas = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catFacturas.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catFacturas.value.filter((item) => {
            return [item.uuid, item.uuidRelacion, item.rfcEmisor, item.nombreEmisor, item.rfcReceptor, item.nombreReceptor, item.serie, item.folio, item.estadoSat, item.metodoDePago, item.formaDePago]
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

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });
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

            estadoSat: frmFiltros.estadoSat || '',

            rfcContraparte: frmFiltros.rfcContraparte || '',

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: '/reportes_cfdi/facturas',

            datosJson: payload
        });

        if (res.estatus !== 200) {
            catFacturas.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });

            return;
        }

        catFacturas.value = res.datos?.facturas ?? [];

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

        catFacturas.value = [];

        ctrlBuscar.value = '';
    };

    // ============================================================
    // MONEDA
    // ============================================================

    const handleFormatMX = (value) => {
        const numero = Number(value || 0);

        return numero.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // ============================================================
    // FECHA
    // ============================================================

    const handleFormatFecha = (value) => {
        if (!value) {
            return '';
        }

        const texto = String(value);

        return texto.replace('T', ' ').substring(0, 19);
    };

    // ============================================================
    // ESTADO SAT
    // ============================================================

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

        // La fila 0 contiene encabezados.
        // Los datos empiezan en la fila 1.
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
        if (!catFacturasFiltradas.value.length) {
            return;
        }

        // ============================================================
        // DATA
        // ============================================================

        const data = catFacturasFiltradas.value.map((item) => ({
            'Estado SAT': item.estadoSat,

            Version: item.version,

            Tipo: item.tipo,

            'Fecha Emision': item.fechaEmision,

            'Fecha Timbrado': item.fechaTimbrado,

            EstadoPago: item.estadoPago,

            FechaPago: item.fechaPago,

            Serie: item.serie,

            Folio: item.folio,

            UUID: item.uuid,

            'UUID Relacion': item.uuidRelacion,

            'RFC Emisor': item.rfcEmisor,

            'Nombre Emisor': item.nombreEmisor,

            LugarDeExpedicion: item.lugarDeExpedicion,

            'RFC Receptor': item.rfcReceptor,

            'Nombre Receptor': item.nombreReceptor,

            ResidenciaFiscal: item.residenciaFiscal,

            NumRegIdTrib: item.numRegIdTrib,

            UsoCFDI: item.usoCFDI,

            // ==================================================
            // IMPORTES
            // ==================================================

            SubTotal: Number(item.subTotal || 0),

            Descuento: Number(item.descuento || 0),

            'Total IEPS': Number(item.totalIEPS || 0),

            'IVA 16%': Number(item.iva16 || 0),

            'Retenido IVA': Number(item.retenidoIVA || 0),

            'Retenido ISR': Number(item.retenidoISR || 0),

            ISH: Number(item.ish || 0),

            Total: Number(item.total || 0),

            'Total Original': Number(item.totalOriginal || 0),

            'Total Trasladados': Number(item.totalTrasladados || 0),

            'Total Retenidos': Number(item.totalRetenidos || 0),

            'Total Local Trasladado': Number(item.totalLocalTrasladado || 0),

            'Total Local Retenido': Number(item.totalLocalRetenido || 0),

            // ==================================================
            // DATOS CFDI
            // ==================================================

            Complemento: item.complemento,

            Moneda: item.moneda,

            'Tipo De Cambio': item.tipoDeCambio,

            FormaDePago: item.formaDePago,

            'Metodo de Pago': item.metodoDePago,

            NumCtaPago: item.numCtaPago,

            'Condicion de Pago': item.condicionDePago,

            Conceptos: item.conceptos,

            Combustible: item.combustible,

            // ==================================================
            // IEPS
            // ==================================================

            'IEPS 3%': Number(item.ieps3 || 0),

            'IEPS 6%': Number(item.ieps6 || 0),

            'IEPS 7%': Number(item.ieps7 || 0),

            'IEPS 8%': Number(item.ieps8 || 0),

            'IEPS 9%': Number(item.ieps9 || 0),

            'IEPS 26.5%': Number(item.ieps26_5 || 0),

            'IEPS 30%': Number(item.ieps30 || 0),

            'IEPS 53%': Number(item.ieps53 || 0),

            'IEPS 160%': Number(item.ieps160 || 0),

            // ==================================================
            // XML / DIRECCIONES
            // ==================================================

            'Archivo XML': item.archivoXML,

            'Direccion Emisor': item.direccionEmisor,

            'Localidad Emisor': item.localidadEmisor,

            'Direccion Receptor': item.direccionReceptor,

            'Localidad Receptor': item.localidadReceptor,

            // ==================================================
            // IMPUESTOS ADICIONALES
            // ==================================================

            'IVA 8%': Number(item.iva8 || 0),

            'IEPS 30.4%': Number(item.ieps30_4 || 0),

            'IVA Ret 6%': Number(item.ivaRet6 || 0),

            // ==================================================
            // RECEPTOR
            // ==================================================

            RegimenFiscalReceptor: item.regimenFiscalReceptor,

            DomicilioFiscalReceptor: item.domicilioFiscalReceptor
        }));

        // ============================================================
        // CREAR HOJA
        // ============================================================

        const worksheet = XLSX.utils.json_to_sheet(data);

        // ============================================================
        // ANCHO DE COLUMNAS
        // ============================================================

        worksheet['!cols'] = [
            // Estado SAT
            {
                wch: 14
            },

            // Version
            {
                wch: 10
            },

            // Tipo
            {
                wch: 14
            },

            // Fecha Emision
            {
                wch: 20
            },

            // Fecha Timbrado
            {
                wch: 20
            },

            // EstadoPago
            {
                wch: 15
            },

            // FechaPago
            {
                wch: 20
            },

            // Serie
            {
                wch: 10
            },

            // Folio
            {
                wch: 12
            },

            // UUID
            {
                wch: 38
            },

            // UUID relacion
            {
                wch: 38
            },

            // RFC Emisor
            {
                wch: 16
            },

            // Nombre Emisor
            {
                wch: 35
            },

            // Lugar expedicion
            {
                wch: 18
            },

            // RFC Receptor
            {
                wch: 16
            },

            // Nombre Receptor
            {
                wch: 35
            },

            // ResidenciaFiscal
            {
                wch: 18
            },

            // NumRegIdTrib
            {
                wch: 18
            },

            // Uso CFDI
            {
                wch: 12
            },

            // Subtotal
            {
                wch: 18
            },

            // Descuento
            {
                wch: 18
            },

            // Total IEPS
            {
                wch: 18
            },

            // IVA 16
            {
                wch: 18
            },

            // Retenido IVA
            {
                wch: 18
            },

            // Retenido ISR
            {
                wch: 18
            },

            // ISH
            {
                wch: 18
            },

            // Total
            {
                wch: 18
            },

            // Total Original
            {
                wch: 18
            },

            // Total Trasladados
            {
                wch: 18
            },

            // Total Retenidos
            {
                wch: 18
            },

            // Total Local Trasladado
            {
                wch: 20
            },

            // Total Local Retenido
            {
                wch: 20
            }
        ];

        // ============================================================
        // FORMATO MONEDA
        //
        // Los índices empiezan en 0.
        //
        // T  = SubTotal                19
        // U  = Descuento               20
        // V  = Total IEPS              21
        // W  = IVA 16%                 22
        // X  = Retenido IVA            23
        // Y  = Retenido ISR            24
        // Z  = ISH                     25
        // AA = Total                   26
        // AB = Total Original          27
        // AC = Total Trasladados       28
        // AD = Total Retenidos         29
        // AE = Total Local Trasladado  30
        // AF = Total Local Retenido    31
        //
        // AP = IEPS 3%                 41
        // AQ = IEPS 6%                 42
        // AR = IEPS 7%                 43
        // AS = IEPS 8%                 44
        // AT = IEPS 9%                 45
        // AU = IEPS 26.5%              46
        // AV = IEPS 30%                47
        // AW = IEPS 53%                48
        // AX = IEPS 160%               49
        //
        // BD = IVA 8%                  55
        // BE = IEPS 30.4%              56
        // BF = IVA Ret 6%              57
        // ============================================================

        aplicarFormatoMoneda(
            worksheet,
            [
                19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,

                41, 42, 43, 44, 45, 46, 47, 48, 49,

                55, 56, 57
            ]
        );

        // ============================================================
        // LIBRO
        // ============================================================

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

        // ============================================================
        // GUARDAR
        // ============================================================

        XLSX.writeFile(workbook, `${frmFiltros.empresa}_Facturas_${formatFechaLocal(frmFiltros.fechaInicial)}_${formatFechaLocal(frmFiltros.fechaFinal)}.xlsx`);
    };

    // ============================================================
    // INICIO
    // ============================================================

    onMounted(async () => {
        await handleCargarCompaniasSat();
    });

    return {
        fechaActual,

        frmFiltros,

        catCompaniasSat,

        catFacturas,

        catFacturasFiltradas,

        catTipo,

        catEstadoSat,

        ctrlBuscar,

        fechaInicialValida,

        fechaFinalValida,

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
