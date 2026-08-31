import { computed, reactive, ref } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useStore } from 'vuex';

const frmSSHInit = () => ({
    host: '',

    puerto: 22,

    usuario: '',

    clave: '',

    timeout: 30,

    ruta_inicial_cfdi: '',

    activo: false
});

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    const frmSSH = reactive(frmSSHInit());

    const procesandoCfdi = ref(false);

    // ============================================================
    // VALIDACIONES
    // ============================================================

    const hostValido = computed(() => {
        if (!frmSSH.host) {
            return true;
        }

        return frmSSH.host.trim().length > 0;
    });

    const puertoValido = computed(() => {
        if (!frmSSH.puerto) {
            return false;
        }

        const puerto = Number(frmSSH.puerto);

        return puerto >= 1 && puerto <= 65535;
    });

    const usuarioValido = computed(() => {
        if (!frmSSH.usuario) {
            return true;
        }

        return frmSSH.usuario.trim().length > 0;
    });

    const claveValida = computed(() => {
        if (!frmSSH.clave) {
            return true;
        }

        return frmSSH.clave.length > 0;
    });

    const timeoutValido = computed(() => {
        const timeout = Number(frmSSH.timeout);

        return timeout >= 1 && timeout <= 300;
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmSSH.host.trim()) {
            return true;
        }

        if (!frmSSH.usuario.trim()) {
            return true;
        }

        if (!frmSSH.clave) {
            return true;
        }

        if (!puertoValido.value) {
            return true;
        }

        if (!hostValido.value) {
            return true;
        }

        if (!usuarioValido.value) {
            return true;
        }

        if (!claveValida.value) {
            return true;
        }

        if (!timeoutValido.value) {
            return true;
        }

        if (!frmSSH.ruta_inicial_cfdi.trim()) {
            return true;
        }

        return false;
    });

    const botonProbarDeshabilitado = computed(() => {
        return botonGuardarDeshabilitado.value;
    });

    const botonDepositarDeshabilitado = computed(() => {
        if (procesandoCfdi.value) {
            return true;
        }

        if (!frmSSH.host.trim()) {
            return true;
        }

        if (!frmSSH.usuario.trim()) {
            return true;
        }

        if (!frmSSH.clave) {
            return true;
        }

        if (!frmSSH.ruta_inicial_cfdi.trim()) {
            return true;
        }

        return false;
    });

    // ============================================================
    // CARGAR CONFIGURACION
    // ============================================================

    const handleDepositarCfdi = async () => {
        if (botonDepositarDeshabilitado.value) {
            return;
        }

        procesandoCfdi.value = true;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/conexion_ssh_sat/depositar_cfdi',

                datosJson: {}
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'CFDI',

                    detail: res.mensaje,

                    life: 5000
                });

                return;
            }

            toast.add({
                severity: 'success',

                summary: 'CFDI',

                detail: res.mensaje,

                life: 5000
            });
        } finally {
            procesandoCfdi.value = false;
        }
    };

    const handleCargarSSH = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: '/conexion_ssh_sat/'
        });

        if (res.estatus !== 200) {
            return;
        }

        const data = res.datos?.conexion_ssh_sat;

        if (!data) {
            return;
        }

        Object.assign(frmSSH, {
            host: data.host ?? '',

            puerto: Number(data.puerto ?? 22),

            usuario: data.usuario ?? '',

            clave: data.clave ?? '',

            timeout: Number(data.timeout ?? 30),

            ruta_inicial_cfdi: data.ruta_inicial_cfdi ?? '',

            activo: data.activo ?? false
        });
    };

    // ============================================================
    // PROBAR CONEXION
    // ============================================================

    const handleProbar = async () => {
        if (botonProbarDeshabilitado.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Complete correctamente la configuración SSH.',

                life: 3000
            });

            return;
        }

        const datosSSH = {
            host: frmSSH.host.trim(),

            puerto: Number(frmSSH.puerto),

            usuario: frmSSH.usuario.trim(),

            clave: frmSSH.clave,

            timeout: Number(frmSSH.timeout || 30),

            ruta_inicial_cfdi: frmSSH.ruta_inicial_cfdi.trim()
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: '/conexion_ssh_sat/probar',

            datosJson: datosSSH
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',

                summary: 'Conexión SSH',

                detail: res.mensaje,

                life: 5000
            });

            return;
        }

        toast.add({
            severity: 'success',

            summary: 'Conexión SSH',

            detail: res.mensaje,

            life: 3000
        });
    };

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Complete correctamente la configuración SSH.',

                life: 3000
            });

            return;
        }

        const datosSSH = {
            host: frmSSH.host.trim(),

            puerto: Number(frmSSH.puerto),

            usuario: frmSSH.usuario.trim(),

            clave: frmSSH.clave,

            timeout: Number(frmSSH.timeout || 30),

            ruta_inicial_cfdi: frmSSH.ruta_inicial_cfdi.trim(),

            activo: frmSSH.activo
        };

        const res = await store.dispatch('api/apiPostToken', {
            direccion: '/conexion_ssh_sat/',

            datosJson: datosSSH
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

        await handleCargarSSH();
    };

    // ============================================================
    // INIT
    // ============================================================

    const handleInit = async () => {
        await handleCargarSSH();
    };

    handleInit();

    return {
        frmSSH,

        hostValido,

        puertoValido,

        usuarioValido,

        claveValida,

        timeoutValido,

        botonGuardarDeshabilitado,

        botonProbarDeshabilitado,

        handleProbar,

        handleGuardar,
        botonDepositarDeshabilitado,
        handleDepositarCfdi
    };
};

export default useProceso;
