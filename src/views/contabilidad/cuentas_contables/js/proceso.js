import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const inicial = () => ({ id: null, company_id: '', revision: null, codigo: '', nombre: '', padre_id: null,
    tipo: 'activo', naturaleza: 'deudora', permite_movimientos: false, activo: true, descripcion: '' });
const ruta = '/contabilidad/cuentas/';
const tipos = [
    { nombre: 'Activo', valor: 'activo' }, { nombre: 'Pasivo', valor: 'pasivo' },
    { nombre: 'Capital', valor: 'capital' }, { nombre: 'Ingresos', valor: 'ingresos' },
    { nombre: 'Costos', valor: 'costos' }, { nombre: 'Gastos', valor: 'gastos' }, { nombre: 'Cuentas de orden', valor: 'orden' }
];
const naturalezas = [{ nombre: 'Deudora', valor: 'deudora' }, { nombre: 'Acreedora', valor: 'acreedora' }];

export default function proceso() {
    const store = useStore(), toast = useToast();
    const empresas = ref([]), empresa = ref(null), registros = ref([]), seleccionado = ref(null), historial = ref([]);
    const busqueda = ref(''), estado = ref(null), tipo = ref(null), uso = ref(null), primero = ref(0);
    const cargando = ref(false), guardando = ref(false), mostrar = ref(false), mostrarAyuda = ref(false), mostrarCambios = ref(false);
    const error = ref(''), errorFormulario = ref(''), detalleTab = ref('datos'), cambios = ref([]);
    const formulario = reactive(inicial());
    const estados = [{ nombre: 'Activas', valor: true }, { nombre: 'Inactivas', valor: false }];
    const usos = [{ nombre: 'Agrupadoras', valor: false }, { nombre: 'Permiten movimientos', valor: true }];
    let activo = true, consulta = 0, operacion = '';
    const empresaActual = computed(() => empresas.value.find(e => e.id === empresa.value));
    const handleTipo = valor => tipos.find(t => t.valor === valor)?.nombre || valor;
    const handleNaturaleza = valor => naturalezas.find(t => t.valor === valor)?.nombre || valor;
    const handleNormalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const orden = new Intl.Collator('es-MX', { numeric: true, sensitivity: 'base' });
    const mapa = computed(() => Object.fromEntries(registros.value.map(c => [c.id, c])));
    const handlePadreNombre = id => mapa.value[id] ? mapa.value[id].codigo + ' · ' + mapa.value[id].nombre : 'Cuenta principal';
    const filas = computed(() => registros.value.filter(c =>
        (estado.value === null || c.activo === estado.value) && (!tipo.value || c.tipo === tipo.value) &&
        (uso.value === null || c.permite_movimientos === uso.value) &&
        handleNormalizar(c.codigo + ' ' + c.nombre + ' ' + handlePadreNombre(c.padre_id)).includes(handleNormalizar(busqueda.value))
    ).sort((a,b) => orden.compare(a.codigo,b.codigo)));
    const padres = computed(() => registros.value.filter(c => c.activo && !c.permite_movimientos && c.nivel < 10 && c.id !== formulario.id)
        .map(c => ({ ...c, etiqueta: c.codigo + ' · ' + c.nombre })).sort((a,b) => orden.compare(a.codigo,b.codigo)));
    const padreActual = computed(() => mapa.value[formulario.padre_id]);
    const nivel = computed(() => padreActual.value ? padreActual.value.nivel + 1 : 1);
    const clasificacionFija = computed(() => !!formulario.padre_id || !!seleccionado.value?.tiene_hijas);
    const valido = computed(() => !!formulario.company_id && /^\d+(?:[.-]\d+)*$/.test(formulario.codigo) &&
        formulario.codigo.length <= 40 && !!formulario.nombre.trim() && formulario.nombre.length <= 150 &&
        formulario.descripcion.length <= 500 && tipos.some(t => t.valor === formulario.tipo) &&
        naturalezas.some(n => n.valor === formulario.naturaleza));
    const resumen = computed(() => [
        { nombre: 'Cuentas registradas', valor: registros.value.length, icono: 'pi pi-book' },
        { nombre: 'Agrupadoras', valor: registros.value.filter(c => !c.permite_movimientos).length, icono: 'pi pi-sitemap' },
        { nombre: 'Permiten movimientos', valor: registros.value.filter(c => c.permite_movimientos).length, icono: 'pi pi-pencil' },
        { nombre: 'Activas', valor: registros.value.filter(c => c.activo).length, icono: 'pi pi-check-circle' }
    ]);
    const handleCargar = async () => {
        if (guardando.value) return;
        const actual = ++consulta;
        cargando.value = true; error.value = '';
        try {
            const q = empresa.value ? '?company_id=' + encodeURIComponent(empresa.value) : '';
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: ruta + q });
            if (!activo || actual !== consulta) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            empresas.value = r.datos.empresas || []; registros.value = r.datos.cuentas || [];
        } catch (e) {
            if (activo && actual === consulta) { error.value = e.message || 'No fue posible consultar el cat\u00e1logo.'; registros.value = []; }
        } finally { if (activo && actual === consulta) cargando.value = false; }
    };
    const handleLimpiar = () => { busqueda.value = ''; estado.value = null; tipo.value = null; uso.value = null; primero.value = 0; };
    const handleEmpresa = () => { registros.value = []; handleLimpiar(); handleCargar(); };
    const handleNuevo = () => {
        if (!empresa.value || !empresaActual.value?.activo || cargando.value) return;
        Object.assign(formulario, inicial(), { company_id: empresa.value });
        seleccionado.value = null; historial.value = []; errorFormulario.value = ''; detalleTab.value = 'datos';
        operacion = crypto.randomUUID(); mostrar.value = true;
    };
    const handleEditar = async fila => {
        if (cargando.value || guardando.value) return;
        cargando.value = true;
        try {
            const r = await store.dispatch('api/apiGetTokenSinCargando', { direccion: ruta + fila.id });
            if (!activo) return;
            if (r.estatus !== 200) throw new Error(r.mensaje);
            Object.assign(formulario, inicial(), r.datos.cuenta);
            seleccionado.value = { ...r.datos.cuenta, tiene_hijas: r.datos.tiene_hijas };
            historial.value = r.datos.historial || []; errorFormulario.value = ''; detalleTab.value = 'datos';
            operacion = crypto.randomUUID(); mostrar.value = true;
        } catch (e) { if (activo) toast.add({ severity: 'error', summary: 'Cuentas contables', detail: e.message || 'No fue posible abrir la cuenta.', life: 4500 }); }
        finally { if (activo) cargando.value = false; }
    };
    const handleNombre = valor => { formulario.nombre = valor.toUpperCase(); };
    const handlePadre = () => {
        const padre = padreActual.value;
        if (padre) { formulario.tipo = padre.tipo; formulario.naturaleza = padre.naturaleza; }
    };
    const handleClasificacion = () => {
        if (!clasificacionFija.value && formulario.tipo !== 'orden') formulario.naturaleza = ['activo','costos','gastos'].includes(formulario.tipo) ? 'deudora' : 'acreedora';
    };
    const handleCancelar = () => { if (!guardando.value) { mostrar.value = false; errorFormulario.value = ''; } };
    const handleGuardar = async () => {
        if (guardando.value || !valido.value) return;
        guardando.value = true; errorFormulario.value = '';
        try {
            const r = await store.dispatch(formulario.id ? 'api/apiPutToken' : 'api/apiPostToken',
                { direccion: ruta, datosJson: { ...formulario, operacion_id: operacion } });
            if (!activo) return;
            if (r.estatus !== 200) {
                if (r.estatus === 400 || r.estatus === 409) operacion = crypto.randomUUID();
                throw new Error(r.mensaje);
            }
            mostrar.value = false;
            toast.add({ severity: 'success', summary: 'Cuentas contables', detail: r.mensaje, life: 4000 });
        } catch (e) { if (activo) errorFormulario.value = e.message || 'No fue posible guardar la cuenta.'; }
        finally { if (activo) guardando.value = false; }
        if (activo && !mostrar.value) await handleCargar();
    };
    const handleCambios = evento => { cambios.value = evento.cambios || []; mostrarCambios.value = true; };
    const handleFecha = valor => {
        if (!valor) return '';
        const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(new Date(valor));
        const v = Object.fromEntries(partes.map(p => [p.type,p.value]));
        return v.year + '-' + v.month + '-' + v.day + ' ' + v.hour + ':' + v.minute;
    };
    const guia = [
        { titulo: 'Carga masiva', texto: 'Descarga la plantilla, completa Cuentas y selecciona el Excel en Carga masiva. Se valida la estructura antes de guardar. Solo crea cuentas nuevas y conserva las cuentas existentes. Máximo 500 filas.' },
        { titulo: '1. Selecciona la empresa', texto: 'Cada empresa tiene su propio cat\u00e1logo. Un c\u00f3digo puede existir en empresas distintas, pero no repetirse dentro de la misma empresa.' },
        { titulo: '2. Crea la estructura', texto: 'Primero registra las cuentas principales como agrupadoras. Despu\u00e9s crea sus subcuentas eligiendo la cuenta padre. La clasificaci\u00f3n y naturaleza se heredan del padre. Se admiten hasta 10 niveles.' },
        { titulo: '3. Agrupadora o con movimientos', texto: 'Las agrupadoras organizan subcuentas. Las cuentas que permiten movimientos ser\u00e1n las que se utilicen al integrar las p\u00f3lizas. Una cuenta con subcuentas no puede convertirse en una cuenta de movimientos.' },
        { titulo: '4. Edita y consulta el historial', texto: 'El c\u00f3digo, la empresa y el padre se conservan despu\u00e9s del alta. Puedes editar nombre, descripci\u00f3n y estado. Si tiene subcuentas, tambi\u00e9n se conserva la clasificaci\u00f3n y naturaleza. El historial muestra responsable, fecha y valores anteriores y nuevos.' },
        { titulo: '5. Desactiva sin perder informaci\u00f3n', texto: 'Las cuentas no se eliminan f\u00edsicamente. Para desactivar una agrupadora, primero desactiva sus subcuentas activas. Esta etapa no genera p\u00f3lizas, saldos iniciales ni reportes contables.' }
    ];

    const mostrarImportacion = ref(false), importando = ref(false), archivoCarga = ref(''), filasCarga = ref([]), resultadoCarga = ref([]), errorCarga = ref(''), cargaValidada = ref(false), cargaCompleta = ref(false);
    let loteCarga = '', empresaCarga = '';
    const columnasCarga = ['Código','Nombre','Código de cuenta padre','Clasificación','Naturaleza','Permite movimientos','Activa','Descripción'];
    const handlePlantilla = async () => {
        const XLSX = await import('xlsx');
        const libro = XLSX.utils.book_new();
        const hoja = XLSX.utils.aoa_to_sheet([columnasCarga, ['100','ACTIVO','','Activo','Deudora','No','S\u00ed','EJEMPLO: BORRAR ESTA FILA ANTES DE IMPORTAR']]);
        hoja['!cols'] = [22,42,26,22,20,24,15,55].map(wch => ({ wch }));
        XLSX.utils.book_append_sheet(libro, hoja, 'Cuentas');
        const ayuda = XLSX.utils.aoa_to_sheet([
            ['Carga de cuentas nuevas'],
            ['La fila 2 de Cuentas es de ejemplo. Elimina esa fila antes de capturar e importar tus cuentas.'],
            ['Selecciona la empresa en Gekko. Completa la hoja Cuentas sin cambiar sus encabezados.'],
            ['Máximo 500 cuentas por archivo. Los códigos y códigos padre deben capturarse como texto para conservar ceros.'],
            ['Clasificación: Activo, Pasivo, Capital, Ingresos, Costos, Gastos o Cuentas de orden.'],
            ['Naturaleza: Deudora o Acreedora. Permite movimientos y Activa: Sí o No.'],
            ['Deja el código padre vacío para una cuenta principal. El padre puede existir o incluirse en el mismo archivo.'],
            ['No se actualizan cuentas existentes. Revisa la vista previa antes de confirmar.'],
            ['Ejemplos ilustrativos (no se importan desde esta hoja):'],
            columnasCarga,
            ['100','ACTIVO','','Activo','Deudora','No','Sí',''],
            ['100.01','CAJA','100','Activo','Deudora','Sí','Sí','']
        ]);
        ayuda['!cols'] = [{wch:36},{wch:42},{wch:26},{wch:22},{wch:20},{wch:24},{wch:15},{wch:55}];
        XLSX.utils.book_append_sheet(libro, ayuda, 'Instrucciones');
        XLSX.writeFile(libro, 'Plantilla_cuentas_contables.xlsx');
    };
    const handleAbrirImportacion = () => {
        empresaCarga = empresa.value;
        mostrarImportacion.value = true; archivoCarga.value = ''; filasCarga.value = []; resultadoCarga.value = [];
        errorCarga.value = ''; cargaValidada.value = false; cargaCompleta.value = false; loteCarga = crypto.randomUUID();
    };
    const handleArchivoCarga = async evento => {
        if (importando.value) return;
        cargaValidada.value = false; cargaCompleta.value = false; resultadoCarga.value = []; errorCarga.value = ''; filasCarga.value = [];
        const archivo = evento.files?.[0];
        if (!archivo) return;
        archivoCarga.value = archivo.name; loteCarga = crypto.randomUUID(); importando.value = true;
        try {
            if (!/\.xlsx$/i.test(archivo.name) || archivo.size > 2 * 1024 * 1024) throw new Error('Selecciona un Excel .xlsx de hasta 2 MB.');
            const XLSX = await import('xlsx');
            const libro = XLSX.read(await archivo.arrayBuffer(), {type:'array'});
            const hoja = libro.Sheets.Cuentas;
            if (!hoja) throw new Error('El archivo debe tener la hoja Cuentas de la plantilla.');
            const rango = XLSX.utils.decode_range(hoja['!ref'] || 'A1');
            if (rango.e.r > 501 || rango.e.c > 7) throw new Error('La plantilla admite hasta 500 cuentas y sus 8 columnas.');
            for (const celda of Object.values(hoja)) if (celda?.f) throw new Error('Captura valores, no fórmulas, en la hoja Cuentas.');
            const matriz = XLSX.utils.sheet_to_json(hoja, {header:1,defval:'',raw:true});
            if (JSON.stringify(matriz[0]) !== JSON.stringify(columnasCarga)) throw new Error('Los encabezados deben coincidir con la plantilla.');
            const booleano = valor => { const v = handleNormalizar(String(valor).trim()); return v === 'si' ? true : v === 'no' ? false : valor; };
            filasCarga.value = matriz.slice(1).map(f => {
                const texto = n => typeof f[n] === 'number' && Number.isInteger(f[n]) ? String(f[n]) : f[n] ?? '';
                return {codigo:texto(0),nombre:f[1] ?? '',codigo_padre:texto(2),
                    tipo:tipos.find(t => handleNormalizar(t.nombre) === handleNormalizar(String(f[3] ?? '').trim()))?.valor || f[3] || '',
                    naturaleza:naturalezas.find(n => handleNormalizar(n.nombre) === handleNormalizar(String(f[4] ?? '').trim()))?.valor || f[4] || '',
                    permite_movimientos:booleano(f[5]),activo:booleano(f[6]),descripcion:f[7] ?? ''};
            });
            while (filasCarga.value.length && Object.values(filasCarga.value.at(-1)).every(v => v === '')) filasCarga.value.pop();
            await handleValidarCarga();
        } catch(e) { errorCarga.value = e.message || 'No fue posible leer el archivo.'; }
        finally { importando.value = false; }
    };
    const handleEnviarCarga = async confirmar => {
        const r = await store.dispatch('api/apiPostToken', {direccion:ruta + 'importar/' + (confirmar ? 'guardar' : 'validar'),
            datosJson:{company_id:empresaCarga,lote_id:loteCarga,filas:filasCarga.value}});
        if (r.estatus !== 200) throw new Error(r.mensaje || 'No fue posible procesar la carga.');
        resultadoCarga.value = r.datos.filas || [];
        cargaValidada.value = r.datos.errores === 0 || r.datos.completa === false;
        errorCarga.value = r.datos.errores ? r.mensaje : '';
        cargaCompleta.value = r.datos.completa === true;
        return r;
    };
    const handleValidarCarga = async () => { await handleEnviarCarga(false); };
    const handleGuardarCarga = async () => {
        if (importando.value || !cargaValidada.value || cargaCompleta.value) return;
        importando.value = true; errorCarga.value = '';
        try {
            const r = await handleEnviarCarga(true);
            if (cargaCompleta.value) toast.add({severity:'success',summary:'Cuentas contables',detail:r.datos.guardadas + ' cuentas incorporadas.',life:4500});
        } catch(e) { errorCarga.value = (e.message || 'No fue posible completar la carga.') + ' Puedes reintentar sin duplicar cuentas.'; }
        finally { importando.value = false; await handleCargar(); }
    };

    onMounted(handleCargar);
    onUnmounted(() => { activo = false; consulta++; });
    return { mostrarImportacion, importando, archivoCarga, resultadoCarga, errorCarga, cargaValidada, cargaCompleta, handlePlantilla, handleAbrirImportacion, handleArchivoCarga, handleGuardarCarga, empresas, empresa, empresaActual, registros, seleccionado, historial, formulario, tipos, naturalezas,
        busqueda, estado, tipo, uso, usos, estados, primero, filas, padres, padreActual, nivel, clasificacionFija, resumen,
        cargando, guardando, mostrar, mostrarAyuda, mostrarCambios, cambios, error, errorFormulario, detalleTab, valido, guia,
        handleCargar, handleLimpiar, handleEmpresa, handleNuevo, handleEditar, handleNombre, handlePadre, handleClasificacion,
        handleCancelar, handleGuardar, handleCambios, handleFecha, handleTipo, handleNaturaleza, handlePadreNombre };
}
