import { ref, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

export default function proceso(props) {
    const store = useStore();
    const mostrar = ref(false),
        cargando = ref(false),
        error = ref(''),
        url = ref(''),
        tipo = ref('');
    let intento = 0;
    const handleCerrar = () => {
        intento++;
        if (url.value) URL.revokeObjectURL(url.value);
        url.value = '';
        cargando.value = false;
    };
    const handleMostrar = async () => {
        if (props.disabled || cargando.value) return;
        handleCerrar();
        const actual = ++intento;
        mostrar.value = true;
        cargando.value = true;
        error.value = '';
        try {
            const extension = String(props.archivo.nombre || '')
                .split('.')
                .pop()
                .toLowerCase();
            const mime = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[extension];
            if (!mime) throw new Error('Este formato no admite vista previa. Puedes descargar el comprobante.');
            const r = await store.dispatch('api/apiGetblob', { direccion: props.direccion });
            if (actual !== intento || !mostrar.value) return;
            if (r.estatus !== 200 || !(r.data instanceof Blob)) throw new Error(r.mensaje || 'No fue posible abrir el comprobante.');
            tipo.value = mime;
            url.value = URL.createObjectURL(new Blob([r.data], { type: mime }));
        } catch (e) {
            if (actual === intento) error.value = e.message || 'No fue posible abrir el comprobante.';
        } finally {
            if (actual === intento) cargando.value = false;
        }
    };
    const handleError = () => {
        error.value = 'No fue posible mostrar la imagen. Puedes descargar el comprobante.';
    };
    onBeforeUnmount(handleCerrar);
    return { mostrar, cargando, error, url, tipo, handleMostrar, handleCerrar, handleError };
}
