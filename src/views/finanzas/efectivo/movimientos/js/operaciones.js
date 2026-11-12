import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function useOperaciones({ cajaId, cajas, detalle, hoy, handleActualizar }) {
    const store = useStore(), toast = useToast();
    const intentoComprobante = ref(0);
    const mostrarComprobantes = ref(false), movimientoComprobante = ref(null), comprobantes = ref([]);
    const cargandoComprobantes = ref(false), guardandoComprobante = ref(false), errorComprobante = ref('');
    const verRetirados = ref(false), mostrarRetiro = ref(false), comprobanteRetirar = ref(null), motivoRetiro = ref(''), errorRetiro = ref(''), retirandoComprobante = ref(false);
    const comprobantesVigentes = computed(() => comprobantes.value.filter(f => !f.retirado));
    const comprobantesVisibles = computed(() => verRetirados.value ? comprobantes.value : comprobantesVigentes.value);
    const retiroValido = computed(() => motivoRetiro.value.trim().length >= 3 && motivoRetiro.value.trim().length <= 1000);
    const handleFechaComprobante = fecha => fecha ? new Date(fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '';
    const mostrarTraspaso = ref(false), cargandoTraspaso = ref(false), guardandoTraspaso = ref(false), errorTraspaso = ref('');
    const soporteTraspasos = ref(false), saldosTraspaso = ref(null);
    const traspaso = reactive({ destino: null, importe: null, motivo: '' });
    let operacion = null, origen = null, versiones = null;
    const destinos = computed(() => cajas.value.filter(c => c.activo && c.id !== cajaId.value));
    const traspasoValido = computed(() => saldosTraspaso.value && Number.isFinite(traspaso.importe) && traspaso.importe > 0 && Math.round(traspaso.importe*100) <= Math.round(Number(saldosTraspaso.value.origen)*100) && traspaso.motivo.trim().length >= 3 && !cargandoTraspaso.value);
    const handleCargarComprobantes = async () => {
        cargandoComprobantes.value = true;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: `/efectivo/movimientos/${movimientoComprobante.value.id}/comprobantes` });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            comprobantes.value = r.datos.archivos || [];
        } catch (e) { errorComprobante.value = e.message || 'No fue posible consultar los comprobantes.'; }
        finally { cargandoComprobantes.value = false; }
    };
    const handleComprobantes = async fila => {
        if (guardandoComprobante.value || retirandoComprobante.value || cargandoComprobantes.value) return;
        verRetirados.value = false; movimientoComprobante.value = fila; comprobantes.value = []; errorComprobante.value = ''; mostrarComprobantes.value = true;
        await handleCargarComprobantes();
    };
    const handleSubirComprobante = async e => {
        if (guardandoComprobante.value || retirandoComprobante.value || cargandoComprobantes.value) return;
        const archivo = e.files?.[0];
        if (!archivo) return;
        guardandoComprobante.value = true; errorComprobante.value = '';
        try {
            const formData = new FormData(); formData.append('archivo', archivo);
            const r = await store.dispatch('api/apiPostTokenFormData', { direccion: `/efectivo/movimientos/${movimientoComprobante.value.id}/comprobantes`, formData });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            await handleCargarComprobantes();
            toast.add({ severity: 'success', summary: 'Comprobantes', detail: r.mensaje, life: 4000 });
        } catch (e) { errorComprobante.value = e.message || 'No fue posible adjuntar el comprobante.'; }
        finally { guardandoComprobante.value = false; intentoComprobante.value += 1; }
    };
    const handleDescargarComprobante = async archivo => {
        errorComprobante.value = '';
        try {
            const r = await store.dispatch('api/apiGetblob', { direccion: `/efectivo/movimientos/${movimientoComprobante.value.id}/comprobantes/${archivo.id}` });
            if (r.estatus !== 200 || !r.data) throw new Error(r.mensaje || 'No fue posible descargar el comprobante.');
            const url = URL.createObjectURL(r.data), enlace = document.createElement('a');
            enlace.href = url; enlace.download = archivo.nombre; enlace.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) { errorComprobante.value = e.message || 'No fue posible descargar.'; }
    };
    const handleRetirarComprobante = archivo => {
        if (archivo.retirado || guardandoComprobante.value || retirandoComprobante.value) return;
        comprobanteRetirar.value = archivo; motivoRetiro.value = ''; errorRetiro.value = ''; mostrarRetiro.value = true;
    };
    const handleConfirmarRetiro = async () => {
        if (retirandoComprobante.value || !retiroValido.value) return;
        retirandoComprobante.value = true; errorRetiro.value = '';
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: `/efectivo/movimientos/${movimientoComprobante.value.id}/comprobantes/${comprobanteRetirar.value.id}/retirar`, datosJson: { motivo: motivoRetiro.value } });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarRetiro.value = false; errorComprobante.value = '';
            await handleCargarComprobantes();
            toast.add({ severity: 'success', summary: 'Comprobantes', detail: r.mensaje, life: 5000 });
        } catch (e) { errorRetiro.value = e.message || 'No fue posible retirar el comprobante.'; }
        finally { retirandoComprobante.value = false; }
    };
    const handleTraspaso = () => {
        if (!detalle.value?.puede_traspasar) return;
        origen = cajaId.value; operacion = crypto.randomUUID(); versiones = null; saldosTraspaso.value = null;
        Object.assign(traspaso, { destino: null, importe: null, motivo: '' }); errorTraspaso.value = ''; mostrarTraspaso.value = true;
    };
    const handleConsultarTraspaso = async () => {
        saldosTraspaso.value = null; versiones = null; errorTraspaso.value = '';
        if (!traspaso.destino || !soporteTraspasos.value) return;
        cargandoTraspaso.value = true;
        try {
            const fecha = `${hoy.value.getFullYear()}-${String(hoy.value.getMonth()+1).padStart(2,'0')}-${String(hoy.value.getDate()).padStart(2,'0')}`;
            const consultar = id => store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/movimientos/?' + new URLSearchParams({ caja_id: id, desde: fecha, hasta: fecha, limite: '10' }) });
            const [a,b] = await Promise.all([consultar(origen), consultar(traspaso.destino)]);
            if (a.estatus !== 200 || b.estatus !== 200) throw new Error(a.estatus !== 200 ? a.mensaje : b.mensaje);
            if (!a.datos.jornada_id || !b.datos.jornada_id) throw new Error('Abre una jornada en ambas cajas antes del traspaso.');
            versiones = { [origen]: a.datos.secuencia, [traspaso.destino]: b.datos.secuencia };
            saldosTraspaso.value = { origen: a.datos.saldo_actual, destino: b.datos.saldo_actual };
        } catch (e) { errorTraspaso.value = e.message || 'No fue posible consultar los saldos.'; }
        finally { cargandoTraspaso.value = false; }
    };
    const handleGuardarTraspaso = async () => {
        if (guardandoTraspaso.value || !traspasoValido.value || !soporteTraspasos.value) return;
        guardandoTraspaso.value = true; errorTraspaso.value = ''; let registrado = false;
        try {
            const datosJson = { operacion_id: operacion, origen, destino: traspaso.destino, importe: String(traspaso.importe), motivo: traspaso.motivo, secuencias: versiones };
            const r = await store.dispatch('api/apiPostToken', { direccion: '/efectivo/movimientos/traspasar', datosJson });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarTraspaso.value = false; registrado = true;
            toast.add({ severity: 'success', summary: 'Traspaso de efectivo', detail: r.mensaje, life: 5000 });
        } catch (e) { errorTraspaso.value = e.message || 'No fue posible confirmar. Reintenta con la misma operacion.'; }
        finally { guardandoTraspaso.value = false; }
        if (registrado) await handleActualizar();
    };
    return { verRetirados, mostrarRetiro, comprobanteRetirar, motivoRetiro, errorRetiro, retirandoComprobante, comprobantesVigentes, comprobantesVisibles, retiroValido, handleFechaComprobante, handleRetirarComprobante, handleConfirmarRetiro, intentoComprobante, mostrarComprobantes, movimientoComprobante, comprobantes, cargandoComprobantes, guardandoComprobante, errorComprobante, handleComprobantes, handleSubirComprobante, handleDescargarComprobante,
        mostrarTraspaso, cargandoTraspaso, guardandoTraspaso, errorTraspaso, soporteTraspasos, saldosTraspaso, traspaso, destinos, traspasoValido, handleTraspaso, handleConsultarTraspaso, handleGuardarTraspaso };
}
