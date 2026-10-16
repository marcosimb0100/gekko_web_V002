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
        { label: 'Propuesta cronológica', value: 'propuesta_cronologica' },
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

    // Guardado confirmado: la seleccion se hace por prestamo + plazo + UUID.
    const seleccionCFDI = ref([]);
    const mostrarConfirmacionGuardado = ref(false);
    const guardandoCFDI = ref(false);
    const progresoGuardado = ref({ procesados: 0, total: 0, correctos: 0, errores: 0 });
    const resultadosGuardado = ref([]);
    const llavePropuesta = (prestamo, periodo) => `${prestamo.idPrestamo}|${periodo.plazo}|${String(periodo.uuidPropuesto || '').toUpperCase()}`;
    const esPropuesta = (p) => p?.estado === 'propuesta_cronologica' && !!p?.uuidPropuesto && !p?.uuidMdCapital;
    const uuidNormalizado = (uuid) =>
        String(uuid || '')
            .trim()
            .toUpperCase();
    const propuestasDisponibles = computed(() =>
        resultadoGlobal.value.length
            ? resultadoGlobal.value.flatMap((prestamo) => (prestamo.periodos || []).filter(esPropuesta).map((periodo) => ({ prestamo, periodo })))
            : (resultadoIndividual.value?.periodos || []).filter(esPropuesta).map((periodo) => ({ prestamo: resultadoIndividual.value, periodo }))
    );
    const uuidConflictos = computed(() => {
        const conteo = new Map();
        for (const { periodo } of propuestasDisponibles.value) {
            const uuid = uuidNormalizado(periodo.uuidPropuesto);
            conteo.set(uuid, (conteo.get(uuid) || 0) + 1);
        }
        return new Set([...conteo].filter(([, cantidad]) => cantidad > 1).map(([uuid]) => uuid));
    });
    const estaSeleccionado = (prestamo, periodo) => seleccionCFDI.value.some((x) => x.clave === llavePropuesta(prestamo, periodo));
    const alternarSeleccion = (prestamo, periodo, checked) => {
        const clave = llavePropuesta(prestamo, periodo);
        if (!checked) {
            seleccionCFDI.value = seleccionCFDI.value.filter((x) => x.clave !== clave);
            return;
        }
        if (!esPropuesta(periodo) || uuidConflictos.value.has(uuidNormalizado(periodo.uuidPropuesto))) return;
        const uuid = uuidNormalizado(periodo.uuidPropuesto);
        if (seleccionCFDI.value.some((x) => x.uuid === uuid && x.clave !== clave)) {
            toast.add({ severity: 'warn', summary: 'UUID repetido', detail: 'Un UUID solo puede asignarse a un periodo.', life: 4500 });
            return;
        }
        if (!estaSeleccionado(prestamo, periodo)) seleccionCFDI.value.push({ clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid });
    };
    const seleccionVigente = computed(() => seleccionCFDI.value.filter((x) => propuestasDisponibles.value.some(({ prestamo, periodo }) => llavePropuesta(prestamo, periodo) === x.clave && !uuidConflictos.value.has(x.uuid))));
    const abrirConfirmacionGuardado = () => {
        if (!seleccionVigente.value.length || guardandoCFDI.value || conciliandoGlobal.value) return;
        resultadosGuardado.value = [];
        progresoGuardado.value = { procesados: 0, total: seleccionVigente.value.length, correctos: 0, errores: 0 };
        mostrarConfirmacionGuardado.value = true;
    };
    const confirmarGuardado = async () => {
        if (guardandoCFDI.value || !seleccionVigente.value.length || conciliandoGlobal.value) return;
        guardandoCFDI.value = true;
        const pendientes = [...seleccionVigente.value];
        progresoGuardado.value = { procesados: 0, total: pendientes.length, correctos: 0, errores: 0 };
        resultadosGuardado.value = [];
        try {
            for (let i = 0; i < pendientes.length; i += 20) {
                const lote = pendientes.slice(i, i + 20);
                try {
                    const res = await store.dispatch('api/apiPostToken', {
                        direccion: '/mdcapital/conciliacion/guardar-lote',
                        datosJson: { confirmado: true, registros: lote.map(({ idPrestamo, plazo, facturaUuid }) => ({ idPrestamo, plazo, facturaUuid })) }
                    });
                    // La API puede devolver HTTP 200 aunque algunos registros del lote fallen.
                    const filas = Array.isArray(res?.datos?.resultados) ? res.datos.resultados : null;
                    if (Number(res?.estatus) !== 200 || !filas) throw new Error(res?.mensaje || 'Respuesta de guardado no valida. Verifique MD Capital antes de reintentar.');
                    for (const fila of filas) {
                        const ok = Number(fila.error) === 0;
                        resultadosGuardado.value.push(fila);
                        progresoGuardado.value.procesados++;
                        progresoGuardado.value[ok ? 'correctos' : 'errores']++;
                        if (ok) seleccionCFDI.value = seleccionCFDI.value.filter((x) => !(x.idPrestamo === fila.idPrestamo && x.plazo === Number(fila.plazo) && x.uuid === uuidNormalizado(fila.facturaUuid)));
                    }
                } catch (error) {
                    // No reintentar automaticamente: el servidor pudo haber guardado parte del lote.
                    for (const fila of lote) resultadosGuardado.value.push({ ...fila, error: 1, mensaje: error.message || 'Estado desconocido: consultar MD Capital antes de reintentar.' });
                    progresoGuardado.value.procesados += lote.length;
                    progresoGuardado.value.errores += lote.length;
                    break;
                }
            }
            toast.add({ severity: progresoGuardado.value.errores ? 'warn' : 'success', summary: 'Guardado CFDI', detail: `${progresoGuardado.value.correctos} guardados, ${progresoGuardado.value.errores} no confirmados/rechazados.`, life: 6500 });
            if (progresoGuardado.value.correctos) await handleConsultar();
        } finally {
            guardandoCFDI.value = false;
        }
    };
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
        seleccionCFDI.value = [];
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
        seleccionCFDI.value = [];
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
            propuesta_cronologica: 'Propuesta cronológica',
            candidato_por_importe: 'Candidato por importe',
            ambiguo: 'Ambiguo',
            uuid_registrado_sin_verificar: 'UUID sin verificar'
        })[estado] ||
        estado ||
        '—';
    const severidadConciliacion = (estado) =>
        ({
            sin_coincidencia: 'secondary',
            propuesta_cronologica: 'success',
            candidato_por_importe: 'info',
            ambiguo: 'warning',
            uuid_registrado_sin_verificar: 'contrast'
        })[estado] || 'secondary';
    // El helper de conciliacion devuelve resumenMdCapital; como respaldo,
    // contamos los periodos pagados incluidos en la respuesta del analisis.
    const periodosPagadosGlobal = (prestamo) => {
        const resumen = prestamo?.resumenMdCapital || prestamo?.resumen || {};
        if (resumen.periodosPagados !== undefined && resumen.periodosPagados !== null) {
            return Number(resumen.periodosPagados) || 0;
        }
        return (prestamo?.periodos || []).filter((p) => Number(p.pagado) === 1 || p.pagado === true).length;
    };

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
        periodosPagadosGlobal,
        handleVerResultadoGlobal,
        seleccionCFDI,
        mostrarConfirmacionGuardado,
        guardandoCFDI,
        progresoGuardado,
        resultadosGuardado,
        propuestasDisponibles,
        uuidConflictos,
        esPropuesta,
        estaSeleccionado,
        alternarSeleccion,
        seleccionVigente,
        abrirConfirmacionGuardado,
        confirmarGuardado
    };
};

export default useProceso;
