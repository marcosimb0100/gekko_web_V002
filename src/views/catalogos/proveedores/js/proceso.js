import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

const frmProveedorInit = () => ({
    _id: '', tipo_persona: '', rfc: '', razon_social_nombre_completo: '', calle: '', numero_ext: '', numero_int: '',
    colonia: '', poblacion: '', municipio: '', codigo_postal: '', pais: '', estado: '', correo_electronico: '',
    numero_contacto_principal: '', numero_contacto_alterno: '', activo: true, historial: []
});
const useProceso = () => {
    const store = useStore(), toast = useToast();
    const tablaProveedores = ref([]), catalogoSat = ref(null), mostrarTablaFormulario = ref(false), movimiento = ref(''), guardando = ref(false);
    const frmProveedor = reactive(frmProveedorInit());
    const filtros = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const logosProveedores = reactive({});
    const logosOriginales = reactive({});
    const versionesLogos = new Map(), pendientesLogos = new Set(), erroresLogos = new Set();
    const elementosLogos = new Map(), logosVisibles = new Set();
    let observadorLogos = null, descargasLogos = 0, colaLogos = [], vistaActiva = true;
    const handleProcesarLogos = () => {
        if (!vistaActiva) return;
        while (descargasLogos < 4 && colaLogos.length) {
            const proveedor = colaLogos.shift();
            const clave = proveedor._id + ':' + proveedor.logo_version;
            if (!logosVisibles.has(proveedor._id)) { pendientesLogos.delete(clave); continue; }
            descargasLogos++;
            (async () => {
                try {
                    const res = await store.dispatch('api/apiGetblobSinCargando', {
                        direccion: '/proveedores/logo/' + proveedor._id + '?miniatura=1&v=' + encodeURIComponent(proveedor.logo_version)
                    });
                    if (!vistaActiva || tablaProveedores.value.find(item => item._id === proveedor._id)?.logo_version !== proveedor.logo_version) return;
                    if (res.estatus === 200 && res.data instanceof Blob) {
                        if (logosProveedores[proveedor._id]) URL.revokeObjectURL(logosProveedores[proveedor._id]);
                        logosProveedores[proveedor._id] = URL.createObjectURL(res.data);
                        versionesLogos.set(proveedor._id, proveedor.logo_version);
                    } else erroresLogos.add(clave);
                } catch { erroresLogos.add(clave); }
                finally {
                    descargasLogos--;
                    pendientesLogos.delete(clave);
                    handleProcesarLogos();
                }
            })();
        }
    };
    const handleEncolarLogo = (proveedor) => {
        const clave = proveedor._id + ':' + proveedor.logo_version;
        if (!vistaActiva || !proveedor.tiene_logo || versionesLogos.get(proveedor._id) === proveedor.logo_version || pendientesLogos.has(clave) || erroresLogos.has(clave)) return;
        pendientesLogos.add(clave); colaLogos.push(proveedor); handleProcesarLogos();
    };
    const handleObservarLogo = (elemento, proveedor) => {
        const anterior = elementosLogos.get(proveedor._id);
        if (!elemento) {
            if (anterior) observadorLogos?.unobserve(anterior.elemento);
            elementosLogos.delete(proveedor._id); logosVisibles.delete(proveedor._id);
            return;
        }
        if (anterior?.elemento === elemento && anterior.version === proveedor.logo_version) return;
        if (anterior) observadorLogos?.unobserve(anterior.elemento);
        elementosLogos.set(proveedor._id, { elemento, version: proveedor.logo_version, proveedor });
        elemento.dataset.proveedorLogo = proveedor._id;
        if (!proveedor.tiene_logo) return;
        if (typeof IntersectionObserver === 'undefined') { logosVisibles.add(proveedor._id); handleEncolarLogo(proveedor); return; }
        if (!observadorLogos) observadorLogos = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                const id = entrada.target.dataset.proveedorLogo;
                if (!entrada.isIntersecting) { logosVisibles.delete(id); return; }
                logosVisibles.add(id);
                const actual = elementosLogos.get(id);
                if (actual) handleEncolarLogo(actual.proveedor);
            });
        }, { rootMargin: '80px', threshold: 0 });
        observadorLogos.observe(elemento);
    };
    onBeforeUnmount(() => {
        vistaActiva = false; colaLogos = [];
        observadorLogos?.disconnect(); elementosLogos.clear();
        Object.values(logosProveedores).forEach(url => URL.revokeObjectURL(url));
        Object.values(logosOriginales).forEach(url => URL.revokeObjectURL(url));
        if (logoPreview.value) URL.revokeObjectURL(logoPreview.value);
    });



    const logoArchivo = ref(null), logoPreview = ref(null), logoInput = ref(null);
    const etiquetaRazonSocial = computed(() => frmProveedor.tipo_persona?.toLowerCase() === 'moral' ? 'Razón Social' : 'Nombre Completo');
    const estadosFiltrados = computed(() => (catalogoSat.value?.estado || []).filter(item => item.pais === frmProveedor.pais).map(item => ({ ...item, texto: `${item.estado} - ${item.nombre_estado}`.toUpperCase() })));
    const requeridos = ['tipo_persona','rfc','razon_social_nombre_completo','codigo_postal'];
    const botonGuardarDeshabilitado = computed(() => requeridos.some(c => !String(frmProveedor[c] || '').trim()) || !/^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/.test(frmProveedor.rfc) || !/^\d{5}$/.test(frmProveedor.codigo_postal) || (!!frmProveedor.correo_electronico && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(frmProveedor.correo_electronico)));
    const handleFecha = valor => valor ? new Date(valor).toLocaleString('es-MX') : '';
    const handleLimpiarFiltro = () => { filtros.value.global.value = null; };
    const handleLimpiarFormulario = () => {
        Object.assign(frmProveedor, frmProveedorInit()); logoArchivo.value = null;
        if (logoPreview.value) URL.revokeObjectURL(logoPreview.value);
        logoPreview.value = null;
        if (logoInput.value) logoInput.value.value = '';
    };
    const handleCargarProveedores = async (silencioso = false) => {
        const res = await store.dispatch(silencioso ? 'api/apiGetTokenSinCargando' : 'api/apiGetToken', { direccion: '/proveedores/' });
        if (!vistaActiva) return;
        if (res.estatus !== 200) { toast.add({ severity: 'error', summary: 'Proveedores', detail: res.mensaje, life: 4000 }); return; }
        const anteriores = new Map(tablaProveedores.value.map(item => [item._id, item.logo_version]));
        const filas = res.datos?.proveedores || [];
        filas.forEach(item => {
            if (!item.tiene_logo || (anteriores.has(item._id) && anteriores.get(item._id) !== item.logo_version)) {
                for (const mapa of [logosProveedores, logosOriginales]) if (mapa[item._id]) { URL.revokeObjectURL(mapa[item._id]); delete mapa[item._id]; }
                versionesLogos.delete(item._id);
            }
        });
        tablaProveedores.value = filas;
    };
    const handleCargarCatalogos = async () => {
        const res = await store.dispatch('api/apiGetToken', { direccion: '/sat/sat_empresa' });
        if (!vistaActiva) return;
        if (res.estatus === 200) catalogoSat.value = res.datos;
        else toast.add({ severity: 'error', summary: 'Proveedores', detail: res.mensaje, life: 4000 });
    };
    const handleCargarLogo = async id => {
        if (!id || logosOriginales[id]) return;
        const res = await store.dispatch('api/apiGetblobSinCargando', { direccion: '/proveedores/logo/' + id });
        if (vistaActiva && res.estatus === 200 && res.data instanceof Blob) logosOriginales[id] = URL.createObjectURL(res.data);
    };
    const handleAbrirLogo = () => { logoInput.value?.click(); };
    const handleSeleccionarLogo = event => {
        const archivo = event.target.files?.[0]; if (!archivo) return;
        if (!['image/jpeg','image/png'].includes(archivo.type) || archivo.size > 2 * 1024 * 1024) {
            toast.add({ severity: 'warn', summary: 'Logo', detail: 'Selecciona una imagen JPG o PNG de hasta 2 MB.', life: 4000 }); event.target.value = ''; return;
        }
        if (logoPreview.value) URL.revokeObjectURL(logoPreview.value);
        logoArchivo.value = archivo; logoPreview.value = URL.createObjectURL(archivo);
    };
    const handleMostrarFormulario = async (tipo, fila) => {
        if (guardando.value) return;
        if (tipo === 'C') { mostrarTablaFormulario.value = false; movimiento.value = ''; handleLimpiarFormulario(); return; }
        handleLimpiarFormulario(); movimiento.value = tipo;
        if (tipo === 'E') {
            const res = await store.dispatch('api/apiGetToken', { direccion: '/proveedores/proveedores_id/' + fila._id });
            if (!vistaActiva) return;
            if (res.estatus !== 200) { toast.add({ severity: 'error', summary: 'Proveedores', detail: res.mensaje, life: 4000 }); return; }
            Object.assign(frmProveedor, res.datos.proveedor); handleCargarLogo(frmProveedor._id);
        }
        mostrarTablaFormulario.value = true;
    };
    const handleGuardar = async () => {
        if (guardando.value || botonGuardarDeshabilitado.value) return;
        guardando.value = true;
        try {
            const nuevo = movimiento.value === 'N';
            const res = await store.dispatch(nuevo ? 'api/apiPostToken' : 'api/apiPutToken', { direccion: '/proveedores/', datosJson: { ...frmProveedor } });
            if (!vistaActiva) return;
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible guardar.');
            if (nuevo) { frmProveedor._id = res.datos._id; movimiento.value = 'E'; }
            if (logoArchivo.value) {
                const formData = new FormData(); formData.append('logo', logoArchivo.value);
                const logo = await store.dispatch('api/apiPutTokenFormData', { direccion: '/proveedores/logo/' + frmProveedor._id, formData });
                if (logo.estatus !== 200) {
                    toast.add({ severity: 'warn', summary: 'Proveedor guardado', detail: logo.mensaje || 'No se pudo guardar la imagen. Puedes intentarlo nuevamente.', life: 5000 });
                    await handleCargarProveedores(true); return;
                }
            }
            toast.add({ severity: 'success', summary: 'Proveedores', detail: res.mensaje, life: 3000 });
            mostrarTablaFormulario.value = false; movimiento.value = ''; handleLimpiarFormulario(); await handleCargarProveedores(true);
        } catch (error) { if (vistaActiva) toast.add({ severity: 'error', summary: 'Proveedores', detail: error.message, life: 5000 }); }
        finally { if (vistaActiva) guardando.value = false; }
    };
    const handleExportarExcel = () => {
        if (!tablaProveedores.value.length) { toast.add({ severity: 'warn', summary: 'Excel', detail: 'No hay proveedores para exportar.', life: 3000 }); return; }
        const campos = { rfc:'RFC', razon_social_nombre_completo:'Razón social / Nombre', tipo_persona:'Tipo de persona', calle:'Calle', numero_ext:'Número exterior', numero_int:'Número interior', colonia:'Colonia', poblacion:'Población', municipio:'Municipio', codigo_postal:'Código postal', pais:'País', estado:'Estado', correo_electronico:'Correo electrónico', numero_contacto_principal:'Contacto principal', numero_contacto_alterno:'Contacto alterno' };
        const filas = tablaProveedores.value.map(fila => ({ ...Object.fromEntries(Object.entries(campos).map(([campo, nombre]) => [nombre, fila[campo] || ''])), Activo: fila.activo ? 'SI' : 'NO' }));
        const hoja = XLSX.utils.json_to_sheet(filas); hoja['!cols'] = Object.keys(filas[0]).map(() => ({ wch: 24 }));
        const libro = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro, hoja, 'Proveedores'); XLSX.writeFile(libro, 'Proveedores.xlsx');
    };
    const handleInit = async () => { await Promise.all([handleCargarProveedores(), handleCargarCatalogos()]); };
    handleInit();
    return { tablaProveedores, catalogoSat, mostrarTablaFormulario, movimiento, guardando, frmProveedor, filtros, logosProveedores, logosOriginales,
        logoArchivo, logoPreview, logoInput, etiquetaRazonSocial, estadosFiltrados, botonGuardarDeshabilitado,
        handleFecha, handleLimpiarFiltro, handleMostrarFormulario, handleGuardar, handleAbrirLogo, handleSeleccionarLogo, handleObservarLogo, handleExportarExcel };
};
export default useProceso;
