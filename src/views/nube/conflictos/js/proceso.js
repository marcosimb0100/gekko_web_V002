import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
const useProceso = () => {
    const servicioHabilitado = ref(null);
    const store = useStore();
    const toast = useToast();
    const registros = ref([]), cargando = ref(false), error = ref(''), offset = ref(0);
    const confirmacionVisible = ref(false), ayudaVisible = ref(false), seleccionado = ref(null);
    const limite = 100;
    const handleFecha = fecha => new Date(fecha).toLocaleString('es-MX');
    const handleTamano = bytes => `${(bytes / 1024).toLocaleString('es-MX', { maximumFractionDigits: 1 })} KB`;
    const handleRespuesta = res => { if (res.estatus < 200 || res.estatus >= 300) throw new Error(res.mensaje || 'No fue posible completar la operación.'); return res; };
    const handleEjecutar = async tarea => {
        if (cargando.value) return;
        cargando.value = true; error.value = '';
        try { await tarea(); } catch (e) { error.value = e.message; toast.add({ severity: 'error', summary: 'Conflictos', detail: error.value, life: 6000 }); }
        finally { cargando.value = false; }
    };
    const handleCargar = async () => {
        const res = handleRespuesta(await store.dispatch('api/apiGetToken', { direccion: `/sync/windows/administracion/conflictos?offset=${offset.value}` }));
        registros.value = res.datos.conflictos;
        servicioHabilitado.value = res.datos.servicio_habilitado === true;
    };
    const handleActualizar = () => handleEjecutar(handleCargar);
    const handlePaginar = paso => handleEjecutar(async () => { offset.value = Math.max(0, offset.value + paso * limite); await handleCargar(); });
    const handleDescargar = registro => handleEjecutar(async () => {
        const res = handleRespuesta(await store.dispatch('api/apiGetblob', { direccion: `/sync/windows/administracion/conflictos/${registro._id}/contenido` }));
        const url = URL.createObjectURL(res.data);
        const enlace = document.createElement('a'); enlace.href = url; enlace.download = registro.nombre;
        document.body.appendChild(enlace); enlace.click(); enlace.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const handleMostrarConfirmacion = registro => { seleccionado.value = registro; error.value = ''; confirmacionVisible.value = true; };
    const handleCerrarConfirmacion = () => { confirmacionVisible.value = false; };
    const handleMostrarAyuda = () => { ayudaVisible.value = true; };
    const handleCerrarAyuda = () => { ayudaVisible.value = false; };
    const handleConfirmar = () => handleEjecutar(async () => {
        handleRespuesta(await store.dispatch('api/apiPostToken', { direccion: `/sync/windows/administracion/conflictos/${seleccionado.value._id}/revisar`, datosJson: {} }));
        confirmacionVisible.value = false;
        toast.add({ severity: 'success', summary: 'Conflictos', detail: 'Revisión registrada. El contenido se conserva.', life: 3500 });
        await handleCargar();
    });
    onMounted(handleActualizar);
    return { servicioHabilitado, registros, cargando, error, offset, limite, confirmacionVisible, ayudaVisible, seleccionado, handleFecha, handleTamano,
        handleActualizar, handlePaginar, handleDescargar, handleMostrarConfirmacion, handleCerrarConfirmacion,
        handleMostrarAyuda, handleCerrarAyuda, handleConfirmar };
};
export default useProceso;
