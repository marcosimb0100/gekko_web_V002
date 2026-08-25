import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const useProceso = () => {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const toast = useToast();

    const clientId = route.params.clientId;

    const logoUrl = ref('');
    const nombreCliente = ref('');

    const frmAcceso = reactive({
        usuario: '',
        password: ''
    });

    // =====================================================
    // VALIDACION
    // =====================================================

    const botonAccesoDeshabilitado = computed(() => {
        return !frmAcceso.usuario.trim() || !frmAcceso.password.trim();
    });

    // =====================================================
    // LOGO
    // =====================================================

    const handleCargarLogo = async () => {
        if (!clientId) {
            return;
        }

        const res = await store.dispatch('api/apiGetblobSinCargando', {
            direccion: `/clientes/publico/logo/${clientId}`
        });

        if (res.estatus !== 200 || !res.data) {
            return;
        }

        if (logoUrl.value) {
            URL.revokeObjectURL(logoUrl.value);
        }

        const blob = new Blob([res.data]);

        logoUrl.value = URL.createObjectURL(blob);
    };

    // =====================================================
    // LOGIN CLIENTE
    // =====================================================

    const handleAcceso = async () => {
        if (botonAccesoDeshabilitado.value) {
            return;
        }

        const payload = {
            client_id: clientId,

            usuario: frmAcceso.usuario.trim().toLowerCase(),

            password: frmAcceso.password
        };

        const res = await store.dispatch('api/apiPostSinToken', {
            direccion: `/clientes/acceso/login`,

            datosJson: payload
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Acceso',
                detail: res.mensaje || 'Usuario o contraseña incorrectos.',
                life: 3000
            });

            return;
        }

        // =================================================
        // GUARDAR TOKEN DEL CLIENTE
        // =================================================

        localStorage.setItem('token_cliente', res.datos.token);

        localStorage.setItem('client_id', clientId);

        if (res.datos.nombre_cliente) {
            localStorage.setItem('nombre_cliente', res.datos.nombre_cliente);
        }

        // =================================================
        // IR AL PORTAL
        // =================================================

        router.replace({
            name: 'cliente_portal',
            params: {
                clientId
            }
        });
    };

    // =====================================================
    // INIT
    // =====================================================

    onMounted(async () => {
        await handleCargarLogo();
    });

    onBeforeUnmount(() => {
        if (logoUrl.value) {
            URL.revokeObjectURL(logoUrl.value);
        }
    });

    return {
        clientId,

        logoUrl,
        nombreCliente,

        frmAcceso,

        botonAccesoDeshabilitado,

        handleAcceso
    };
};

export default useProceso;
