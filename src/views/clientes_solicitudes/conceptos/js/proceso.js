import { computed, onMounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { useStore } from 'vuex';

import { useToast } from 'primevue/usetoast';

const useProceso = () => {
    const route = useRoute();

    const router = useRouter();

    const store = useStore();

    const toast = useToast();

    // =====================================================
    // CLIENTE
    // =====================================================

    const clientId = route.params.clientId;

    const nombreCliente = ref(localStorage.getItem('nombre_cliente') || '');

    // =====================================================
    // ESTADOS
    // =====================================================

    const empresas = ref([]);

    const empresaSeleccionada = ref(null);

    const conceptos = ref([]);

    const cargandoEmpresas = ref(false);

    const cargandoConceptos = ref(false);

    // =====================================================
    // EMPRESA ACTUAL
    // =====================================================

    const empresaActual = computed(() => {
        if (!empresaSeleccionada.value) {
            return null;
        }

        return empresas.value.find((item) => item._id === empresaSeleccionada.value) ?? null;
    });

    // =====================================================
    // VALIDAR SESION
    // =====================================================

    const handleValidarSesion = () => {
        const token = localStorage.getItem('token_cliente');

        const clienteGuardado = localStorage.getItem('client_id');

        if (!token || !clienteGuardado || clienteGuardado !== clientId) {
            router.replace({
                name: 'cliente_acceso',

                params: {
                    clientId: clientId
                }
            });

            return false;
        }

        return true;
    };

    // =====================================================
    // CARGAR EMPRESAS
    // =====================================================

    const handleCargarEmpresas = async () => {
        cargandoEmpresas.value = true;

        try {
            const res = await store.dispatch('api/apiGetTokenCliente', {
                direccion: '/clientes/portal/empresas',

                clientId: clientId
            });

            if (res.estatus !== 200) {
                empresas.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Conceptos',

                    detail: res.mensaje || 'No fue posible consultar las empresas.',

                    life: 3000
                });

                return;
            }

            empresas.value = res.datos?.companias ?? [];

            // -----------------------------------------
            // SI SOLO TIENE UNA EMPRESA
            // SE SELECCIONA AUTOMATICAMENTE
            // -----------------------------------------

            if (empresas.value.length === 1) {
                empresaSeleccionada.value = empresas.value[0]._id;

                await handleCargarConceptos();
            }
        } finally {
            cargandoEmpresas.value = false;
        }
    };

    // =====================================================
    // CARGAR CONCEPTOS
    // =====================================================

    const handleCargarConceptos = async () => {
        conceptos.value = [];

        if (!empresaSeleccionada.value) {
            return;
        }

        cargandoConceptos.value = true;

        try {
            const res = await store.dispatch('api/apiGetTokenCliente', {
                direccion: `/clientes/portal/conceptos/${empresaSeleccionada.value}`,

                clientId: clientId
            });

            if (res.estatus !== 200) {
                conceptos.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Conceptos',

                    detail: res.mensaje || 'No fue posible consultar los conceptos.',

                    life: 3000
                });

                return;
            }

            conceptos.value = res.datos?.conceptos ?? [];
        } finally {
            cargandoConceptos.value = false;
        }
    };

    // =====================================================
    // CAMBIO EMPRESA
    // =====================================================

    const handleCambioEmpresa = async () => {
        await handleCargarConceptos();
    };

    // =====================================================
    // OBJETO IMPUESTO
    // =====================================================

    const handleObjetoImp = (valor) => {
        const objetos = {
            '01': 'No objeto de impuesto',

            '02': 'Sí objeto de impuesto',

            '03': 'Sí objeto de impuesto y no obligado al desglose',

            '04': 'Sí objeto de impuesto y no causa impuesto',

            '05': 'Sí objeto de impuesto, IVA crédito PODEBI',

            '06': 'Sí objeto de impuesto, IVA sin traslado desglosado'
        };

        return objetos[String(valor || '')] ?? '';
    };

    // =====================================================
    // REGRESAR
    // =====================================================

    const handleRegresar = () => {
        router.push({
            name: 'cliente_portal',

            params: {
                clientId: clientId
            }
        });
    };

    // =====================================================
    // INIT
    // =====================================================

    onMounted(async () => {
        if (!handleValidarSesion()) {
            return;
        }

        await handleCargarEmpresas();
    });

    // =====================================================
    // RETURN
    // =====================================================

    return {
        clientId,

        nombreCliente,

        empresas,

        empresaSeleccionada,

        empresaActual,

        conceptos,

        cargandoEmpresas,

        cargandoConceptos,

        handleCambioEmpresa,

        handleObjetoImp,

        handleRegresar
    };
};

export default useProceso;
