import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const fechaLocal = f => f instanceof Date && !Number.isNaN(f.getTime()) ? `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}` : null;
const fechaMexico = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const v = tipo => p.find(i => i.type === tipo).value;
    return new Date(`${v('year')}-${v('month')}-${v('day')}T12:00:00`);
};
export default function useProceso() {
    const store = useStore(), toast = useToast();
    const cajas = ref([]), cajaId = ref(null), hoy = ref(fechaMexico()), detalle = ref(null), cortes = ref([]);
    const desde = ref(new Date(hoy.value.getFullYear(), hoy.value.getMonth(), 1, 12)), hasta = ref(new Date(hoy.value));
    const periodo = ref('mes'), primero = ref(0), limite = ref(10), total = ref(0);
    const cargando = ref(false), guardando = ref(false), error = ref(''), errorFormulario = ref('');
    const mostrar = ref(false), cerrando = ref(false), contado = ref(null), observaciones = ref(''), usarDesglose = ref(false);
    const mostrarDetalle = ref(false), seleccionado = ref(null);
    const denominaciones = ref([]);
    const nombreUsuario = localStorage.getItem('nombre_completo') || 'Usuario conectado';
    let operacion = null, secuencia = null, jornada = null;
    const periodos = [{ id: 'hoy', nombre: 'Hoy' }, { id: 'semana', nombre: 'Esta semana' }, { id: 'quincena', nombre: 'Esta quincena' }, { id: 'mes', nombre: 'Este mes' }, { id: 'personalizado', nombre: 'Personalizado' }];
    const cajaActual = computed(() => cajas.value.find(c => c.id === cajaId.value));
    const puedeAbrir = computed(() => !cargando.value && !error.value && !!detalle.value && !detalle.value.jornada && cajaActual.value?.activo);
    const puedeCerrar = computed(() => !cargando.value && !error.value && !!detalle.value?.jornada);
    const totalContado = computed(() => usarDesglose.value ? denominaciones.value.reduce((s,d) => s + d.valor * (d.cantidad || 0), 0) / 100 : contado.value);
    const diferencia = computed(() => (Math.round(Number(totalContado.value || 0) * 100) - Math.round(Number(detalle.value?.saldo_actual || 0) * 100)) / 100);
    const formularioValido = computed(() => !!detalle.value && (!cerrando.value || (Number.isFinite(totalContado.value) && totalContado.value >= 0 && totalContado.value <= 999999999999.99 && (diferencia.value === 0 || observaciones.value.trim().length >= 3))));
    const handleMoneda = v => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v || 0));
    const handleFechaHora = v => v ? new Date(v).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '';
    const handleDiferencia = v => Number(v) === 0 ? 'Sin diferencia' : (Number(v) < 0 ? 'Faltante: ' : 'Sobrante: ') + handleMoneda(Math.abs(Number(v)));
    const datosDetalle = computed(() => seleccionado.value ? [
        { nombre: 'Caja', valor: cajaActual.value?.nombre }, { nombre: 'Jornada', valor: '#' + seleccionado.value.apertura_secuencia },
        { nombre: 'Apertura', valor: handleFechaHora(seleccionado.value.apertura_fecha) }, { nombre: 'Responsable de apertura', valor: seleccionado.value.responsable_nombre },
        { nombre: 'Cierre', valor: handleFechaHora(seleccionado.value.fecha_creacion) }, { nombre: 'Cerrado por', valor: seleccionado.value.usuario_nombre },
        { nombre: 'Saldo al abrir', valor: handleMoneda(seleccionado.value.apertura_saldo) }, { nombre: 'Entradas', valor: handleMoneda(seleccionado.value.entradas) },
        { nombre: 'Salidas', valor: handleMoneda(seleccionado.value.salidas) }, { nombre: 'Esperado', valor: handleMoneda(seleccionado.value.saldo) },
        { nombre: 'Contado', valor: handleMoneda(seleccionado.value.contado) }, { nombre: 'Diferencia', valor: handleDiferencia(seleccionado.value.diferencia) },
        { nombre: 'Observaciones', valor: seleccionado.value.observaciones }
    ] : []);
    const handleCargar = async (catalogos = false) => {
        if (cargando.value || guardando.value) return;
        cargando.value = true; error.value = ''; detalle.value = null; cortes.value = []; total.value = 0;
        try {
            if (catalogos) {
                const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/cortes/catalogos' });
                if (r.estatus !== 200) { error.value = r.mensaje || 'No fue posible consultar las cajas.'; return; }
                cajas.value = r.datos.cajas || []; hoy.value = new Date(r.datos.hoy + 'T12:00:00');
                if (!cajas.value.some(c => c.id === cajaId.value)) cajaId.value = cajas.value.find(c => c.activo)?.id || cajas.value[0]?.id || null;
            }
            if (!cajaId.value) return;
            if (!fechaLocal(desde.value) || !fechaLocal(hasta.value) || desde.value > hasta.value) { error.value = 'Revisa el periodo de consulta.'; return; }
            const q = new URLSearchParams({ caja_id: cajaId.value, desde: fechaLocal(desde.value), hasta: fechaLocal(hasta.value), pagina: String(Math.floor(primero.value/limite.value)+1), limite: String(limite.value) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/cortes/?' + q });
            if (r.estatus !== 200) { error.value = r.mensaje || 'No fue posible consultar los cortes.'; return; }
            detalle.value = r.datos; cortes.value = r.datos.cortes || []; total.value = r.datos.total;
        } catch { error.value = 'No fue posible conectar con el servidor.'; }
        finally { cargando.value = false; }
    };
    const handleConsultar = () => { primero.value = 0; return handleCargar(); };
    const handleActualizar = () => { primero.value = 0; return handleCargar(true); };
    const handlePagina = e => { primero.value = e.first; limite.value = e.rows; return handleCargar(); };
    const handlePeriodo = () => {
        if (periodo.value === 'personalizado') return;
        const f = new Date(hoy.value), fin = new Date(hoy.value);
        if (periodo.value === 'semana') f.setDate(f.getDate() - (f.getDay()+6)%7);
        if (periodo.value === 'quincena') { f.setDate(f.getDate() <= 15 ? 1 : 16); fin.setMonth(fin.getMonth()+ (fin.getDate() <= 15 ? 0 : 1), fin.getDate() <= 15 ? 15 : 0); }
        if (periodo.value === 'mes') { f.setDate(1); fin.setMonth(fin.getMonth()+1,0); }
        desde.value = f; hasta.value = fin; handleConsultar();
    };
    const preparar = cierre => {
        cerrando.value = cierre; contado.value = null; observaciones.value = ''; usarDesglose.value = false;
        denominaciones.value = [100000,50000,20000,10000,5000,2000,1000,500,200,100,50].map(valor => ({ valor, cantidad: 0 }));
        operacion = crypto.randomUUID(); secuencia = detalle.value.secuencia; jornada = detalle.value.jornada?.id || null;
        errorFormulario.value = ''; mostrar.value = true;
    };
    const handleAbrir = () => { if (puedeAbrir.value) preparar(false); };
    const handleCerrar = () => { if (puedeCerrar.value) preparar(true); };
    const handleDetalle = fila => { seleccionado.value = fila; mostrarDetalle.value = true; };
    const handleGuardar = async () => {
        if (guardando.value || !formularioValido.value) return;
        guardando.value = true; errorFormulario.value = ''; let aplicado = false;
        try {
            const datosJson = { caja_id: cajaId.value, secuencia, operacion_id: operacion, observaciones: observaciones.value };
            if (cerrando.value) Object.assign(datosJson, { jornada_id: jornada, contado: String(totalContado.value), denominaciones: usarDesglose.value ? denominaciones.value.map(d => ({ valor: String(d.valor/100), cantidad: d.cantidad || 0 })) : [] });
            const r = await store.dispatch('api/apiPostToken', { direccion: '/efectivo/cortes/' + (cerrando.value ? 'cerrar' : 'abrir'), datosJson });
            if (r.estatus !== 200) { errorFormulario.value = r.mensaje || 'No fue posible completar la operacion.'; return; }
            aplicado = true; mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Cortes de caja', detail: r.mensaje, life: 5000 });
        } catch { errorFormulario.value = 'No fue posible completar la operacion. Intenta nuevamente.'; }
        finally { guardando.value = false; }
        if (aplicado) await handleActualizar();
    };
    const mostrarRevision = ref(false), guardandoRevision = ref(false), corteRevision = ref(null), motivoRevision = ref(''), errorRevision = ref(''), autorizaResolucion = ref(false);
    let operacionRevision = null;
    const estadosRevision = { pendiente: 'Pendiente', en_revision: 'En revisión', resuelta: 'Resuelta' };
    const handleEstadoRevision = fila => Number(fila.diferencia) === 0 ? 'No aplica' : estadosRevision[fila.revision_diferencia?.estado || 'pendiente'];
    const revisionValida = computed(() => motivoRevision.value.trim().length >= 3 && motivoRevision.value.trim().length <= 1000 && (corteRevision.value?.revision_diferencia?.estado !== 'en_revision' || autorizaResolucion.value));
    const handleRevision = fila => {
        corteRevision.value = fila; motivoRevision.value = ''; errorRevision.value = ''; autorizaResolucion.value = false;
        operacionRevision = crypto.randomUUID(); mostrarRevision.value = true;
    };
    const handleGuardarRevision = async () => {
        if (guardandoRevision.value || !revisionValida.value || !detalle.value?.puede_revisar) return;
        guardandoRevision.value = true; errorRevision.value = ''; let aplicada = false;
        try {
            const datosJson = { corte_id: corteRevision.value.id, operacion_id: operacionRevision, revision: corteRevision.value.revision_diferencia?.revision || 0,
                estado: corteRevision.value.revision_diferencia?.estado === 'en_revision' ? 'resuelta' : 'en_revision', motivo: motivoRevision.value };
            const r = await store.dispatch('api/apiPostToken', { direccion: '/efectivo/cortes/diferencias/revisar', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarRevision.value = false; aplicada = true;
            toast.add({ severity: 'success', summary: 'Diferencias de caja', detail: r.mensaje, life: 5000 });
        } catch (e) { errorRevision.value = e.message || 'No fue posible registrar la revision.'; }
        finally { guardandoRevision.value = false; }
        if (aplicada) await handleActualizar();
    };
    onMounted(handleActualizar);
    return { mostrarRevision, guardandoRevision, corteRevision, motivoRevision, errorRevision, autorizaResolucion, revisionValida, handleEstadoRevision, handleRevision, handleGuardarRevision, cajas, cajaId, cajaActual, detalle, cortes, desde, hasta, periodo, periodos, primero, limite, total, cargando, guardando, error, errorFormulario, mostrar, cerrando, contado, observaciones, usarDesglose, denominaciones, nombreUsuario, puedeAbrir, puedeCerrar, totalContado, diferencia, formularioValido, mostrarDetalle, seleccionado, datosDetalle, handleConsultar, handleActualizar, handlePagina, handlePeriodo, handleAbrir, handleCerrar, handleDetalle, handleGuardar, handleMoneda, handleFechaHora, handleDiferencia };
}
