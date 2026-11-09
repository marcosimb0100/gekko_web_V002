import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { estadoSocket } from '@/helpers/socket';
import { avanceSat, trabajoSat, actualizandoSat, descripcionSat, revisionFinSat, handleSeguirSat, handleConsultarSat, handleRecuperarSat, handleDetenerSeguimientoSat } from '@/helpers/actualizacionSat';

export default function proceso() {
    const store = useStore(), toast = useToast();
    const mostrarDetalle = ref(false);
    const porcentaje = computed(() => Math.max(0, Math.min(100, Number(avanceSat.value.porcentaje) || 0)));
    const resumen = computed(() => avanceSat.value.resultado?.datos || {});
    const handleMostrarDetalle = () => { mostrarDetalle.value = true; handleConsultarSat(); };
    const handleCerrarDetalle = () => { mostrarDetalle.value = false; };
    watch(() => estadoSocket.revisionSat, () => {
        if (trabajoSat.value && trabajoSat.value !== estadoSocket.trabajoSat && actualizandoSat.value) return;
        handleSeguirSat(store, estadoSocket.trabajoSat);
    });
    watch(() => estadoSocket.revisionConexion, () => { if (trabajoSat.value) handleConsultarSat(); });
    watch(revisionFinSat, () => {
        const datos = avanceSat.value, fin = datos.resultado;
        const correcto = datos.estado === 'finalizado' && fin?.estatus === 200;
        toast.add({ severity: correcto ? (resumen.value.errores ? 'warn' : 'success') : 'error', summary: 'Actualizacion SAT',
            detail: correcto ? `${resumen.value.procesados || 0} CFDI procesados. ${resumen.value.proveedores?.creados || 0} proveedores nuevos. ${resumen.value.proveedores?.actualizados || 0} actualizaciones de proveedores. ${resumen.value.errores || 0} errores.` : (datos.mensaje || fin?.mensaje || 'La actualizacion se interrumpio.'), life: 7000 });
    });
    onMounted(() => handleRecuperarSat(store));
    onBeforeUnmount(handleDetenerSeguimientoSat);
    return { mostrarDetalle, avanceSat, trabajoSat, actualizandoSat, descripcionSat, porcentaje, resumen, handleMostrarDetalle, handleCerrarDetalle };
}
