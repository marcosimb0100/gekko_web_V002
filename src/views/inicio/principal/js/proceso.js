import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default function proceso() {
    const store = useStore(), router = useRouter();
    const nombreUsuario = ref(localStorage.getItem('nombre_completo') || 'Usuario');
    const fotoUsuario = ref(null), secciones = ref([]), cargando = ref(false), error = ref(''), actualizado = ref('');
    const ayuda = ref(null);
    const handleAyuda = bloque => { ayuda.value = bloque; };
    const handleTono = item => Number(item.valor) > 0 ? item.tono : 'normal';
    const handleSubtitulo = bloque => ({ mesa: 'Revisi\u00f3n y timbrado', pagos: 'Vencimientos y abonos', bancos: 'Informaci\u00f3n bancaria registrada', efectivo: 'Disponibilidad y jornadas', juridico: 'Asuntos y compromisos', cancelaciones: 'Seguimiento de solicitudes', rh: 'Solicitudes de personal', nube: 'Contenido disponible para ti' }[bloque.id] || 'Resumen operativo');
    const handleTituloLista = bloque => ({ pagos: 'Vencimientos por atender', bancos: '\u00daltimos saldos por cuenta', efectivo: 'Tus cajas', juridico: 'Compromisos por atender', nube: 'Repositorios autorizados' }[bloque.id] || 'Registros recientes');
    const fechaActual = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let activo = true;
    const handleMoneda = valor => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor));
    const handleFecha = valor => /^\d{4}-\d{2}-\d{2}/.test(String(valor || '')) ? String(valor).slice(0, 10) : '';
    const handleHora = valor => valor ? new Date(valor).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
    const handleValor = item => item.tipo === 'moneda' ? handleMoneda(item.valor) : new Intl.NumberFormat('es-MX').format(item.valor);
    const handleImporte = item => Object.prototype.hasOwnProperty.call(item, 'importe');
    const handleIrModulo = bloque => {
        if (secciones.value.some(item => item.id === bloque.id && item.ruta === bloque.ruta) && bloque.ruta) router.push(bloque.ruta);
    };
    const handleCargar = async () => {
        if (cargando.value) return;
        cargando.value = true; error.value = '';
        try {
            const respuesta = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/inicio/resumen' });
            if (!activo) return;
            if (respuesta?.estatus !== 200) throw new Error(respuesta?.mensaje || 'No fue posible consultar tu resumen.');
            secciones.value = respuesta.datos?.secciones || [];
            actualizado.value = respuesta.datos?.actualizado || '';
        } catch (e) {
            if (activo) { error.value = e.message || 'No fue posible consultar tu resumen.'; secciones.value = []; actualizado.value = ''; }
        } finally { if (activo) cargando.value = false; }
    };
    const handleCargarFoto = async () => {
        try {
            const r = await store.dispatch('api/apiGetblob', { direccion: '/usuarios/foto' });
            if (activo && r.estatus === 200 && r.data instanceof Blob && r.data.type.startsWith('image/')) fotoUsuario.value = URL.createObjectURL(r.data);
        } catch { /* Se conserva el avatar predeterminado. */ }
    };
    const handleErrorFoto = () => {
        if (fotoUsuario.value) URL.revokeObjectURL(fotoUsuario.value);
        fotoUsuario.value = null;
    };
    onMounted(() => Promise.allSettled([handleCargar(), handleCargarFoto()]));
    onUnmounted(() => { activo = false; handleErrorFoto(); });
    return { ayuda, handleAyuda, handleTono, handleSubtitulo, handleTituloLista, nombreUsuario, fotoUsuario, fechaActual, secciones, cargando, error, actualizado,
        handleCargar, handleIrModulo, handleMoneda, handleValor, handleImporte, handleFecha, handleHora, handleErrorFoto };
}
