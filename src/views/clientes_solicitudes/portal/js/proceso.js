import { onMounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { useStore } from 'vuex';

const useProceso = () => {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const clientId = route.params.clientId;

    const logoUrl = ref('');

    const nombreCliente = ref('');

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

        logoUrl.value = URL.createObjectURL(new Blob([res.data]));
    };

    // =====================================================
    // OPCIONES
    // =====================================================

    const handleIrConceptos = () => {
        router.push({
            name: 'cliente_conceptos',

            params: {
                clientId
            }
        });
    };

    const handleIrCif = () => {
        router.push({
            name: 'cliente_cif',

            params: {
                clientId
            }
        });
    };

    const handleIrSolicitud = () => {
        router.push({
            name: 'cliente_solicitud',

            params: {
                clientId
            }
        });
    };

    // =====================================================
    // INICIAL
    // =====================================================

    onMounted(async () => {
        await handleCargarLogo();
    });

    const handleCerrarSesion = () => {
        localStorage.removeItem('token_cliente');

        localStorage.removeItem('client_id');

        localStorage.removeItem('nombre_cliente');

        router.replace({
            name: 'cliente_acceso',
            params: {
                clientId
            }
        });
    };

    return {
        clientId,

        logoUrl,
        nombreCliente,

        handleIrConceptos,
        handleIrCif,
        handleIrSolicitud,
        handleCerrarSesion
    };
};

export default useProceso;
