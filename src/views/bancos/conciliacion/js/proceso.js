import { computed, onMounted, ref } from 'vue';

import { useStore } from 'vuex';

import { useToast } from 'primevue/usetoast';

// ============================================================
// FECHA INICIAL
// PRIMER DIA DEL MES
// ============================================================

const fechaInicialDefault = () => {
    const fecha = new Date();

    fecha.setDate(1);

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// FECHA FINAL
// HOY
// ============================================================

const fechaFinalDefault = () => {
    const fecha = new Date();

    fecha.setHours(0, 0, 0, 0);

    return fecha;
};

// ============================================================
// PROCESO
// ============================================================

const useProceso = () => {
    const store = useStore();

    const toast = useToast();

    // ========================================================
    // FECHAS
    // ========================================================

    const fechaInicial = ref(fechaInicialDefault());

    const fechaFinal = ref(fechaFinalDefault());

    const fechaActual = new Date();

    // ========================================================
    // EMPRESAS
    // ========================================================

    const empresas = ref([]);

    /*
     * IMPORTANTE:
     *
     * Aquí guardamos OBJETOS completos.
     *
     * [
     *     {
     *         _id: "...",
     *         razon_social: "...",
     *         cuentas: [...]
     *     }
     * ]
     *
     * No guardar solamente IDs.
     */
    const empresasSeleccionadas = ref([]);

    // ========================================================
    // ESTADOS
    // ========================================================

    const cargando = ref(false);

    const exportando = ref(false);

    // ========================================================
    // BUSQUEDA
    // ========================================================

    const buscar = ref('');

    // ========================================================
    // TOAST
    // ========================================================

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity,
            summary,
            detail,
            life: 4000
        });
    };

    // ========================================================
    // FECHA YYYY-MM-DD
    // ========================================================

    const handleFechaApi = (fecha) => {
        if (!fecha) {
            return '';
        }

        const valor = new Date(fecha);

        const year = valor.getFullYear();

        const month = String(valor.getMonth() + 1).padStart(2, '0');

        const day = String(valor.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // ========================================================
    // EMPRESAS FILTRADAS
    // ========================================================

    const empresasFiltradas = computed(() => {
        const texto = String(buscar.value || '')
            .trim()
            .toLowerCase();

        if (!texto) {
            return empresas.value;
        }

        return empresas.value.filter((empresa) => {
            const cuentas = Array.isArray(empresa.cuentas) ? empresa.cuentas : [];

            const coincideEmpresa = [empresa.razon_social, empresa.rfc].some((valor) =>
                String(valor || '')
                    .toLowerCase()
                    .includes(texto)
            );

            const coincideCuenta = cuentas.some((cuenta) => {
                return [cuenta.banco, cuenta.clave_banco, cuenta.cuenta_banco, cuenta.clabe_bancaria, cuenta.nombre_hoja].some((valor) =>
                    String(valor || '')
                        .toLowerCase()
                        .includes(texto)
                );
            });

            return coincideEmpresa || coincideCuenta;
        });
    });

    // ========================================================
    // TODAS SELECCIONADAS
    // ========================================================

    const todasSeleccionadas = computed(() => {
        if (empresas.value.length === 0) {
            return false;
        }

        return empresas.value.every((empresa) => {
            return empresasSeleccionadas.value.some((seleccionada) => seleccionada._id === empresa._id);
        });
    });

    // ========================================================
    // TOTAL CUENTAS SELECCIONADAS
    // ========================================================

    const totalCuentasSeleccionadas = computed(() => {
        return empresasSeleccionadas.value.reduce((total, empresa) => {
            const totalEmpresa = Number(empresa?.total_cuentas ?? empresa?.cuentas?.length ?? 0);

            return total + totalEmpresa;
        }, 0);
    });

    // ========================================================
    // CARGAR EMPRESAS
    // ========================================================

    const handleCargarEmpresas = async () => {
        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/conciliacion/empresas'
            });

            if (res.estatus !== 200) {
                empresas.value = [];

                empresasSeleccionadas.value = [];

                handleToast('error', res.mensaje || 'No fue posible consultar las empresas.');

                return;
            }

            const datos = res.datos ?? {};

            empresas.value = Array.isArray(datos.empresas) ? datos.empresas : [];

            // ==================================================
            // DE CAJON:
            // TODAS SELECCIONADAS
            // ==================================================

            empresasSeleccionadas.value = [...empresas.value];
        } catch (error) {
            console.error('ERROR CARGANDO EMPRESAS CONCILIACION:', error);

            empresas.value = [];

            empresasSeleccionadas.value = [];

            handleToast('error', 'Ocurrió un error al consultar las empresas.');
        } finally {
            cargando.value = false;
        }
    };

    // ========================================================
    // EMPRESA SELECCIONADA
    // ========================================================

    const handleEmpresaSeleccionada = (empresa) => {
        return empresasSeleccionadas.value.some((item) => item._id === empresa._id);
    };

    // ========================================================
    // CAMBIAR EMPRESA INDIVIDUAL
    // ========================================================

    const handleCambiarEmpresa = (empresa) => {
        const indice = empresasSeleccionadas.value.findIndex((item) => item._id === empresa._id);

        if (indice >= 0) {
            empresasSeleccionadas.value.splice(indice, 1);
        } else {
            empresasSeleccionadas.value.push(empresa);
        }
    };

    // ========================================================
    // SELECCIONAR / QUITAR TODAS
    // ========================================================

    const handleSeleccionarTodas = () => {
        if (todasSeleccionadas.value) {
            empresasSeleccionadas.value = [];

            return;
        }

        empresasSeleccionadas.value = [...empresas.value];
    };

    // ========================================================
    // LIMPIAR BUSQUEDA
    // ========================================================

    const handleLimpiarBusqueda = () => {
        buscar.value = '';
    };

    // ========================================================
    // RESTABLECER
    // ========================================================

    const handleRestablecer = () => {
        fechaInicial.value = fechaInicialDefault();

        fechaFinal.value = fechaFinalDefault();

        buscar.value = '';

        empresasSeleccionadas.value = [...empresas.value];
    };

    // ========================================================
    // DESCARGAR BLOB
    // ========================================================

    const handleDescargarBlob = (blob, nombreArchivo) => {
        const archivo =
            blob instanceof Blob
                ? blob
                : new Blob([blob], {
                      type: 'application/' + 'vnd.openxmlformats-officedocument.' + 'spreadsheetml.sheet'
                  });

        const url = window.URL.createObjectURL(archivo);

        const enlace = document.createElement('a');

        enlace.href = url;

        enlace.download = nombreArchivo;

        document.body.appendChild(enlace);

        enlace.click();

        document.body.removeChild(enlace);

        window.URL.revokeObjectURL(url);
    };

    // ========================================================
    // LEER ERROR BLOB
    // ========================================================

    const handleMensajeBlob = async (data) => {
        try {
            if (data instanceof Blob) {
                const texto = await data.text();

                const json = JSON.parse(texto);

                return json.mensaje || 'No fue posible generar la conciliación.';
            }
        } catch {
            // No es JSON.
        }

        return 'No fue posible generar la conciliación.';
    };

    // ========================================================
    // EXPORTAR
    // ========================================================

    const handleExportar = async () => {
        // ====================================================
        // FECHA INICIAL
        // ====================================================

        if (!fechaInicial.value) {
            handleToast('warn', 'Seleccione la fecha inicial.');

            return;
        }

        // ====================================================
        // FECHA FINAL
        // ====================================================

        if (!fechaFinal.value) {
            handleToast('warn', 'Seleccione la fecha final.');

            return;
        }

        // ====================================================
        // RANGO
        // ====================================================

        if (fechaInicial.value > fechaFinal.value) {
            handleToast('warn', 'La fecha inicial no puede ser ' + 'mayor a la fecha final.');

            return;
        }

        // ====================================================
        // EMPRESAS
        // ====================================================

        if (empresasSeleccionadas.value.length === 0) {
            handleToast('warn', 'Seleccione por lo menos una empresa.');

            return;
        }

        exportando.value = true;

        try {
            const fechaInicio = handleFechaApi(fechaInicial.value);

            const fechaFin = handleFechaApi(fechaFinal.value);

            const payload = {
                fecha_inicial: fechaInicio,

                fecha_final: fechaFin,

                empresas: empresasSeleccionadas.value.map((empresa) => empresa._id)
            };

            console.log('PAYLOAD CONCILIACION:', payload);

            const res = await store.dispatch('api/apiPostTokenFile', {
                direccion: '/estados_cuenta/conciliacion/exportar',

                datosJson: payload
            });

            if (res.estatus !== 200) {
                const mensaje = await handleMensajeBlob(res.data);

                handleToast('error', res.mensaje || mensaje);

                return;
            }

            if (!res.data) {
                handleToast('error', 'El servidor no devolvió el archivo Excel.');

                return;
            }

            const nombreArchivo = 'Conciliacion_Bancaria_' + fechaInicio + '_' + fechaFin + '.xlsx';

            handleDescargarBlob(res.data, nombreArchivo);

            handleToast('success', 'Conciliación bancaria exportada correctamente.', 'Excel');
        } catch (error) {
            console.error('ERROR EXPORTANDO CONCILIACION:', error);

            handleToast('error', 'Ocurrió un error al generar ' + 'la conciliación bancaria.');
        } finally {
            exportando.value = false;
        }
    };

    // ========================================================
    // INIT
    // ========================================================

    onMounted(async () => {
        await handleCargarEmpresas();
    });

    // ========================================================
    // RETURN
    // ========================================================

    return {
        // Fechas
        fechaInicial,
        fechaFinal,
        fechaActual,

        // Empresas
        empresas,
        empresasFiltradas,
        empresasSeleccionadas,

        // Búsqueda
        buscar,

        // Estados
        cargando,
        exportando,

        // Computed
        todasSeleccionadas,
        totalCuentasSeleccionadas,

        // Métodos
        handleSeleccionarTodas,
        handleEmpresaSeleccionada,
        handleCambiarEmpresa,

        handleLimpiarBusqueda,
        handleRestablecer,

        handleExportar
    };
};

export default useProceso;
