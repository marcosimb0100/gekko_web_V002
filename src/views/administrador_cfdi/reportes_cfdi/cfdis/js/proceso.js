import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
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
    tipoComprobante: ['I', 'E', 'P'],
    metodoPago: ['PUE', 'PPD'],
    fechaInicial: getFechaInicialDefault(),
    fechaFinal: getFechaFinalDefault()
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const fechaActual = new Date();

    const frmFiltros = reactive(frmFiltrosInit());

    const catCfdis = ref([]);
    const catCompaniasSat = ref([]);

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

    const catTiposComprobantes = [
        {
            id: 'I',
            description: 'Ingreso'
        },
        {
            id: 'E',
            description: 'Egreso'
        },
        {
            id: 'P',
            description: 'Pago'
        }
    ];

    const catMetodoPago = [
        {
            id: 'PUE',
            paymentMethod: 'PUE'
        },
        {
            id: 'PPD',
            paymentMethod: 'PPD'
        }
    ];

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const empresaValida = computed(() => {
        if (!frmFiltros.empresa) {
            return true;
        }

        return true;
    });

    const tipoComprobanteValido = computed(() => {
        return Array.isArray(frmFiltros.tipoComprobante) && frmFiltros.tipoComprobante.length > 0;
    });

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

        const fechaFinal = new Date(frmFiltros.fechaFinal);
        const fechaInicial = new Date(frmFiltros.fechaInicial);
        const hoy = new Date();

        fechaFinal.setHours(0, 0, 0, 0);
        fechaInicial.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);

        if (fechaFinal > hoy) {
            return false;
        }

        if (fechaFinal < fechaInicial) {
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

        if (!tipoComprobanteValido.value) {
            return true;
        }

        if (!frmFiltros.fechaInicial) {
            return true;
        }

        if (!frmFiltros.fechaFinal) {
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

    // -------------------------------------------------------------------------
    // FILTRADO LOCAL
    // -------------------------------------------------------------------------

    const catCfdisFiltrados = computed(() => {
        if (!ctrlBuscar.value.trim()) {
            return catCfdis.value;
        }

        const buscar = ctrlBuscar.value.trim().toLowerCase();

        return catCfdis.value.filter((item) => {
            return [item.uuid, item.emisorRfc, item.emisorNombre, item.receptorRfc, item.receptorNombre, item.serie, item.folio, item.tipoDeComprobante, item.metodoPago].filter(Boolean).join(' ').toLowerCase().includes(buscar);
        });
    });

    // -------------------------------------------------------------------------
    // CARGAR EMPRESAS
    // -------------------------------------------------------------------------

    const handleCargarCompaniasSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/operacion_sat/companias_descarga_cfdi_sat`
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

    // -------------------------------------------------------------------------
    // FORMATO FECHA
    // -------------------------------------------------------------------------

    const formatFechaLocal = (fecha, final = false) => {
        if (!fecha) {
            return null;
        }

        const nuevaFecha = new Date(fecha);

        if (final) {
            nuevaFecha.setHours(23, 59, 59, 999);
        } else {
            nuevaFecha.setHours(0, 0, 0, 0);
        }

        const pad = (n) => String(n).padStart(2, '0');

        const year = nuevaFecha.getFullYear();

        const month = pad(nuevaFecha.getMonth() + 1);

        const day = pad(nuevaFecha.getDate());

        const hours = pad(nuevaFecha.getHours());

        const minutes = pad(nuevaFecha.getMinutes());

        const seconds = pad(nuevaFecha.getSeconds());

        return `${year}-${month}-${day}T` + `${hours}:${minutes}:${seconds}`;
    };

    // -------------------------------------------------------------------------
    // CONSULTAR
    // -------------------------------------------------------------------------

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

            tipoComprobante: frmFiltros.tipoComprobante.join(','),

            metodoPago: frmFiltros.metodoPago.join(','),

            pago: frmFiltros.tipoComprobante.includes('P') ? 'Si' : 'No',

            fechaInicial: formatFechaLocal(frmFiltros.fechaInicial, false),

            fechaFinal: formatFechaLocal(frmFiltros.fechaFinal, true)
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/operacion_sat/cfdis`,

            datosJson: payload
        });

        if (res.estatus !== 200) {
            catCfdis.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        catCfdis.value = res.datos?.cfdis ?? [];

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });
    };

    // -------------------------------------------------------------------------
    // LIMPIAR
    // -------------------------------------------------------------------------

    const handleCancelar = () => {
        Object.assign(frmFiltros, frmFiltrosInit());

        catCfdis.value = [];

        ctrlBuscar.value = '';
    };

    // -------------------------------------------------------------------------
    // FORMATO MONEDA
    // -------------------------------------------------------------------------

    const handleFormatMX = (value) => {
        const numero = Number(value || 0);

        return numero.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // -------------------------------------------------------------------------
    // FORMATO FECHA TABLA
    // -------------------------------------------------------------------------

    const handleFormatFecha = (fecha) => {
        if (!fecha) {
            return '';
        }

        return String(fecha).substring(0, 10);
    };

    // -------------------------------------------------------------------------
    // DESCARGA XML
    // -------------------------------------------------------------------------

    const handleDescargaXml = async (rowData) => {
        if (!rowData?.uuid) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El CFDI no tiene UUID.',
                life: 3000
            });

            return;
        }

        const res = await store.dispatch('api/apiGetblob', {
            direccion: `/operacion_sat/cfdis/descargar_xml/${rowData.uuid}`
        });

        if (res.estatus !== 200 || !res.data) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje || 'No se pudo descargar el XML.',
                life: 3000
            });

            return;
        }

        const url = window.URL.createObjectURL(res.data);

        const a = document.createElement('a');

        a.href = url;

        a.download = `${rowData.uuid}.xml`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);
    };

    // -------------------------------------------------------------------------
    // EXPORTAR EXCEL
    // -------------------------------------------------------------------------

    const handleExportarExcel = () => {
        if (!catCfdisFiltrados.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Excel',
                detail: 'No existen CFDI para exportar.',
                life: 3000
            });

            return;
        }

        try {
            const datosExcel = catCfdisFiltrados.value.map((item) => ({
                UUID: item.uuid ?? '',

                Fecha: handleFormatFecha(item.fecha),

                Serie: item.serie ?? '',

                Folio: item.folio ?? '',

                'Tipo Comprobante': item.tipoDeComprobante ?? '',

                'Forma Pago': item.formaPago ?? '',

                'Método Pago': item.metodoPago ?? '',

                Moneda: item.moneda ?? '',

                'RFC Emisor': item.emisorRfc ?? '',

                'Nombre Emisor': item.emisorNombre ?? '',

                'RFC Receptor': item.receptorRfc ?? '',

                'Nombre Receptor': item.receptorNombre ?? '',

                Subtotal: Number(item.subTotal ?? 0),

                Descuento: Number(item.descuento ?? 0),

                'Impuestos Trasladados': Number(item.totalImpuestosTrasladados ?? 0),

                'Impuestos Retenidos': Number(item.totalImpuestosRetenidos ?? 0),

                Total: Number(item.total ?? 0),

                Estatus: Number(item.estatusCFDI) === 1 ? 'VIGENTE' : 'CANCELADO',

                'Fecha Timbrado': item.fechaTimbrado ?? ''
            }));

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            hoja['!cols'] = [
                { wch: 38 }, // UUID
                { wch: 14 }, // Fecha
                { wch: 10 }, // Serie
                { wch: 10 }, // Folio
                { wch: 18 }, // Tipo
                { wch: 15 }, // Forma
                { wch: 15 }, // Metodo
                { wch: 10 }, // Moneda
                { wch: 18 }, // RFC emisor
                { wch: 38 }, // emisor
                { wch: 18 }, // RFC receptor
                { wch: 38 }, // receptor
                { wch: 16 }, // subtotal
                { wch: 16 }, // descuento
                { wch: 20 }, // traslados
                { wch: 20 }, // retenciones
                { wch: 16 }, // total
                { wch: 14 }, // estatus
                { wch: 22 } // timbrado
            ];

            hoja['!autofilter'] = {
                ref: `A1:S${datosExcel.length + 1}`
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'CFDI');

            const fecha = new Date();

            const nombreArchivo = `CFDI_${frmFiltros.empresa}_` + `${fecha.getFullYear()}-` + `${String(fecha.getMonth() + 1).padStart(2, '0')}-` + `${String(fecha.getDate()).padStart(2, '0')}.xlsx`;

            XLSX.writeFile(libro, nombreArchivo);

            toast.add({
                severity: 'success',
                summary: 'Excel',
                detail: `${datosExcel.length} CFDI exportados correctamente.`,
                life: 3000
            });
        } catch (error) {
            console.error('EXPORTAR CFDI:', error);

            toast.add({
                severity: 'error',
                summary: 'Excel',
                detail: 'No fue posible generar el archivo Excel.',
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // INIT
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarCompaniasSat();
    };

    handleInit();

    return {
        frmFiltros,

        catCompaniasSat,

        catTipo,
        catTiposComprobantes,
        catMetodoPago,

        fechaActual,

        catCfdis,
        catCfdisFiltrados,

        ctrlBuscar,

        empresaValida,
        tipoComprobanteValido,
        fechaInicialValida,
        fechaFinalValida,

        botonConsultarDeshabilitado,

        handleConsultar,
        handleCancelar,

        handleFormatMX,
        handleFormatFecha,

        handleDescargaXml,
        handleExportarExcel
    };
};

export default useProceso;
