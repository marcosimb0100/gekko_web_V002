import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const regexCorreoElectronico = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const regexTelefono = /^\(\d{3}\)-\d{3}-\d{4}$/;
const regexNombreCompleto = /^\S+\s+\S+.*$/;

const frmPromotorInit = () => ({
    _id: '',
    nombre_completo: '',
    correo_electronico: '',
    celular: '',
    telefono: '',
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

    const tablaPromotores = ref([]);
    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const frmPromotor = reactive(frmPromotorInit());

    const handleCargarPromotores = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/promotores/`
        });

        if (res.estatus === 200) {
            tablaPromotores.value = res.datos?.promotores ?? [];
        } else {
            tablaPromotores.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    const handleLimpiarFormulario = async () => {
        Object.assign(frmPromotor, frmPromotorInit());

        await nextTick();
    };

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';
            frmPromotor.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            await handleLimpiarFormulario();

            movimiento.value = 'E';

            Object.assign(frmPromotor, {
                _id: data?._id ?? '',
                nombre_completo: data?.nombre_completo ?? '',
                correo_electronico: data?.correo_electronico ?? '',
                celular: data?.celular ?? '',
                telefono: data?.telefono ?? '',
                activo: data?.activo ?? false
            });

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            await handleLimpiarFormulario();
            await handleCargarPromotores();
        }
    };

    const nombreCompletoValido = computed(() => {
        if (!frmPromotor.nombre_completo) {
            return true;
        }

        return regexNombreCompleto.test(frmPromotor.nombre_completo.trim());
    });

    const correoElectronicoValido = computed(() => {
        if (!frmPromotor.correo_electronico) {
            return true;
        }

        return regexCorreoElectronico.test(frmPromotor.correo_electronico.trim().toLowerCase());
    });

    const celularValido = computed(() => {
        if (!frmPromotor.celular) {
            return true;
        }

        return regexTelefono.test(frmPromotor.celular);
    });

    const telefonoValido = computed(() => {
        if (!frmPromotor.telefono) {
            return true;
        }

        return regexTelefono.test(frmPromotor.telefono);
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmPromotor.nombre_completo.trim()) {
            return true;
        }

        if (!frmPromotor.correo_electronico.trim()) {
            return true;
        }

        if (!frmPromotor.celular) {
            return true;
        }

        if (!frmPromotor.telefono) {
            return true;
        }

        if (!nombreCompletoValido.value) {
            return true;
        }

        if (!correoElectronicoValido.value) {
            return true;
        }

        if (!celularValido.value) {
            return true;
        }

        if (!telefonoValido.value) {
            return true;
        }

        return false;
    });

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente la información del promotor.',
                life: 3000
            });

            return;
        }

        const datosPromotor = {
            ...frmPromotor,
            nombre_completo: frmPromotor.nombre_completo.trim().toUpperCase(),
            correo_electronico: frmPromotor.correo_electronico.trim().toLowerCase()
        };

        let res;

        if (movimiento.value === 'N') {
            res = await store.dispatch('api/apiPostToken', {
                direccion: `/promotores/`,
                datosJson: datosPromotor
            });
        } else if (movimiento.value === 'E') {
            res = await store.dispatch('api/apiPutToken', {
                direccion: `/promotores/`,
                datosJson: datosPromotor
            });
        }

        if (!res || res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res?.mensaje ?? 'No fue posible guardar el promotor.',
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
        await handleCargarPromotores();
    };

    const handleInit = async () => {
        await handleCargarPromotores();
    };

    handleInit();

    return {
        tablaPromotores,
        filtros,

        mostrarTablaFormulario,
        movimiento,
        frmPromotor,

        nombreCompletoValido,
        correoElectronicoValido,
        celularValido,
        telefonoValido,
        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro
    };
};

export default useProceso;
