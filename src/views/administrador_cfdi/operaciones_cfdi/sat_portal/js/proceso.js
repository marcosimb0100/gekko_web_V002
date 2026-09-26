import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ==========================================================
    // ARCHIVOS
    // ==========================================================

    const archivoCer = ref(null);

    const archivoKey = ref(null);

    const password = ref('');

    // ==========================================================
    // ESTADOS
    // ==========================================================

    const validando = ref(false);

    const conectando = ref(false);

    const efirmaValidada = ref(false);

    const datosEfirma = ref({});

    const sesionSat = ref(null);

    const procesando = computed(() => {
        return validando.value || conectando.value;
    });

    // ==========================================================
    // BOTON VALIDAR
    // ==========================================================

    const botonValidarDeshabilitado = computed(() => {
        return !archivoCer.value || !archivoKey.value || !password.value || validando.value;
    });

    // ==========================================================
    // SELECCION CER
    // ==========================================================

    const handleSeleccionarCer = (event) => {
        archivoCer.value = event.files?.[0] || null;

        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;
    };

    // ==========================================================
    // SELECCION KEY
    // ==========================================================

    const handleSeleccionarKey = (event) => {
        archivoKey.value = event.files?.[0] || null;

        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;
    };

    // ==========================================================
    // CREAR FORM DATA
    // ==========================================================

    const handleCrearFormData = () => {
        const formData = new FormData();

        formData.append('cer', archivoCer.value);

        formData.append('key', archivoKey.value);

        formData.append('password', password.value);

        return formData;
    };

    // ==========================================================
    // VALIDAR E.FIRMA
    // ==========================================================

    const handleValidarEfirma = async () => {
        if (!archivoCer.value || !archivoKey.value || !password.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Selecciona CER, KEY e ingresa la contraseña.',
                life: 3500
            });

            return;
        }

        validando.value = true;

        try {
            const formData = handleCrearFormData();

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/sat_portal/validar_efirma',

                formData
            });

            if (res.estatus !== 200) {
                efirmaValidada.value = false;

                datosEfirma.value = {};

                toast.add({
                    severity: 'error',
                    summary: 'e.firma',
                    detail: res.mensaje ?? 'No fue posible validar la e.firma.',
                    life: 4500
                });

                return;
            }

            datosEfirma.value = res.datos || {};

            efirmaValidada.value = true;

            toast.add({
                severity: 'success',
                summary: 'e.firma',
                detail: res.mensaje ?? 'La e.firma fue validada correctamente.',
                life: 3500
            });
        } catch (error) {
            console.error('ERROR VALIDAR EFIRMA:', error);

            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No fue posible validar la e.firma.',
                life: 3500
            });
        } finally {
            validando.value = false;
        }
    };

    // ==========================================================
    // INICIAR SESION SAT
    // ==========================================================

    const handleIniciarSesion = async () => {
        if (!efirmaValidada.value) {
            toast.add({
                severity: 'warn',
                summary: 'SAT',
                detail: 'Primero valida la e.firma.',
                life: 3000
            });

            return;
        }

        conectando.value = true;

        try {
            const formData = handleCrearFormData();

            const res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/sat_portal/iniciar_sesion',

                formData
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: res.estatus === 501 ? 'info' : 'error',

                    summary: 'Portal SAT',

                    detail: res.mensaje ?? 'No fue posible iniciar sesión con el SAT.',

                    life: 5000
                });

                return;
            }

            sesionSat.value = {
                sesion_id: res.datos?.sesion_id,

                rfc: res.datos?.rfc
            };

            toast.add({
                severity: 'success',
                summary: 'Portal SAT',
                detail: res.mensaje ?? 'Sesión SAT iniciada correctamente.',
                life: 3500
            });
        } catch (error) {
            console.error('ERROR INICIAR SESION SAT:', error);

            toast.add({
                severity: 'error',
                summary: 'Portal SAT',
                detail: 'No fue posible iniciar sesión con el SAT.',
                life: 3500
            });
        } finally {
            conectando.value = false;
        }
    };

    // ==========================================================
    // FECHA
    // ==========================================================

    const handleFecha = (fecha) => {
        if (!fecha) {
            return '-';
        }

        try {
            return new Date(fecha).toLocaleString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch {
            return fecha;
        }
    };

    // ==========================================================
    // LIMPIAR
    // ==========================================================

    const handleLimpiar = () => {
        archivoCer.value = null;

        archivoKey.value = null;

        password.value = '';

        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;
    };

    return {
        archivoCer,

        archivoKey,

        password,

        validando,

        conectando,

        procesando,

        efirmaValidada,

        datosEfirma,

        sesionSat,

        botonValidarDeshabilitado,

        handleSeleccionarCer,

        handleSeleccionarKey,

        handleValidarEfirma,

        handleIniciarSesion,

        handleFecha,

        handleLimpiar
    };
};

export default useProceso;
