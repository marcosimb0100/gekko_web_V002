import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { conectarSocket, desconectarSocket, estadoSocket, probarSocket, registrarCierreSesion } from '@/helpers/socket';

export default function proceso() {
    const toast = useToast();
    const router = useRouter();
    const quitarCierre = registrarCierreSesion(() => router.replace({ name: 'acceso' }));
    const mostrarDetalle = ref(false);
    const probando = ref(false);
    const etiquetas = { conectado: 'Conectado', conectando: 'Conectando', reconectando: 'Reconectando', desconectado: 'Desconectado', sesion_cerrada: 'Sesion cerrada', sesion_vencida: 'Sesión vencida' };
    const etiqueta = computed(() => etiquetas[estadoSocket.estado] || 'Desconectado');
    const icono = computed(() => ['conectando', 'reconectando'].includes(estadoSocket.estado) ? 'pi pi-spin pi-spinner' : (estadoSocket.autorizado ? 'pi pi-wifi' : 'pi pi-exclamation-circle'));
    const severidad = computed(() => estadoSocket.autorizado ? 'success' : (estadoSocket.estado === 'sesion_vencida' ? 'danger' : 'warn'));
    const handleMostrarDetalle = () => { mostrarDetalle.value = true; };
    const handleCerrarDetalle = () => { mostrarDetalle.value = false; };
    const handleReconectar = () => conectarSocket();
    const handleCambioSesion = (evento) => {
        if (evento.key === 'token' || evento.key === null) {
            conectarSocket();
            if (!localStorage.getItem('token')) router.replace({ name: 'acceso' });
        }
    };
    const handleProbarAviso = async () => {
        if (probando.value) return;
        probando.value = true;
        try {
            const resultado = await probarSocket();
            if (resultado.estatus !== 200) toast.add({ severity: 'warn', summary: 'Tiempo real', detail: resultado.mensaje || 'No se pudo completar la prueba.', life: 5000 });
        } finally { probando.value = false; }
    };
    watch(() => estadoSocket.revisionAviso, () => {
        if (estadoSocket.ultimoAviso) toast.add({ severity: 'success', summary: 'Aviso privado', detail: estadoSocket.ultimoAviso.mensaje, life: 4000 });
    });
    onMounted(() => {
        conectarSocket();
        window.addEventListener('storage', handleCambioSesion);
    });
    onBeforeUnmount(() => {
        quitarCierre();
        window.removeEventListener('storage', handleCambioSesion);
        desconectarSocket();
    });
    return { estadoSocket, mostrarDetalle, probando, etiqueta, icono, severidad,
        handleMostrarDetalle, handleCerrarDetalle, handleReconectar, handleProbarAviso };
}
