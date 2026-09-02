import { computed, ref } from 'vue';

import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const confirm = useConfirm();

    // ============================================================
    // VARIABLES
    // ============================================================

    const archivoExcel = ref(null);

    const nombreArchivo = ref('');

    const inputArchivo = ref(null);

    const procesando = ref(false);

    const guardando = ref(false);

    const archivoValidado = ref(false);

    // ============================================================
    // RESULTADOS
    // ============================================================

    const totalFilas = ref(0);

    const totalSolicitudes = ref(0);

    const correctas = ref(0);

    const conError = ref(0);

    const solicitudes = ref([]);

    const errores = ref([]);

    // ============================================================
    // NOTIFICACION
    // ============================================================

    const notificar = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity,
            summary,
            detail,
            life: 3500
        });
    };

    // ============================================================
    // LIMPIAR RESULTADOS
    // ============================================================

    const handleLimpiarResultados = () => {
        archivoValidado.value = false;

        totalFilas.value = 0;

        totalSolicitudes.value = 0;

        correctas.value = 0;

        conError.value = 0;

        solicitudes.value = [];

        errores.value = [];
    };

    // ============================================================
    // SELECCIONAR ARCHIVO
    // ============================================================

    const handleSeleccionarArchivo = (event) => {
        const archivo = event.target.files?.[0] ?? null;

        handleLimpiarResultados();

        if (!archivo) {
            archivoExcel.value = null;

            nombreArchivo.value = '';

            return;
        }

        // ========================================================
        // VALIDAR EXTENSION
        // ========================================================

        if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
            notificar('warn', 'El archivo debe ser formato .xlsx.', 'Archivo inválido');

            archivoExcel.value = null;

            nombreArchivo.value = '';

            if (inputArchivo.value) {
                inputArchivo.value.value = '';
            }

            return;
        }

        archivoExcel.value = archivo;

        nombreArchivo.value = archivo.name;
    };

    // ============================================================
    // ABRIR SELECTOR
    // ============================================================

    const handleAbrirArchivo = () => {
        inputArchivo.value?.click();
    };

    // ============================================================
    // QUITAR ARCHIVO
    // ============================================================

    const handleQuitarArchivo = () => {
        archivoExcel.value = null;

        nombreArchivo.value = '';

        handleLimpiarResultados();

        if (inputArchivo.value) {
            inputArchivo.value.value = '';
        }
    };

    // ============================================================
    // VALIDAR ARCHIVO
    // ============================================================

    const handleValidarArchivo = async () => {
        if (!archivoExcel.value) {
            notificar('warn', 'Selecciona un archivo Excel.', 'Carga masiva');

            return;
        }

        procesando.value = true;

        handleLimpiarResultados();

        try {
            const formData = new FormData();

            formData.append('archivo', archivoExcel.value);

            const response = await store.dispatch('api/apiPostTokenFormData', {
                direccion: '/solicitud_detallada/carga_masiva/validar',

                formData
            });

            console.log('======================================');

            console.log('RESPUESTA COMPLETA:', response);

            console.log('RESPONSE.DATOS:', response?.datos);

            console.log('RESPONSE.DATOS.DATOS:', response?.datos?.datos);

            console.log('======================================');

            if (response?.estatus !== 200) {
                notificar('error', response?.mensaje || 'No fue posible validar el archivo.', 'Carga masiva');

                return;
            }

            /*
        |--------------------------------------------------------------------------
        | OBTENER DATOS
        |--------------------------------------------------------------------------
        |
        | Soporta ambas respuestas:
        |
        | response.datos
        |
        | o:
        |
        | response.datos.datos
        |
        */

            const datos = response?.datos?.datos ?? response?.datos ?? {};

            console.log('DATOS FINALES:', datos);

            totalFilas.value = Number(datos?.total_filas ?? 0);

            totalSolicitudes.value = Number(datos?.total_solicitudes ?? 0);

            correctas.value = Number(datos?.correctas ?? 0);

            conError.value = Number(datos?.con_error ?? 0);

            solicitudes.value = Array.isArray(datos?.solicitudes) ? datos.solicitudes : [];

            errores.value = Array.isArray(datos?.errores) ? datos.errores : [];

            archivoValidado.value = true;

            console.log('TOTAL FILAS:', totalFilas.value);

            console.log('TOTAL SOLICITUDES:', totalSolicitudes.value);

            console.log('CORRECTAS:', correctas.value);

            console.log('CON ERROR:', conError.value);

            console.log('SOLICITUDES:', solicitudes.value);

            console.log('ERRORES:', errores.value);

            if (correctas.value > 0) {
                notificar('success', `Se encontraron ${correctas.value} solicitudes correctas.`, 'Archivo validado');
            } else if (conError.value > 0) {
                notificar('warn', `Se encontraron ${conError.value} solicitudes con errores.`, 'Archivo validado');
            } else {
                notificar('warn', 'El archivo fue procesado pero no se encontraron solicitudes.', 'Archivo validado');
            }
        } catch (error) {
            console.error('ERROR CARGA MASIVA:', error);

            notificar('error', error?.message || 'Ocurrió un error al validar el archivo.', 'Carga masiva');
        } finally {
            procesando.value = false;
        }
    };

    // ============================================================
    // CONFIRMAR GUARDADO
    // ============================================================

    const handleConfirmarGuardar = () => {
        if (!solicitudes.value.length) {
            notificar('warn', 'No hay solicitudes correctas para guardar.', 'Carga masiva');

            return;
        }

        confirm.require({
            message: `Se crearán ${solicitudes.value.length} solicitudes. ¿Deseas continuar?`,

            header: 'Confirmar carga masiva',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Guardar',

            rejectLabel: 'Cancelar',

            acceptClass: 'p-button-success',

            accept: () => {
                handleGuardarSolicitudes();
            }
        });
    };

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleGuardarSolicitudes = async () => {
        if (!solicitudes.value.length) {
            return;
        }

        guardando.value = true;

        try {
            const response = await store.dispatch('api/apiPostToken', {
                direccion: '/solicitud_detallada/carga_masiva/guardar',

                datosJson: {
                    solicitudes: solicitudes.value
                }
            });

            if (response.estatus !== 200) {
                notificar('error', response.mensaje || 'No fue posible guardar las solicitudes.', 'Carga masiva');

                return;
            }

            const datos = response.datos ?? {};

            notificar('success', response.mensaje || 'Carga masiva realizada correctamente.', 'Carga completada');

            // =================================================
            // SI ALGUNA FALLÓ DURANTE EL GUARDADO
            // =================================================

            if (datos.errores?.length) {
                errores.value = [...errores.value, ...datos.errores];

                conError.value = errores.value.length;
            }

            solicitudes.value = [];

            correctas.value = 0;

            archivoValidado.value = false;

            archivoExcel.value = null;

            nombreArchivo.value = '';

            if (inputArchivo.value) {
                inputArchivo.value.value = '';
            }
        } catch (error) {
            console.error(error);

            notificar('error', error?.message || 'Ocurrió un error al guardar las solicitudes.', 'Carga masiva');
        } finally {
            guardando.value = false;
        }
    };

    // ============================================================
    // DESCARGAR PLANTILLA
    //
    // Coloca el Excel en:
    //
    // public/plantillas/
    // plantilla_carga_masiva_solicitudes.xlsx
    // ============================================================

    const handleDescargarPlantilla = () => {
        const enlace = document.createElement('a');

        enlace.href = '/plantillas/plantilla_carga_masiva_solicitudes.xlsx';

        enlace.download = 'plantilla_carga_masiva_solicitudes.xlsx';

        document.body.appendChild(enlace);

        enlace.click();

        enlace.remove();
    };

    // ============================================================
    // FORMATOS
    // ============================================================

    const handleMoney = (valor) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 4
        }).format(Number(valor || 0));
    };

    // ============================================================
    // ERRORES COMO TEXTO
    // ============================================================

    const handleErroresTexto = (item) => {
        if (Array.isArray(item.errores)) {
            return item.errores.join(' | ');
        }

        return item.mensaje || 'Error no especificado.';
    };

    // ============================================================
    // COMPUTED
    // ============================================================

    const puedeValidar = computed(() => Boolean(archivoExcel.value) && !procesando.value);

    const puedeGuardar = computed(() => archivoValidado.value && solicitudes.value.length > 0 && !guardando.value);

    const tieneResultados = computed(() => archivoValidado.value || errores.value.length > 0);

    // ============================================================
    // RETURN
    // ============================================================

    return {
        archivoExcel,

        nombreArchivo,

        inputArchivo,

        procesando,

        guardando,

        archivoValidado,

        totalFilas,

        totalSolicitudes,

        correctas,

        conError,

        solicitudes,

        errores,

        puedeValidar,

        puedeGuardar,

        tieneResultados,

        handleSeleccionarArchivo,

        handleAbrirArchivo,

        handleQuitarArchivo,

        handleValidarArchivo,

        handleConfirmarGuardar,

        handleDescargarPlantilla,

        handleMoney,

        handleErroresTexto
    };
};

export default useProceso;
