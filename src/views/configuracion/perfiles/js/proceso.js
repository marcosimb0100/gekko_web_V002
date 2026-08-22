import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { computed, nextTick, reactive, ref } from 'vue';

import { useStore } from 'vuex';

const frmPerfilInit = () => ({
    _id: '',
    nombre_perfil: '',
    activo: true
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    const tablaPerfiles = ref([]);

    const mostrarTablaFormulario = ref(false);

    const movimiento = ref('');

    const frmPerfil = reactive(frmPerfilInit());


    const handleInit = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/perfiles/perfiles`
        });

        if (res.estatus === 200) {
            tablaPerfiles.value = res.datos?.perfiles ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    handleInit();


    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };


    const handleMostrarFormulario = async (tipo, data) => {

        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';

            frmPerfil.activo = true;

            mostrarTablaFormulario.value = true;
        }

        else if (tipo === 'E') {
            await handleLimpiarFormulario();

            movimiento.value = 'E';

            Object.assign(frmPerfil, {
                _id: data?._id ?? '',
                nombre_perfil: data?.nombre_perfil ?? '',
                activo: data?.activo ?? false
            });

            mostrarTablaFormulario.value = true;
        }

        else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;

            movimiento.value = '';

            await handleLimpiarFormulario();

            await handleInit();
        }
    };

    const handleGuardar = async () => {
        if (!frmPerfil.nombre_perfil.trim()) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese el nombre del perfil.',
                life: 3000
            });

            return;
        }

        if (!nombrePerfilValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El nombre del perfil no es válido.',
                life: 3000
            });

            return;
        }

        const datosPerfil = {
            ...frmPerfil,

            nombre_perfil: frmPerfil.nombre_perfil.trim().toUpperCase()
        };


        if (movimiento.value === 'N') {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/perfiles/`,
                datosJson: datosPerfil
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
        }

        else if (movimiento.value === 'E') {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: `/perfiles/`,
                datosJson: datosPerfil
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
        }


        mostrarTablaFormulario.value = false;

        movimiento.value = '';

        await handleLimpiarFormulario();

        await handleInit();
    };


    const handleLimpiarFormulario = async () => {
        Object.assign(frmPerfil, frmPerfilInit());

        await nextTick();
    };


    const nombrePerfilValido = computed(() => {
        if (!frmPerfil.nombre_perfil) {
            return true;
        }

        const nombre = frmPerfil.nombre_perfil.trim();

        return nombre.length >= 3;
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmPerfil.nombre_perfil.trim()) {
            return true;
        }

        if (!nombrePerfilValido.value) {
            return true;
        }

        return false;
    });


    return {
        tablaPerfiles,
        filtros,

        mostrarTablaFormulario,

        frmPerfil,

        movimiento,

        nombrePerfilValido,

        botonGuardarDeshabilitado,

        handleMostrarFormulario,

        handleGuardar,

        handleLimpiarFiltro
    };
};

export default useProceso;
