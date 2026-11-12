import useOperaciones from './operaciones';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const fechaLocal = f => f instanceof Date && !Number.isNaN(f.getTime()) ? `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}` : null;
const fechaMexico = () => {
    const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const v = tipo => partes.find(p => p.type === tipo).value;
    return new Date(`${v('year')}-${v('month')}-${v('day')}T12:00:00`);
};
export default function useProceso() {
    const store = useStore(), toast = useToast();
    const cajas = ref([]), conceptos = ref([]), cajaId = ref(null), hoy = ref(fechaMexico());
    const desde = ref(new Date(hoy.value.getFullYear(), hoy.value.getMonth(), 1, 12)), hasta = ref(new Date(hoy.value));
    const tipoFiltro = ref(null), movimientos = ref([]), detalle = ref(null), total = ref(0), primero = ref(0), limite = ref(10);
    const cargando = ref(false), guardando = ref(false), error = ref(''), errorFormulario = ref(''), mostrar = ref(false);
    const mostrarDetalle = ref(false), seleccionado = ref(null);
    const mostrarAnulacion = ref(false), guardandoAnulacion = ref(false), errorAnulacion = ref(''), motivoAnulacion = ref(''), movimientoAnular = ref(null);
    let operacionAnulacion = null, secuenciaAnulacion = null, jornadaAnulacion = null;
    const formulario = reactive({ tipo: 'entrada', fecha: null, importe: null, concepto_id: null, referencia: '', descripcion: '' });
    let operacion = null, secuencia = null;
    const tipos = [{ id: 'entrada', nombre: 'Entradas' }, { id: 'salida', nombre: 'Salidas' }];
    const cajaActual = computed(() => cajas.value.find(c => c.id === cajaId.value));
    const puedeRegistrar = computed(() => !cargando.value && !guardandoAnulacion.value && !error.value && !!detalle.value?.jornada_id && cajaActual.value?.activo && conceptos.value.length > 0);
    const minFecha = computed(() => detalle.value ? new Date(detalle.value.ultima_fecha + 'T12:00:00') : null);
    const formularioValido = computed(() => !!fechaLocal(formulario.fecha) && !!formulario.concepto_id && Number.isFinite(formulario.importe) && formulario.importe > 0 && (formulario.tipo !== 'salida' || Math.round(formulario.importe*100) <= Math.round(Number(detalle.value?.saldo_actual || 0)*100)));
    const handleMoneda = v => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v || 0));
    const handleFecha = v => v ? new Date(v + 'T12:00:00').toLocaleDateString('es-MX') : '';
    const datosDetalle = computed(() => seleccionado.value ? [
        { nombre: 'Caja', valor: cajaActual.value?.nombre }, { nombre: 'Folio', valor: '#' + seleccionado.value.secuencia },
        { nombre: 'Movimiento', valor: seleccionado.value.tipo === 'entrada' ? 'Entrada' : 'Salida' }, { nombre: 'Fecha', valor: handleFecha(seleccionado.value.fecha) },
        { nombre: 'Concepto', valor: seleccionado.value.concepto }, { nombre: 'Importe', valor: handleMoneda(seleccionado.value.importe) },
        { nombre: 'Saldo posterior', valor: handleMoneda(seleccionado.value.saldo) }, { nombre: 'Referencia', valor: seleccionado.value.referencia },
        { nombre: 'Descripción', valor: seleccionado.value.descripcion }, { nombre: 'Registrado por', valor: seleccionado.value.usuario },
        { nombre: 'Traspaso', valor: seleccionado.value.traspaso_id || '' }, { nombre: 'Otra caja', valor: seleccionado.value.otra_caja || '' },
        { nombre: 'Estado', valor: seleccionado.value.reversa_de ? 'Contramovimiento' : seleccionado.value.anulado ? 'Anulado' : 'Vigente' },
        { nombre: 'Movimiento original', valor: seleccionado.value.secuencia_original ? '#' + seleccionado.value.secuencia_original : '' },
        { nombre: 'Motivo de anulacion', valor: seleccionado.value.motivo_anulacion || seleccionado.value.anulacion?.motivo || '' },
        { nombre: 'Anulado por', valor: seleccionado.value.anulacion?.usuario || '' },
        { nombre: 'Contramovimiento', valor: seleccionado.value.anulacion ? '#' + seleccionado.value.anulacion.secuencia : '' },
        { nombre: 'Fecha de anulacion', valor: handleFecha(seleccionado.value.anulacion?.fecha) }
    ] : []);
    const handleCargar = async (catalogos = false) => {
        if (cargando.value || guardando.value || guardandoAnulacion.value) return;
        cargando.value = true; error.value = ''; detalle.value = null; movimientos.value = []; total.value = 0;
        try {
            if (catalogos) {
                const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/movimientos/catalogos' });
                if (res.estatus !== 200) { error.value = res.mensaje || 'No fue posible cargar los catalogos.'; return; }
                extras.soporteTraspasos.value = res.datos.traspasos_disponibles === true; cajas.value = res.datos.cajas || []; conceptos.value = res.datos.conceptos || []; hoy.value = new Date(res.datos.hoy + 'T12:00:00');
                if (!cajas.value.some(c => c.id === cajaId.value)) cajaId.value = cajas.value.find(c => c.activo)?.id || cajas.value[0]?.id || null;
            }
            if (!cajaId.value) return;
            if (!fechaLocal(desde.value) || !fechaLocal(hasta.value) || desde.value > hasta.value) { error.value = 'Revisa el periodo de consulta.'; return; }
            const parametros = new URLSearchParams({ caja_id: cajaId.value, desde: fechaLocal(desde.value), hasta: fechaLocal(hasta.value), tipo: tipoFiltro.value || '', pagina: String(Math.floor(primero.value/limite.value)+1), limite: String(limite.value) });
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/movimientos/?' + parametros });
            if (res.estatus !== 200) { error.value = res.mensaje || 'No fue posible consultar los movimientos.'; return; }
            detalle.value = res.datos; movimientos.value = res.datos.movimientos || []; total.value = res.datos.total || 0;
        } catch { error.value = 'No fue posible conectar con el servidor.'; }
        finally { cargando.value = false; }
    };
    const handleConsultar = () => { primero.value = 0; return handleCargar(); };
    const handleCambiarCaja = () => handleConsultar();
    const handleActualizar = () => { primero.value = 0; return handleCargar(true); };
    const handlePagina = e => { primero.value = e.first; limite.value = e.rows; return handleCargar(); };
    const handleNuevo = tipo => {
        if (!puedeRegistrar.value) return;
        Object.assign(formulario, { tipo, fecha: new Date(hoy.value), importe: null, concepto_id: null, referencia: '', descripcion: '' });
        operacion = crypto.randomUUID(); secuencia = detalle.value.secuencia; errorFormulario.value = ''; mostrar.value = true;
    };
    const handleDetalle = data => { seleccionado.value = data; mostrarDetalle.value = true; };
    const handleGuardar = async () => {
        if (guardando.value || !formularioValido.value) return;
        guardando.value = true; errorFormulario.value = ''; let registrado = false;
        try {
            const datosJson = { ...formulario, caja_id: cajaId.value, fecha: fechaLocal(formulario.fecha), importe: String(formulario.importe), operacion_id: operacion, secuencia, jornada_id: detalle.value.jornada_id };
            const res = await store.dispatch('api/apiPostToken', { direccion: '/efectivo/movimientos/', datosJson });
            if (res.estatus !== 200) { errorFormulario.value = res.mensaje || 'No fue posible registrar el movimiento.'; return; }
            mostrar.value = false; registrado = true;
            toast.add({ severity: 'success', summary: 'Movimientos de caja', detail: res.mensaje, life: 4000 });
        } catch { errorFormulario.value = 'No fue posible registrar. Intenta nuevamente.'; }
        finally { guardando.value = false; }
        if (registrado) await handleActualizar();
    };
    const puedeAnular = data => !!detalle.value?.puede_anular && !!detalle.value?.jornada_id && !!cajaActual.value?.activo && !cargando.value && !error.value && !guardando.value && !guardandoAnulacion.value && !data.anulado && !data.reversa_de && !data.traspaso_id && !data.pago_programado_id;
    const saldoTrasAnular = computed(() => {
        if (!movimientoAnular.value) return 0;
        const actual = Math.round(Number(detalle.value?.saldo_actual || 0)*100);
        const importe = Math.round(Number(movimientoAnular.value.importe)*100);
        return (actual + (movimientoAnular.value.tipo === 'entrada' ? -importe : importe))/100;
    });
    const anulacionValida = computed(() => movimientoAnular.value && puedeAnular(movimientoAnular.value) && motivoAnulacion.value.trim().length >= 3 && motivoAnulacion.value.trim().length <= 1000 && saldoTrasAnular.value >= 0 && saldoTrasAnular.value <= 999999999999.99);
    const handleAnular = data => {
        if (!puedeAnular(data)) return;
        movimientoAnular.value = data; motivoAnulacion.value = ''; errorAnulacion.value = '';
        operacionAnulacion = crypto.randomUUID(); secuenciaAnulacion = detalle.value.secuencia; jornadaAnulacion = detalle.value.jornada_id;
        mostrarAnulacion.value = true;
    };
    const handleConfirmarAnulacion = async () => {
        if (guardandoAnulacion.value || !anulacionValida.value) return;
        guardandoAnulacion.value = true; errorAnulacion.value = ''; let aplicada = false;
        try {
            const datosJson = { caja_id: cajaId.value, movimiento_id: movimientoAnular.value.id, motivo: motivoAnulacion.value, operacion_id: operacionAnulacion, secuencia: secuenciaAnulacion, jornada_id: jornadaAnulacion };
            const res = await store.dispatch('api/apiPostToken', { direccion: '/efectivo/movimientos/anular', datosJson });
            if (res.estatus !== 200) { errorAnulacion.value = res.mensaje || 'No fue posible anular el movimiento.'; return; }
            mostrarAnulacion.value = false; aplicada = true;
            toast.add({ severity: 'success', summary: 'Correccion de efectivo', detail: res.mensaje, life: 5000 });
        } catch { errorAnulacion.value = 'No fue posible completar la anulacion. Intenta nuevamente.'; }
        finally { guardandoAnulacion.value = false; }
        if (aplicada) await handleActualizar();
    };
    const extras = useOperaciones({ cajaId, cajas, detalle, hoy, handleActualizar });
    onMounted(handleActualizar);
    return { ...extras, mostrarAnulacion, guardandoAnulacion, errorAnulacion, motivoAnulacion, movimientoAnular, puedeAnular, saldoTrasAnular, anulacionValida, handleAnular, handleConfirmarAnulacion, cajas, conceptos, cajaId, cajaActual, hoy, desde, hasta, tipoFiltro, tipos, movimientos, detalle, total, primero, limite, cargando, guardando, error, errorFormulario, mostrar, formulario, puedeRegistrar, formularioValido, minFecha, mostrarDetalle, seleccionado, datosDetalle, handleConsultar, handleCambiarCaja, handleActualizar, handlePagina, handleNuevo, handleGuardar, handleDetalle, handleMoneda, handleFecha };
}
