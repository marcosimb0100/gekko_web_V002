import { useToast } from 'primevue/usetoast';
import { reactive } from 'vue';
import { useStore } from 'vuex';

const catSatInit = () => ({
    regimen_fiscal: [],
    banco: [],
    clave_unidad: [],
    exportacion: [],
    objeto_imp: [],
    uso_cfdi: [],
    metodo_pago: [],
    forma_pago: []
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const catSat = reactive(catSatInit());

    const handleCargarCatalogos = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/sat/sat_empresa`
        });

        if (res.estatus === 200) {
            Object.assign(catSat, {
                regimen_fiscal: res.datos?.regimen_fiscal ?? [],
                banco: res.datos?.banco ?? [],
                clave_unidad: res.datos?.clave_unidad ?? [],
                exportacion: res.datos?.exportacion ?? [],
                objeto_imp: res.datos?.objeto_imp ?? [],
                uso_cfdi: res.datos?.uso_cfdi ?? [],
                metodo_pago: res.datos?.metodo_pago ?? [],
                forma_pago: res.datos?.forma_pago ?? []
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    const handleInit = async () => {
        await handleCargarCatalogos();
    };

    handleInit();

    return {
        catSat
    };
};

export default useProceso;
