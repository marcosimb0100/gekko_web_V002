import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const regexCorreoElectronico = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const frmCorreoInit = () => ({
    correo_electronico: '',
    clave: '',
    activo: false,
    servidor_entrante: '',
    puerto_imap: null,
    puerto_pop3: null,
    servidor_saliente: '',
    puerto_smtp: null
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const frmCorreo = reactive(frmCorreoInit());
    const correoPrueba = ref('');

    // -------------------------------------------------------------------------
    // CARGAR CONFIGURACION
    // -------------------------------------------------------------------------

    const handleCargarCorreo = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/servidor_correo/`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'info',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        const data = res.datos?.servidor_correo_electronico;

        if (!data) {
            return;
        }

        Object.assign(frmCorreo, {
            correo_electronico: data.correo_electronico ?? '',
            clave: data.clave ?? '',
            activo: data.activo ?? false,
            servidor_entrante: data.servidor_entrante ?? '',
            puerto_imap: data.puerto_imap ?? null,
            puerto_pop3: data.puerto_pop3 ?? null,
            servidor_saliente: data.servidor_saliente ?? '',
            puerto_smtp: data.puerto_smtp ?? null
        });
    };

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const correoElectronicoValido = computed(() => {
        if (!frmCorreo.correo_electronico) {
            return true;
        }

        return regexCorreoElectronico.test(frmCorreo.correo_electronico.trim().toLowerCase());
    });

    const claveValida = computed(() => {
        if (!frmCorreo.clave) {
            return true;
        }

        return frmCorreo.clave.trim().length > 0;
    });

    const servidorEntranteValido = computed(() => {
        if (!frmCorreo.servidor_entrante) {
            return true;
        }

        return frmCorreo.servidor_entrante.trim().length > 0;
    });

    const servidorSalienteValido = computed(() => {
        if (!frmCorreo.servidor_saliente) {
            return true;
        }

        return frmCorreo.servidor_saliente.trim().length > 0;
    });

    const puertoImapValido = computed(() => {
        if (!frmCorreo.puerto_imap) {
            return true;
        }

        return Number(frmCorreo.puerto_imap) > 0;
    });

    const puertoPop3Valido = computed(() => {
        if (!frmCorreo.puerto_pop3) {
            return true;
        }

        return Number(frmCorreo.puerto_pop3) > 0;
    });

    const puertoSmtpValido = computed(() => {
        if (!frmCorreo.puerto_smtp) {
            return true;
        }

        return Number(frmCorreo.puerto_smtp) > 0;
    });

    const correoPruebaValido = computed(() => {
        if (!correoPrueba.value) {
            return false;
        }

        return regexCorreoElectronico.test(correoPrueba.value.trim().toLowerCase());
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmCorreo.correo_electronico.trim()) {
            return true;
        }

        if (!frmCorreo.clave.trim()) {
            return true;
        }

        if (!frmCorreo.servidor_entrante.trim()) {
            return true;
        }

        if (!frmCorreo.servidor_saliente.trim()) {
            return true;
        }

        if (!frmCorreo.puerto_imap) {
            return true;
        }

        if (!frmCorreo.puerto_pop3) {
            return true;
        }

        if (!frmCorreo.puerto_smtp) {
            return true;
        }

        if (!correoElectronicoValido.value) {
            return true;
        }

        if (!claveValida.value) {
            return true;
        }

        if (!servidorEntranteValido.value) {
            return true;
        }

        if (!servidorSalienteValido.value) {
            return true;
        }

        if (!puertoImapValido.value) {
            return true;
        }

        if (!puertoPop3Valido.value) {
            return true;
        }

        if (!puertoSmtpValido.value) {
            return true;
        }

        return false;
    });

    // -------------------------------------------------------------------------
    // PROBAR CORREO
    // -------------------------------------------------------------------------

    const handleProbar = async () => {
        if (!correoPruebaValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El correo electrónico de prueba no es válido.',
                life: 3000
            });

            return;
        }

        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/servidor_correo/probar/${encodeURIComponent(correoPrueba.value.trim().toLowerCase())}`
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        correoPrueba.value = '';
    };

    // -------------------------------------------------------------------------
    // GUARDAR
    // -------------------------------------------------------------------------

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente la configuración del correo.',
                life: 3000
            });

            return;
        }

        const datosCorreo = {
            ...frmCorreo,
            correo_electronico: frmCorreo.correo_electronico.trim().toLowerCase(),
            servidor_entrante: frmCorreo.servidor_entrante.trim().toLowerCase(),
            servidor_saliente: frmCorreo.servidor_saliente.trim().toLowerCase()
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: `/servidor_correo/`,
            datosJson: datosCorreo
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        await handleCargarCorreo();
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarCorreo();
    };

    handleInit();

    return {
        frmCorreo,
        correoPrueba,

        correoElectronicoValido,
        claveValida,
        servidorEntranteValido,
        servidorSalienteValido,
        puertoImapValido,
        puertoPop3Valido,
        puertoSmtpValido,
        correoPruebaValido,
        botonGuardarDeshabilitado,

        handleProbar,
        handleGuardar
    };
};

export default useProceso;
