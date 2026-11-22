import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function proceso() {
    const store = useStore(), toast = useToast();
    const resumen = ref(null), ocupado = ref(false), confirmar = ref(false), texto = ref(''), detenidos = ref(false);
    let confirmacionId = null;
    const handleError = error => toast.add({ severity: 'error', summary: 'Reinicio de datos', detail: error.message || 'No fue posible completar la operación.', life: 9000 });
    const handleCargar = async () => {
        if (ocupado.value) return;
        ocupado.value = true;
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/reiniciar_datos/' });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            resumen.value = res.datos;
            toast.add({ severity: 'info', summary: res.datos.mantenimiento ? 'Modo mantenimiento' : 'Solo vista previa',
                detail: 'Se conserva tu usuario ROOT, el menú general y los catálogos técnicos. Se eliminan los catálogos capturados y las compañías. Los archivos físicos permanecen. El reinicio no cancela CFDI ante el SAT.',
                life: 8000 });
        } catch (error) { handleError(error); }
        finally { ocupado.value = false; }
    };
    const handlePreparar = async () => {
        if (ocupado.value) return;
        ocupado.value = true;
        try {
            const res = await store.dispatch('api/apiPostToken', { direccion: '/reiniciar_datos/preparar', datosJson: {} });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            resumen.value = res.datos;
            confirmacionId = res.datos.confirmacion_id;
            texto.value = ''; detenidos.value = false; confirmar.value = true;
        } catch (error) { handleError(error); }
        finally { ocupado.value = false; }
    };
    const handleEjecutar = async () => {
        if (ocupado.value || !detenidos.value || texto.value !== 'REINICIAR ' + resumen.value.base) return;
        ocupado.value = true;
        try {
            const res = await store.dispatch('api/apiPostToken', { direccion: '/reiniciar_datos/ejecutar',
                datosJson: { confirmacion_id: confirmacionId, texto: texto.value, servicios_detenidos: detenidos.value } });
            if (res.estatus !== 200) throw new Error(res.mensaje);
            confirmar.value = false; confirmacionId = null;
            toast.add({ severity: 'success', summary: 'Reinicio finalizado', detail: res.datos.mensaje + ' Respaldo: ' + res.datos.respaldo, life: 15000 });
        } catch (error) { handleError(error); }
        finally { ocupado.value = false; }
    };
    onMounted(handleCargar);
    return { resumen, ocupado, confirmar, texto, detenidos, handleCargar, handlePreparar, handleEjecutar };
}
