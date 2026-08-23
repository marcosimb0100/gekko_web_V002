import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const solicitudes = ref([]);
    const solicitudDetalle = ref(null);

    const dialogDetalle = ref(false);
    const dialogRechazo = ref(false);
    const dialogEditarConceptos = ref(false);

    const motivoRechazo = ref('');

    const estatusFiltro = ref('pendiente');
    const tipoSolicitudFiltro = ref('facturas');
    const empresaFiltro = ref('');

    const conceptosEditables = ref([]);
    const conceptosDisponibles = ref([]);

    const solicitudEditando = ref(null);

    const conceptoNuevoId = ref('');
    const cantidadNuevo = ref('');
    const valorUnitarioNuevo = ref('');

    const tiposSolicitud = [
        { label: 'Facturas', value: 'facturas' },
        { label: 'Complementos de pago', value: 'complementos_pago' }
    ];

    const estatusSolicitud = [
        { label: 'Pendientes', value: 'pendiente' },
        { label: 'Timbradas', value: 'timbrada' }
    ];

    const handleEndpointSolicitudes = () => {
        if (tipoSolicitudFiltro.value === 'facturas') {
            return estatusFiltro.value === 'pendiente' ? '/solicitud_detallada/pendientes' : '/solicitud_detallada/timbradas';
        }

        return estatusFiltro.value === 'pendiente' ? '/solicitud_detallada/complementos_pago/pendientes' : '/solicitud_detallada/complementos_pago/timbradas';
    };

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    const handleRecargarSolicitudes = async () => {
        empresaFiltro.value = '';

        const res = await store.dispatch('api/apiGetToken', {
            direccion: handleEndpointSolicitudes()
        });

        if (res.estatus === 200) {
            solicitudes.value = res.datos?.solicitudes ?? [];
        } else {
            solicitudes.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    const handleAbrirDetalle = (rowData) => {
        solicitudDetalle.value = rowData;
        dialogDetalle.value = true;
    };

    const handleCerrarDetalle = () => {
        solicitudDetalle.value = null;
        dialogDetalle.value = false;
    };

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

        await handleRecargarSolicitudes();
    };

    const handleRechazarSolicitud = async () => {
        if (!solicitudDetalle.value?._id) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'No hay solicitud seleccionada.',
                life: 3000
            });

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

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        handleCerrarRechazo();

        await handleRecargarSolicitudes();
    };

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

    const handleDescargarArchivo = async (rowData) => {
        if (!rowData.tiene_archivo) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La solicitud no tiene archivo adjunto.',
                life: 3000
            });

            return;
        }

        await handleDescargarBlob(`/solicitud_detallada/archivo/${rowData._id}`, rowData.archivo_adjunto?.nombre_original || rowData.archivo_adjunto?.nombre_guardado || 'archivo_adjunto');
    };

    const handleDescargarXml = async (rowData) => {
        const esComplemento = tipoSolicitudFiltro.value === 'complementos_pago';

        const direccion = esComplemento
            ? estatusFiltro.value === 'pendiente'
                ? `/solicitud_detallada/complementos_pago/cfdi/${rowData._id}`
                : `/solicitud_detallada/complementos_pago/cfdi_timbrado/${rowData._id}`
            : estatusFiltro.value === 'pendiente'
              ? `/solicitud_detallada/cfdi/${rowData._id}`
              : `/solicitud_detallada/cfdi_timbrado/${rowData._id}`;

        await handleDescargarBlob(direccion, esComplemento ? `complemento_pago_${rowData.uuid || rowData._id}.xml` : `cfdi_${rowData.uuid || rowData._id}.xml`);
    };

    const handleDescargarPdf = async (rowData) => {
        const esComplemento = tipoSolicitudFiltro.value === 'complementos_pago';

        const direccion = esComplemento
            ? estatusFiltro.value === 'pendiente'
                ? `/solicitud_detallada/complementos_pago/pdf/${rowData._id}`
                : `/solicitud_detallada/complementos_pago/pdf_timbrado/${rowData._id}`
            : estatusFiltro.value === 'pendiente'
              ? `/solicitud_detallada/pdf/${rowData._id}`
              : `/solicitud_detallada/pdf_timbrado/${rowData._id}`;

        await handleDescargarBlob(direccion, esComplemento ? `complemento_pago_${rowData.uuid || rowData._id}.pdf` : `factura_${rowData.uuid || rowData._id}.pdf`);
    };

    const handleMoney = (valor) => {
        return `$${Number(valor || 0).toFixed(2)}`;
    };

    const recalcularConcepto = (concepto) => {
        const cantidad = Number(concepto.cantidad || 0);
        const valor_unitario = Number(concepto.valor_unitario || 0);
        const importe = Number((cantidad * valor_unitario).toFixed(4));

        const traslado = (concepto.impuestos?.traslado ?? []).map((imp) => {
            const tasa = Number(imp.tasa || 0);

            return {
                ...imp,
                base: importe,
                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const retencion = (concepto.impuestos?.retencion ?? []).map((imp) => {
            const tasa = Number(imp.tasa || 0);

            return {
                ...imp,
                base: importe,
                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const total_traslados = traslado.reduce((sum, imp) => sum + Number(imp.importe || 0), 0);

        const total_retenciones = retencion.reduce((sum, imp) => sum + Number(imp.importe || 0), 0);

        return {
            ...concepto,
            cantidad,
            valor_unitario,
            importe,
            impuestos: {
                traslado,
                retencion
            },
            total_traslados: Number(total_traslados.toFixed(4)),
            total_retenciones: Number(total_retenciones.toFixed(4)),
            total: Number((importe + total_traslados - total_retenciones).toFixed(4))
        };
    };

    const handleCambiarConceptoEditable = (index, field, value) => {
        conceptosEditables.value[index] = recalcularConcepto({
            ...conceptosEditables.value[index],
            [field]: value
        });
    };

    const handleEliminarConceptoEditable = (index) => {
        conceptosEditables.value.splice(index, 1);
    };

    const handleEditarConceptos = async (rowData) => {
        solicitudEditando.value = rowData;
        conceptosEditables.value = rowData.conceptos ?? [];

        conceptoNuevoId.value = '';
        cantidadNuevo.value = '';
        valorUnitarioNuevo.value = '';

        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/solicitud_detallada/conceptos/${rowData.client_id}/${rowData.company_id}`
        });

        if (res.estatus === 200) {
            conceptosDisponibles.value = res.datos?.conceptos ?? [];
        } else {
            conceptosDisponibles.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }

        dialogEditarConceptos.value = true;
    };

    const normalizarTasa = (tasa) => {
        const valor = Number(tasa) || 0;

        return valor > 1 ? valor / 100 : valor;
    };

    const handleAgregarConceptoEditable = () => {
        const conceptoSeleccionado = conceptosDisponibles.value.find((item) => item._id === conceptoNuevoId.value);

        if (!conceptoSeleccionado) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Selecciona un concepto.',
                life: 3000
            });

            return;
        }

        if (Number(cantidadNuevo.value) <= 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La cantidad debe ser mayor a 0.',
                life: 3000
            });

            return;
        }

        if (Number(valorUnitarioNuevo.value) <= 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El valor unitario debe ser mayor a 0.',
                life: 3000
            });

            return;
        }

        const yaExiste = conceptosEditables.value.some((item) => item.concepto_id === conceptoSeleccionado._id);

        if (yaExiste) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El concepto ya está agregado.',
                life: 3000
            });

            return;
        }

        const cantidad = Number(cantidadNuevo.value);
        const valor_unitario = Number(valorUnitarioNuevo.value);
        const importe = Number((cantidad * valor_unitario).toFixed(4));

        const traslado = (conceptoSeleccionado.impuestos?.traslado ?? []).map((imp) => {
            const tasa = normalizarTasa(imp.tasa);

            return {
                ...imp,
                base: importe,
                tasa,
                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const retencion = (conceptoSeleccionado.impuestos?.retencion ?? []).map((imp) => {
            const tasa = normalizarTasa(imp.tasa);

            return {
                ...imp,
                base: importe,
                tasa,
                importe: Number((importe * tasa).toFixed(4))
            };
        });

        const total_traslados = Number(traslado.reduce((sum, item) => sum + Number(item.importe || 0), 0).toFixed(4));

        const total_retenciones = Number(retencion.reduce((sum, item) => sum + Number(item.importe || 0), 0).toFixed(4));

        conceptosEditables.value.push({
            concepto_id: conceptoSeleccionado._id,
            prod_serv: conceptoSeleccionado.prod_serv,
            descripcion_sat: conceptoSeleccionado.descripcion_sat,
            descripcion: conceptoSeleccionado.descripcion,
            cuenta_predial: conceptoSeleccionado.cuenta_predial,
            clave_unidad: conceptoSeleccionado.clave_unidad,
            unidad: conceptoSeleccionado.unidad,
            objeto_imp: conceptoSeleccionado.objeto_imp,
            num_uso: conceptoSeleccionado.num_uso,

            cantidad,
            valor_unitario,
            importe,
            descuento: 0,

            impuestos: {
                traslado,
                retencion
            },

            total_traslados,
            total_retenciones,
            total: Number((importe + total_traslados - total_retenciones).toFixed(4))
        });

        conceptoNuevoId.value = '';
        cantidadNuevo.value = '';
        valorUnitarioNuevo.value = '';
    };

    const handleGuardarConceptosEditados = async () => {
        if (!solicitudEditando.value?._id) {
            return;
        }

        if (!conceptosEditables.value.length) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Debe existir al menos un concepto.',
                life: 3000
            });

            return;
        }

        const subtotal = conceptosEditables.value.reduce((sum, item) => sum + Number(item.importe || 0), 0);

        const traslados = conceptosEditables.value.reduce((sum, item) => sum + Number(item.total_traslados || 0), 0);

        const retenciones = conceptosEditables.value.reduce((sum, item) => sum + Number(item.total_retenciones || 0), 0);

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

        dialogEditarConceptos.value = false;
        solicitudEditando.value = null;
        conceptosEditables.value = [];

        await handleRecargarSolicitudes();
    };

    const handleInit = async () => {
        await handleRecargarSolicitudes();
    };

    handleInit();

    const empresasFiltro = computed(() => {
        const empresas = solicitudes.value
            .filter((item) => item.company_id && item.compania)
            .map((item) => ({
                _id: item.company_id,
                nombre: item.compania
            }));

        return empresas.filter((item, index, array) => index === array.findIndex((x) => String(x._id) === String(item._id))).sort((a, b) => a.nombre.localeCompare(b.nombre));
    });

    const solicitudesFiltradas = computed(() => {
        if (!empresaFiltro.value) {
            return solicitudes.value;
        }

        return solicitudes.value.filter((item) => String(item.company_id) === String(empresaFiltro.value));
    });

    return {
        solicitudes,
        filtros,

        solicitudDetalle,

        dialogDetalle,
        dialogRechazo,
        dialogEditarConceptos,

        motivoRechazo,

        estatusFiltro,
        tipoSolicitudFiltro,

        tiposSolicitud,
        estatusSolicitud,

        conceptosEditables,
        conceptosDisponibles,
        solicitudEditando,

        conceptoNuevoId,
        cantidadNuevo,
        valorUnitarioNuevo,

        handleMoney,

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

        handleRecargarSolicitudes,
        handleLimpiarFiltro,

        solicitudes,
        solicitudesFiltradas,

        empresaFiltro,
        empresasFiltro
    };
};

export default useProceso;
