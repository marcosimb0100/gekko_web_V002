import { handleFechaJuridico } from '@/helpers/fechaJuridico';
import { ref, reactive, watch, onBeforeUnmount } from 'vue';

export default function seguimiento({ store, router, toast }) {
    const mostrarSeguimiento = ref(false), expedienteSeguimiento = ref(null), seguimientoTab = ref('historial');
    const cargandoSeguimiento = ref(false), errorSeguimiento = ref(''), verExpediente = ref(false), mostrarRetirados = ref(false);
    const detalleSeguimiento = reactive({ historial: [], documentos: [], correos: [] });
    const totalesSeguimiento = reactive({ historial: 0, documentos: 0, correos: 0 });
    const paginasSeguimiento = reactive({ historial: 0, documentos: 0, correos: 0 });
    const mostrarCorreoSeguimiento = ref(false), correoSeguimiento = ref(null), leyendoCorreo = ref(false);
    let id = null, consulta = 0, lectura = 0, activo = true;
    const baseUrl = () => '/juridico/tablero/' + id;
    async function handleCargarSeguimiento() {
        if (!id || !mostrarSeguimiento.value) return;
        const turno = ++consulta, caso = id, vista = seguimientoTab.value;
        cargandoSeguimiento.value = true; errorSeguimiento.value = '';
        try {
            const q = new URLSearchParams({ vista, pagina: String(Math.floor(paginasSeguimiento[vista] / 10) + 1), limite: '10', retirados: String(mostrarRetirados.value) });
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: baseUrl() + '/seguimiento?' + q });
            if (!activo || turno !== consulta || id !== caso || !mostrarSeguimiento.value) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            expedienteSeguimiento.value = r.datos.expediente;
            detalleSeguimiento[vista] = r.datos.registros || [];
            totalesSeguimiento[vista] = r.datos.total || 0;
            verExpediente.value = r.datos.ver_expedientes === true;
        } catch (e) {
            if (turno === consulta && activo) { errorSeguimiento.value = e.message || 'No fue posible consultar el seguimiento.'; detalleSeguimiento[vista] = []; }
        } finally { if (activo && turno === consulta) cargandoSeguimiento.value = false; }
    }
    const handleSeguimiento = (fila) => {
        consulta++; lectura++; id = fila.expediente_id;
        expedienteSeguimiento.value = { id, folio: fila.expediente_folio, titulo: fila.expediente_titulo, empresa_nombre: fila.empresa_nombre };
        Object.keys(detalleSeguimiento).forEach(k => { detalleSeguimiento[k] = []; totalesSeguimiento[k] = 0; paginasSeguimiento[k] = 0; });
        verExpediente.value = false; mostrarRetirados.value = false; mostrarCorreoSeguimiento.value = false; correoSeguimiento.value = null;
        seguimientoTab.value = 'historial'; mostrarSeguimiento.value = true;
        handleCargarSeguimiento();
    };
    const handlePaginaSeguimiento = e => { paginasSeguimiento[seguimientoTab.value] = e.first; handleCargarSeguimiento(); };
    const handleAbrirExpediente = () => {
        if (!verExpediente.value || !id) return;
        mostrarSeguimiento.value = false;
        router.push({ path: '/juridico/expedientes', query: { expediente: id } });
    };
    const handleFechaSeguimiento = valor => handleFechaJuridico(valor, true, 'No disponible');
    const handleIconoEvento = evento => /correo/i.test(evento.accion) ? 'pi pi-envelope' : /documento/i.test(evento.accion) ? 'pi pi-paperclip' : /cumplida/i.test(evento.accion) ? 'pi pi-check' : /actuacion/i.test(evento.accion) ? 'pi pi-file-edit' : 'pi pi-history';
    async function handleDescargarSeguimiento(archivo, correo = null, adjunto = null) {
        if (!id) return;
        try {
            const url = correo ? baseUrl() + `/correspondencia/${correo.id}/` + (adjunto ? `adjuntos/${adjunto.id}` : 'original') : baseUrl() + '/documentos/' + archivo.id;
            const r = await store.dispatch('api/apiGetblob', { direccion: url });
            if (r.estatus !== 200 || !r.data) throw new Error(r.mensaje || 'Archivo no disponible.');
            const blobUrl = URL.createObjectURL(r.data), a = document.createElement('a');
            a.href = blobUrl; a.download = adjunto?.nombre || correo?.nombre || archivo.nombre; a.click();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (e) { toast.add({ severity:'error', summary:'Seguimiento', detail:e.message, life:5000 }); }
    }
    async function handleLeerCorreoSeguimiento(fila) {
        const caso = id, turno = ++lectura;
        mostrarCorreoSeguimiento.value = true; leyendoCorreo.value = true; correoSeguimiento.value = null;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: baseUrl() + '/correspondencia/' + fila.id });
            if (!activo || turno !== lectura || id !== caso || !mostrarSeguimiento.value) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            correoSeguimiento.value = r.datos.correo;
        } catch (e) { if (turno === lectura) { mostrarCorreoSeguimiento.value = false; toast.add({ severity:'error', summary:'Correo', detail:e.message, life:5000 }); } }
        finally { if (activo && turno === lectura) leyendoCorreo.value = false; }
    }
    watch(seguimientoTab, () => { if (mostrarSeguimiento.value) handleCargarSeguimiento(); });
    watch(mostrarRetirados, () => { paginasSeguimiento.documentos = 0; paginasSeguimiento.correos = 0; if (seguimientoTab.value !== 'historial') handleCargarSeguimiento(); });
    watch(mostrarSeguimiento, v => { if (!v) { consulta++; lectura++; mostrarCorreoSeguimiento.value = false; } });
    onBeforeUnmount(() => { activo = false; consulta++; lectura++; });
    return { mostrarSeguimiento, expedienteSeguimiento, seguimientoTab, cargandoSeguimiento, errorSeguimiento, verExpediente, mostrarRetirados,
        detalleSeguimiento, totalesSeguimiento, paginasSeguimiento, mostrarCorreoSeguimiento, correoSeguimiento, leyendoCorreo,
        handleSeguimiento, handleCargarSeguimiento, handlePaginaSeguimiento, handleAbrirExpediente, handleFechaSeguimiento, handleIconoEvento, handleDescargarSeguimiento, handleLeerCorreoSeguimiento };
}
