import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

export default function useProceso(props, emit) {
    const store = useStore();
    const visible = computed({
        get: () => Boolean(props.factura),
        set: (abierto) => {
            if (!abierto) emit('cerrar');
        }
    });
    const relaciones = ref([]);
    const tipoRelacion = ref(null);
    const motivo = ref('');
    const importe = ref(null);
    const cargando = ref(false);
    const errorCatalogo = ref('');

    watch(() => props.factura, async (factura, _, onCleanup) => {
        if (!factura) return;
        let vigente = true;
        onCleanup(() => { vigente = false; });
        relaciones.value = [];
        tipoRelacion.value = null;
        motivo.value = '';
        importe.value = null;
        errorCatalogo.value = '';
        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', { direccion: '/sat/sat_tipo_relacion' });
            if (!vigente) return;
            const relacion = res.estatus === 200 && res.datos?.tipos_relacion?.find(({ clave }) => clave === '01');
            if (!relacion) {
                errorCatalogo.value = 'No se pudo cargar la relación de nota de crédito.';
                return;
            }
            relaciones.value = [{ ...relacion, etiqueta: `${relacion.clave} - ${relacion.descripcion}` }];
            tipoRelacion.value = relacion.clave;
        } catch {
            if (vigente) errorCatalogo.value = 'No se pudo consultar el catálogo SAT.';
        } finally {
            if (vigente) cargando.value = false;
        }
    }, { immediate: true });

    return { visible, tipoRelacion, relaciones, cargando, errorCatalogo, motivo, importe };
}
