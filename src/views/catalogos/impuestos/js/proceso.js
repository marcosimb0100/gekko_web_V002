import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const regexTasa = /^0\.\d{1,6}$/;

const tiposImpuesto = [
    { label: 'Traslado', value: 'traslado' },
    { label: 'Retención', value: 'retencion' }
];

const codigosFiscalesPorTipo = {
    traslado: [
        { label: '002 - IVA', value: '002' },
        { label: '003 - IEPS', value: '003' }
    ],
    retencion: [
        { label: '001 - ISR', value: '001' },
        { label: '002 - IVA', value: '002' },
        { label: '003 - IEPS', value: '003' }
    ]
};

const tiposFactor = [
    { label: 'Tasa', value: 'Tasa' },
    { label: 'Cuota', value: 'Cuota' },
    { label: 'Exento', value: 'Exento' }
];

const frmImpuestoInit = () => ({
    _id: '',
    tipo: '',
    codigo_fiscal: '',
    descripcion: '',
    tipo_factor: '',
    tasa: '',
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

    const tablaImpuestos = ref([]);
    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const frmImpuesto = reactive(frmImpuestoInit());

    const codigosFiscales = computed(() => {
        return frmImpuesto.tipo ? (codigosFiscalesPorTipo[frmImpuesto.tipo] ?? []) : [];
    });

    const handleCargarImpuestos = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/impuestos/`
        });

        if (res.estatus === 200) {
            tablaImpuestos.value = res.datos?.impuestos ?? [];
        } else {
            tablaImpuestos.value = [];

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
        Object.assign(frmImpuesto, frmImpuestoInit());

        await nextTick();
    };

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';
            frmImpuesto.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            await handleLimpiarFormulario();

            movimiento.value = 'E';

            Object.assign(frmImpuesto, {
                _id: data?._id ?? '',
                tipo: data?.tipo ?? '',
                codigo_fiscal: data?.codigo_fiscal ?? '',
                descripcion: data?.descripcion ?? '',
                tipo_factor: data?.tipo_factor ?? '',
                tasa: data?.tasa ?? '',
                activo: data?.activo ?? false
            });

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            await handleLimpiarFormulario();
            await handleCargarImpuestos();
        }
    };

    const handleCambioTipo = () => {
        frmImpuesto.codigo_fiscal = '';
    };

    const handleCambioTipoFactor = () => {
        if (frmImpuesto.tipo_factor === 'Exento') {
            frmImpuesto.tasa = '0.000000';
        }
    };

    const tipoValido = computed(() => {
        if (!frmImpuesto.tipo) {
            return true;
        }

        return tiposImpuesto.some((item) => item.value === frmImpuesto.tipo);
    });

    const codigoFiscalValido = computed(() => {
        if (!frmImpuesto.codigo_fiscal) {
            return true;
        }

        return codigosFiscales.value.some((item) => item.value === frmImpuesto.codigo_fiscal);
    });

    const descripcionValida = computed(() => {
        if (!frmImpuesto.descripcion) {
            return true;
        }

        return frmImpuesto.descripcion.trim().length > 0;
    });

    const tipoFactorValido = computed(() => {
        if (!frmImpuesto.tipo_factor) {
            return true;
        }

        return tiposFactor.some((item) => item.value === frmImpuesto.tipo_factor);
    });

    const tasaValida = computed(() => {
        if (frmImpuesto.tipo_factor === 'Exento') {
            return true;
        }

        if (!frmImpuesto.tasa) {
            return true;
        }

        return regexTasa.test(frmImpuesto.tasa);
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmImpuesto.tipo) {
            return true;
        }

        if (!frmImpuesto.codigo_fiscal) {
            return true;
        }

        if (!frmImpuesto.descripcion.trim()) {
            return true;
        }

        if (!frmImpuesto.tipo_factor) {
            return true;
        }

        if (frmImpuesto.tipo_factor !== 'Exento' && !frmImpuesto.tasa) {
            return true;
        }

        if (!tipoValido.value) {
            return true;
        }

        if (!codigoFiscalValido.value) {
            return true;
        }

        if (!descripcionValida.value) {
            return true;
        }

        if (!tipoFactorValido.value) {
            return true;
        }

        if (!tasaValida.value) {
            return true;
        }

        return false;
    });

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente la información del impuesto.',
                life: 3000
            });

            return;
        }

        if (frmImpuesto.tipo_factor !== 'Exento' && !regexTasa.test(frmImpuesto.tasa)) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La tasa/cuota debe tener formato 0.000000.',
                life: 3000
            });

            return;
        }

        const datosImpuesto = {
            ...frmImpuesto,
            descripcion: frmImpuesto.descripcion.trim().toUpperCase(),
            tasa: frmImpuesto.tipo_factor === 'Exento' ? '0.000000' : frmImpuesto.tasa
        };

        let res;

        if (movimiento.value === 'N') {
            res = await store.dispatch('api/apiPostToken', {
                direccion: `/impuestos/`,
                datosJson: datosImpuesto
            });
        } else if (movimiento.value === 'E') {
            res = await store.dispatch('api/apiPutToken', {
                direccion: `/impuestos/`,
                datosJson: datosImpuesto
            });
        }

        if (!res || res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res?.mensaje ?? 'No fue posible guardar el impuesto.',
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
        await handleCargarImpuestos();
    };

    const handleInit = async () => {
        await handleCargarImpuestos();
    };

    handleInit();

    return {
        tablaImpuestos,
        filtros,

        tiposImpuesto,
        codigosFiscales,
        tiposFactor,

        mostrarTablaFormulario,
        movimiento,
        frmImpuesto,

        tipoValido,
        codigoFiscalValido,
        descripcionValida,
        tipoFactorValido,
        tasaValida,
        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleCambioTipo,
        handleCambioTipoFactor,
        handleGuardar,
        handleLimpiarFiltro
    };
};

export default useProceso;
