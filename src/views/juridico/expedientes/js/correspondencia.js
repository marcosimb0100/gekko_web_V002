import { ref, watch, onBeforeUnmount } from 'vue';

export default function correspondencia({ store, toast, seleccionado, detalleTab, detalleCerrado, handleDetalle }) {
    const correos = ref([]), totalCorreos = ref(0), primeroCorreos = ref(0), limiteCorreos = ref(10);
    const cargandoCorreos = ref(false), subiendoCorreo = ref(false), errorCorreos = ref(''), verCorreosRetirados = ref(false), intentoCorreo = ref(0);
    const mostrarCorreo = ref(false), correoSeleccionado = ref(null), leyendoCorreo = ref(false);
    const mostrarRetiroCorreo = ref(false), correoRetiro = ref(null), motivoRetiroCorreo = ref(''), retirandoCorreo = ref(false), errorRetiroCorreo = ref('');
    const incorporandoAdjunto = ref(false);
    let consulta = 0, lectura = 0, activo = true;
    const direccion = (id) => `/juridico/expedientes/${id}/correspondencia`;
    async function handleCargarCorreos() {
        const id = seleccionado.value?.id, turno = ++consulta;
        if (!id) return;
        cargandoCorreos.value = true; errorCorreos.value = '';
        try {
            const q = new URLSearchParams({ pagina: String(Math.floor(primeroCorreos.value / limiteCorreos.value) + 1), limite: String(limiteCorreos.value), retirados: String(verCorreosRetirados.value) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: direccion(id) + '?' + q });
            if (!activo || turno !== consulta || seleccionado.value?.id !== id) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            correos.value = r.datos.correos || []; totalCorreos.value = r.datos.total || 0;
        } catch (e) { if (activo && turno === consulta) { errorCorreos.value = e.message; correos.value = []; totalCorreos.value = 0; } }
        finally { if (activo && turno === consulta) cargandoCorreos.value = false; }
    }
    async function handleSubirCorreo(e) {
        const id = seleccionado.value?.id, archivo = e.files?.[0];
        if (!id || !archivo || subiendoCorreo.value || detalleCerrado.value) return;
        subiendoCorreo.value = true; errorCorreos.value = '';
        try {
            const formData = new FormData(); formData.append('archivo', archivo);
            const r = await store.dispatch('api/apiPostTokenFormData', { direccion: direccion(id), formData });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            primeroCorreos.value = 0;
            await handleDetalle({ id }); await handleCargarCorreos();
            toast.add({ severity: 'success', summary: 'Correspondencia', detail: r.mensaje, life: 4000 });
        } catch (e) { errorCorreos.value = e.message || 'No fue posible incorporar el correo.'; }
        finally { subiendoCorreo.value = false; intentoCorreo.value++; }
    }
    async function handleVerCorreo(fila) {
        const id = seleccionado.value?.id, turno = ++lectura;
        if (!id) return;
        mostrarCorreo.value = true; correoSeleccionado.value = null; leyendoCorreo.value = true; errorCorreos.value = '';
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: direccion(id) + '/' + fila.id });
            if (!activo || turno !== lectura || seleccionado.value?.id !== id) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            correoSeleccionado.value = r.datos.correo;
        } catch (e) { errorCorreos.value = e.message; mostrarCorreo.value = false; }
        finally { if (activo && turno === lectura) leyendoCorreo.value = false; }
    }
    async function handleDescargarCorreo(correo, adjunto = null) {
        try {
            const sufijo = adjunto ? `/adjuntos/${adjunto.id}` : '/original';
            const r = await store.dispatch('api/apiGetblob', { direccion: direccion(seleccionado.value.id) + '/' + correo.id + sufijo });
            if (r.estatus !== 200 || !r.data) throw new Error(r.mensaje || 'Archivo no disponible.');
            const url = URL.createObjectURL(r.data), a = document.createElement('a');
            a.href = url; a.download = adjunto?.nombre || correo.nombre; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) { toast.add({ severity: 'error', summary: 'Correspondencia', detail: e.message, life: 5000 }); }
    }
    const handleRetirarCorreo = (fila) => { correoRetiro.value = fila; motivoRetiroCorreo.value = ''; errorRetiroCorreo.value = ''; mostrarRetiroCorreo.value = true; };
    async function handleConfirmarRetiroCorreo() {
        if (retirandoCorreo.value || motivoRetiroCorreo.value.trim().length < 3) return;
        const id = seleccionado.value.id;
        retirandoCorreo.value = true; errorRetiroCorreo.value = '';
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: direccion(id) + '/' + correoRetiro.value.id + '/retirar', datosJson: { motivo: motivoRetiroCorreo.value } });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            mostrarRetiroCorreo.value = false;
            await handleDetalle({ id }); await handleCargarCorreos();
        } catch (e) { errorRetiroCorreo.value = e.message; }
        finally { retirandoCorreo.value = false; }
    }
    async function handleIncorporarAdjunto(adjunto) {
        if (incorporandoAdjunto.value || detalleCerrado.value) return;
        const id = seleccionado.value.id;
        incorporandoAdjunto.value = true;
        try {
            const r = await store.dispatch('api/apiPostToken', { direccion: direccion(id) + '/' + correoSeleccionado.value.id + `/adjuntos/${adjunto.id}/documento`, datosJson: {} });
            if (r.estatus !== 200) throw new Error(r.mensaje);
            await handleDetalle({ id });
            toast.add({ severity: 'success', summary: 'Documentos', detail: r.mensaje, life: 4000 });
        } catch (e) { toast.add({ severity: 'error', summary: 'Documentos', detail: e.message, life: 5000 }); }
        finally { incorporandoAdjunto.value = false; }
    }
    const handlePaginaCorreos = e => { primeroCorreos.value = e.first; limiteCorreos.value = e.rows; handleCargarCorreos(); };
    const handleDocumentoCompatible = a => /\.(pdf|docx|jpe?g|png)$/i.test(a.nombre);
    watch(detalleTab, v => { if (v === 'correspondencia') handleCargarCorreos(); });
    watch(verCorreosRetirados, () => { primeroCorreos.value = 0; handleCargarCorreos(); });
    watch(() => seleccionado.value?.id, (id, anterior) => {
        if (id && anterior && id !== anterior) { mostrarCorreo.value = false; correoSeleccionado.value = null; }
        if (id && detalleTab.value === 'correspondencia') handleCargarCorreos();
    });
    onBeforeUnmount(() => { activo = false; consulta++; lectura++; });
    return { correos, totalCorreos, primeroCorreos, limiteCorreos, cargandoCorreos, subiendoCorreo, errorCorreos, verCorreosRetirados, intentoCorreo,
        mostrarCorreo, correoSeleccionado, leyendoCorreo, mostrarRetiroCorreo, motivoRetiroCorreo, retirandoCorreo, errorRetiroCorreo, incorporandoAdjunto,
        handleCargarCorreos, handleSubirCorreo, handleVerCorreo, handleDescargarCorreo, handleRetirarCorreo, handleConfirmarRetiroCorreo, handleIncorporarAdjunto, handlePaginaCorreos, handleDocumentoCompatible };
}
