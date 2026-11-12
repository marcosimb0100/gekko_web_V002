import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const fechaLocal = f => f instanceof Date && !Number.isNaN(f.getTime()) ? `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}` : null;
const fecha = s => s ? new Date(s + 'T12:00:00') : null;

export default function useRegistro({ handleCargar }) {
    const store = useStore(), toast = useToast();
    const mostrarRegistro = ref(false), cargandoRegistro = ref(false), guardandoRegistro = ref(false), errorRegistro = ref('');
    const programacionPago = ref(null), opcionesPago = ref({}), cuentasPago = ref([]), movimientosPago = ref([]), totalMovimientosPago = ref(0), primeroMovimientosPago = ref(0);
    const cargandoCuentasPago = ref(false), cargandoMovimientosPago = ref(false), hoyPago = ref(new Date());
    const saldoPeriodo = ref(null), cargandoPeriodo = ref(false);
    const pago = reactive({ total_periodo: null, origen: 'efectivo', vencimiento: null, fecha: null, caja_id: null, concepto_id: null, importe: null, empresa_id: null, cuenta_id: null, movimiento_id: null, notas: '', desde: null, hasta: null });
    const mostrarHistorialPago = ref(false), cargandoHistorialPago = ref(false), historialPago = ref([]), totalHistorialPago = ref(0), primeroHistorialPago = ref(0), errorHistorialPago = ref('');
    let operacion = null, historialProgramacion = null, consultaCuentas = 0, consultaMovimientos = 0, consultaPeriodo = 0;
    const origenesPago = computed(() => [{ id: 'efectivo', nombre: 'Caja', disponible: opcionesPago.value.puede_efectivo }, { id: 'banco', nombre: 'Banco', disponible: opcionesPago.value.puede_bancario }].filter(i => i.disponible));
    const cajaPago = computed(() => (opcionesPago.value.cajas || []).find(c => c.id === pago.caja_id));
    const movimientoPago = computed(() => movimientosPago.value.find(m => m.id === pago.movimiento_id));
    const totalPeriodoEditable = computed(() => !!saldoPeriodo.value && !saldoPeriodo.value.total_definido && saldoPeriodo.value.total_periodo === null);
    const pendientePeriodo = computed(() => Number.isFinite(pago.total_periodo) && saldoPeriodo.value ? Math.round((pago.total_periodo - Number(saldoPeriodo.value.abonado))*100)/100 : null);
    const totalPeriodoValido = computed(() => !!saldoPeriodo.value && Number.isFinite(pago.total_periodo) && pago.total_periodo > 0 && pago.total_periodo <= 999999999999.99 && pendientePeriodo.value >= 0);
    const pagoValido = computed(() => !cargandoPeriodo.value && !!saldoPeriodo.value && saldoPeriodo.value.estado_pago !== 'pagado' && totalPeriodoValido.value && Math.round(Number(pago.importe || 0)*100) <= Math.round(Number(pendientePeriodo.value || 0)*100) && !cargandoRegistro.value && !cargandoCuentasPago.value && !cargandoMovimientosPago.value && !!fechaLocal(pago.vencimiento) && Number.isFinite(pago.importe) && pago.importe > 0 && pago.importe <= 999999999999.99 &&
        (pago.origen === 'efectivo' ? opcionesPago.value.puede_efectivo && !!cajaPago.value?.jornada_id && !!pago.concepto_id && !!fechaLocal(pago.fecha) && pago.fecha <= hoyPago.value && Math.round(pago.importe*100) <= Math.round(Number(cajaPago.value.saldo)*100) : opcionesPago.value.puede_bancario && !!pago.empresa_id && !!pago.cuenta_id && !!movimientoPago.value && !movimientoPago.value.usado));
    const handleConsultarPeriodo = async () => {
        const consulta = ++consultaPeriodo;
        saldoPeriodo.value = null; pago.total_periodo = null; errorRegistro.value = ''; cargandoPeriodo.value = false;
        if (!fechaLocal(pago.vencimiento) || !programacionPago.value) return;
        cargandoPeriodo.value = true;
        try {
            const q = new URLSearchParams({ programacion_id: programacionPago.value.id, vencimiento: fechaLocal(pago.vencimiento) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/registro/periodo?' + q });
            if (consulta !== consultaPeriodo) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            saldoPeriodo.value = r.datos; pago.total_periodo = r.datos.total_periodo === null ? null : Number(r.datos.total_periodo);
            if (pago.origen === 'efectivo') pago.importe = r.datos.pendiente === null ? null : Number(r.datos.pendiente);
        } catch (e) { if (consulta === consultaPeriodo) errorRegistro.value = e.message || 'No fue posible consultar el periodo.'; }
        finally { if (consulta === consultaPeriodo) cargandoPeriodo.value = false; }
    };
    const handleCuentasPago = async () => {
        const consulta = ++consultaCuentas; ++consultaMovimientos;
        cuentasPago.value = []; movimientosPago.value = []; totalMovimientosPago.value = 0; pago.cuenta_id = null; pago.movimiento_id = null;
        if (!pago.empresa_id || pago.origen !== 'banco') return;
        cargandoCuentasPago.value = true; errorRegistro.value = '';
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/registro/cuentas?' + new URLSearchParams({ empresa_id: pago.empresa_id }) });
            if (consulta !== consultaCuentas) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            cuentasPago.value = r.datos.cuentas || [];
        } catch (e) { if (consulta === consultaCuentas) errorRegistro.value = e.message || 'No fue posible consultar las cuentas.'; }
        finally { if (consulta === consultaCuentas) cargandoCuentasPago.value = false; }
    };
    const handleMovimientosPago = async (reiniciar = true) => {
        const consulta = ++consultaMovimientos;
        movimientosPago.value = []; pago.movimiento_id = null; totalMovimientosPago.value = 0;
        if (reiniciar) primeroMovimientosPago.value = 0;
        if (!pago.cuenta_id || !fechaLocal(pago.desde) || !fechaLocal(pago.hasta)) return;
        if (pago.desde > pago.hasta) { errorRegistro.value = 'Revisa el periodo bancario.'; return; }
        cargandoMovimientosPago.value = true; errorRegistro.value = '';
        try {
            const q = new URLSearchParams({ empresa_id: pago.empresa_id, cuenta_id: pago.cuenta_id, desde: fechaLocal(pago.desde), hasta: fechaLocal(pago.hasta), pagina: String(Math.floor(primeroMovimientosPago.value/10)+1) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/registro/movimientos?' + q });
            if (consulta !== consultaMovimientos) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            movimientosPago.value = r.datos.movimientos || []; totalMovimientosPago.value = r.datos.total || 0;
        } catch (e) { if (consulta === consultaMovimientos) errorRegistro.value = e.message || 'No fue posible consultar las salidas bancarias.'; }
        finally { if (consulta === consultaMovimientos) cargandoMovimientosPago.value = false; }
    };
    const handlePaginaMovimientosPago = e => { primeroMovimientosPago.value = e.first; return handleMovimientosPago(false); };
    const handleSeleccionarMovimientoPago = () => { pago.importe = movimientoPago.value ? Number(movimientoPago.value.importe) : null; };
    const handleOrigenPago = () => {
        ++consultaCuentas; ++consultaMovimientos; cargandoCuentasPago.value = false; cargandoMovimientosPago.value = false;
        errorRegistro.value = ''; pago.movimiento_id = null; movimientosPago.value = []; totalMovimientosPago.value = 0;
        pago.importe = pago.origen === 'efectivo' && pendientePeriodo.value > 0 ? pendientePeriodo.value : null;
        if (pago.origen === 'banco') return handleCuentasPago();
    };
    const handleRegistrarPago = async item => {
        if (cargandoRegistro.value || guardandoRegistro.value) return;
        programacionPago.value = item; mostrarRegistro.value = true; cargandoRegistro.value = true; errorRegistro.value = ''; opcionesPago.value = {};
        operacion = crypto.randomUUID(); saldoPeriodo.value = null; cuentasPago.value = []; movimientosPago.value = []; totalMovimientosPago.value = 0;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/registro/opciones' });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            opcionesPago.value = r.datos; hoyPago.value = fecha(r.datos.hoy);
            const origen = item.medio === 'Efectivo' && r.datos.puede_efectivo ? 'efectivo' : r.datos.puede_bancario ? 'banco' : 'efectivo';
            Object.assign(pago, { origen, vencimiento: fecha(item.proxima_fecha), fecha: new Date(hoyPago.value), caja_id: null, concepto_id: null, importe: item.variable ? null : Number(item.importe), empresa_id: item.empresa, cuenta_id: null, movimiento_id: null, notas: '', desde: new Date(hoyPago.value.getFullYear(), hoyPago.value.getMonth(), 1, 12), hasta: new Date(hoyPago.value) });
            if (!origenesPago.value.length) throw new Error('Tu perfil requiere acceso a Movimientos de caja o Movimientos bancarios para registrar pagos.');
            await handleConsultarPeriodo();
            if (origen === 'banco') await handleCuentasPago();
        } catch (e) { errorRegistro.value = e.message || 'No fue posible preparar el registro.'; }
        finally { cargandoRegistro.value = false; }
    };
    const handleGuardarPago = async () => {
        if (guardandoRegistro.value || !pagoValido.value) return;
        guardandoRegistro.value = true; errorRegistro.value = ''; let registrado = false;
        try {
            const datosJson = { operacion_id: operacion, programacion_id: programacionPago.value.id, revision: programacionPago.value.revision, origen: pago.origen, vencimiento: programacionPago.value.proxima_fecha, importe: String(pago.importe), notas: pago.notas, periodo_revision: saldoPeriodo.value.periodo_revision };
            if (totalPeriodoEditable.value) datosJson.total_periodo = String(pago.total_periodo);
            if (pago.origen === 'efectivo') Object.assign(datosJson, { caja_id: pago.caja_id, concepto_id: pago.concepto_id, fecha: fechaLocal(pago.fecha), secuencia: cajaPago.value.secuencia, jornada_id: cajaPago.value.jornada_id });
            else Object.assign(datosJson, { empresa_id: pago.empresa_id, cuenta_id: pago.cuenta_id, movimiento_id: pago.movimiento_id });
            const r = await store.dispatch('api/apiPostToken', { direccion: '/pagos_programados/registro', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarRegistro.value = false; registrado = true;
            toast.add({ severity: 'success', summary: 'Registro de pago', detail: r.mensaje, life: 6000 });
        } catch (e) { errorRegistro.value = e.message || 'No fue posible confirmar. Reintenta con la misma operacion.'; }
        finally { guardandoRegistro.value = false; }
        if (registrado) await handleCargar();
    };
    const handleCargarHistorialPago = async () => {
        cargandoHistorialPago.value = true; errorHistorialPago.value = '';
        try {
            const q = new URLSearchParams({ programacion_id: historialProgramacion, pagina: String(Math.floor(primeroHistorialPago.value/10)+1) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/pagos_programados/registro/historial?' + q });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            historialPago.value = r.datos.pagos || []; totalHistorialPago.value = r.datos.total || 0;
        } catch (e) { errorHistorialPago.value = e.message || 'No fue posible consultar el historial.'; }
        finally { cargandoHistorialPago.value = false; }
    };
    const handleHistorialPago = item => { historialProgramacion = item.id; primeroHistorialPago.value = 0; historialPago.value = []; mostrarHistorialPago.value = true; return handleCargarHistorialPago(); };
    const handlePaginaHistorialPago = e => { primeroHistorialPago.value = e.first; return handleCargarHistorialPago(); };
    return { saldoPeriodo, cargandoPeriodo, totalPeriodoEditable, pendientePeriodo, totalPeriodoValido, handleConsultarPeriodo, mostrarRegistro, cargandoRegistro, guardandoRegistro, errorRegistro, programacionPago, opcionesPago, cuentasPago, movimientosPago, totalMovimientosPago, primeroMovimientosPago, cargandoCuentasPago, cargandoMovimientosPago, hoyPago, pago, origenesPago, cajaPago, movimientoPago, pagoValido, handleRegistrarPago, handleOrigenPago, handleCuentasPago, handleMovimientosPago, handlePaginaMovimientosPago, handleSeleccionarMovimientoPago, handleGuardarPago,
        mostrarHistorialPago, cargandoHistorialPago, historialPago, totalHistorialPago, primeroHistorialPago, errorHistorialPago, handleHistorialPago, handlePaginaHistorialPago };
}
