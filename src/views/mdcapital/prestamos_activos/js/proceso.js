import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const prestamos = ref([]);
    const prestamoSeleccionado = ref(null);
    const mostrarDialogAmortizacion = ref(false);
    const cargando = ref(false);
    const buscar = ref('');
    const filtroPago = ref('todos');
    const mensajeError = ref('');
    const conciliandoIndividual = ref(false);
    const resultadoIndividual = ref(null);
    const mostrarDialogConciliacion = ref(false);
    const rfcEmisor = ref('');
    const conciliandoGlobal = ref(false);
    const cancelarGlobal = ref(false);
    const resultadoGlobal = ref([]);
    const mostrarDialogGlobal = ref(false);
    const globalProgreso = ref({ procesados: 0, total: 0, lotes: 0 });
    const errorGlobal = ref('');
    const filtroConciliacion = ref('todos');
    const opcionesConciliacion = [
        { label: 'Todos', value: 'todos' },
        { label: 'Sin coincidencia', value: 'sin_coincidencia' },
        { label: 'Candidato por importe', value: 'candidato_por_importe' },
        { label: 'Ambiguo', value: 'ambiguo' },
        { label: 'UUID sin verificar', value: 'uuid_registrado_sin_verificar' }
    ];
    const periodosIndividuales = computed(() => {
        const periodos = resultadoIndividual.value?.periodos || [];
        return filtroConciliacion.value === 'todos' ? periodos : periodos.filter((p) => p.estado === filtroConciliacion.value);
    });
    const resumenConciliacion = computed(() => {
        const conteos = {};
        for (const p of resultadoIndividual.value?.periodos || []) {
            conteos[p.estado] = (conteos[p.estado] || 0) + 1;
        }
        return conteos;
    });
    const porcentajeGlobal = computed(() => porcentaje(globalProgreso.value.procesados, globalProgreso.value.total));

    const opcionesPago = [
        { label: 'Todos', value: 'todos' },
        { label: 'Con pagos', value: 'con_pagos' },
        { label: 'Sin pagos', value: 'sin_pagos' },
        { label: 'Pago completo', value: 'completo' }
    ];

    const porcentaje = (parte, total) => {
        const divisor = Number(total || 0);
        return divisor > 0 ? Math.min(100, Math.max(0, (Number(parte || 0) / divisor) * 100)) : 0;
    };

    const formatoMoneda = (valor) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number.isFinite(Number(valor)) ? Number(valor) : 0);

    const formatoFecha = (valor) => (valor ? String(valor).substring(0, 10) : '—');

    const prestamosFiltrados = computed(() => {
        const termino = buscar.value.trim().toLocaleLowerCase('es-MX');
        return prestamos.value.filter((item) => {
            const texto = [item.idPrestamo, item.cliente?.nombreCompleto, item.cliente?.rfc, item.prestamo?.nombrePrestamo].map((x) => String(x || '').toLocaleLowerCase('es-MX')).join(' ');
            if (termino && !texto.includes(termino)) return false;
            const pagados = Number(item.resumen?.periodosPagados || 0);
            const total = Number(item.resumen?.totalPeriodos || 0);
            if (filtroPago.value === 'con_pagos') return pagados > 0;
            if (filtroPago.value === 'sin_pagos') return pagados === 0;
            if (filtroPago.value === 'completo') return total > 0 && pagados >= total;
            return true;
        });
    });

    const resumen = computed(() =>
        prestamosFiltrados.value.reduce(
            (acum, item) => {
                acum.totalPrestamos++;
                acum.periodosTotales += Number(item.resumen?.totalPeriodos || 0);
                acum.periodosPagados += Number(item.resumen?.periodosPagados || 0);
                acum.periodosConUuid += Number(item.resumen?.periodosConUuid || 0);
                return acum;
            },
            { totalPrestamos: 0, periodosTotales: 0, periodosPagados: 0, periodosConUuid: 0 }
        )
    );

    const handleConsultar = async () => {
        if (cargando.value) return;
        cargando.value = true;
        mensajeError.value = '';
        try {
            const respuesta = await store.dispatch('api/apiGetToken', {
                direccion: 'mdcapital/prestamos/pt'
            });
            // apiGet_token devuelve data.datos como respuesta.datos.
            // El endpoint entrega { error: 0, datos: { prestamos: [...] } }.
            // Por tanto, respuesta.datos es { prestamos: [...] }.
            if (Number(respuesta?.estatus) !== 200) {
                throw new Error(respuesta?.mensaje || 'No fue posible consultar los préstamos.');
            }
            const datos = respuesta?.datos;
            const lista = datos?.prestamos;
            if (!Array.isArray(lista)) {
                throw new Error('La API no devolvió una lista de préstamos válida.');
            }
            prestamos.value = lista;
            if (prestamoSeleccionado.value) {
                prestamoSeleccionado.value = lista.find((p) => p.idPrestamo === prestamoSeleccionado.value.idPrestamo) || null;
                if (!prestamoSeleccionado.value) mostrarDialogAmortizacion.value = false;
            }
        } catch (error) {
            console.error('MD CAPITAL PRESTAMOS:', error);
            mensajeError.value = error.message || 'Error consultando MD Capital.';
            toast.add({ severity: 'error', summary: 'Préstamos MD Capital', detail: mensajeError.value, life: 4000 });
        } finally {
            cargando.value = false;
        }
    };

    const interpretar = (res) => {
        if (Number(res?.estatus) !== 200) {
            throw new Error(res?.mensaje || 'No fue posible ejecutar la conciliación.');
        }
        const datos = res?.datos;
        if (!datos || !Array.isArray(datos.prestamos)) {
            throw new Error('La conciliación no devolvió la estructura esperada.');
        }
        return datos;
    };

    const handleConciliarIndividual = async () => {
        if (conciliandoIndividual.value || !prestamoSeleccionado.value?.idPrestamo) return;
        conciliandoIndividual.value = true;
        resultadoIndividual.value = null;
        filtroConciliacion.value = 'todos';
        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/mdcapital/conciliacion/individual',
                datosJson: {
                    idPrestamo: prestamoSeleccionado.value.idPrestamo,
                    ...(rfcEmisor.value.trim() ? { rfcEmisor: rfcEmisor.value.trim().toUpperCase() } : {})
                }
            });
            const datos = interpretar(res);
            resultadoIndividual.value = datos.prestamos[0] || null;
            if (!resultadoIndividual.value) throw new Error('No se encontró el préstamo en el análisis.');
            mostrarDialogConciliacion.value = true;
            toast.add({ severity: 'info', summary: 'Análisis terminado', detail: 'Los candidatos requieren revisión; no se modificaron CFDI ni UUID.', life: 5000 });
        } catch (error) {
            console.error('CONCILIACION INDIVIDUAL:', error);
            toast.add({ severity: 'error', summary: 'Conciliación individual', detail: error?.message || 'Error de consulta.', life: 5000 });
        } finally {
            conciliandoIndividual.value = false;
        }
    };

    const handleConciliarGlobal = async () => {
        if (conciliandoGlobal.value) return;
        conciliandoGlobal.value = true;
        cancelarGlobal.value = false;
        resultadoGlobal.value = [];
        errorGlobal.value = '';
        globalProgreso.value = { procesados: 0, total: 0, lotes: 0 };
        mostrarDialogGlobal.value = true;
        let offset = 0;
        try {
            while (!cancelarGlobal.value) {
                const res = await store.dispatch('api/apiPostToken', {
                    direccion: '/mdcapital/conciliacion/global',
                    datosJson: {
                        offset,
                        limite: 20,
                        ...(rfcEmisor.value.trim() ? { rfcEmisor: rfcEmisor.value.trim().toUpperCase() } : {})
                    }
                });
                const datos = interpretar(res);
                resultadoGlobal.value.push(...datos.prestamos);
                globalProgreso.value = {
                    procesados: resultadoGlobal.value.length,
                    total: Number(datos.totalPrestamos || 0),
                    lotes: globalProgreso.value.lotes + 1
                };
                if (!datos.hayMas || datos.siguienteOffset == null) break;
                const siguiente = Number(datos.siguienteOffset);
                if (!Number.isInteger(siguiente) || siguiente <= offset) {
                    throw new Error('La API devolvió una paginación inválida.');
                }
                offset = siguiente;
            }
            if (!cancelarGlobal.value) toast.add({ severity: 'info', summary: 'Análisis global finalizado', detail: 'Resultados disponibles para revisión. No se guardaron UUID.', life: 5000 });
        } catch (error) {
            console.error('CONCILIACION GLOBAL:', error);
            errorGlobal.value = error?.message || 'Error durante el análisis global.';
            toast.add({ severity: 'error', summary: 'Conciliación global', detail: errorGlobal.value, life: 6000 });
        } finally {
            conciliandoGlobal.value = false;
        }
    };
    const handleCancelarGlobal = () => {
        cancelarGlobal.value = true;
    };
    const estadoConciliacion = (estado) =>
        ({
            sin_coincidencia: 'Sin coincidencia',
            candidato_por_importe: 'Candidato por importe',
            ambiguo: 'Ambiguo',
            uuid_registrado_sin_verificar: 'UUID sin verificar'
        })[estado] ||
        estado ||
        '—';
    const severidadConciliacion = (estado) =>
        ({
            sin_coincidencia: 'secondary',
            candidato_por_importe: 'info',
            ambiguo: 'warning',
            uuid_registrado_sin_verificar: 'contrast'
        })[estado] || 'secondary';
    const totalEstado = (periodos, estado) => (periodos || []).filter((p) => p.estado === estado).length;
    const handleVerResultadoGlobal = (prestamo) => {
        resultadoIndividual.value = prestamo;
        filtroConciliacion.value = 'todos';
        mostrarDialogConciliacion.value = true;
    };

    const handleSeleccionar = (prestamo) => {
        if (!prestamo) return;
        prestamoSeleccionado.value = prestamo;
        resultadoIndividual.value = null;
        mostrarDialogAmortizacion.value = true;
    };
    const handleCerrarDetalle = () => {
        mostrarDialogAmortizacion.value = false;
        prestamoSeleccionado.value = null;
    };
    const handleLimpiar = () => {
        buscar.value = '';
        filtroPago.value = 'todos';
    };
    onMounted(handleConsultar);

    return {
        prestamos,
        prestamoSeleccionado,
        mostrarDialogAmortizacion,
        cargando,
        buscar,
        filtroPago,
        opcionesPago,
        mensajeError,
        prestamosFiltrados,
        resumen,
        porcentaje,
        formatoMoneda,
        formatoFecha,
        handleConsultar,
        handleSeleccionar,
        handleCerrarDetalle,
        handleLimpiar,
        conciliandoIndividual,
        resultadoIndividual,
        mostrarDialogConciliacion,
        rfcEmisor,
        conciliandoGlobal,
        cancelarGlobal,
        resultadoGlobal,
        mostrarDialogGlobal,
        globalProgreso,
        errorGlobal,
        filtroConciliacion,
        opcionesConciliacion,
        periodosIndividuales,
        resumenConciliacion,
        porcentajeGlobal,
        handleConciliarIndividual,
        handleConciliarGlobal,
        handleCancelarGlobal,
        estadoConciliacion,
        severidadConciliacion,
        totalEstado,
        handleVerResultadoGlobal
    };
};

export default useProceso;
