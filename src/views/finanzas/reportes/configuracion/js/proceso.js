import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

export default function useProceso() {
    const store = useStore(), toast = useToast();
    const direccion = '/finanzas/reportes/configuracion';
    const reportes = ref([]), opciones = ref({ dimensiones: [], valores: [], filtros: [] });
    const cargando = ref(false), guardando = ref(false), editando = ref(false), busqueda = ref(''), estado = ref(null);
    const mostrarAyuda = ref(false), mostrarCambio = ref(false), cambioSeleccionado = ref(null), errorFormulario = ref('');
    const handleVacio = () => ({ nombre: '', descripcion: '', origen: 'movimientos_bancarios', filas: ['concepto'], columnas: ['mes'], valores: ['ingresos', 'egresos'], filtros: ['empresa', 'periodo'], subtotales: true, total_general: true, mostrar_grafica: true, activo: true, historial: [] });
    const formulario = ref(handleVacio());
    const ocupado = computed(() => cargando.value || guardando.value);
    const estados = [{ label: 'Activos', value: true }, { label: 'Inactivos', value: false }];
    const datos = computed(() => reportes.value.filter(item => (estado.value === null || item.activo === estado.value) && `${item.nombre} ${item.descripcion}`.toLocaleLowerCase().includes(busqueda.value.toLocaleLowerCase())));
    const dimensionesFilas = computed(() => opciones.value.dimensiones.filter(item => !formulario.value.columnas.includes(item.value)));
    const dimensionesColumnas = computed(() => opciones.value.dimensiones.filter(item => !formulario.value.filas.includes(item.value)));
    const filtrosAdicionales = computed(() => opciones.value.filtros.filter(item => !['empresa', 'periodo'].includes(item.value)));
    const filtrosElegidos = computed({ get: () => formulario.value.filtros.filter(item => !['empresa', 'periodo'].includes(item)), set: valor => { formulario.value.filtros = ['empresa', 'periodo', ...valor]; } });
    const handleDatos = res => res?.datos?.datos ?? res?.datos ?? res?.data?.datos ?? res?.data ?? {};
    const handleToast = (severity, detail) => toast.add({ severity, summary: 'Configurador de reportes', detail, life: 4500 });
    const handlePeticion = async (accion, ruta, payload) => {
        const res = await store.dispatch(`api/${accion}`, { direccion: ruta, ...(payload ? { datosJson: payload } : {}) });
        if (![200, 201].includes(res?.estatus)) throw new Error(res?.mensaje || 'No fue posible completar la operacion.');
        return handleDatos(res);
    };
    const handleActualizar = async () => {
        if (ocupado.value) return;
        cargando.value = true;
        try { reportes.value = (await handlePeticion('apiGetToken', `${direccion}/`)).reportes || []; }
        catch (error) { handleToast('error', error.message); } finally { cargando.value = false; }
    };
    const handleNuevo = () => { if (ocupado.value) return; formulario.value = handleVacio(); errorFormulario.value = ''; editando.value = true; };
    const handleEditar = async item => {
        if (ocupado.value) return;
        cargando.value = true;
        try { formulario.value = (await handlePeticion('apiGetToken', `${direccion}/${item._id}`)).reporte; formulario.value.mostrar_grafica ??= true; errorFormulario.value = ''; editando.value = true; }
        catch (error) { handleToast('error', error.message); } finally { cargando.value = false; }
    };
    const handleCancelar = () => { if (ocupado.value) return; editando.value = false; formulario.value = handleVacio(); errorFormulario.value = ''; };
    const handleValidar = () => {
        const f = formulario.value;
        if (f.nombre.trim().length < 3) return 'Escribe un nombre de al menos 3 caracteres.';
        if (f.filas.length < 1 || f.filas.length > 4) return 'Selecciona entre una y cuatro agrupaciones en filas.';
        if (f.columnas.length > 2) return 'Selecciona hasta dos agrupaciones en columnas.';
        if (!f.valores.length) return 'Selecciona al menos un valor para el reporte.';
        return '';
    };
    const handleGuardar = async () => {
        if (ocupado.value) return;
        errorFormulario.value = handleValidar();
        if (errorFormulario.value) { handleToast('warn', errorFormulario.value); return; }
        guardando.value = true;
        try {
            const f = formulario.value;
            const payload = { nombre: f.nombre.trim(), descripcion: f.descripcion, filas: [...f.filas], columnas: [...f.columnas], valores: [...f.valores], filtros: [...f.filtros], subtotales: f.subtotales, total_general: f.total_general, mostrar_grafica: f.mostrar_grafica, activo: f.activo, ...(f._id ? { revision: f.revision } : {}) };
            await handlePeticion(f._id ? 'apiPutToken' : 'apiPostToken', f._id ? `${direccion}/${f._id}` : `${direccion}/`, payload);
            handleToast('success', 'Diseno del reporte guardado.'); editando.value = false;
        } catch (error) { errorFormulario.value = error.message; handleToast('error', error.message); }
        finally { guardando.value = false; }
        if (!editando.value) await handleActualizar();
    };
    const handleMover = (campo, indice, sentido) => {
        if (ocupado.value) return;
        const lista = formulario.value[campo], siguiente = indice + sentido;
        if (siguiente < 0 || siguiente >= lista.length) return;
        [lista[indice], lista[siguiente]] = [lista[siguiente], lista[indice]];
    };
    const handleEtiqueta = campo => [...opciones.value.dimensiones, ...opciones.value.valores, ...opciones.value.filtros].find(item => item.value === campo)?.label || campo;
    const handleCampo = campo => ({ nombre: 'Nombre', descripcion: 'Descripcion', activo: 'Activo', filas: 'Filas', columnas: 'Columnas', valores: 'Valores', filtros: 'Filtros', subtotales: 'Subtotales', total_general: 'Total general', mostrar_grafica: 'Mostrar grafica', origen: 'Origen de datos', version_esquema: 'Version del diseno' }[campo] || campo);
    const handleValor = valor => valor === null || valor === undefined ? 'Sin dato' : typeof valor === 'boolean' ? (valor ? 'Si' : 'No') : Array.isArray(valor) ? valor.map(handleEtiqueta).join(' / ') || 'Sin seleccion' : valor === 'movimientos_bancarios' ? 'Movimientos bancarios' : String(valor);
    const handleFecha = valor => { if (!valor) return ''; const fecha = new Date(valor); return `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')} ${fecha.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}`; };
    const handleCambios = item => { cambioSeleccionado.value = item; mostrarCambio.value = true; };
    const handleLimpiar = () => { busqueda.value = ''; estado.value = null; };
    // Muestra ilustrativa local: no consulta ni guarda movimientos bancarios.
    const muestrasReporte = [
        { empresa: 'Empresa ejemplo', banco: 'BBVA', cuenta: 'Cuenta 001', concepto: 'SERVICIOS', anio: '2026', mes: '01 - Enero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Completa', con_facturas: 'Con facturas', ingresos: 0, egresos: 2500, aplicado: 2500, pendiente: 0, uuids: ['FACTURA-A'] },
        { empresa: 'Empresa ejemplo', banco: 'BBVA', cuenta: 'Cuenta 001', concepto: 'SERVICIOS', anio: '2026', mes: '02 - Febrero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Parcial', con_facturas: 'Con facturas', ingresos: 0, egresos: 3000, aplicado: 1000, pendiente: 2000, uuids: ['FACTURA-B'] },
        { empresa: 'Empresa ejemplo', banco: 'Santander', cuenta: 'Cuenta 002', concepto: 'SERVICIOS', anio: '2026', mes: '02 - Febrero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Completa', con_facturas: 'Con facturas', ingresos: 0, egresos: 1500, aplicado: 1500, pendiente: 0, uuids: ['FACTURA-A'] },
        { empresa: 'Empresa ejemplo', banco: 'BBVA', cuenta: 'Cuenta 001', concepto: 'RENTA', anio: '2026', mes: '01 - Enero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Completa', con_facturas: 'Con facturas', ingresos: 0, egresos: 8000, aplicado: 8000, pendiente: 0, uuids: ['FACTURA-C', 'FACTURA-D'] },
        { empresa: 'Empresa ejemplo', banco: 'Santander', cuenta: 'Cuenta 002', concepto: 'RENTA', anio: '2026', mes: '02 - Febrero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Sin aplicacion', con_facturas: 'Sin facturas', ingresos: 0, egresos: 8000, aplicado: 0, pendiente: 8000, uuids: [] },
        { empresa: 'Empresa ejemplo', banco: 'BBVA', cuenta: 'Cuenta 001', concepto: 'COBRANZA', anio: '2026', mes: '01 - Enero', tipo_movimiento: 'Ingreso', estado_aplicacion: 'Completa', con_facturas: 'Con facturas', ingresos: 12000, egresos: 0, aplicado: 12000, pendiente: 0, uuids: ['FACTURA-E'] },
        { empresa: 'Empresa ejemplo', banco: 'Santander', cuenta: 'Cuenta 002', concepto: 'COBRANZA', anio: '2026', mes: '02 - Febrero', tipo_movimiento: 'Ingreso', estado_aplicacion: 'Parcial', con_facturas: 'Con facturas', ingresos: 6000, egresos: 0, aplicado: 3000, pendiente: 3000, uuids: ['FACTURA-F'] },
        { empresa: 'Empresa ejemplo', banco: 'BBVA', cuenta: 'Cuenta 001', concepto: 'Sin concepto', anio: '2026', mes: '02 - Febrero', tipo_movimiento: 'Egreso', estado_aplicacion: 'Sin aplicacion', con_facturas: 'Sin facturas', ingresos: 0, egresos: 500, aplicado: 0, pendiente: 500, uuids: [] }
    ];
    const vistaPrevia = computed(() => {
        const f = formulario.value;
        if (!f.filas.length || !f.valores.length) return { columnas: [], filas: [] };
        const claveGrupo = registro => JSON.stringify(f.columnas.map(campo => registro[campo]));
        const grupos = [...new Map(muestrasReporte.map(registro => [claveGrupo(registro), f.columnas.map(campo => registro[campo])])).entries()].sort((a,b) => a[0].localeCompare(b[0]));
        const columnas = [];
        grupos.forEach(([clave, etiquetas], indice) => f.valores.forEach(valor => columnas.push({ field: `v${indice}_${valor}`, header: [...etiquetas, handleEtiqueta(valor)].join(' / '), clave, valor, total: false })));
        if (f.total_general && f.columnas.length) f.valores.forEach(valor => columnas.push({ field: `total_${valor}`, header: `Total / ${handleEtiqueta(valor)}`, valor, total: true }));
        const calcular = (registros, valor) => valor === 'movimientos' ? registros.length : valor === 'facturas' ? new Set(registros.flatMap(registro => registro.uuids)).size : registros.reduce((suma, registro) => suma + Number(registro[valor] || 0), 0);
        const filas = [];
        const agregar = (registros, etiquetas, tipo, profundidad) => {
            const fila = { id: `muestra-${filas.length}`, tipo, profundidad, ...Object.fromEntries(f.filas.map((campo, indice) => [campo, etiquetas[indice] || ''])) };
            columnas.forEach(columna => { fila[columna.field] = calcular(columna.total ? registros : registros.filter(registro => claveGrupo(registro) === columna.clave), columna.valor); });
            filas.push(fila);
        };
        const agrupar = (registros, nivel, etiquetas) => {
            const campo = f.filas[nivel];
            const valores = [...new Set(registros.map(registro => registro[campo]))].sort((a,b) => a.localeCompare(b));
            valores.forEach(valor => {
                const seleccion = registros.filter(registro => registro[campo] === valor), nuevas = [...etiquetas, valor];
                if (nivel === f.filas.length - 1) agregar(seleccion, nuevas, 'detalle', nivel);
                else {
                    agrupar(seleccion, nivel + 1, nuevas);
                    if (f.subtotales) agregar(seleccion, nuevas.map((nombre, indice) => indice === nivel ? `Subtotal ${nombre}` : nombre), 'subtotal', nivel);
                }
            });
        };
        agrupar(muestrasReporte, 0, []);
        if (f.total_general) agregar(muestrasReporte, ['Total general'], 'total', 0);
        return { columnas, filas };
    });
    const handleImportePrevia = (valor, campo) => new Intl.NumberFormat('es-MX', ['movimientos', 'facturas'].includes(campo) ? { maximumFractionDigits: 0 } : { style: 'currency', currency: 'MXN' }).format(valor || 0);
    const handleClasePrevia = fila => fila.tipo === 'total' ? 'previa-total' : fila.tipo === 'subtotal' ? 'previa-subtotal' : '';
    onMounted(async () => {
        cargando.value = true;
        try { opciones.value = await handlePeticion('apiGetToken', `${direccion}/opciones`); reportes.value = (await handlePeticion('apiGetToken', `${direccion}/`)).reportes || []; }
        catch (error) { handleToast('error', error.message); } finally { cargando.value = false; }
    });
    return { vistaPrevia, handleImportePrevia, handleClasePrevia, reportes, opciones, datos, cargando, guardando, editando, busqueda, estado, estados, formulario, ocupado, dimensionesFilas, dimensionesColumnas, filtrosAdicionales, filtrosElegidos, mostrarAyuda, errorFormulario, mostrarCambio, cambioSeleccionado,
        handleActualizar, handleNuevo, handleEditar, handleCancelar, handleGuardar, handleMover, handleEtiqueta, handleCampo, handleValor, handleFecha, handleCambios, handleLimpiar };
}
