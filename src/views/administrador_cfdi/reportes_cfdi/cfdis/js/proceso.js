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

    // Cancelación: esta vista solo registra solicitudes en MongoDB.
    const modalCancelacion = ref(false);
    const cfdiSeleccionado = ref(null);
    const guardandoCancelacion = ref(false);
    const frmCancelacion = reactive({ motivo_sat: null, uuid_sustituto: '', observaciones: '' });
    const catMotivosCancelacion = [
        { value: '02', label: '02 - Comprobante emitido con errores sin relación' },
        { value: '03', label: '03 - No se llevó a cabo la operación' },
        { value: '04', label: '04 - Operación nominativa relacionada en factura global' }
    ];
    const uuidValido = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
    const normalizarUuid = (value) =>
        String(value || '')
            .trim()
            .toUpperCase();
    const solicitudesCancelacion = ref([]);
    const cancelacionesCargadas = ref(false);
    const cargandoCancelaciones = ref(false);
    // Evita que una consulta anterior sobrescriba los datos de otra empresa.
    let versionConsultaCancelaciones = 0;

    const tieneSolicitudActiva = (cfdi) => solicitudesCancelacion.value.some((solicitud) => normalizarUuid(solicitud.uuid) === normalizarUuid(cfdi?.uuid));

    const puedeSolicitarCancelacion = (cfdi) => frmFiltros.tipo === 1 && Number(cfdi?.estatusCFDI) === 1 && uuidValido(cfdi?.uuid) && normalizarUuid(cfdi?.emisorRfc) === normalizarUuid(frmFiltros.empresa);

    const cancelacionDeshabilitada = (cfdi) => !puedeSolicitarCancelacion(cfdi) || !cancelacionesCargadas.value || cargandoCancelaciones.value || guardandoCancelacion.value || tieneSolicitudActiva(cfdi);

    const mensajeBotonCancelacion = (cfdi) => {
        if (Number(cfdi?.estatusCFDI) !== 1) return 'CFDI cancelado';
        if (!puedeSolicitarCancelacion(cfdi)) return 'No disponible para este CFDI';
        if (!cancelacionesCargadas.value || cargandoCancelaciones.value) return 'Verificando solicitudes de cancelación';
        if (tieneSolicitudActiva(cfdi)) return 'Ya existe una solicitud de cancelación activa';
        if (guardandoCancelacion.value) return 'Registrando solicitud';
        return 'Solicitar cancelación SAT';
    };

    const invalidarCancelaciones = () => {
        versionConsultaCancelaciones += 1;
        cancelacionesCargadas.value = false;
        cargandoCancelaciones.value = false;
        solicitudesCancelacion.value = [];
    };

    const handleConsultarCancelaciones = async () => {
        invalidarCancelaciones();
        const version = versionConsultaCancelaciones;
        const companyId = obtenerCompanyId();
        if (!companyId) {
            toast.add({ severity: 'warn', summary: 'Cancelaciones', detail: 'La empresa no tiene un ID válido para consultar sus solicitudes.', life: 4500 });
            return;
        }
        cargandoCancelaciones.value = true;
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/solicitudes_cancelacion/listar?company_id=${encodeURIComponent(companyId)}`
            });
            if (version !== versionConsultaCancelaciones) return;
            if (res?.estatus !== 200 || !Array.isArray(res?.datos)) {
                throw new Error(res?.mensaje || 'No se pudieron consultar las solicitudes.');
            }
            solicitudesCancelacion.value = res.datos;
            // El endpoint actual limita a 500 solicitudes. Con 500 no podemos
            // garantizar que no existan otras solicitudes activas: bloquear por seguridad.
            if (res.datos.length >= 500) {
                toast.add({ severity: 'warn', summary: 'Cancelaciones', detail: 'Se alcanzó el límite de 500 solicitudes. Debes paginar el endpoint antes de permitir nuevas cancelaciones.', life: 6500 });
                return;
            }
            cancelacionesCargadas.value = true;
        } catch (error) {
            if (version !== versionConsultaCancelaciones) return;
            console.error('CONSULTAR CANCELACIONES:', error);
            toast.add({ severity: 'error', summary: 'Cancelaciones', detail: 'No se pudo verificar el estado de las solicitudes. La cancelación permanecerá bloqueada.', life: 5500 });
        } finally {
            if (version === versionConsultaCancelaciones) cargandoCancelaciones.value = false;
        }
    };

    // El filtro usa RFC, pero el helper de cancelaciones exige ObjectId de Mongo.
    // No se envía el RFC como company_id; si el catálogo no trae el ID se bloquea el registro.
    const obtenerCompanyId = () => {
        const compania = catCompaniasSat.value.find((item) => String(item.rfc || '').toUpperCase() === String(frmFiltros.empresa || '').toUpperCase());
        const id = compania?._id?.$oid || compania?._id || compania?.company_id || compania?.id;
        return /^[a-f\d]{24}$/i.test(String(id || '')) ? String(id) : null;
    };

    const puedeGuardarCancelacion = computed(() => {
        if (guardandoCancelacion.value || !cfdiSeleccionado.value || !obtenerCompanyId() || cancelacionDeshabilitada(cfdiSeleccionado.value)) return false;
        if (!catMotivosCancelacion.some((m) => m.value === frmCancelacion.motivo_sat)) return false;
        if (frmCancelacion.motivo_sat === '01') {
            return uuidValido(frmCancelacion.uuid_sustituto) && frmCancelacion.uuid_sustituto.trim().toUpperCase() !== cfdiSeleccionado.value.uuid.toUpperCase();
        }
        return true;
    });

    const handleAbrirCancelacion = (cfdi) => {
        if (cancelacionDeshabilitada(cfdi)) return;
        cfdiSeleccionado.value = { ...cfdi };
        frmCancelacion.motivo_sat = null;
        frmCancelacion.uuid_sustituto = '';
        frmCancelacion.observaciones = '';
        modalCancelacion.value = true;
    };

    const handleCerrarCancelacion = () => {
        if (guardandoCancelacion.value) return;
        modalCancelacion.value = false;
        cfdiSeleccionado.value = null;
    };

    const handleGuardarCancelacion = async () => {
        if (guardandoCancelacion.value) return;
        const companyId = obtenerCompanyId();
        if (!companyId) {
            toast.add({ severity: 'error', summary: 'Cancelación', detail: 'El catálogo de empresas no contiene el _id de Mongo. Es necesario agregarlo a la respuesta de compañías.', life: 6000 });
            return;
        }
        if (!puedeGuardarCancelacion.value || cancelacionDeshabilitada(cfdiSeleccionado.value)) {
            toast.add({ severity: 'warn', summary: 'Cancelación', detail: 'Verifica el motivo SAT y el UUID sustituto, cuando corresponda.', life: 4000 });
            return;
        }
        guardandoCancelacion.value = true;
        try {
            const cfdi = cfdiSeleccionado.value;
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/solicitudes_cancelacion/guardar',
                datosJson: {
                    uuid: cfdi.uuid.trim().toUpperCase(),
                    company_id: companyId,
                    tipo_cfdi: String(cfdi.tipoDeComprobante).toUpperCase() === 'P' ? 'complemento_pago' : 'factura',
                    motivo_sat: frmCancelacion.motivo_sat,
                    uuid_sustituto: frmCancelacion.motivo_sat === '01' ? frmCancelacion.uuid_sustituto.trim().toUpperCase() : null,
                    observaciones: frmCancelacion.observaciones.trim()
                }
            });
            if (res?.estatus !== 201 && res?.estatus !== 200) {
                if (res?.estatus === 409) {
                    // La API confirma que existe una solicitud; no permitir otro intento.
                    solicitudesCancelacion.value = [...solicitudesCancelacion.value, { uuid: normalizarUuid(cfdiSeleccionado.value?.uuid), activo: true, estatus: 'pendiente' }];
                    modalCancelacion.value = false;
                }
                toast.add({ severity: 'error', summary: 'Cancelación', detail: res?.mensaje || 'No fue posible registrar la solicitud.', life: 5000 });
                return;
            }
            // Bloqueo inmediato sin esperar una nueva consulta a MongoDB.
            const registrada = res?.datos && typeof res.datos === 'object' ? res.datos : {};
            solicitudesCancelacion.value = [...solicitudesCancelacion.value, { ...registrada, uuid: normalizarUuid(cfdi.uuid), company_id: companyId, activo: true, estatus: 'pendiente' }];
            toast.add({ severity: 'success', summary: 'Cancelación', detail: 'Solicitud registrada como pendiente. El CFDI aún no está cancelado.', life: 5000 });
            modalCancelacion.value = false;
            cfdiSeleccionado.value = null;
        } catch (error) {
            console.error('REGISTRAR CANCELACIÓN:', error);
            toast.add({ severity: 'error', summary: 'Cancelación', detail: 'Error de comunicación al registrar la solicitud.', life: 5000 });
        } finally {
            guardandoCancelacion.value = false;
        }
    };

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
            invalidarCancelaciones();

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        catCfdis.value = res.datos?.cfdis ?? [];
        await handleConsultarCancelaciones();

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
        invalidarCancelaciones();

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
    // DESCARGAR XML FILTRADOS EN ZIP
    // -------------------------------------------------------------------------

    const handleDescargarZip = async () => {
        // ============================================================
        // TOMAMOS EXACTAMENTE LO QUE ESTA FILTRADO EN LA TABLA
        // ============================================================

        const cfdisVigentes = catCfdisFiltrados.value.filter((item) => {
            return Number(item.estatusCFDI) === 1;
        });

        if (!cfdisVigentes.length) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'No existen CFDI vigentes para descargar.',

                life: 3000
            });

            return;
        }

        // ============================================================
        // UUID
        // ============================================================

        const uuids = cfdisVigentes.map((item) => item.uuid).filter(Boolean);

        if (!uuids.length) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Los CFDI filtrados no contienen UUID.',

                life: 3000
            });

            return;
        }

        // ============================================================
        // PETICION
        // ============================================================

        const res = await store.dispatch('api/apiPostblob', {
            direccion: '/operacion_sat/cfdis/descargar_zip',

            datosJson: {
                uuids: uuids
            }
        });

        // ============================================================
        // ERROR
        // ============================================================

        if (res.estatus !== 200 || !res.data) {
            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje || 'No fue posible generar el ZIP.',

                life: 4000
            });

            return;
        }

        // ============================================================
        // BLOB
        // ============================================================

        const url = window.URL.createObjectURL(res.data);

        const a = document.createElement('a');

        a.href = url;

        // ============================================================
        // NOMBRE
        // ============================================================

        const fecha = new Date();

        const pad = (numero) => String(numero).padStart(2, '0');

        const nombreArchivo = `CFDI_${frmFiltros.empresa}_` + `${fecha.getFullYear()}` + `${pad(fecha.getMonth() + 1)}` + `${pad(fecha.getDate())}` + '.zip';

        a.download = nombreArchivo;

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);

        toast.add({
            severity: 'success',

            summary: 'Notificación',

            detail: `${uuids.length} CFDI enviados para descarga.`,

            life: 3000
        });
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
        handleExportarExcel,
        handleDescargarZip,
        modalCancelacion,
        cfdiSeleccionado,
        guardandoCancelacion,
        frmCancelacion,
        catMotivosCancelacion,
        puedeSolicitarCancelacion,
        cancelacionDeshabilitada,
        mensajeBotonCancelacion,
        handleConsultarCancelaciones,
        puedeGuardarCancelacion,
        handleAbrirCancelacion,
        handleCerrarCancelacion,
        handleGuardarCancelacion
    };
};

export default useProceso;
