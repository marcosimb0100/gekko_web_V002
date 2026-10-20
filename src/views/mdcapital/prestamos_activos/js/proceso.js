import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const prestamos = ref([]);
    const prestamoSeleccionado = ref(null);
    const mostrarDialogAmortizacion = ref(false);
    const cargando = ref(false);
    const buscar = ref('');
    const filtroPago = ref('todos');
    const filtroTipoPrestamo = ref('todos');
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

    // Seleccion por destino (prestamo + plazo). Un destino admite un solo UUID,
    // ya sea propuesto automaticamente o elegido manualmente en un periodo ambiguo.
    const seleccionCFDI = ref([]);
    const origenSeleccion = ref('individual');
    const uuidsGuardadosSesion = ref(new Set());
    const mostrarConfirmacionGuardado = ref(false);
    const guardandoCFDI = ref(false);
    const progresoGuardado = ref({ procesados: 0, total: 0, correctos: 0, errores: 0 });
    const resultadosGuardado = ref([]);
    const llaveDestino = (prestamo, periodo) => `${prestamo.idPrestamo}|${periodo.plazo}`;
    const uuidNormalizado = (uuid) =>
        String(uuid || '')
            .trim()
            .toUpperCase();
    const periodoSeleccionado = (prestamo, periodo) => seleccionCFDI.value.find((x) => x.clave === llaveDestino(prestamo, periodo)) || null;
    const esPropuesta = (p) => p?.estado === 'propuesta_cronologica' && !!p?.uuidPropuesto && !p?.uuidMdCapital && !uuidsGuardadosSesion.value.has(uuidNormalizado(p.uuidPropuesto));
    const esAmbiguoSeleccionable = (p) => p?.estado === 'ambiguo' && !p?.uuidMdCapital && Array.isArray(p?.candidatos) && p.candidatos.length > 0;

    const prestamosEnRevision = computed(() => (origenSeleccion.value === 'global' ? resultadoGlobal.value : resultadoIndividual.value ? [resultadoIndividual.value] : []));
    const periodosEnRevision = computed(() => prestamosEnRevision.value.flatMap((prestamo) => (prestamo.periodos || []).map((periodo) => ({ prestamo, periodo }))));
    const propuestasDisponibles = computed(() => periodosEnRevision.value.filter(({ periodo }) => esPropuesta(periodo)));
    const manualesDisponibles = computed(() => periodosEnRevision.value.filter(({ periodo }) => esAmbiguoSeleccionable(periodo)));
    const uuidConflictos = computed(() => {
        const conteo = new Map();
        for (const { periodo } of propuestasDisponibles.value) {
            const uuid = uuidNormalizado(periodo.uuidPropuesto);
            conteo.set(uuid, (conteo.get(uuid) || 0) + 1);
        }
        return new Set([...conteo].filter(([, cantidad]) => cantidad > 1).map(([uuid]) => uuid));
    });
    const estaSeleccionado = (prestamo, periodo) => {
        const seleccionado = periodoSeleccionado(prestamo, periodo);
        return !!seleccionado && seleccionado.modo === 'automatico' && seleccionado.uuid === uuidNormalizado(periodo.uuidPropuesto);
    };
    const estaManualSeleccionado = (prestamo, periodo) => periodoSeleccionado(prestamo, periodo)?.modo === 'manual';
    const alternarSeleccion = (prestamo, periodo, checked) => {
        const clave = llaveDestino(prestamo, periodo);
        if (!checked) {
            seleccionCFDI.value = seleccionCFDI.value.filter((x) => x.clave !== clave);
            return;
        }
        if (guardandoCFDI.value || !esPropuesta(periodo) || uuidConflictos.value.has(uuidNormalizado(periodo.uuidPropuesto))) return;
        const uuid = uuidNormalizado(periodo.uuidPropuesto);
        if (seleccionCFDI.value.some((x) => x.uuid === uuid && x.clave !== clave)) {
            toast.add({ severity: 'warn', summary: 'UUID repetido', detail: 'Un UUID solo puede asignarse a un periodo.', life: 4500 });
            return;
        }
        seleccionCFDI.value = [...seleccionCFDI.value.filter((x) => x.clave !== clave), { clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid, modo: 'automatico' }];
    };
    // Sugerencia visible por periodo, SIN autorizar el guardado.
    // El backend calcula las reservas de forma global para ambos prestamos.
    const borradoresAmbiguos = ref({});
    const uuidSugeridoAmbiguo = (prestamo, periodo) => {
        const clave = llaveDestino(prestamo, periodo);
        const borrador = borradoresAmbiguos.value[clave];
        if (borrador !== undefined) return borrador;
        return uuidNormalizado(periodo.uuidPropuesto) || null;
    };
    const cambiarSugerenciaAmbigua = (prestamo, periodo, uuidElegido) => {
        if (guardandoCFDI.value || !esAmbiguoSeleccionable(periodo)) return;
        const clave = llaveDestino(prestamo, periodo);
        const uuid = uuidNormalizado(uuidElegido);
        if (uuid && !(periodo.candidatos || []).some((c) => uuidNormalizado(c.uuid) === uuid)) return;
        borradoresAmbiguos.value = { ...borradoresAmbiguos.value, [clave]: uuid || null };
        // Actualiza la preseleccion, si el nuevo UUID esta libre y es elegible.
        seleccionarCandidatoManual(prestamo, periodo, uuid || null);
    };
    const alternarConfirmacionAmbigua = (prestamo, periodo, checked) => {
        if (!checked) {
            seleccionarCandidatoManual(prestamo, periodo, null);
            return;
        }
        const uuid = uuidSugeridoAmbiguo(prestamo, periodo);
        if (!uuid) return;
        seleccionarCandidatoManual(prestamo, periodo, uuid);
    };
    const candidatoSugerido = (prestamo, periodo) => (periodo.candidatos || []).find((c) => uuidNormalizado(c.uuid) === uuidSugeridoAmbiguo(prestamo, periodo)) || null;
    const uuidManualSeleccion = (prestamo, periodo) => {
        const seleccionado = periodoSeleccionado(prestamo, periodo);
        return seleccionado?.modo === 'manual' ? seleccionado.uuid : null;
    };
    const seleccionarCandidatoManual = (prestamo, periodo, uuidElegido) => {
        const clave = llaveDestino(prestamo, periodo);
        if (guardandoCFDI.value) return;
        if (!uuidElegido) {
            seleccionCFDI.value = seleccionCFDI.value.filter((x) => x.clave !== clave);
            return;
        }
        const uuid = uuidNormalizado(uuidElegido);
        const candidato = (periodo.candidatos || []).find((c) => uuidNormalizado(c.uuid) === uuid);
        if (!esAmbiguoSeleccionable(periodo) || !candidato) {
            toast.add({ severity: 'warn', summary: 'Candidato no válido', detail: 'Vuelve a analizar el préstamo y selecciona un CFDI elegible.', life: 4500 });
            return;
        }
        if (uuidsGuardadosSesion.value.has(uuid) || seleccionCFDI.value.some((x) => x.uuid === uuid && x.clave !== clave)) {
            toast.add({ severity: 'warn', summary: 'UUID repetido', detail: 'Ese CFDI ya está seleccionado o guardado para otro periodo.', life: 4500 });
            return;
        }
        seleccionCFDI.value = [...seleccionCFDI.value.filter((x) => x.clave !== clave), { clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid, modo: 'manual' }];
    };
    // Preseleccion local: NO escribe en SQL ni llama al endpoint de guardado.
    // Solo se aceptan sugerencias del backend presentes en los candidatos y
    // se evita reutilizar un UUID entre destinos del mismo analisis.
    const preseleccionarSugerencias = (prestamosAnalizados) => {
        const nuevas = [];
        const ocupados = new Set(uuidsGuardadosSesion.value);
        for (const prestamo of prestamosAnalizados || []) {
            for (const periodo of prestamo.periodos || []) {
                const uuid = uuidNormalizado(periodo.uuidPropuesto);
                if (!uuid || ocupados.has(uuid)) continue;
                const clave = llaveDestino(prestamo, periodo);
                if (esAmbiguoSeleccionable(periodo)) {
                    if (!(periodo.candidatos || []).some((c) => uuidNormalizado(c.uuid) === uuid)) continue;
                    nuevas.push({ clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid, modo: 'manual' });
                } else if (esPropuesta(periodo)) {
                    nuevas.push({ clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid, modo: 'automatico' });
                } else continue;
                ocupados.add(uuid);
            }
        }
        seleccionCFDI.value = nuevas;
    };
    const propuestasElegibles = computed(() => propuestasDisponibles.value.filter(({ periodo }) => !uuidConflictos.value.has(uuidNormalizado(periodo.uuidPropuesto))));
    const totalElegibles = computed(() => propuestasElegibles.value.length);
    const todasSeleccionadas = computed(() => totalElegibles.value > 0 && propuestasElegibles.value.every(({ prestamo, periodo }) => estaSeleccionado(prestamo, periodo)));
    const seleccionarTodas = () => {
        if (guardandoCFDI.value || conciliandoGlobal.value) return;
        const disponibles = propuestasElegibles.value;
        if (todasSeleccionadas.value) {
            const claves = new Set(disponibles.map(({ prestamo, periodo }) => llaveDestino(prestamo, periodo)));
            seleccionCFDI.value = seleccionCFDI.value.filter((x) => !claves.has(x.clave));
            return;
        }
        const nuevas = [...seleccionCFDI.value];
        const claves = new Set(nuevas.map((x) => x.clave));
        const uuids = new Set(nuevas.map((x) => x.uuid));
        for (const { prestamo, periodo } of disponibles) {
            const clave = llaveDestino(prestamo, periodo);
            const uuid = uuidNormalizado(periodo.uuidPropuesto);
            if (claves.has(clave) || uuids.has(uuid)) continue;
            nuevas.push({ clave, uuid, idPrestamo: prestamo.idPrestamo, plazo: Number(periodo.plazo), facturaUuid: uuid, modo: 'automatico' });
            claves.add(clave);
            uuids.add(uuid);
        }
        seleccionCFDI.value = nuevas;
    };
    const elegiblesPrestamo = (prestamo) => (prestamo?.periodos || []).filter((p) => esPropuesta(p) && !uuidConflictos.value.has(uuidNormalizado(p.uuidPropuesto)));
    const seleccionadasPrestamo = (prestamo) => elegiblesPrestamo(prestamo).filter((p) => estaSeleccionado(prestamo, p)).length;
    const alternarPrestamoCompleto = (prestamo) => {
        if (guardandoCFDI.value || conciliandoGlobal.value) return;
        const periodos = elegiblesPrestamo(prestamo);
        const seleccionar = periodos.some((p) => !estaSeleccionado(prestamo, p));
        for (const periodo of periodos) alternarSeleccion(prestamo, periodo, seleccionar);
    };
    const seleccionVigente = computed(() => {
        const destinos = new Map(periodosEnRevision.value.map(({ prestamo, periodo }) => [llaveDestino(prestamo, periodo), { prestamo, periodo }]));
        const candidatos = seleccionCFDI.value.filter((x) => {
            const destino = destinos.get(x.clave);
            if (!destino || uuidsGuardadosSesion.value.has(x.uuid)) return false;
            const { periodo } = destino;
            if (x.modo === 'automatico') return esPropuesta(periodo) && uuidNormalizado(periodo.uuidPropuesto) === x.uuid;
            if (x.modo === 'manual') return esAmbiguoSeleccionable(periodo) && (periodo.candidatos || []).some((c) => uuidNormalizado(c.uuid) === x.uuid);
            return false;
        });
        const conteo = new Map();
        for (const x of candidatos) conteo.set(x.uuid, (conteo.get(x.uuid) || 0) + 1);
        const repetidos = new Set([...conteo].filter(([, n]) => n > 1).map(([uuid]) => uuid));
        return candidatos.filter((x) => !repetidos.has(x.uuid));
    });
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
                        datosJson: {
                            confirmado: true,
                            registros: lote.map(({ idPrestamo, plazo, facturaUuid, modo }) => ({
                                idPrestamo,
                                plazo,
                                facturaUuid,
                                modo: modo || 'automatico'
                            }))
                        }
                    });
                    const filas = Array.isArray(res?.datos?.resultados) ? res.datos.resultados : null;
                    if (Number(res?.estatus) !== 200 || !filas) throw new Error(res?.mensaje || 'Respuesta de guardado no válida. Verifique MD Capital antes de reintentar.');
                    for (const fila of filas) {
                        const ok = Number(fila.error) === 0;
                        resultadosGuardado.value.push(fila);
                        progresoGuardado.value.procesados++;
                        progresoGuardado.value[ok ? 'correctos' : 'errores']++;
                        if (ok) {
                            uuidsGuardadosSesion.value = new Set([...uuidsGuardadosSesion.value, uuidNormalizado(fila.facturaUuid)]);
                            seleccionCFDI.value = seleccionCFDI.value.filter((x) => !(x.idPrestamo === fila.idPrestamo && x.plazo === Number(fila.plazo) && x.uuid === uuidNormalizado(fila.facturaUuid)));
                        }
                    }
                } catch (error) {
                    for (const fila of lote)
                        resultadosGuardado.value.push({
                            ...fila,
                            error: 2,
                            estado: 'desconocido',
                            mensaje: 'Estado no confirmado. Consulte MD Capital antes de reintentar. ' + (error?.message || '')
                        });
                    progresoGuardado.value.procesados += lote.length;
                    progresoGuardado.value.errores += lote.length;
                    break;
                }
            }
            toast.add({
                severity: progresoGuardado.value.errores ? 'warn' : 'success',
                summary: 'Guardado CFDI',
                detail: `${progresoGuardado.value.correctos} guardados, ${progresoGuardado.value.errores} no confirmados/rechazados.`,
                life: 6500
            });
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

    // Catálogo dinámico obtenido de los préstamos cargados (sin valores fijos).
    const opcionesTipoPrestamo = computed(() => {
        const nombres = new Map();
        for (const item of prestamos.value) {
            const nombre = String(item.prestamo?.nombrePrestamo || '').trim();
            if (nombre && !nombres.has(nombre.toLocaleLowerCase('es-MX'))) {
                nombres.set(nombre.toLocaleLowerCase('es-MX'), nombre);
            }
        }
        return [
            { label: 'Todos', value: 'todos' },
            ...Array.from(nombres.entries())
                .sort((a, b) => a[1].localeCompare(b[1], 'es-MX'))
                .map(([value, label]) => ({ label, value }))
        ];
    });

    // Vista previa de solicitudes: no escribe en MongoDB.
    const prestamosParaMesa = ref([]);
    const mostrarVistaPreviaMesa = ref(false);
    const empresaMesa = ref('6a42fe70c4f6d1d7a5eee614');
    const seleccionTodosMesa = computed(() => prestamosFiltrados.value.length > 0 && prestamosFiltrados.value.every((p) => prestamosParaMesa.value.includes(p.idPrestamo)));
    const alternarPrestamoMesa = (id, checked) => {
        prestamosParaMesa.value = checked ? [...new Set([...prestamosParaMesa.value, id])] : prestamosParaMesa.value.filter((x) => x !== id);
    };
    const alternarTodosMesa = (checked) => {
        const visibles = new Set(prestamosFiltrados.value.map((p) => p.idPrestamo));
        prestamosParaMesa.value = checked ? [...new Set([...prestamosParaMesa.value, ...visibles])] : prestamosParaMesa.value.filter((id) => !visibles.has(id));
    };
    const prestamosSeleccionadosMesa = computed(() => prestamos.value.filter((p) => prestamosParaMesa.value.includes(p.idPrestamo)));
    const abrirVistaPreviaMesa = () => {
        if (!prestamosSeleccionadosMesa.value.length) return;
        mostrarVistaPreviaMesa.value = true;
    };

    const prestamosFiltrados = computed(() => {
        const termino = buscar.value.trim().toLocaleLowerCase('es-MX');
        return prestamos.value.filter((item) => {
            const texto = [item.idPrestamo, item.cliente?.nombreCompleto, item.cliente?.rfc, item.prestamo?.nombrePrestamo].map((x) => String(x || '').toLocaleLowerCase('es-MX')).join(' ');
            if (termino && !texto.includes(termino)) return false;
            const tipo = String(item.prestamo?.nombrePrestamo || '')
                .trim()
                .toLocaleLowerCase('es-MX');
            if (filtroTipoPrestamo.value !== 'todos' && tipo !== filtroTipoPrestamo.value) return false;
            const pagados = Number(item.resumen?.periodosPagados || 0);
            const total = Number(item.resumen?.totalPeriodos || 0);
            if (filtroPago.value === 'con_pagos') return pagados > 0;
            if (filtroPago.value === 'sin_pagos') return pagados === 0;
            if (filtroPago.value === 'completo') return total > 0 && pagados >= total;
            return true;
        });
    });

    // Exporta todos los préstamos que cumplen los filtros actuales, no solo la página visible.
    const handleExportarExcel = () => {
        const lista = prestamosFiltrados.value;
        if (cargando.value) {
            toast.add({ severity: 'warn', summary: 'Excel', detail: 'Espera a que termine la consulta de préstamos.', life: 3500 });
            return;
        }
        if (!lista.length) {
            toast.add({ severity: 'warn', summary: 'Excel', detail: 'No hay préstamos para exportar con los filtros actuales.', life: 3500 });
            return;
        }
        try {
            const datos = lista.map((item) => ({
                Cliente: item.cliente?.nombreCompleto || '',
                RFC: item.cliente?.rfc || '',
                'ID préstamo': item.idPrestamo || '',
                Préstamo: item.prestamo?.nombrePrestamo || '',
                Periodicidad: item.prestamo?.periodicidad || '',
                Monto: Number(item.prestamo?.montoPrestamo || 0),
                'Periodos pagados': Number(item.resumen?.periodosPagados || 0),
                'Periodos programados': Number(item.resumen?.totalPeriodos || 0),
                'UUID registrados': Number(item.resumen?.periodosConUuid || 0)
            }));
            const hoja = XLSX.utils.json_to_sheet(datos);
            hoja['!cols'] = [{ wch: 38 }, { wch: 19 }, { wch: 22 }, { wch: 24 }, { wch: 16 }, { wch: 17 }, { wch: 19 }, { wch: 23 }, { wch: 20 }];
            hoja['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: datos.length, c: 8 } }) };
            for (let i = 2; i <= datos.length + 1; i++) {
                const celda = hoja[`F${i}`];
                if (celda) celda.z = '#,##0.00';
            }
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, 'Préstamos activos');
            const fecha = new Date();
            const fechaArchivo = [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-');
            XLSX.writeFile(libro, `MD_Capital_Prestamos_Activos_${fechaArchivo}.xlsx`);
            toast.add({ severity: 'success', summary: 'Excel', detail: `${datos.length} préstamos exportados correctamente.`, life: 3500 });
        } catch (error) {
            console.error('EXPORTAR PRÉSTAMOS MD CAPITAL:', error);
            toast.add({ severity: 'error', summary: 'Excel', detail: 'No fue posible generar el archivo Excel.', life: 4500 });
        }
    };

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
        borradoresAmbiguos.value = {};
        origenSeleccion.value = 'individual';
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
            preseleccionarSugerencias([resultadoIndividual.value]);
            mostrarDialogConciliacion.value = true;
            toast.add({ severity: 'info', summary: 'Análisis terminado', detail: 'Sugerencias preseleccionadas para revisión. No se guardó ningún UUID.', life: 5000 });
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
        borradoresAmbiguos.value = {};
        origenSeleccion.value = 'global';
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
            if (!cancelarGlobal.value) {
                preseleccionarSugerencias(resultadoGlobal.value);
                toast.add({ severity: 'info', summary: 'Análisis global finalizado', detail: 'Sugerencias preseleccionadas para revisión. No se guardaron UUID.', life: 5000 });
            }
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
        origenSeleccion.value = 'global';
        filtroConciliacion.value = 'todos';
        mostrarDialogConciliacion.value = true;
    };

    const handleSeleccionar = (prestamo) => {
        if (!prestamo) return;
        prestamoSeleccionado.value = prestamo;
        resultadoIndividual.value = null;
        origenSeleccion.value = 'individual';
        seleccionCFDI.value = [];
        mostrarDialogAmortizacion.value = true;
    };
    const handleCerrarDetalle = () => {
        mostrarDialogAmortizacion.value = false;
        prestamoSeleccionado.value = null;
    };
    const handleLimpiar = () => {
        buscar.value = '';
        filtroPago.value = 'todos';
        filtroTipoPrestamo.value = 'todos';
    };
    onMounted(handleConsultar);

    return {
        prestamosParaMesa,
        mostrarVistaPreviaMesa,
        empresaMesa,
        seleccionTodosMesa,
        alternarPrestamoMesa,
        alternarTodosMesa,
        prestamosSeleccionadosMesa,
        abrirVistaPreviaMesa,
        prestamos,
        prestamoSeleccionado,
        mostrarDialogAmortizacion,
        cargando,
        buscar,
        filtroPago,
        opcionesPago,
        filtroTipoPrestamo,
        opcionesTipoPrestamo,
        mensajeError,
        prestamosFiltrados,
        handleExportarExcel,
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
        origenSeleccion,
        mostrarConfirmacionGuardado,
        guardandoCFDI,
        progresoGuardado,
        resultadosGuardado,
        propuestasDisponibles,
        manualesDisponibles,
        uuidConflictos,
        esPropuesta,
        estaSeleccionado,
        estaManualSeleccionado,
        uuidManualSeleccion,
        uuidSugeridoAmbiguo,
        cambiarSugerenciaAmbigua,
        alternarConfirmacionAmbigua,
        candidatoSugerido,
        seleccionarCandidatoManual,
        alternarSeleccion,
        seleccionVigente,
        totalElegibles,
        todasSeleccionadas,
        seleccionarTodas,
        elegiblesPrestamo,
        seleccionadasPrestamo,
        alternarPrestamoCompleto,
        abrirConfirmacionGuardado,
        confirmarGuardado
    };
};

export default useProceso;
