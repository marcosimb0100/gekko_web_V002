import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';

const DOCUMENTOS = [
    { campo: 'fotografia', nombre: 'Fotografía' },
    { campo: 'acta_nacimiento', nombre: 'Acta de nacimiento' },
    { campo: 'cif', nombre: 'CIF' },
    { campo: 'curp_documento', nombre: 'CURP' },
    { campo: 'nss_documento', nombre: 'NSS' },
    { campo: 'comprobante_domicilio', nombre: 'Comprobante domicilio' },
    { campo: 'ine', nombre: 'INE' }
];

const isoLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const pestana = ref('PENDIENTE');
    const busqueda = ref('');
    const pendientes = ref([]);
    const historial = ref([]);
    const cargando = ref(false);
    const procesando = ref(false);
    const visibleAlta = ref(false);
    const visibleRechazo = ref(false);
    const visibleDetalle = ref(false);
    const seleccionada = ref(null);
    const detalle = ref(null);
    const tiposNomina = ref([]);
    const periodicidades = ref([]);
    const predeterminado = ref({ tipo_nomina: '', periodicidad_pago: '' });
    const formularioAlta = reactive({ tipo_nomina: '', periodicidad_pago: '', fecha_alta: null });
    const observacion = ref('');

    const fechaMinima = computed(() => {
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);
        fecha.setDate(fecha.getDate() + 10);
        return fecha;
    });
    const nombre = (x) => [x?.nombres, x?.apellido_paterno, x?.apellido_materno].filter(Boolean).join(' ');
    const fecha = (x) => (x ? String(x).slice(0, 10) : '—');
    const notificar = (severity, detail) =>
        toast.add({
            severity,
            summary: severity === 'success' ? 'Correcto' : 'Mesa de Control',
            detail,
            life: 4500
        });
    const apiGet = (direccion) => store.dispatch('api/apiGetToken', { direccion });
    const apiPost = (direccion, datosJson) => store.dispatch('api/apiPostToken', { direccion, datosJson });
    const cargarSolicitudes = async () => {
        cargando.value = true;
        try {
            const r = await apiGet(`/mesa_control_rh/solicitudes?estatus=${pestana.value}`);
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudieron consultar solicitudes');
            const datos = Array.isArray(r?.datos?.solicitudes) ? r.datos.solicitudes : [];
            if (pestana.value === 'PENDIENTE') pendientes.value = datos;
            else historial.value = datos;
        } catch (e) {
            notificar('error', e?.message || 'Error al consultar solicitudes');
        } finally {
            cargando.value = false;
        }
    };
    const cargarNomina = async () => {
        const r = await apiGet('/mesa_control_rh/nomina');
        if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudieron consultar los catálogos');
        tiposNomina.value = r?.datos?.tipo_nomina || [];
        periodicidades.value = r?.datos?.periodicidad_pago || [];
        predeterminado.value = r?.datos?.predeterminado || { tipo_nomina: '', periodicidad_pago: '' };
    };
    const cambiarPestanaLista = async (valor) => {
        pestana.value = valor;
        await cargarSolicitudes();
    };
    const solicitudesFiltradas = computed(() => {
        const lista = pestana.value === 'PENDIENTE' ? pendientes.value : historial.value;
        const q = busqueda.value.toLocaleLowerCase('es-MX').trim();
        return !q
            ? lista
            : lista.filter((x) =>
                  [nombre(x), x.rfc, x.curp, x.estatus].some((v) =>
                      String(v || '')
                          .toLocaleLowerCase('es-MX')
                          .includes(q)
                  )
              );
    });
    const abrirAlta = async (solicitud) => {
        seleccionada.value = solicitud;
        try {
            await cargarNomina();
            formularioAlta.tipo_nomina = predeterminado.value.tipo_nomina || '';
            formularioAlta.periodicidad_pago = predeterminado.value.periodicidad_pago || '';
            formularioAlta.fecha_alta = new Date(fechaMinima.value);
            visibleAlta.value = true;
        } catch (e) {
            notificar('error', e?.message || 'Error al cargar nómina');
        }
    };
    const guardarAlta = async () => {
        if (!seleccionada.value || procesando.value) return;
        if (!tiposNomina.value.some((x) => x.tipo_nomina === formularioAlta.tipo_nomina) || !periodicidades.value.some((x) => x.periodicidad_pago === formularioAlta.periodicidad_pago)) {
            return notificar('warn', 'Selecciona un tipo de nómina y una periodicidad válidos');
        }
        if (!(formularioAlta.fecha_alta instanceof Date) || Number.isNaN(formularioAlta.fecha_alta.getTime()) || isoLocal(formularioAlta.fecha_alta) < isoLocal(fechaMinima.value)) {
            return notificar('warn', 'La fecha debe ser al menos 10 días posterior a hoy');
        }
        procesando.value = true;
        try {
            const r = await apiPost(`/mesa_control_rh/solicitudes/${seleccionada.value._id}/alta`, {
                tipo_nomina: formularioAlta.tipo_nomina,
                periodicidad_pago: formularioAlta.periodicidad_pago,
                fecha_alta: isoLocal(formularioAlta.fecha_alta)
            });
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudo completar el alta');
            visibleAlta.value = false;
            notificar('success', r.mensaje || 'Empleado dado de alta');
            await cargarSolicitudes();
        } catch (e) {
            notificar('error', e?.message || 'Error al dar de alta');
        } finally {
            procesando.value = false;
        }
    };
    const abrirRechazo = (solicitud) => {
        seleccionada.value = solicitud;
        observacion.value = '';
        visibleRechazo.value = true;
    };
    const guardarRechazo = async () => {
        if (!observacion.value.trim() || procesando.value || !seleccionada.value) {
            return notificar('warn', 'Escribe el motivo del rechazo');
        }
        procesando.value = true;
        try {
            const r = await apiPost(`/mesa_control_rh/solicitudes/${seleccionada.value._id}/rechazo`, {
                observacion: observacion.value.trim()
            });
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No se pudo rechazar');
            visibleRechazo.value = false;
            notificar('success', r.mensaje || 'Solicitud rechazada');
            await cargarSolicitudes();
        } catch (e) {
            notificar('error', e?.message || 'Error al rechazar');
        } finally {
            procesando.value = false;
        }
    };

    // Reutiliza el endpoint protegido de documentos de Alta de Personal.
    const documentosVisor = DOCUMENTOS;
    const pestanaDocumento = ref('fotografia');
    const urlArchivo = ref('');
    const tipoArchivo = ref('');
    const cargandoArchivo = ref(false);
    const mensajeArchivo = ref('');
    let secuencia = 0;
    const limpiarVisor = () => {
        secuencia++;
        if (urlArchivo.value) URL.revokeObjectURL(urlArchivo.value);
        urlArchivo.value = '';
        tipoArchivo.value = '';
        cargandoArchivo.value = false;
    };
    const archivoDisponible = computed(() => Boolean(detalle.value?.documentos?.[pestanaDocumento.value]));
    const nombreArchivo = computed(() => detalle.value?.documentos?.[pestanaDocumento.value]?.nombre_original || 'Documento');
    const obtenerBlob = async (campo) => {
        const r = await axios.get(`/personal_registration/${encodeURIComponent(detalle.value._id)}/documentos/${encodeURIComponent(campo)}`, {
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
            const nombre = detalle.value.documentos[campo]?.nombre_original || '';
            tipoArchivo.value = blob.type === 'application/pdf' || /\.pdf$/i.test(nombre) ? 'pdf' : blob.type.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(nombre) ? 'imagen' : 'otro';
            urlArchivo.value = URL.createObjectURL(blob);
        } catch (e) {
            if (actual === secuencia) mensajeArchivo.value = 'No fue posible cargar el documento';
        } finally {
            if (actual === secuencia) cargandoArchivo.value = false;
        }
    };
    const verDetalle = async (solicitud) => {
        try {
            const r = await apiGet(`/personal_registration/${solicitud._id}`);
            if (r?.estatus !== 200) throw new Error(r?.mensaje || 'No fue posible abrir el detalle');
            detalle.value = r?.datos?.solicitud || r?.datos?.registro || r?.datos;
            visibleDetalle.value = true;
            const primero = documentosVisor.find((d) => detalle.value?.documentos?.[d.campo]);
            await cambiarDocumento(primero?.campo || 'fotografia');
        } catch (e) {
            notificar('error', e?.message || 'No se pudo abrir el detalle');
        }
    };
    const descargarDocumento = async () => {
        if (!archivoDisponible.value) return;
        try {
            const blob = await obtenerBlob(pestanaDocumento.value);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo.value;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (e) {
            notificar('error', 'No fue posible descargar el documento');
        }
    };
    const camposDetalle = [
        ['nombres', 'Nombre(s)'],
        ['apellido_paterno', 'Apellido paterno'],
        ['apellido_materno', 'Apellido materno'],
        ['fecha_nacimiento', 'Fecha nacimiento'],
        ['sexo', 'Sexo'],
        ['rfc', 'RFC'],
        ['curp', 'CURP'],
        ['nss', 'NSS'],
        ['area_nombre', 'Área'],
        ['puesto_nombre', 'Puesto'],
        ['clabe', 'CLABE'],
        ['estatus', 'Estatus'],
        ['tipo_nomina', 'Tipo de nómina'],
        ['periodicidad_pago', 'Periodicidad'],
        ['fecha_alta', 'Fecha de alta'],
        ['observacion_rechazo', 'Observación de rechazo']
    ];
    const valorDetalle = (clave) => {
        const v = detalle.value?.[clave];
        if (clave === 'sexo') return { F: 'Femenino', M: 'Masculino', N: 'No especificado' }[v] || v || '—';
        if (clave === 'tipo_nomina') return { O: 'Nómina Ordinaria', E: 'Nómina Extraordinaria' }[v] || v || '—';
        return v || '—';
    };
    onMounted(cargarSolicitudes);
    onBeforeUnmount(limpiarVisor);
    return {
        pestana,
        busqueda,
        pendientes,
        historial,
        cargando,
        procesando,
        visibleAlta,
        visibleRechazo,
        visibleDetalle,
        seleccionada,
        detalle,
        tiposNomina,
        periodicidades,
        formularioAlta,
        observacion,
        fechaMinima,
        nombre,
        fecha,
        solicitudesFiltradas,
        cambiarPestanaLista,
        cargarSolicitudes,
        abrirAlta,
        guardarAlta,
        abrirRechazo,
        guardarRechazo,
        verDetalle,
        documentosVisor,
        pestanaDocumento,
        urlArchivo,
        tipoArchivo,
        cargandoArchivo,
        mensajeArchivo,
        archivoDisponible,
        nombreArchivo,
        cambiarDocumento,
        limpiarVisor,
        descargarDocumento,
        camposDetalle,
        valorDetalle
    };
}
