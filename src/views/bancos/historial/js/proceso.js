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
    const puedeRevertir = ref(false);
    const verArchivadas = ref(false);
    const mostrarReversion = ref(false);
    const cargandoReversion = ref(false);
    const guardandoReversion = ref(false);
    const impactoReversion = ref(null);
    const cargaReversion = ref(null);
    const motivoReversion = ref('');
    const confirmarReversion = ref(false);
    const reversionSoloConsulta = ref(false);
    const reversionRequiereRevision = ref(false);


    const cargando = ref(false);

    const eliminando = ref(false);
    const mostrarEliminarCarga = ref(false);
    const cargaPorEliminar = ref(null);
    const errorEliminarCarga = ref('');
    const eliminacionSinConfirmar = ref(false);

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
                direccion: '/estados_cuenta/cargas' + (verArchivadas.value ? '?archivadas=1' : '')
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

    const handleEliminarCarga = (carga) => {
        if (!carga?._id || carga.archivada || eliminando.value) return;
        cargaPorEliminar.value = carga;
        errorEliminarCarga.value = '';
        eliminacionSinConfirmar.value = false;
        mostrarEliminarCarga.value = true;
    };

    const handleConfirmarEliminarCarga = async () => {
        const carga = cargaPorEliminar.value;
        if (!carga?._id || eliminando.value || eliminacionSinConfirmar.value) return;
        errorEliminarCarga.value = '';
        eliminando.value = true;

        cargaEliminandoId.value = carga._id;

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/estados_cuenta/cargas/' + carga._id + '/eliminar',

                datosJson: {}
            });


            if (res?.estatus !== 200) {
                errorEliminarCarga.value = res?.mensaje || 'No fue posible eliminar la carga.';
                eliminacionSinConfirmar.value = !res?.estatus || res.estatus >= 500;

                return;
            }

            const datos = res?.datos ?? {};

            handleToast('success', 'Carga eliminada correctamente. ' + 'Movimientos eliminados: ' + String(datos?.movimientos_eliminados ?? 0) + '. Conservados: ' + String(datos?.movimientos_conservados ?? 0) + '.');

            mostrarEliminarCarga.value = false;
            cargaPorEliminar.value = null;
            await handleCargarHistorial();
        } catch (error) {
            console.error('ERROR ELIMINANDO CARGA:', error);

            errorEliminarCarga.value = 'No se confirmó la eliminación. Actualiza el historial antes de intentar nuevamente.';
            eliminacionSinConfirmar.value = true;
        } finally {
            eliminando.value = false;

            cargaEliminandoId.value = null;
        }
    };


    const handlePermisosReversion = async () => {
        const res = await store.dispatch('api/apiGetToken', { direccion: '/estados_cuenta/cargas/permisos' });
        puedeRevertir.value = res?.estatus === 200 && res?.datos?.puede_revertir === true;
    };

    const handleAbrirReversion = async (carga) => {
        if (!puedeRevertir.value || cargandoReversion.value || !carga?._id) return;
        cargaReversion.value = carga;
        impactoReversion.value = null;
        motivoReversion.value = '';
        confirmarReversion.value = false;
        reversionRequiereRevision.value = false;
        reversionSoloConsulta.value = carga.archivada === true || ['aplicando', 'revision_requerida'].includes(carga.reversion?.estado);
        mostrarReversion.value = true;
        cargandoReversion.value = true;
        try {
            const endpoint = reversionSoloConsulta.value ? 'reversion' : 'impacto_reversion';
            const res = await store.dispatch('api/apiGetToken', { direccion: `/estados_cuenta/cargas/${carga._id}/${endpoint}` });
            if (res?.estatus !== 200) {
                handleToast('error', res?.mensaje || 'No fue posible consultar el impacto.');
                mostrarReversion.value = false;
                return;
            }
            impactoReversion.value = reversionSoloConsulta.value ? { ...res.datos.impacto, historial: res.datos } : res.datos;
            if (reversionSoloConsulta.value) motivoReversion.value = res.datos.motivo || '';
        } catch {
            handleToast('error', 'No fue posible consultar la reversión.');
            mostrarReversion.value = false;
        } finally { cargandoReversion.value = false; }
    };

    const handleArchivarDesdeEliminacion = async () => {
        if (!puedeRevertir.value || eliminando.value || eliminacionSinConfirmar.value) return;
        const carga = cargaPorEliminar.value;
        mostrarEliminarCarga.value = false;
        await handleAbrirReversion(carga);
    };

    const handleConfirmarReversion = async () => {
        if (!puedeRevertir.value || guardandoReversion.value || reversionSoloConsulta.value || reversionRequiereRevision.value || !confirmarReversion.value || motivoReversion.value.trim().length < 10 || !impactoReversion.value?.revision_impacto) return;
        guardandoReversion.value = true;
        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/estados_cuenta/cargas/${cargaReversion.value._id}/revertir`,
                datosJson: { motivo: motivoReversion.value.trim(), confirmar: true, revision_impacto: impactoReversion.value.revision_impacto }
            });
            if (res?.estatus !== 200) {
                reversionRequiereRevision.value = !res?.estatus || res.estatus >= 500;
                handleToast('error', res?.mensaje || 'No se confirmó la operación. Revisa el historial antes de reintentar.');
                return;
            }
            handleToast('success', res.mensaje || 'Carga revertida y archivada.');
            mostrarReversion.value = false;
            await handleCargarHistorial();
        } catch {
            reversionRequiereRevision.value = true;
            handleToast('error', 'Resultado sin confirmar. Revisa el historial antes de reintentar.');
        } finally { guardandoReversion.value = false; }
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
        await handlePermisosReversion();
        await handleCargarHistorial();
    });

    // ============================================================
    // RETURN
    // ============================================================

    return {
        mostrarEliminarCarga, cargaPorEliminar, errorEliminarCarga, eliminacionSinConfirmar,
        handleConfirmarEliminarCarga, handleArchivarDesdeEliminacion,
        puedeRevertir, verArchivadas, mostrarReversion, cargandoReversion, guardandoReversion,
        impactoReversion, cargaReversion, motivoReversion, confirmarReversion, reversionSoloConsulta,
        reversionRequiereRevision, handleAbrirReversion, handleConfirmarReversion,
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
