import { computed, onMounted, ref } from 'vue';

import { useToast } from 'primevue/usetoast';

import { useStore } from 'vuex';

const useProceso = () => {
    // ============================================================
    // STORE / TOAST
    // ============================================================

    const store = useStore();

    const toast = useToast();

    // ============================================================
    // CARGAS
    // ============================================================

    const cargas = ref([]);

    const cargando = ref(false);

    const eliminando = ref(false);

    const cargaEliminandoId = ref(null);

    // ============================================================
    // FILTROS
    // ============================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: 'contains'
        }
    });

    const empresaFiltro = ref(null);

    const bancoFiltro = ref(null);

    const anioFiltro = ref(null);

    // ============================================================
    // TOAST
    // ============================================================

    const handleToast = (severity, detail, summary = 'Notificación') => {
        toast.add({
            severity: severity,

            summary: summary,

            detail: detail,

            life: 3500
        });
    };

    // ============================================================
    // CARGAR HISTORIAL
    // ============================================================

    const handleCargarHistorial = async () => {
        if (cargando.value) {
            return;
        }

        cargando.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/estados_cuenta/cargas'
            });

            console.log('RESPUESTA HISTORIAL CARGAS:', res);

            if (res?.estatus !== 200) {
                cargas.value = [];

                handleToast('error', res?.mensaje || 'No fue posible consultar el historial de cargas.');

                return;
            }

            const datos = res?.datos ?? {};

            cargas.value = Array.isArray(datos?.cargas) ? datos.cargas : [];
        } catch (error) {
            console.error('ERROR CARGANDO HISTORIAL:', error);

            cargas.value = [];

            handleToast('error', 'Ocurrió un error al consultar ' + 'el historial de cargas.');
        } finally {
            cargando.value = false;
        }
    };

    // ============================================================
    // EMPRESAS DISPONIBLES
    // ============================================================

    const empresas = computed(() => {
        const mapa = new Map();

        cargas.value.forEach((carga) => {
            const companyId = String(carga?.company_id ?? '');

            const nombre = carga?.empresa?.razon_social ?? '';

            if (!companyId || !nombre) {
                return;
            }

            if (!mapa.has(companyId)) {
                mapa.set(companyId, {
                    _id: companyId,

                    nombre: nombre,

                    rfc: carga?.empresa?.rfc ?? ''
                });
            }
        });

        return Array.from(mapa.values()).sort((a, b) => {
            return String(a.nombre).localeCompare(String(b.nombre), 'es', {
                sensitivity: 'base'
            });
        });
    });

    // ============================================================
    // BANCOS DISPONIBLES
    // ============================================================

    const bancos = computed(() => {
        const mapa = new Map();

        cargas.value.forEach((carga) => {
            const clave = String(carga?.banco?.clabe_banco ?? carga?.clabe_banco ?? '');

            const nombre = carga?.banco?.descripcion ?? '';

            if (!clave && !nombre) {
                return;
            }

            const key = clave + '|' + nombre;

            if (!mapa.has(key)) {
                mapa.set(key, {
                    clave: clave,

                    nombre: nombre,

                    label: clave ? clave + ' - ' + nombre : nombre
                });
            }
        });

        return Array.from(mapa.values()).sort((a, b) => {
            return String(a.label).localeCompare(String(b.label), 'es', {
                sensitivity: 'base'
            });
        });
    });

    // ============================================================
    // AÑOS DISPONIBLES
    // ============================================================

    const anios = computed(() => {
        const valores = new Set();

        cargas.value.forEach((carga) => {
            const anio = Number(carga?.archivo?.anio);

            if (!Number.isNaN(anio) && anio > 0) {
                valores.add(anio);
            }
        });

        return Array.from(valores)
            .sort((a, b) => b - a)
            .map((anio) => ({
                label: String(anio),

                value: anio
            }));
    });

    // ============================================================
    // CARGAS FILTRADAS
    // ============================================================

    const cargasFiltradas = computed(() => {
        return cargas.value.filter((carga) => {
            // =================================================
            // EMPRESA
            // =================================================

            if (empresaFiltro.value) {
                if (String(carga?.company_id ?? '') !== String(empresaFiltro.value._id)) {
                    return false;
                }
            }

            // =================================================
            // BANCO
            // =================================================

            if (bancoFiltro.value) {
                const claveCarga = String(carga?.banco?.clabe_banco ?? carga?.clabe_banco ?? '');

                if (claveCarga !== String(bancoFiltro.value.clave)) {
                    return false;
                }
            }

            // =================================================
            // AÑO
            // =================================================

            if (anioFiltro.value) {
                if (Number(carga?.archivo?.anio) !== Number(anioFiltro.value)) {
                    return false;
                }
            }

            return true;
        });
    });

    // ============================================================
    // RESUMEN
    // ============================================================

    const totalCargas = computed(() => cargasFiltradas.value.length);

    const totalMovimientos = computed(() => {
        return cargasFiltradas.value.reduce((acumulado, carga) => {
            return acumulado + Number(carga?.total_movimientos_archivo ?? 0);
        }, 0);
    });

    const totalInsertados = computed(() => {
        return cargasFiltradas.value.reduce((acumulado, carga) => {
            return acumulado + Number(carga?.movimientos_insertados ?? 0);
        }, 0);
    });

    const totalDuplicados = computed(() => {
        return cargasFiltradas.value.reduce((acumulado, carga) => {
            return acumulado + Number(carga?.movimientos_duplicados ?? 0);
        }, 0);
    });

    // ============================================================
    // LIMPIAR FILTROS
    // ============================================================

    const handleLimpiarFiltros = () => {
        empresaFiltro.value = null;

        bancoFiltro.value = null;

        anioFiltro.value = null;

        filtros.value = {
            global: {
                value: null,

                matchMode: 'contains'
            }
        };
    };

    // ============================================================
    // ELIMINAR CARGA
    // ============================================================

    const handleEliminarCarga = async (carga) => {
        if (!carga?._id) {
            return;
        }

        const nombreArchivo = carga?.archivo?.nombre_original ?? 'el archivo';

        const empresa = carga?.empresa?.razon_social ?? 'la empresa';

        const confirmacion = window.confirm('¿Desea eliminar esta carga?\n\n' + 'Empresa: ' + empresa + '\n' + 'Archivo: ' + nombreArchivo + '\n\n' + 'Se eliminará el archivo físico y ' + 'los movimientos que no pertenezcan ' + 'a otra carga.');

        if (!confirmacion) {
            return;
        }

        if (eliminando.value) {
            return;
        }

        eliminando.value = true;

        cargaEliminandoId.value = carga._id;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/estados_cuenta/cargas/' + carga._id + '/eliminar',

                datosJson: {}
            });

            console.log('RESPUESTA ELIMINAR CARGA:', res);

            if (res?.estatus !== 200) {
                handleToast('error', res?.mensaje || 'No fue posible eliminar la carga.');

                return;
            }

            const datos = res?.datos ?? {};

            handleToast('success', 'Carga eliminada correctamente. ' + 'Movimientos eliminados: ' + String(datos?.movimientos_eliminados ?? 0) + '. Conservados: ' + String(datos?.movimientos_conservados ?? 0) + '.');

            await handleCargarHistorial();
        } catch (error) {
            console.error('ERROR ELIMINANDO CARGA:', error);

            handleToast('error', 'Ocurrió un error al ' + 'eliminar la carga.');
        } finally {
            eliminando.value = false;

            cargaEliminandoId.value = null;
        }
    };

    // ============================================================
    // FORMATO FECHA
    // ============================================================

    const handleFormatoFechaHora = (valor) => {
        if (!valor) {
            return '-';
        }

        try {
            const fecha = new Date(valor);

            if (Number.isNaN(fecha.getTime())) {
                return String(valor);
            }

            return new Intl.DateTimeFormat('es-MX', {
                year: 'numeric',

                month: '2-digit',

                day: '2-digit',

                hour: '2-digit',

                minute: '2-digit'
            }).format(fecha);
        } catch (error) {
            return String(valor);
        }
    };

    // ============================================================
    // CUENTA ENMASCARADA
    // ============================================================

    const handleCuentaEnmascarada = (valor) => {
        const texto = String(valor ?? '').trim();

        if (!texto) {
            return '-';
        }

        if (texto.length <= 4) {
            return texto;
        }

        return '•••• ' + texto.slice(-4);
    };

    // ============================================================
    // FORMATO MONEDA
    // ============================================================

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor ?? 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(Number.isNaN(numero) ? 0 : numero);
    };

    // ============================================================
    // INIT
    // ============================================================

    onMounted(async () => {
        await handleCargarHistorial();
    });

    // ============================================================
    // RETURN
    // ============================================================

    return {
        // DATOS

        cargas,

        cargasFiltradas,

        cargando,

        eliminando,

        cargaEliminandoId,

        // FILTROS

        filtros,

        empresaFiltro,

        bancoFiltro,

        anioFiltro,

        empresas,

        bancos,

        anios,

        // RESUMEN

        totalCargas,

        totalMovimientos,

        totalInsertados,

        totalDuplicados,

        // METODOS

        handleCargarHistorial,

        handleLimpiarFiltros,

        handleEliminarCarga,

        handleFormatoFechaHora,

        handleCuentaEnmascarada,

        handleFormatoMoneda
    };
};

export default useProceso;
