import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const frmAsignacionInit = () => ({
    _id: '',
    id_usuario: '',
    id_perfil: '',
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

    const catUsuarios = ref([]);
    const catPerfiles = ref([]);
    const tablaAsignaciones = ref([]);

    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const frmAsignacion = reactive(frmAsignacionInit());

    // -------------------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------------------

    const handleCargarUsuarios = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/usuarios/usuarios`
        });

        if (res.estatus === 200) {
            catUsuarios.value = res.datos?.usuarios ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // PERFILES
    // -------------------------------------------------------------------------

    const handleCargarPerfiles = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/perfiles/perfiles`
        });

        if (res.estatus === 200) {
            catPerfiles.value = res.datos?.perfiles ?? [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // ASIGNACIONES
    // -------------------------------------------------------------------------

    const handleCargarAsignaciones = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/perfiles/perfiles_usuarios`
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

        const asignaciones = res.datos?.perfiles_usuarios ?? [];

        tablaAsignaciones.value = asignaciones.map((item) => {
            const usuario = catUsuarios.value.find((x) => String(x._id) === String(item.id_usuario));

            const perfil = catPerfiles.value.find((x) => String(x._id) === String(item.id_perfil));

            return {
                ...item,
                nombre_completo: usuario?.nombre_completo ?? '',
                nombre_perfil: perfil?.nombre_perfil ?? ''
            };
        });
    };

    // -------------------------------------------------------------------------
    // FILTRO
    // -------------------------------------------------------------------------

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // -------------------------------------------------------------------------
    // LIMPIAR FORMULARIO
    // -------------------------------------------------------------------------

    const handleLimpiarFormulario = async () => {
        Object.assign(frmAsignacion, frmAsignacionInit());

        await nextTick();
    };

    // -------------------------------------------------------------------------
    // MOSTRAR FORMULARIO
    // -------------------------------------------------------------------------

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';
            frmAsignacion.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            await handleLimpiarFormulario();

            movimiento.value = 'E';

            Object.assign(frmAsignacion, {
                _id: data?._id ?? data?.id_perfil_usuario ?? '',
                id_usuario: data?.id_usuario ?? '',
                id_perfil: data?.id_perfil ?? '',
                activo: data?.activo ?? true
            });

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            await handleLimpiarFormulario();
            await handleCargarAsignaciones();
        }
    };

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmAsignacion.id_usuario) {
            return true;
        }

        if (!frmAsignacion.id_perfil) {
            return true;
        }

        return false;
    });

    // -------------------------------------------------------------------------
    // GUARDAR
    // -------------------------------------------------------------------------

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

        if (!frmAsignacion.id_perfil) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione un perfil.',
                life: 3000
            });

            return;
        }

        const datosAsignacion = {
            ...frmAsignacion
        };

        let res;

        if (movimiento.value === 'N') {
            res = await store.dispatch('api/apiPostToken', {
                direccion: `/perfiles/perfiles_usuarios`,
                datosJson: datosAsignacion
            });
        } else if (movimiento.value === 'E') {
            res = await store.dispatch('api/apiPutToken', {
                direccion: `/perfiles/perfiles_usuarios`,
                datosJson: datosAsignacion
            });
        }

        if (!res || res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res?.mensaje ?? 'No fue posible guardar la asignación.',
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

        mostrarTablaFormulario.value = false;
        movimiento.value = '';

        await handleLimpiarFormulario();
        await handleCargarAsignaciones();
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await handleCargarUsuarios();
        await handleCargarPerfiles();
        await handleCargarAsignaciones();
    };

    handleInit();

    return {
        catUsuarios,
        catPerfiles,
        tablaAsignaciones,
        filtros,

        mostrarTablaFormulario,
        movimiento,
        frmAsignacion,

        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro
    };
};

export default useProceso;
