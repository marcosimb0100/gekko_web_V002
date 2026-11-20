import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const ruta = '/finanzas/solicitudes/mesa/';
const fecha = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null);
export default function proceso() {
    const store = useStore(),
        toast = useToast();
    const registros = ref([]),
        total = ref(0),
        primero = ref(0),
        limite = ref(10),
        busqueda = ref(''),
        estado = ref('Pendiente');
    const cargando = ref(false),
        error = ref(''),
        seleccionado = ref(null),
        tab = ref('datos'),
        mostrarAyuda = ref(false),
        verRetirados = ref(false);
    const decision = ref(null),
        motivo = ref(''),
        mostrarPago = ref(false),
        opciones = ref({}),
        cuentas = ref([]),
        movimientos = ref([]),
        totalBanco = ref(0),
        primeroBanco = ref(0);
    const pago = reactive({ origen: 'efectivo', caja_id: null, fecha: new Date(), concepto_id: null, cuenta_id: null, movimiento_id: null, requiere_factura: null, motivo_sin_factura: '', desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1), hasta: new Date() });
    const estados = ['Pendiente', 'Autorizada', 'Rechazada', 'Pagada'];
    let operacion = null,
        timer = null,
        activa = true;
    const archivos = computed(() => (seleccionado.value?.archivos || []).filter((a) => verRetirados.value || !a.retirado));
    const caja = computed(() => (opciones.value.cajas || []).find((c) => c.id === pago.caja_id));
    const validoPago = computed(() => typeof pago.requiere_factura === 'boolean' && (pago.requiere_factura || pago.motivo_sin_factura.trim().length >= 3) && !!pago.concepto_id && (pago.origen === 'efectivo' ? !!caja.value?.jornada_id && !!fecha(pago.fecha) : !!pago.cuenta_id && !!pago.movimiento_id));
    const handleMoneda = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v || 0));
    const handleAviso = (detail, severity = 'success') => toast.add({ summary: 'Mesa de solicitudes', detail, severity, life: 5000 });
    const handleApi = async (direccion, datos) => {
        const r = await store.dispatch(datos ? 'api/apiPostToken' : 'api/apiGetTokenSinCargando', datos ? { direccion, datosJson: datos } : { direccion });
        if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible completar la operacion.');
        return r.datos;
    };
    const handleCargar = async () => {
        if (cargando.value) return;
        cargando.value = true;
        error.value = '';
        try {
            const r = await handleApi(ruta + '?' + new URLSearchParams({ pagina: String(Math.floor(primero.value / limite.value) + 1), limite: String(limite.value), busqueda: busqueda.value, estado: estado.value || '' }));
            if (activa) {
                registros.value = r.solicitudes || [];
                total.value = r.total || 0;
            }
        } catch (e) {
            error.value = e.message;
        } finally {
            cargando.value = false;
        }
    };
    const handleAbrir = async (d) => {
        if (cargando.value) return;
        cargando.value = true;
        error.value = '';
        try {
            const r = await handleApi(ruta + d.id);
            seleccionado.value = r.solicitud;
            tab.value = 'datos';
            verRetirados.value = false;
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleVolver = () => {
        if (cargando.value) return;
        seleccionado.value = null;
        handleCargar();
    };
    const handleDecision = (valor) => {
        decision.value = valor;
        motivo.value = '';
        operacion = crypto.randomUUID();
    };
    const handleConfirmar = async () => {
        if (cargando.value || !decision.value || (decision.value === 'Rechazada' && motivo.value.trim().length < 3)) return;
        cargando.value = true;
        try {
            await handleApi(ruta + seleccionado.value.id + '/decision', { estado: decision.value, motivo: motivo.value, revision: seleccionado.value.revision, operacion_id: operacion });
            decision.value = null;
            seleccionado.value = (await handleApi(ruta + seleccionado.value.id)).solicitud;
            handleAviso('Revision registrada. El solicitante recibira el aviso.');
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handlePagar = async () => {
        if (cargando.value) return;
        cargando.value = true;
        try {
            opciones.value = await handleApi(ruta + 'opciones');
            Object.assign(pago, { origen: opciones.value.puede_efectivo ? 'efectivo' : 'bancario', caja_id: null, fecha: new Date(), concepto_id: null, cuenta_id: null, movimiento_id: null, requiere_factura: null, motivo_sin_factura: '' });
            movimientos.value = [];
            cuentas.value = [];
            operacion = crypto.randomUUID();
            mostrarPago.value = true;
            if (opciones.value.puede_bancario) cuentas.value = (await handleApi(ruta + 'cuentas?' + new URLSearchParams({ empresa_id: seleccionado.value.empresa_id }))).cuentas || [];
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleBuscarBanco = async (event) => {
        if (cargando.value || !pago.cuenta_id || !fecha(pago.desde) || !fecha(pago.hasta)) return;
        primeroBanco.value = event?.first || 0;
        pago.movimiento_id = null;
        cargando.value = true;
        try {
            const r = await handleApi(
                ruta + 'movimientos?' + new URLSearchParams({ empresa_id: seleccionado.value.empresa_id, cuenta_id: pago.cuenta_id, desde: fecha(pago.desde), hasta: fecha(pago.hasta), pagina: String(Math.floor(primeroBanco.value / 10) + 1) })
            );
            movimientos.value = r.movimientos || [];
            totalBanco.value = r.total || 0;
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleElegirBanco = (m) => {
        pago.movimiento_id = m.id;
        if (m.concepto_id) pago.concepto_id = m.concepto_id;
    };
    const handleConfirmarPago = async () => {
        if (cargando.value || !validoPago.value) return;
        cargando.value = true;
        const datos = { operacion_id: operacion, revision: seleccionado.value.revision, origen: pago.origen, concepto_id: pago.concepto_id, requiere_factura: pago.requiere_factura, motivo_sin_factura: pago.requiere_factura ? '' : pago.motivo_sin_factura.trim() };
        if (pago.origen === 'efectivo') Object.assign(datos, { caja_id: pago.caja_id, jornada_id: caja.value.jornada_id, secuencia: caja.value.secuencia, fecha: fecha(pago.fecha) });
        else Object.assign(datos, { cuenta_id: pago.cuenta_id, movimiento_id: pago.movimiento_id });
        try {
            await handleApi(ruta + seleccionado.value.id + '/pago', datos);
            mostrarPago.value = false;
            seleccionado.value = (await handleApi(ruta + seleccionado.value.id)).solicitud;
            handleAviso('Pago completo registrado.');
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handleDescargar = async (a) => {
        if (cargando.value) return;
        cargando.value = true;
        try {
            const r = await store.dispatch('api/apiGetblob', { direccion: ruta + seleccionado.value.id + '/archivos/' + a.id });
            if (r.estatus !== 200) throw new Error(r.mensaje || 'Archivo no disponible.');
            const url = URL.createObjectURL(r.data),
                link = document.createElement('a');
            link.href = url;
            link.download = a.nombre;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            handleAviso(e.message, 'error');
        } finally {
            cargando.value = false;
        }
    };
    const handlePagina = (e) => {
        primero.value = e.first;
        limite.value = e.rows;
        handleCargar();
    };
    const handleLimpiar = () => {
        busqueda.value = '';
        estado.value = null;
        primero.value = 0;
        handleCargar();
    };
    watch([busqueda, estado], () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            primero.value = 0;
            handleCargar();
        }, 300);
    });
    watch(
        () => pago.cuenta_id,
        () => {
            pago.movimiento_id = null;
            movimientos.value = [];
            totalBanco.value = 0;
        }
    );
    onMounted(handleCargar);
    onBeforeUnmount(() => {
        activa = false;
        clearTimeout(timer);
    });
    return {
        registros,
        total,
        primero,
        limite,
        busqueda,
        estado,
        estados,
        cargando,
        error,
        seleccionado,
        tab,
        mostrarAyuda,
        verRetirados,
        archivos,
        decision,
        motivo,
        mostrarPago,
        pago,
        opciones,
        cuentas,
        movimientos,
        totalBanco,
        primeroBanco,
        caja,
        validoPago,
        handleMoneda,
        handleCargar,
        handleAbrir,
        handleVolver,
        handleDecision,
        handleConfirmar,
        handlePagar,
        handleBuscarBanco,
        handleElegirBanco,
        handleConfirmarPago,
        handleDescargar,
        handlePagina,
        handleLimpiar
    };
}
