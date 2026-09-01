import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

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
    // CIF
    // =====================================================

    const archivoCif = ref(null);

    const nombreArchivo = ref('');

    const urlCif = ref('');

    const tieneCif = ref(false);

    const cargandoCif = ref(false);

    const guardandoCif = ref(false);

    const inputArchivo = ref(null);

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
    // LIMPIAR URL PDF
    // =====================================================

    const handleLiberarUrlCif = () => {
        if (urlCif.value) {
            URL.revokeObjectURL(urlCif.value);

            urlCif.value = '';
        }
    };

    // =====================================================
    // CONSULTAR CIF
    // =====================================================

    const handleCargarCif = async () => {
        cargandoCif.value = true;

        handleLiberarUrlCif();

        try {
            const res = await store.dispatch('api/apiGetBlobTokenCliente', {
                direccion: '/clientes/portal/cif',

                clientId: clientId
            });

            // -----------------------------------------
            // CLIENTE SIN CIF
            // -----------------------------------------

            if (res.estatus === 404) {
                tieneCif.value = false;

                return;
            }

            if (res.estatus !== 200) {
                tieneCif.value = false;

                toast.add({
                    severity: 'error',

                    summary: 'CIF',

                    detail: res.mensaje || 'No fue posible consultar el CIF.',

                    life: 3000
                });

                return;
            }

            // -----------------------------------------
            // GENERAR URL LOCAL DEL PDF
            // -----------------------------------------

            const blob = new Blob([res.datos], {
                type: 'application/pdf'
            });

            urlCif.value = URL.createObjectURL(blob);

            tieneCif.value = true;
        } finally {
            cargandoCif.value = false;
        }
    };

    // =====================================================
    // SELECCIONAR CIF
    // =====================================================

    const handleSeleccionarArchivo = (event) => {
        const archivo = event.target.files?.[0] ?? null;

        archivoCif.value = null;

        nombreArchivo.value = '';

        if (!archivo) {
            return;
        }

        // -----------------------------------------
        // PDF
        // -----------------------------------------

        const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');

        if (!esPdf) {
            toast.add({
                severity: 'warn',

                summary: 'Archivo inválido',

                detail: 'Seleccione un archivo PDF.',

                life: 3000
            });

            if (inputArchivo.value) {
                inputArchivo.value.value = '';
            }

            return;
        }

        archivoCif.value = archivo;

        nombreArchivo.value = archivo.name;
    };

    // =====================================================
    // ABRIR SELECTOR
    // =====================================================

    const handleSeleccionarCif = () => {
        inputArchivo.value?.click();
    };

    // =====================================================
    // CANCELAR ARCHIVO
    // =====================================================

    const handleCancelarArchivo = () => {
        archivoCif.value = null;

        nombreArchivo.value = '';

        if (inputArchivo.value) {
            inputArchivo.value.value = '';
        }
    };

    // =====================================================
    // BOTON GUARDAR
    // =====================================================

    const botonGuardarDeshabilitado = computed(() => !archivoCif.value || guardandoCif.value);

    // =====================================================
    // GUARDAR CIF
    // =====================================================

    const handleGuardarCif = async () => {
        if (!archivoCif.value) {
            toast.add({
                severity: 'warn',

                summary: 'CIF',

                detail: 'Seleccione un archivo PDF.',

                life: 3000
            });

            return;
        }

        const formData = new FormData();

        formData.append('archivo_cif', archivoCif.value);

        guardandoCif.value = true;

        try {
            const res = await store.dispatch('api/apiPutTokenClienteFormData', {
                direccion: '/clientes/portal/cif',

                datosFormData: formData,

                clientId: clientId
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'CIF',

                    detail: res.mensaje || 'No fue posible actualizar el CIF.',

                    life: 3000
                });

                return;
            }

            toast.add({
                severity: 'success',

                summary: 'CIF',

                detail: res.mensaje || 'CIF actualizado correctamente.',

                life: 3000
            });

            handleCancelarArchivo();

            await handleCargarCif();
        } finally {
            guardandoCif.value = false;
        }
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

        await handleCargarCif();
    });

    // =====================================================
    // LIBERAR BLOB
    // =====================================================

    onBeforeUnmount(() => {
        handleLiberarUrlCif();
    });

    return {
        clientId,

        nombreCliente,

        archivoCif,

        nombreArchivo,

        urlCif,

        tieneCif,

        cargandoCif,

        guardandoCif,

        inputArchivo,

        botonGuardarDeshabilitado,

        handleSeleccionarArchivo,

        handleSeleccionarCif,

        handleCancelarArchivo,

        handleGuardarCif,

        handleRegresar
    };
};

export default useProceso;
