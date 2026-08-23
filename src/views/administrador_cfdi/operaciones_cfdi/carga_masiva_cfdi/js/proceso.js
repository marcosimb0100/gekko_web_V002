import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const fileUploadRef = ref(null);

    const handleCargaMasiva = async (event) => {
        const archivo = event.files?.[0];

        if (!archivo) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Selecciona un archivo ZIP.',
                life: 3000
            });

            return;
        }

        if (!archivo.name.toLowerCase().endsWith('.zip')) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El archivo debe ser formato ZIP.',
                life: 3000
            });

            return;
        }

        const formData = new FormData();

        formData.append('archivo_zip', archivo);

        const res = await store.dispatch('api/apiPostTokenFormData', {
            direccion: `/operacion_sat/carga_masiva_cfdi`,

            formData
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje ?? 'Error al cargar el archivo ZIP.',
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje ?? 'Carga masiva realizada correctamente.',
            life: 3000
        });

        if (fileUploadRef.value) {
            fileUploadRef.value.clear();
        }
    };

    return {
        fileUploadRef,

        handleCargaMasiva
    };
};

export default useProceso;
