import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const registros = ref([]),
        empresas = ref([]),
        resumen = ref({}),
        total = ref(0),
        offset = ref(0),
        limite = ref(50);
    const cargando = ref(false),
        cargandoDetalle = ref(false),
        guardando = ref(false);
    const error = ref(''),
        errorDetalle = ref(''),
        detalleVisible = ref(false),
        guiaVisible = ref(false);
    const motivoRetiro = ref('');
    const puedeRetirar = computed(() => seleccionado.value?.activo !== false && ['pendiente', 'aceptada'].includes(seleccionado.value?.estatus) && Number(seleccionado.value?.intentos || 0) === 0);
    const seleccionado = ref(null),
        accionPendiente = ref('');
    const filtros = reactive({ company_id: null, estatus: null, fecha_inicial: null, fecha_final: null, buscar: '' });
    let consultaAplicada = '';
    const estados = [
        { value: 'pendiente', label: 'Pendiente de revisar', severity: 'warn' },
        { value: 'aceptada', label: 'Aceptada', severity: 'info' },
        { value: 'retirada', label: 'Retirada', severity: 'secondary' },
        { value: 'procesando', label: 'Procesando', severity: 'info' },
        { value: 'pendiente_aceptacion', label: 'Pendiente de aceptación', severity: 'warn' },
        { value: 'confirmacion_pendiente', label: 'Por confirmar', severity: 'info' },
        { value: 'cancelada', label: 'Cancelada', severity: 'success' },
        { value: 'rechazada', label: 'Rechazada', severity: 'danger' },
        { value: 'error', label: 'Error', severity: 'danger' }
    ];
    const ocupado = computed(() => cargando.value || cargandoDetalle.value || guardando.value);
    const puedeAceptar = computed(() => seleccionado.value?.estatus === 'pendiente');
    const handleMensajeAccion = () =>
        ({
            aceptar: 'Al aceptar, autorizas que el ejecutor .NET envie la solicitud a CONTPAQi. Esto no confirma su cancelacion ante el SAT.',
            reintentar: 'Se pondra nuevamente en cola una solicitud confirmada como no enviada.',
            'consultar-estado': 'Se consultara el resultado ante el SAT sin reenviar la cancelacion.'
        })[accionPendiente.value] || '';
    const handleAceptar = async (registro) => {
        await handleDetalle(registro);
        if (puedeAceptar.value && !errorDetalle.value) handlePrepararAccion('aceptar');
    };
    const puedeConsultar = computed(() => ['error', 'pendiente_aceptacion', 'confirmacion_pendiente'].includes(seleccionado.value?.estatus));
    const puedeReintentar = computed(() => seleccionado.value?.estatus === 'error' && seleccionado.value?.reintentable === true);
    const handleEstado = (valor) => estados.find((item) => item.value === valor) || { label: valor || 'Sin estado', severity: 'secondary' };
    const handleFecha = (valor) => (valor && !Number.isNaN(new Date(valor).getTime()) ? new Date(valor).toLocaleString('es-MX') : '—');
    const handleImporte = (valor) => (valor != null && Number.isFinite(Number(valor)) ? Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
    const handleTexto = (valor) => (typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2));
    const handleMotivo = (valor) => ({ '01': '01 · Errores con relación', '02': '02 · Errores sin relación', '03': '03 · No se realizó la operación', '04': '04 · Operación nominativa de factura global' })[valor] || valor;
    const handleRespuesta = (res) => {
        if (!res || res.estatus < 200 || res.estatus >= 300) throw new Error(res?.mensaje || 'No fue posible completar la operación.');
        return res.datos;
    };
    const handleFechaFiltro = (fecha) => {
        if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) throw new Error('Selecciona una fecha válida.');
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    };
    const handleCargar = async () => {
        const params = new URLSearchParams(consultaAplicada);
        params.set('limite', limite.value);
        params.set('offset', offset.value);
        const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/solicitudes_cancelacion/mesa?${params}` }));
        registros.value = datos.solicitudes || [];
        resumen.value = datos.resumen || {};
        total.value = datos.total || 0;
    };
    const handleEjecutar = async (tarea) => {
        if (ocupado.value) return;
        cargando.value = true;
        error.value = '';
        try {
            await tarea();
        } catch (e) {
            error.value = e.message;
        } finally {
            cargando.value = false;
        }
    };
    const handleActualizar = () => handleEjecutar(handleCargar);
    const handleBuscar = () =>
        handleEjecutar(async () => {
            if (filtros.fecha_inicial && filtros.fecha_final && filtros.fecha_inicial > filtros.fecha_final) throw new Error('La fecha inicial debe ser anterior a la final.');
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filtros)) {
                if (value) params.set(key, key.startsWith('fecha_') ? handleFechaFiltro(value) : String(value).trim());
            }
            consultaAplicada = params.toString();
            offset.value = 0;
            await handleCargar();
        });
    const handleLimpiar = () => {
        if (ocupado.value) return;
        Object.assign(filtros, { company_id: null, estatus: null, fecha_inicial: null, fecha_final: null, buscar: '' });
        return handleBuscar();
    };
    const handlePaginar = (evento) =>
        handleEjecutar(async () => {
            offset.value = evento.first;
            limite.value = evento.rows;
            await handleCargar();
        });
    const handleCargarDetalle = async (id) => {
        seleccionado.value = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/solicitudes_cancelacion/detalle/${encodeURIComponent(id)}` }));
    };
    const handleDetalle = async (registro) => {
        if (ocupado.value) return;
        detalleVisible.value = true;
        seleccionado.value = null;
        accionPendiente.value = '';
        errorDetalle.value = '';
        cargandoDetalle.value = true;
        try {
            await handleCargarDetalle(registro._id);
        } catch (e) {
            errorDetalle.value = e.message;
        } finally {
            cargandoDetalle.value = false;
        }
    };
    const handleCerrarDetalle = () => {
        if (!ocupado.value) detalleVisible.value = false;
    };
    const handlePrepararAccion = (accion) => {
        if (!ocupado.value) {
            accionPendiente.value = accion;
            motivoRetiro.value = '';
        }
    };
    const handleConfirmarAccion = async () => {
        if (ocupado.value || !seleccionado.value || !accionPendiente.value) return;
        const permitida = { retirar: puedeRetirar.value && motivoRetiro.value.trim().length >= 10, aceptar: puedeAceptar.value, reintentar: puedeReintentar.value, 'consultar-estado': puedeConsultar.value };
        if (!permitida[accionPendiente.value]) return;
        const id = seleccionado.value._id,
            accion = accionPendiente.value;
        guardando.value = true;
        errorDetalle.value = '';
        accionPendiente.value = '';
        try {
            handleRespuesta(await store.dispatch('api/apiPostToken', { direccion: `/solicitudes_cancelacion/${accion}/${encodeURIComponent(id)}`, datosJson: accion === 'retirar' ? { motivo: motivoRetiro.value.trim() } : {} }));
            toast.add({ severity: 'success', summary: 'Cancelaciones', detail: accion === 'retirar' ? 'Solicitud retirada. Puedes solicitar nuevamente desde CFDI.' : 'Solicitud puesta en cola para el ejecutor .NET.', life: 4500 });
            await handleCargarDetalle(id);
            await handleCargar();
        } catch (e) {
            errorDetalle.value = `${e.message} Actualiza el detalle antes de intentar otra acción.`;
            seleccionado.value = null;
        } finally {
            guardando.value = false;
        }
    };
    const handleDescargarAcuse = () => {
        const acuse = seleccionado.value?.acuse_sat;
        if (!acuse) return;
        const texto = handleTexto(acuse),
            xml = typeof acuse === 'string' && acuse.trim().startsWith('<');
        const url = URL.createObjectURL(new Blob([texto], { type: xml ? 'application/xml;charset=utf-8' : 'application/json;charset=utf-8' }));
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `acuse-${seleccionado.value.uuid}.${xml ? 'xml' : 'json'}`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const handleMostrarGuia = () => {
        guiaVisible.value = true;
    };
    const handleCerrarGuia = () => {
        guiaVisible.value = false;
    };
    onMounted(() =>
        handleEjecutar(async () => {
            await handleCargar();
            const datos = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: '/operacion_sat/companias_descarga_cfdi_sat' }));
            empresas.value = (datos.companias || [])
                .map((item) => ({ value: String(item._id?.$oid || item._id || item.company_id || item.id || ''), label: item.razon_social_nombre_completo || item.razon_social || item.nombre || item.rfc }))
                .filter((item) => /^[a-f0-9]{24}$/i.test(item.value));
        })
    );
    return {
        registros,
        empresas,
        resumen,
        total,
        offset,
        limite,
        filtros,
        estados,
        cargando,
        ocupado,
        error,
        detalleVisible,
        guiaVisible,
        seleccionado,
        errorDetalle,
        cargandoDetalle,
        guardando,
        accionPendiente,
        motivoRetiro,
        puedeRetirar,
        puedeAceptar,
        handleAceptar,
        handleMensajeAccion,
        puedeConsultar,
        puedeReintentar,
        handleFecha,
        handleImporte,
        handleEstado,
        handleMotivo,
        handleTexto,
        handleActualizar,
        handleBuscar,
        handleLimpiar,
        handlePaginar,
        handleDetalle,
        handleCerrarDetalle,
        handlePrepararAccion,
        handleConfirmarAccion,
        handleDescargarAcuse,
        handleMostrarGuia,
        handleCerrarGuia
    };
};
export default useProceso;
