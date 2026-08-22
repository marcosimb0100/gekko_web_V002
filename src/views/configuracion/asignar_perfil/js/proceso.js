import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const frmAsignacionInit = () => ({
    idprofilesUser: 0,
    id_usuario: null,
    idprofiles: null,
    status: 1
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

    const catUsuarios = ref([]);
    const catPerfiles = ref([]);
    const catPerfilesUser = ref([]);

    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const frmAsignacion = reactive(frmAsignacionInit());

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCatalogos();
    };

    handleInit();

    const handleCatalogos = async () => {
        const reqUsuarios = await store.dispatch('api/apiGetToken', {
            direccion: `/api/profiles/users`
        });

        if (reqUsuarios.estatus === 200) {
            catUsuarios.value = reqUsuarios.datos?.users ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: reqUsuarios.mensaje,
                life: 3000
            });
        }

        const reqPerfiles = await store.dispatch('api/apiGetToken', {
            direccion: `/api/profiles/profiles`
        });

        if (reqPerfiles.estatus === 200) {
            catPerfiles.value = reqPerfiles.datos?.profiles ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: reqPerfiles.mensaje,
                life: 3000
            });
        }

        await handlePerfilesAsignados();
    };

    const handlePerfilesAsignados = async () => {
        const reqPerfilesAsignados = await store.dispatch('api/apiGetToken', {
            direccion: `/api/profiles/profile_assignment`
        });

        if (reqPerfilesAsignados.estatus === 200) {
            catPerfilesUser.value = reqPerfilesAsignados.datos?.perfiles_asignados ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: reqPerfilesAsignados.mensaje,
                life: 3000
            });
        }
    };

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    const handleLimpiarFormulario = () => {
        Object.assign(frmAsignacion, frmAsignacionInit());
    };

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            handleLimpiarFormulario();

            movimiento.value = 'N';
            frmAsignacion.status = 1;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            handleLimpiarFormulario();

            movimiento.value = 'E';

            Object.assign(frmAsignacion, {
                idprofilesUser: data?.idprofilesUser ?? 0,
                id_usuario: data?.id_usuario ?? null,
                idprofiles: data?.idprofiles ?? null,
                status: data?.status ?? 1
            });

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            handleLimpiarFormulario();

            await handlePerfilesAsignados();
        }
    };

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // GUARDAR
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const handleGuardar = async () => {
        if (!frmAsignacion.id_usuario) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione un usuario.',
                life: 3000
            });

            return;
        }

        if (!frmAsignacion.idprofiles) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione un perfil.',
                life: 3000
            });

            return;
        }

        const datosAsignacion = {
            id_usuario: frmAsignacion.id_usuario,
            idprofiles: frmAsignacion.idprofiles,
            status: Number(frmAsignacion.status)
        };

        // NUEVO
        if (movimiento.value === 'N') {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/api/profiles/profiles_user`,
                datosJson: datosAsignacion
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

        // EDITAR
        else if (movimiento.value === 'E') {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: `/api/profiles/profiles_user/${frmAsignacion.idprofilesUser}`,
                datosJson: datosAsignacion
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

        handleLimpiarFormulario();

        await handlePerfilesAsignados();
    };

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // NOMBRES PARA TABLA
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const handleNombreUsuario = (idUsuario) => {
        const usuario = catUsuarios.value.find((item) => item.id_usuario === idUsuario);

        return usuario?.username ?? '';
    };

    const handleNombrePerfil = (idPerfil) => {
        const perfil = catPerfiles.value.find((item) => item.idprofiles === idPerfil);

        return perfil?.nameProfile ?? '';
    };

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmAsignacion.id_usuario) {
            return true;
        }

        if (!frmAsignacion.idprofiles) {
            return true;
        }

        return false;
    });

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    return {
        catUsuarios,
        catPerfiles,
        catPerfilesUser,

        filtros,

        mostrarTablaFormulario,
        movimiento,
        frmAsignacion,

        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro,

        handleNombreUsuario,
        handleNombrePerfil
    };
};

export default useProceso;