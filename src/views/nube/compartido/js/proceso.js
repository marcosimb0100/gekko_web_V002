import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

export default () => {
    const route = useRoute();
    const store = useStore();
    const archivo = ref(null);
    const cargando = ref(false);
    const descargando = ref(false);
    const error = ref('');
    const descargaError = ref('');
    const descargaIniciada = ref(false);
    const enlaceFinalizado = ref(false);
    const agotado = computed(() => enlaceFinalizado.value || archivo.value?.restantes === 0);
    let activo = true;
    let consulta = 0;
    const handleTamano = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
    const handleFecha = fecha => new Date(fecha).toLocaleString('es-MX');
    const handleCargar = async () => {
        const numero = ++consulta;
        archivo.value = null; error.value = ''; descargaError.value = ''; descargaIniciada.value = false; enlaceFinalizado.value = false; cargando.value = false;
        const token = String(route.params.token || '');
        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { error.value = 'El enlace no es válido.'; return; }
        cargando.value = true;
        try {
            const res = await store.dispatch('api/apiSyncPublicInfo', { direccion: `/sync/compartidos/${encodeURIComponent(token)}/informacion` });
            if (!activo || numero !== consulta) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'Enlace vencido, revocado o agotado.');
            archivo.value = res.datos;
        } catch (e) {
            if (activo && numero === consulta) error.value = e.message;
        } finally {
            if (activo && numero === consulta) cargando.value = false;
        }
    };
    const handleDescargar = async () => {
        if (descargando.value || !archivo.value || agotado.value) return;
        descargando.value = true; descargaError.value = ''; descargaIniciada.value = false;
        const token = String(route.params.token);
        const nombre = archivo.value.nombre;
        try {
            const res = await store.dispatch('api/apiSyncPublicFile', { direccion: `/sync/compartidos/${encodeURIComponent(token)}/descarga` });
            if (!activo || token !== route.params.token) return;
            if (res.estatus !== 200 || !res.data) throw new Error(res.mensaje || 'No fue posible descargar el archivo.');
            const url = URL.createObjectURL(res.data);
            const enlace = document.createElement('a');
            enlace.href = url; enlace.download = nombre;
            document.body.appendChild(enlace); enlace.click(); enlace.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            descargaIniciada.value = true;
            // Read the authoritative counter, including downloads on other computers.
            const info = await store.dispatch('api/apiSyncPublicInfo', { direccion: `/sync/compartidos/${encodeURIComponent(token)}/informacion` });
            if (!activo || token !== route.params.token) return;
            if (info.estatus === 200) archivo.value = info.datos;
            else if (info.estatus === 410) enlaceFinalizado.value = true;
        } catch (e) {
            if (activo && token === route.params.token) descargaError.value = e.message;
        } finally {
            if (activo) descargando.value = false;
        }
    };
    watch(() => route.params.token, handleCargar, { immediate: true });
    onBeforeUnmount(() => { activo = false; });
    return { archivo, cargando, descargando, error, descargaError, descargaIniciada, agotado, handleTamano, handleFecha, handleCargar, handleDescargar };
};
