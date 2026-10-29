import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const DOCUMENTOS = [
    { campo: 'fotografia', nombre: 'Fotografía' },
    { campo: 'acta_nacimiento', nombre: 'Acta de nacimiento' },
    { campo: 'cif', nombre: 'CIF' },
    { campo: 'curp_documento', nombre: 'CURP' },
    { campo: 'nss_documento', nombre: 'NSS' },
    { campo: 'comprobante_domicilio', nombre: 'Comprobante de domicilio' },
    { campo: 'ine', nombre: 'INE' }
];
const CAMPOS = [
    ['nombres', 'Nombre(s)'],
    ['apellido_paterno', 'Apellido paterno'],
    ['apellido_materno', 'Apellido materno'],
    ['fecha_nacimiento', 'Fecha de nacimiento'],
    ['sexo', 'Sexo'],
    ['rfc', 'RFC'],
    ['curp', 'CURP'],
    ['nss', 'NSS'],
    ['area_nombre', 'Área'],
    ['puesto_nombre', 'Puesto'],
    ['clabe', 'CLABE'],
    ['tipo_nomina', 'Tipo de nómina'],
    ['periodicidad_pago', 'Periodicidad de pago'],
    ['fecha_alta', 'Fecha de alta'],
    ['estatus', 'Estatus']
];
export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const empleados = ref([]);
    const cargando = ref(false);
    const busqueda = ref('');
    const filtroArea = ref(null);
    const visibleDetalle = ref(false);
    const detalle = ref(null);
    const pestanaDocumento = ref('fotografia');
    const urlArchivo = ref('');
    const tipoArchivo = ref('');
    const cargandoArchivo = ref(false);
    const mensajeArchivo = ref('');
    let secuencia = 0;

    const avisar = (severity, detail) =>
        toast.add({
            severity,
            summary: severity === 'error' ? 'Error' : 'Aviso',
            detail,
            life: 3500
        });
    const nombre = (x) => [x?.nombres, x?.apellido_paterno, x?.apellido_materno].filter(Boolean).join(' ') || '—';
    const fecha = (v) => String(v || '').slice(0, 10) || '—';
    const opcionesAreas = computed(() =>
        Array.from(new Set(empleados.value.map((x) => x.area_nombre).filter(Boolean)))
            .sort()
            .map((x) => ({ label: x, value: x }))
    );
    const filtrados = computed(() => {
        const q = busqueda.value.trim().toLocaleLowerCase('es');
        return empleados.value.filter((x) => {
            if (filtroArea.value && x.area_nombre !== filtroArea.value) return false;
            return (
                !q ||
                [nombre(x), x.rfc, x.curp, x.area_nombre, x.puesto_nombre].some((v) =>
                    String(v || '')
                        .toLocaleLowerCase('es')
                        .includes(q)
                )
            );
        });
    });
    const cargarEmpleados = async () => {
        cargando.value = true;
        try {
            const r = await store.dispatch('api/apiGetToken', { direccion: '/empleados/' });
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudieron consultar empleados');
            empleados.value = Array.isArray(r?.datos?.empleados) ? r.datos.empleados : [];
        } catch (e) {
            avisar('error', e?.message || 'Error al consultar empleados');
        } finally {
            cargando.value = false;
        }
    };
    const camposDetalle = CAMPOS.map(([key, label]) => ({ key, label }));
    const documentosVisor = DOCUMENTOS;
    const valorDetalle = (key) => {
        const v = detalle.value?.[key];
        if (key === 'sexo') return { F: 'Femenino', M: 'Masculino', N: 'No especificado' }[String(v || '').toUpperCase()] || v || '—';
        return v === null || v === undefined || v === '' ? '—' : String(v);
    };
    const archivoDisponible = computed(() => Boolean(detalle.value?.documentos?.[pestanaDocumento.value]));
    const nombreArchivo = computed(() => detalle.value?.documentos?.[pestanaDocumento.value]?.nombre_original || 'Sin documento');
    const limpiarVisor = () => {
        ++secuencia;
        if (urlArchivo.value) URL.revokeObjectURL(urlArchivo.value);
        urlArchivo.value = '';
        tipoArchivo.value = '';
        cargandoArchivo.value = false;
        mensajeArchivo.value = '';
    };
    const obtenerBlob = async (campo) => {
        const r = await axios.get(`/empleados/${encodeURIComponent(detalle.value._id)}/documentos/${encodeURIComponent(campo)}`, {
            baseURL: import.meta.env.VITE_API_URL,
            responseType: 'blob',
            headers: {
                Authorization: localStorage.getItem('token') || '',
                rutaActual: localStorage.getItem('rutaActual') || ''
            }
        });
        return r.data;
    };
    const cambiarDocumento = async (campo) => {
        pestanaDocumento.value = campo;
        limpiarVisor();
        if (!detalle.value?.documentos?.[campo]) {
            mensajeArchivo.value = 'No se adjuntó este documento';
            return;
        }
        const actual = secuencia;
        cargandoArchivo.value = true;
        try {
            const blob = await obtenerBlob(campo);
            if (actual !== secuencia) return;
            const nombre = nombreArchivo.value;
            tipoArchivo.value = blob.type === 'application/pdf' || /\.pdf$/i.test(nombre) ? 'pdf' : blob.type.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(nombre) ? 'imagen' : 'otro';
            urlArchivo.value = URL.createObjectURL(blob);
        } catch (e) {
            if (actual === secuencia) mensajeArchivo.value = 'No fue posible cargar el documento';
        } finally {
            if (actual === secuencia) cargandoArchivo.value = false;
        }
    };
    const verDetalle = async (empleado) => {
        try {
            const r = await store.dispatch('api/apiGetToken', { direccion: `/empleados/${empleado._id}` });
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudo abrir el expediente');
            detalle.value = r?.datos?.empleado || null;
            if (!detalle.value) throw new Error('El expediente está vacío');
            visibleDetalle.value = true;
            const primero = DOCUMENTOS.find((d) => detalle.value?.documentos?.[d.campo]);
            await cambiarDocumento(primero?.campo || 'fotografia');
        } catch (e) {
            avisar('error', e?.message || 'No fue posible abrir el expediente');
        }
    };
    const descargarDocumento = async () => {
        if (!archivoDisponible.value) return;
        try {
            const blob = await obtenerBlob(pestanaDocumento.value);
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombreArchivo.value;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            avisar('error', 'No fue posible descargar el documento');
        }
    };
    onMounted(cargarEmpleados);
    onBeforeUnmount(limpiarVisor);
    return {
        empleados,
        cargando,
        busqueda,
        filtroArea,
        visibleDetalle,
        detalle,
        pestanaDocumento,
        urlArchivo,
        tipoArchivo,
        cargandoArchivo,
        mensajeArchivo,
        nombre,
        fecha,
        opcionesAreas,
        filtrados,
        cargarEmpleados,
        camposDetalle,
        documentosVisor,
        valorDetalle,
        archivoDisponible,
        nombreArchivo,
        limpiarVisor,
        cambiarDocumento,
        verDetalle,
        descargarDocumento
    };
}
