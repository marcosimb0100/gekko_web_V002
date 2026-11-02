import { onMounted, ref } from 'vue';

export const useSyncInstaller = (store, toast) => {
    const instalador = ref(null);
    const descargandoInstalador = ref(false);
    const handleCargarInstalador = async () => {
        try {
            const res = await store.dispatch('api/apiGetToken', { direccion: '/sync/windows/instalador' });
            instalador.value = res.estatus === 200 && res.datos?.disponible ? res.datos : null;
        } catch {
            instalador.value = null;
        }
    };
    const handleDescargarInstalador = async () => {
        if (descargandoInstalador.value || !instalador.value) return;
        descargandoInstalador.value = true;
        try {
            const res = await store.dispatch('api/apiGetblob', { direccion: '/sync/windows/instalador/descarga' });
            if (res.estatus !== 200 || !res.data) throw new Error('No fue posible descargar el instalador. Comprueba que el servicio siga habilitado.');
            const url = URL.createObjectURL(res.data);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = instalador.value.nombre;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Gekko Sync Windows', detail: error.message, life: 6000 });
            await handleCargarInstalador();
        } finally {
            descargandoInstalador.value = false;
        }
    };
    onMounted(handleCargarInstalador);
    return { instalador, descargandoInstalador, handleDescargarInstalador };
};
