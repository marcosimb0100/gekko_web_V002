import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import * as XLSX from 'xlsx';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ============================================================
    // FECHAS
    // ============================================================

    const ahora = new Date();

    const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const fechaInicial = ref(new Date(ahora.getFullYear(), ahora.getMonth(), 1));

    const fechaFinal = ref(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));

    // ============================================================
    // FILTROS PRINCIPALES
    // ============================================================

    const tipoSolicitudFiltro = ref('facturas');

    const estatusFiltro = ref('pendiente');

    const empresaFiltro = ref('');

    // ============================================================
    // SOLICITUDES TABLA
    // ============================================================

    const solicitudes = ref([]);

    const cargandoSolicitudes = ref(false);

    // ============================================================
    // DASHBOARD
    // ============================================================

    const dashboardFacturasPendientes = ref([]);

    const dashboardFacturasTimbradas = ref([]);

    const dashboardComplementosPendientes = ref([]);

    const dashboardComplementosTimbrados = ref([]);

    // ============================================================
    // BUSCADOR
    // ============================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // ============================================================
    // DIALOGS
    // ============================================================

    const dialogDetalle = ref(false);

    const dialogRechazo = ref(false);

    const dialogEditarConceptos = ref(false);

    const solicitudDetalle = ref(null);

    const motivoRechazo = ref('');

    // ============================================================
    // CONCEPTOS
    // ============================================================

    const conceptosEditables = ref([]);

    const conceptosDisponibles = ref([]);

    const solicitudEditando = ref(null);

    const conceptoNuevoId = ref('');

    const cantidadNuevo = ref('');

    const valorUnitarioNuevo = ref('');

    // ============================================================
    // CATALOGOS
    // ============================================================

    const tiposSolicitud = [
        {
            label: 'Facturas',

            value: 'facturas'
        },

        {
            label: 'Complementos de pago',

            value: 'complementos_pago'
        }
    ];

    const estatusSolicitud = [
        {
            label: 'Pendientes',

            value: 'pendiente'
        },

        {
            label: 'Timbradas',

            value: 'timbrada'
        }
    ];

    // ============================================================
    // FECHA API
    // ============================================================

    const handleFechaApi = (fecha) => {
        if (!fecha) {
            return '';
        }

        const value = fecha instanceof Date ? fecha : new Date(fecha);

        const anio = value.getFullYear();

        const mes = String(value.getMonth() + 1).padStart(2, '0');

        const dia = String(value.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    };

    // ============================================================
    // PARAMETROS FECHA
    // ============================================================

    const handleParametrosFecha = () => {
        const parametros = new URLSearchParams();

        parametros.append('fecha_inicial', handleFechaApi(fechaInicial.value));

        parametros.append('fecha_final', handleFechaApi(fechaFinal.value));

        return parametros.toString();
    };

    // ============================================================
    // VALIDAR FECHAS
    // ============================================================

    const handleValidarFechas = () => {
        if (!fechaInicial.value || !fechaFinal.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Selecciona la fecha ' + 'inicial y final.',

                life: 3000
            });

            return false;
        }

        if (fechaInicial.value > fechaFinal.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'La fecha inicial ' + 'no puede ser mayor ' + 'a la fecha final.',

                life: 3000
            });

            return false;
        }

        return true;
    };

    // ============================================================
    // ENDPOINT TABLA
    // ============================================================

    const handleEndpointSolicitudes = () => {
        if (tipoSolicitudFiltro.value === 'facturas') {
            return estatusFiltro.value === 'timbrada' ? '/solicitud_detallada/timbradas' : '/solicitud_detallada/pendientes';
        }

        return estatusFiltro.value === 'timbrada' ? '/solicitud_detallada/complementos_pago/timbradas' : '/solicitud_detallada/complementos_pago/pendientes';
    };

    // ============================================================
    // OBTENER SOLICITUDES RESPUESTA
    // ============================================================

    const handleObtenerSolicitudesRespuesta = (respuesta) => {
        if (respuesta?.estatus !== 200) {
            return [];
        }

        return respuesta?.datos?.solicitudes ?? [];
    };

    // ============================================================
    // CONSULTA TABLA
    // ============================================================

    const handleRecargarSolicitudes = async () => {
        if (!handleValidarFechas()) {
            return;
        }

        cargandoSolicitudes.value = true;

        try {
            const direccion = handleEndpointSolicitudes() + '?' + handleParametrosFecha();

            console.log('CONSULTANDO TABLA:', direccion);

            const res = await store.dispatch('api/apiGetToken', {
                direccion
            });

            console.log('RESPUESTA TABLA:', res);

            if (res.estatus === 200) {
                solicitudes.value = res.datos?.solicitudes ?? [];
            } else {
                solicitudes.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Notificación',

                    detail: res.mensaje || 'No fue posible consultar las solicitudes.',

                    life: 3000
                });
            }
        } catch (error) {
            console.error('ERROR CONSULTANDO TABLA:', error);

            solicitudes.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: 'Ocurrió un error al ' + 'consultar las solicitudes.',

                life: 3000
            });
        } finally {
            cargandoSolicitudes.value = false;
        }
    };

    // ============================================================
    // DASHBOARD
    // ============================================================

    const handleCargarDashboard = async () => {
        if (!handleValidarFechas()) {
            return;
        }

        const parametros = handleParametrosFecha();

        try {
            const [facturasPendientes, facturasTimbradas, complementosPendientes, complementosTimbrados] = await Promise.all([
                store.dispatch('api/apiGetToken', {
                    direccion: '/solicitud_detallada/pendientes' + '?' + parametros
                }),

                store.dispatch('api/apiGetToken', {
                    direccion: '/solicitud_detallada/timbradas' + '?' + parametros
                }),

                store.dispatch('api/apiGetToken', {
                    direccion: '/solicitud_detallada/' + 'complementos_pago/pendientes' + '?' + parametros
                }),

                store.dispatch('api/apiGetToken', {
                    direccion: '/solicitud_detallada/' + 'complementos_pago/timbradas' + '?' + parametros
                })
            ]);

            dashboardFacturasPendientes.value = handleObtenerSolicitudesRespuesta(facturasPendientes);

            dashboardFacturasTimbradas.value = handleObtenerSolicitudesRespuesta(facturasTimbradas);

            dashboardComplementosPendientes.value = handleObtenerSolicitudesRespuesta(complementosPendientes);

            dashboardComplementosTimbrados.value = handleObtenerSolicitudesRespuesta(complementosTimbrados);
        } catch (error) {
            console.error('ERROR DASHBOARD:', error);

            dashboardFacturasPendientes.value = [];

            dashboardFacturasTimbradas.value = [];

            dashboardComplementosPendientes.value = [];

            dashboardComplementosTimbrados.value = [];
        }
    };

    // ============================================================
    // TOTAL
    // ============================================================

    const handleObtenerTotal = (item) => {
        if (!item) {
            return 0;
        }

        return Number(item.montoTotal ?? item.total ?? item.monto_total_pagos ?? item.monto ?? 0);
    };

    // ============================================================
    // FILTRO EMPRESA
    // ============================================================

    const handleFiltrarEmpresa = (registros) => {
        if (!empresaFiltro.value) {
            return registros;
        }

        return registros.filter((item) => String(item.company_id) === String(empresaFiltro.value));
    };

    // ============================================================
    // DASHBOARD COMPUTED
    // ============================================================

    const resumenDashboard = computed(() => {
        const facturasPendientes = handleFiltrarEmpresa(dashboardFacturasPendientes.value);

        const facturasTimbradas = handleFiltrarEmpresa(dashboardFacturasTimbradas.value);

        const complementosPendientes = handleFiltrarEmpresa(dashboardComplementosPendientes.value);

        const complementosTimbrados = handleFiltrarEmpresa(dashboardComplementosTimbrados.value);

        const facturas = [...facturasPendientes, ...facturasTimbradas];

        const complementos = [...complementosPendientes, ...complementosTimbrados];

        const pendientes = [...facturasPendientes, ...complementosPendientes];

        const todos = [...facturas, ...complementos];

        const importe = todos.reduce(
            (total, item) => total + handleObtenerTotal(item),

            0
        );

        return {
            pendientes: pendientes.length,

            facturas: facturas.length,

            complementos: complementos.length,

            total: todos.length,

            importe
        };
    });

    // ============================================================
    // EMPRESAS
    // ============================================================

    const empresasFiltro = computed(() => {
        const todos = [...dashboardFacturasPendientes.value, ...dashboardFacturasTimbradas.value, ...dashboardComplementosPendientes.value, ...dashboardComplementosTimbrados.value];

        const empresas = todos
            .filter((item) => item.company_id && item.compania)
            .map((item) => ({
                _id: item.company_id,

                nombre: item.compania
            }));

        return empresas

            .filter((item, index, array) => index === array.findIndex((empresa) => String(empresa._id) === String(item._id)))

            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    });

    // ============================================================
    // SOLICITUDES FILTRADAS
    // ============================================================

    const solicitudesFiltradas = computed(() => {
        return handleFiltrarEmpresa(solicitudes.value);
    });

    // ============================================================
    // EXPORTABLES
    // ============================================================

    const solicitudesExportables = computed(() => {
        const registros = solicitudesFiltradas.value;

        const busqueda = String(filtros.value?.global?.value ?? '')
            .trim()
            .toLowerCase();

        if (!busqueda) {
            return registros;
        }

        const campos = ['created_at', 'cliente', 'compania', 'uso_cfdi', 'banco', 'cuenta_banco', 'estatus', 'factura_serie', 'factura_folio', 'uuid'];

        return registros.filter((item) =>
            campos.some((campo) =>
                String(item?.[campo] ?? '')
                    .toLowerCase()
                    .includes(busqueda)
            )
        );
    });

    // ============================================================
    // TITULO TABLA
    // ============================================================

    const tituloTabla = computed(() => {
        const tipo = tipoSolicitudFiltro.value === 'facturas' ? 'Facturas' : 'Complementos';

        const estatus = estatusFiltro.value === 'timbrada' ? 'timbrados' : 'pendientes';

        return `${tipo} ${estatus}`;
    });

    // ============================================================
    // MONEY
    // ============================================================

    const handleMoney = (valor) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(Number(valor ?? 0));
    };

    // ============================================================
    // CAMBIAR TIPO
    // ============================================================

    const handleCambiarTipoSolicitud = async () => {
        empresaFiltro.value = '';

        filtros.value.global.value = null;

        await handleRecargarSolicitudes();
    };

    // ============================================================
    // CAMBIAR ESTATUS
    // ============================================================

    const handleCambiarEstatus = async () => {
        filtros.value.global.value = null;

        await handleRecargarSolicitudes();
    };

    // ============================================================
    // TARJETA TIPO
    // ============================================================

    const handleSeleccionarTipoResumen = async (tipo) => {
        tipoSolicitudFiltro.value = tipo;

        await handleCambiarTipoSolicitud();
    };

    // ============================================================
    // CONSULTAR
    // ============================================================

    const handleConsultar = async () => {
        if (!handleValidarFechas()) {
            return;
        }

        empresaFiltro.value = '';

        filtros.value.global.value = null;

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    // ============================================================
    // LIMPIAR
    // ============================================================

    const handleLimpiarFiltroCompleto = async () => {
        const hoy = new Date();

        tipoSolicitudFiltro.value = 'facturas';

        estatusFiltro.value = 'pendiente';

        fechaInicial.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        fechaFinal.value = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        empresaFiltro.value = '';

        filtros.value.global.value = null;

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    // ============================================================
    // ESTATUS
    // ============================================================

    const handleNombreEstatus = (estatus) => {
        const valor = String(estatus ?? '').toLowerCase();

        if (valor === 'timbrada') {
            return 'Timbrada';
        }

        if (valor === 'rechazada') {
            return 'Rechazada';
        }

        if (valor === 'aceptada' || valor === 'pendiente') {
            return 'Pendiente';
        }

        return estatus || '-';
    };

    const handleClaseEstatus = (estatus) => {
        const valor = String(estatus ?? '').toLowerCase();

        if (valor === 'timbrada') {
            return 'timbrada';
        }

        if (valor === 'rechazada') {
            return 'rechazada';
        }

        return 'pendiente';
    };

    // ============================================================
    // DETALLE
    // ============================================================

    const handleAbrirDetalle = (rowData) => {
        solicitudDetalle.value = rowData;

        dialogDetalle.value = true;
    };

    const handleCerrarDetalle = () => {
        solicitudDetalle.value = null;

        dialogDetalle.value = false;
    };

    // ============================================================
    // RECHAZO
    // ============================================================

    const handleAbrirRechazo = (rowData) => {
        solicitudDetalle.value = rowData;

        motivoRechazo.value = '';

        dialogRechazo.value = true;
    };

    const handleCerrarRechazo = () => {
        solicitudDetalle.value = null;

        motivoRechazo.value = '';

        dialogRechazo.value = false;
    };

    // ============================================================
    // ACEPTAR
    // ============================================================

    const handleAceptarSolicitud = async (rowData) => {
        const direccion = tipoSolicitudFiltro.value === 'complementos_pago' ? '/solicitud_detallada/complementos_pago/aceptar' : '/solicitud_detallada/aceptar';

        const res = await store.dispatch('api/apiPutToken', {
            direccion,

            datosJson: {
                solicitud_id: rowData._id
            }
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

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    // ============================================================
    // RECHAZAR
    // ============================================================

    const handleRechazarSolicitud = async () => {
        if (!solicitudDetalle.value?._id) {
            return;
        }

        if (!motivoRechazo.value.trim()) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Escribe el motivo.',

                life: 3000
            });

            return;
        }

        const direccion = tipoSolicitudFiltro.value === 'complementos_pago' ? '/solicitud_detallada/complementos_pago/rechazar' : '/solicitud_detallada/rechazar';

        const res = await store.dispatch('api/apiPutToken', {
            direccion,

            datosJson: {
                solicitud_id: solicitudDetalle.value._id,

                motivo: motivoRechazo.value.trim()
            }
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

        handleCerrarRechazo();

        toast.add({
            severity: 'success',

            summary: 'Notificación',

            detail: res.mensaje,

            life: 3000
        });

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    // ============================================================
    // DESCARGAR BLOB
    // ============================================================

    const handleDescargarBlob = async (direccion, nombreArchivo) => {
        const res = await store.dispatch('api/apiGetblob', {
            direccion
        });

        if (res.estatus !== 200 || !res.data) {
            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje || 'No fue posible descargar el archivo.',

                life: 3000
            });

            return;
        }

        const url = window.URL.createObjectURL(res.data);

        const link = document.createElement('a');

        link.href = url;

        link.download = nombreArchivo;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);
    };

    // ============================================================
    // ARCHIVO
    // ============================================================

    const handleDescargarArchivo = async (rowData) => {
        if (!rowData.tiene_archivo) {
            return;
        }

        await handleDescargarBlob('/solicitud_detallada/archivo/' + rowData._id, rowData.archivo_adjunto?.nombre_original || rowData.archivo_adjunto?.nombre_guardado || 'archivo_adjunto');
    };

    // ============================================================
    // XML
    // ============================================================

    const handleDescargarXml = async (rowData) => {
        const complemento = tipoSolicitudFiltro.value === 'complementos_pago';

        const timbrada = estatusFiltro.value === 'timbrada';

        let direccion = '';

        let nombre = '';

        if (complemento) {
            direccion = timbrada ? '/solicitud_detallada/' + 'complementos_pago/' + `cfdi_timbrado/${rowData._id}` : '/solicitud_detallada/' + 'complementos_pago/' + `cfdi/${rowData._id}`;

            nombre = timbrada ? `CP-${rowData.factura_folio || rowData._id}.xml` : `complemento_pago_${rowData.uuid || rowData._id}.xml`;
        } else {
            direccion = timbrada ? `/solicitud_detallada/cfdi_timbrado/${rowData._id}` : `/solicitud_detallada/cfdi/${rowData._id}`;

            nombre = timbrada ? `F-${rowData.factura_folio || rowData._id}.xml` : `cfdi_${rowData.uuid || rowData._id}.xml`;
        }

        await handleDescargarBlob(direccion, nombre);
    };

    // ============================================================
    // PDF
    // ============================================================

    const handleDescargarPdf = async (rowData) => {
        const complemento = tipoSolicitudFiltro.value === 'complementos_pago';

        const timbrada = estatusFiltro.value === 'timbrada';

        let direccion = '';

        let nombre = '';

        if (complemento) {
            direccion = timbrada ? '/solicitud_detallada/' + 'complementos_pago/' + `pdf_timbrado/${rowData._id}` : '/solicitud_detallada/' + 'complementos_pago/' + `pdf/${rowData._id}`;

            nombre = timbrada ? `CP-${rowData.factura_folio || rowData._id}.pdf` : `complemento_pago_${rowData.uuid || rowData._id}.pdf`;
        } else {
            direccion = timbrada ? `/solicitud_detallada/pdf_timbrado/${rowData._id}` : `/solicitud_detallada/pdf/${rowData._id}`;

            nombre = timbrada ? `F-${rowData.factura_folio || rowData._id}.pdf` : `factura_${rowData.uuid || rowData._id}.pdf`;
        }

        await handleDescargarBlob(direccion, nombre);
    };

    // ============================================================
    // CONCEPTOS
    // ============================================================

    const normalizarTasa = (tasa) => {
        const valor = Number(tasa) || 0;

        return valor > 1 ? valor / 100 : valor;
    };

    const recalcularConcepto = (concepto) => {
        const cantidad = Number(concepto.cantidad || 0);

        const valorUnitario = Number(concepto.valor_unitario || 0);

        const importe = Number((cantidad * valorUnitario).toFixed(4));

        const traslado = (concepto.impuestos?.traslado ?? []).map((impuesto) => {
            const tasa = normalizarTasa(impuesto.tasa);

            return {
                ...impuesto,

                base: importe,

                tasa,

                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const retencion = (concepto.impuestos?.retencion ?? []).map((impuesto) => {
            const tasa = normalizarTasa(impuesto.tasa);

            return {
                ...impuesto,

                base: importe,

                tasa,

                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const totalTraslados = traslado.reduce(
            (total, item) => total + Number(item.importe || 0),

            0
        );

        const totalRetenciones = retencion.reduce(
            (total, item) => total + Number(item.importe || 0),

            0
        );

        return {
            ...concepto,

            cantidad,

            valor_unitario: valorUnitario,

            importe,

            impuestos: {
                traslado,
                retencion
            },

            total_traslados: totalTraslados,

            total_retenciones: totalRetenciones,

            total: Number((importe + totalTraslados - totalRetenciones).toFixed(4))
        };
    };

    const handleCambiarConceptoEditable = (index, campo, value) => {
        conceptosEditables.value[index] = recalcularConcepto({
            ...conceptosEditables.value[index],

            [campo]: value
        });
    };

    const handleEliminarConceptoEditable = (index) => {
        conceptosEditables.value.splice(index, 1);
    };

    const handleEditarConceptos = async (rowData) => {
        solicitudEditando.value = rowData;

        conceptosEditables.value = (rowData.conceptos ?? []).map((item) => ({
            ...item
        }));

        const res = await store.dispatch('api/apiGetToken', {
            direccion: '/solicitud_detallada/' + `conceptos/${rowData.client_id}/${rowData.company_id}`
        });

        conceptosDisponibles.value = res.estatus === 200 ? (res.datos?.conceptos ?? []) : [];

        conceptoNuevoId.value = '';

        cantidadNuevo.value = '';

        valorUnitarioNuevo.value = '';

        dialogEditarConceptos.value = true;
    };

    const handleAgregarConceptoEditable = () => {
        const concepto = conceptosDisponibles.value.find((item) => item._id === conceptoNuevoId.value);

        if (!concepto) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Selecciona un concepto.',

                life: 3000
            });

            return;
        }

        const cantidad = Number(cantidadNuevo.value);

        const valorUnitario = Number(valorUnitarioNuevo.value);

        if (cantidad <= 0 || valorUnitario <= 0) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Cantidad y valor ' + 'unitario deben ser mayores a 0.',

                life: 3000
            });

            return;
        }

        conceptosEditables.value.push(
            recalcularConcepto({
                ...concepto,

                concepto_id: concepto._id,

                cantidad,

                valor_unitario: valorUnitario,

                descuento: 0
            })
        );

        conceptoNuevoId.value = '';

        cantidadNuevo.value = '';

        valorUnitarioNuevo.value = '';
    };

    const handleGuardarConceptosEditados = async () => {
        if (!solicitudEditando.value?._id || !conceptosEditables.value.length) {
            return;
        }

        const subtotal = conceptosEditables.value.reduce(
            (total, item) => total + Number(item.importe || 0),

            0
        );

        const traslados = conceptosEditables.value.reduce(
            (total, item) => total + Number(item.total_traslados || 0),

            0
        );

        const retenciones = conceptosEditables.value.reduce(
            (total, item) => total + Number(item.total_retenciones || 0),

            0
        );

        const total = subtotal + traslados - retenciones;

        const res = await store.dispatch('api/apiPutToken', {
            direccion: '/solicitud_detallada/actualizar_conceptos',

            datosJson: {
                solicitud_id: solicitudEditando.value._id,

                conceptos: conceptosEditables.value,

                subtotal,

                traslados,

                retenciones,

                total
            }
        });

        if (res.estatus !== 200) {
            return;
        }

        dialogEditarConceptos.value = false;

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    // ============================================================
    // EXCEL
    // ============================================================

    const handleExportarExcel = () => {
        if (!solicitudesExportables.value.length) {
            return;
        }

        const datos = solicitudesExportables.value.map((item, index) => ({
            '#': index + 1,

            Fecha: item.created_at || '',

            Tipo: tipoSolicitudFiltro.value === 'facturas' ? 'Factura' : 'Complemento de pago',

            Estatus: handleNombreEstatus(item.estatus),

            Empresa: item.compania || '',

            Cliente: item.cliente || '',

            'Uso CFDI': item.uso_cfdi || '',

            Serie: item.factura_serie || '',

            Folio: item.factura_folio || '',

            UUID: item.uuid || '',

            Total: handleObtenerTotal(item),

            Banco: item.banco || '',

            Cuenta: item.cuenta_banco || '',

            CLABE: item.clabe_banco || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(datos);

        worksheet['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 35 }, { wch: 35 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes');

        XLSX.writeFile(workbook, `${tipoSolicitudFiltro.value}_` + `${estatusFiltro.value}_` + `${handleFechaApi(fechaInicial.value)}_` + `${handleFechaApi(fechaFinal.value)}` + '.xlsx');
    };

    // ============================================================
    // INIT
    // ============================================================

    const handleInit = async () => {
        tipoSolicitudFiltro.value = 'facturas';

        estatusFiltro.value = 'pendiente';

        await Promise.all([handleRecargarSolicitudes(), handleCargarDashboard()]);
    };

    handleInit();

    // ============================================================
    // RETURN
    // ============================================================

    return {
        fechaActual,

        fechaInicial,

        fechaFinal,

        tipoSolicitudFiltro,

        estatusFiltro,

        empresaFiltro,

        tiposSolicitud,

        estatusSolicitud,

        empresasFiltro,

        solicitudes,

        solicitudesFiltradas,

        solicitudesExportables,

        resumenDashboard,

        filtros,

        cargandoSolicitudes,

        tituloTabla,

        solicitudDetalle,

        dialogDetalle,

        dialogRechazo,

        dialogEditarConceptos,

        motivoRechazo,

        conceptosEditables,

        conceptosDisponibles,

        solicitudEditando,

        conceptoNuevoId,

        cantidadNuevo,

        valorUnitarioNuevo,

        handleFechaApi,

        handleMoney,

        handleObtenerTotal,

        handleConsultar,

        handleRecargarSolicitudes,

        handleCambiarTipoSolicitud,

        handleCambiarEstatus,

        handleSeleccionarTipoResumen,

        handleLimpiarFiltroCompleto,

        handleNombreEstatus,

        handleClaseEstatus,

        handleAbrirDetalle,

        handleCerrarDetalle,

        handleAbrirRechazo,

        handleCerrarRechazo,

        handleAceptarSolicitud,

        handleRechazarSolicitud,

        handleDescargarArchivo,

        handleDescargarXml,

        handleDescargarPdf,

        handleEditarConceptos,

        handleCambiarConceptoEditable,

        handleEliminarConceptoEditable,

        handleAgregarConceptoEditable,

        handleGuardarConceptosEditados,

        handleExportarExcel
    };
};

export default useProceso;
