import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { regexCorreoElectronico, regexNombreCompleto, regex_clave } from '../../../../helpers/regex';

const frmUsuarioInit = () => ({
    _id: '',
    nombre_completo: '',
    correo_electronico: '',
    correo_acceso: false,
    activo: false,
    cambiar_clave: false,
    clave: '',
    repita_clave: ''
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

    const fotosUsuarios = reactive({});
    const mostrarTablaFormulario = ref(false);
    const tablasUsuarios = ref([]);
    const frmUsuario = reactive(frmUsuarioInit());
    const movimiento = ref('');
    const fotoArchivo = ref(null);
    const fotoPreview = ref(null);
    const fotoInput = ref(null);

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const handleInit = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/usuarios/usuarios`
        });

        if (res.estatus === 200) {
            tablasUsuarios.value = res.datos?.usuarios;

            for (const usuario of tablasUsuarios.value) {
                await handleCargarFotoUsuario(usuario._id);
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificacion',
                detail: res.mensaje,
                life: 3000
            });
        }
    };
    handleInit();

    const handleCargarFotoUsuario = async (id, recargar = false) => {
        if (!id) {
            return;
        }

        if (fotosUsuarios[id] && !recargar) {
            return;
        }

        if (fotosUsuarios[id] && recargar) {
            URL.revokeObjectURL(fotosUsuarios[id]);

            delete fotosUsuarios[id];
        }

        const res = await store.dispatch('api/apiGetblob', {
            direccion: `/usuarios/foto/${id}`
        });

        if (res.estatus === 200 && res.data instanceof Blob) {
            fotosUsuarios[id] = URL.createObjectURL(res.data);
        }
    };

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            await handleLimpiarFormulario();

            movimiento.value = 'N';

            // Nuevo usuario siempre debe capturar clave
            frmUsuario.cambiar_clave = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            movimiento.value = 'E';

            const resRegistro = await store.dispatch('api/apiGetToken', {
                direccion: `/usuarios/usuarios_id/${data._id}`
            });

            if (resRegistro.estatus === 200) {
                const usuario = resRegistro?.datos?.usuario;

                Object.assign(frmUsuario, {
                    _id: usuario?._id ?? '',
                    nombre_completo: usuario?.nombre_completo ?? '',
                    correo_electronico: usuario?.correo_electronico ?? '',
                    correo_acceso: usuario?.correo_acceso ?? false,
                    activo: usuario?.activo ?? false,

                    cambiar_clave: false,
                    clave: '',
                    repita_clave: ''
                });

                mostrarTablaFormulario.value = true;
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Notificación',
                    detail: resRegistro.mensaje,
                    life: 3000
                });
            }
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            await handleLimpiarFormulario();

            handleInit();
        }
    };

    const handleGuardar = async () => {
        // ==============================================
        // VALIDACIONES
        // ==============================================

        if (!frmUsuario.nombre_completo.trim()) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese el nombre completo.',
                life: 3000
            });

            return;
        }

        if (!nombreCompletoValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El nombre completo no es válido.',
                life: 3000
            });

            return;
        }

        if (!frmUsuario.correo_electronico.trim()) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese el correo electrónico.',
                life: 3000
            });

            return;
        }

        if (!correoElectronicoValido.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El correo electrónico no es válido.',
                life: 3000
            });

            return;
        }

        // ==============================================
        // CLAVE
        // ==============================================

        if (frmUsuario.cambiar_clave) {
            if (!frmUsuario.clave) {
                toast.add({
                    severity: 'warn',
                    summary: 'Notificación',
                    detail: 'Ingrese la clave.',
                    life: 3000
                });

                return;
            }

            if (!claveValida.value) {
                toast.add({
                    severity: 'warn',
                    summary: 'Notificación',
                    detail: 'La clave no cumple con los requisitos.',
                    life: 3000
                });

                return;
            }

            if (!frmUsuario.repita_clave) {
                toast.add({
                    severity: 'warn',
                    summary: 'Notificación',
                    detail: 'Repita la clave.',
                    life: 3000
                });

                return;
            }

            if (!repitaClaveValida.value) {
                toast.add({
                    severity: 'warn',
                    summary: 'Notificación',
                    detail: 'Las claves no coinciden.',
                    life: 3000
                });

                return;
            }
        }

        // ==============================================
        // PAYLOAD
        // ==============================================

        const datosUsuario = {
            ...frmUsuario,

            nombre_completo: frmUsuario.nombre_completo.trim().toUpperCase(),

            correo_electronico: frmUsuario.correo_electronico.trim().toLowerCase()
        };

        // ==============================================
        // NUEVO
        // ==============================================

        if (movimiento.value === 'N') {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/usuarios/`,
                datosJson: datosUsuario
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

            // El backend devuelve el nuevo ObjectId
            const idUsuario = res.datos?._id;

            // ==========================================
            // FOTO
            // ==========================================

            if (fotoArchivo.value && idUsuario) {
                const resFoto = await handleGuardarFoto(idUsuario);

                if (resFoto.estatus !== 200) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Notificación',
                        detail: 'El usuario se creó correctamente, pero la imagen no pudo guardarse.',
                        life: 4000
                    });

                    return;
                }
            }

            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }

        // ==============================================
        // EDITAR
        // ==============================================
        else if (movimiento.value === 'E') {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: `/usuarios/`,
                datosJson: datosUsuario
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

            // ==========================================
            // FOTO
            // ==========================================

            if (fotoArchivo.value) {
                const resFoto = await handleGuardarFoto(frmUsuario._id);

                if (resFoto.estatus !== 200) {
                    toast.add({
                        severity: 'warn',
                        summary: 'Notificación',
                        detail: 'Los datos se actualizaron correctamente, pero la imagen no pudo actualizarse.',
                        life: 4000
                    });

                    return;
                }
            }

            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }

        // ==============================================
        // TERMINAR
        // ==============================================

        mostrarTablaFormulario.value = false;
        movimiento.value = '';

        await handleLimpiarFormulario();

        await handleInit();
    };

    const handleGuardarFoto = async (idUsuario) => {
        if (!fotoArchivo.value) {
            return {
                estatus: 200
            };
        }

        const formData = new FormData();

        formData.append('foto_perfil', fotoArchivo.value);

        const resFoto = await store.dispatch('api/apiPutTokenFormData', {
            direccion: `/usuarios/foto/${idUsuario}`,
            formData
        });

        if (resFoto.estatus === 200) {
            await handleCargarFotoUsuario(idUsuario, true);
        }

        return resFoto;
    };

    const handleLimpiarFormulario = async () => {
        Object.assign(frmUsuario, frmUsuarioInit());

        fotoArchivo.value = null;

        if (fotoPreview.value) {
            URL.revokeObjectURL(fotoPreview.value);

            fotoPreview.value = null;
        }

        if (fotoInput.value) {
            fotoInput.value.value = '';
        }

        await nextTick();
    };

    const handleLimpiarFotoCache = (id) => {
        if (fotosUsuarios[id]) {
            URL.revokeObjectURL(fotosUsuarios[id]);

            delete fotosUsuarios[id];
        }
    };

    const handleCambiarClave = () => {
        if (!frmUsuario.cambiar_clave) {
            frmUsuario.clave = '';
            frmUsuario.repita_clave = '';
        }
    };

    const handleSeleccionarFoto = (event) => {
        const archivo = event.target.files?.[0];

        if (!archivo) {
            return;
        }

        const tiposPermitidos = ['image/jpeg', 'image/png'];

        if (!tiposPermitidos.includes(archivo.type)) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione una imagen JPG o PNG.',
                life: 3000
            });

            event.target.value = '';
            return;
        }

        fotoArchivo.value = archivo;

        if (fotoPreview.value) {
            URL.revokeObjectURL(fotoPreview.value);
        }

        fotoPreview.value = URL.createObjectURL(archivo);
    };

    const handleAbrirFoto = () => {
        fotoInput.value?.click();
    };

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const nombreCompletoValido = computed(() => {
        if (!frmUsuario.nombre_completo) {
            return true;
        }

        const nombre = frmUsuario.nombre_completo.trim();

        return nombre.length >= 3 && regexNombreCompleto.test(nombre);
    });

    const correoElectronicoValido = computed(() => {
        if (!frmUsuario.correo_electronico) {
            return true;
        }

        return regexCorreoElectronico.test(frmUsuario.correo_electronico.trim().toLowerCase());
    });

    const claveValida = computed(() => {
        if (!frmUsuario.cambiar_clave) {
            return true;
        }

        if (!frmUsuario.clave) {
            return true;
        }

        return regex_clave.test(frmUsuario.clave);
    });

    const repitaClaveValida = computed(() => {
        if (!frmUsuario.cambiar_clave) {
            return true;
        }

        if (!frmUsuario.repita_clave) {
            return true;
        }

        return frmUsuario.clave === frmUsuario.repita_clave;
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (!frmUsuario.nombre_completo.trim() || !frmUsuario.correo_electronico.trim()) {
            return true;
        }

        if (!nombreCompletoValido.value || !correoElectronicoValido.value) {
            return true;
        }

        // Si solicita cambio de clave
        if (frmUsuario.cambiar_clave) {
            if (!frmUsuario.clave || !frmUsuario.repita_clave) {
                return true;
            }

            if (!claveValida.value || !repitaClaveValida.value) {
                return true;
            }
        }

        return false;
    });

    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    return {
        tablasUsuarios,
        filtros,
        mostrarTablaFormulario,
        frmUsuario,
        movimiento,

        fotosUsuarios,

        fotoArchivo,
        fotoPreview,
        fotoInput,

        nombreCompletoValido,
        correoElectronicoValido,
        claveValida,
        repitaClaveValida,
        botonGuardarDeshabilitado,

        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro,
        handleCambiarClave,

        handleSeleccionarFoto,
        handleAbrirFoto
    };
};

export default useProceso;
