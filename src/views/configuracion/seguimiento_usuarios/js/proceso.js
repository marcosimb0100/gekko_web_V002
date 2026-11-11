import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { estadoSocket } from '@/helpers/socket';

export default function useProceso() {
    const store = useStore();
    const sesiones = ref([]);
    const busqueda = ref('');
    const error = ref('');
    const cargando = ref(false);
    const consultado = ref(null);
    const enVivo = computed(() => estadoSocket.autorizado);
    const totalUsuarios = computed(() => new Set(sesiones.value.map((s) => s.usuario_id)).size);
    const filas = computed(() => {
        const texto = busqueda.value.trim().toLocaleLowerCase('es');
        return sesiones.value.filter((s) => `${s.nombre} ${s.correo} ${s.pantalla} ${s.ruta}`.toLocaleLowerCase('es').includes(texto));
    });
    let activo = true;
    let pendiente = false;
    let timer = null;
    const fecha = (valor) => valor ? new Date(valor).toLocaleString('es-MX') : 'Sin reporte';
    async function cargar() {
        if (!activo || cargando.value) return;
        cargando.value = true;
        pendiente = false;
        error.value = '';
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', { direccion: '/usuarios/seguimiento', datosJson: {} });
            if (!activo) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible consultar el seguimiento.');
            sesiones.value = res.datos?.sesiones || [];
            consultado.value = res.datos?.consultado || null;
        } catch (ex) {
            if (activo) { sesiones.value = []; error.value = ex.message || 'No fue posible consultar el seguimiento.'; }
        } finally {
            if (activo) {
                cargando.value = false;
                if (pendiente) actualizar();
            }
        }
    }
    function actualizar() {
        pendiente = true;
        if (!activo || document.visibilityState !== 'visible') return;
        window.clearTimeout(timer);
        timer = window.setTimeout(cargar, 200);
    }
    watch(() => estadoSocket.revisionSeguimientoUsuarios, actualizar);
    watch(() => estadoSocket.revisionConexion, actualizar);
    watch(() => estadoSocket.autorizado, (autorizado) => { if (!autorizado) sesiones.value = []; });
    onMounted(() => {
        cargar();
        document.addEventListener('visibilitychange', actualizar);
        window.addEventListener('online', actualizar);
    });
    onBeforeUnmount(() => {
        activo = false;
        window.clearTimeout(timer);
        document.removeEventListener('visibilitychange', actualizar);
        window.removeEventListener('online', actualizar);
    });
    return { busqueda, error, cargando, consultado, enVivo, totalUsuarios, sesiones, filas, fecha, cargar };
}
