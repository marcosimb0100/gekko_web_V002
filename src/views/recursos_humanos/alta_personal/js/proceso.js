import axios from 'axios';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
import { useStore } from 'vuex';
const datosIniciales = () => ({
    apellido_paterno: '',
    apellido_materno: '',
    nombres: '',
    fecha_nacimiento: '',
    sexo: '',
    rfc: '',
    curp: '',
    nss: '',
    clabe: '',
    area_id: '',
    puesto_id: ''
});
const CAMPOS = [
    { campo: 'fotografia', nombre: 'Fotografía del empleado', limite: 2, imagen: true },
    { campo: 'acta_nacimiento', nombre: 'Acta de nacimiento', limite: 5 },
    { campo: 'cif', nombre: 'CIF (Constancia de Situación Fiscal)', limite: 5 },
    { campo: 'curp_documento', nombre: 'CURP', limite: 5 },
    { campo: 'nss_documento', nombre: 'NSS', limite: 5 },
    { campo: 'comprobante_domicilio', nombre: 'Comprobante de domicilio', limite: 5 },
    { campo: 'ine', nombre: 'INE (Identificación oficial)', limite: 5 }
];
export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const confirm = useConfirm();
    const frmPersonal = reactive(datosIniciales());
    // Mismo catálogo SAT y misma ruta que utiliza el módulo Empresas.
    const catalogoSat = ref(null);
    const cargandoBancos = ref(false);
    const catalogoBancos = computed(() => catalogoSat.value?.banco || []);
    const bancoDetectado = computed(() => {
        const clave = String(frmPersonal.clabe || '').substring(0, 3);
        if (clave.length !== 3) return null;
        return catalogoBancos.value.find((item) => String(item.clabe_banco || '').padStart(3, '0') === clave) || null;
    });
    const handleCambioClabePersonal = (valor) => {
        frmPersonal.clabe = String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 18);
    };
    const cargarCatalogoBancos = async () => {
        cargandoBancos.value = true;
        try {
            const respuesta = await store.dispatch('api/apiGetToken', {
                direccion: '/sat/sat_empresa'
            });
            if (respuesta?.estatus === 200) {
                catalogoSat.value = respuesta.datos || null;
            } else {
                notificar('warn', respuesta?.mensaje || 'No fue posible cargar el catálogo de bancos.');
            }
        } catch (error) {
            notificar('warn', error?.message || 'No fue posible consultar el catálogo de bancos.');
        } finally {
            cargandoBancos.value = false;
        }
    };
    // Catálogos existentes de Recursos Humanos (sin duplicar endpoints).
    const areasRH = ref([]);
    const puestosRH = ref([]);
    const cargandoCatalogosRH = ref(false);
    const areasActivas = computed(() => areasRH.value.filter((x) => x.activo === true));
    const puestosFiltrados = computed(() => puestosRH.value.filter((x) => x.activo === true && String(x.area_id) === String(frmPersonal.area_id) && areasActivas.value.some((a) => String(a._id) === String(frmPersonal.area_id))));
    const nombreAreaSeleccionada = computed(() => areasRH.value.find((x) => String(x._id) === String(frmPersonal.area_id))?.nombre || '—');
    const nombrePuestoSeleccionado = computed(() => puestosRH.value.find((x) => String(x._id) === String(frmPersonal.puesto_id))?.nombre || '—');
    const cambiarArea = (id) => {
        frmPersonal.area_id = id || '';
        frmPersonal.puesto_id = '';
    };
    const cargarCatalogosRH = async () => {
        cargandoCatalogosRH.value = true;
        try {
            const [a, p] = await Promise.all([store.dispatch('api/apiGetToken', { direccion: '/catalogo_recursos_humanos/areas' }), store.dispatch('api/apiGetToken', { direccion: '/catalogo_recursos_humanos/puestos' })]);
            if (a?.estatus === 200) areasRH.value = Array.isArray(a.datos) ? a.datos : [];
            else notificar('warn', a?.mensaje || 'No se pudo consultar el catálogo de áreas.');
            if (p?.estatus === 200) puestosRH.value = Array.isArray(p.datos) ? p.datos : [];
            else notificar('warn', p?.mensaje || 'No se pudo consultar el catálogo de puestos.');
        } catch (error) {
            notificar('error', error?.message || 'No fue posible cargar los catálogos de Recursos Humanos.');
        } finally {
            cargandoCatalogosRH.value = false;
        }
    };

    const archivos = reactive({});
    const vistaPreviaFoto = ref('');
    const paso = ref(1);
    const guardando = ref(false);
    const solicitudes = ref([]);
    const visibleObservacion = ref(false);
    const observacionActual = ref(null);
    const busqueda = ref('');
    const visibleDetalle = ref(false);
    const solicitudActual = ref(null);
    const documentosVisor = CAMPOS.map(({ campo, nombre }) => ({ campo, nombre }));
    const camposDetalle = [
        { key: 'nombres', label: 'Nombre(s)' },
        { key: 'apellido_paterno', label: 'Apellido paterno' },
        { key: 'apellido_materno', label: 'Apellido materno' },
        { key: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
        { key: 'sexo', label: 'Sexo' },
        { key: 'rfc', label: 'RFC' },
        { key: 'curp', label: 'CURP' },
        { key: 'nss', label: 'NSS' },
        { key: 'area_id', label: 'Área' },
        { key: 'puesto_id', label: 'Puesto' },
        { key: 'clabe', label: 'CLABE interbancaria' },
        { key: 'banco', label: 'Banco' },
        { key: 'estatus', label: 'Estatus' }
    ];
    // Presentación del detalle: mostrar nombres legibles sin alterar valores guardados.
    const valorCampoDetalle = (campo) => {
        const registro = solicitudActual.value || {};
        if (campo === 'sexo') {
            const valores = { F: 'Femenino', M: 'Masculino', N: 'No especificado' };
            const valor = String(registro.sexo || '').trim();
            return valores[valor.toUpperCase()] || valor || '—';
        }
        if (campo === 'area_id') {
            return registro.area_nombre || areasRH.value.find((x) => String(x._id) === String(registro.area_id))?.nombre || '—';
        }
        if (campo === 'puesto_id') {
            return registro.puesto_nombre || puestosRH.value.find((x) => String(x._id) === String(registro.puesto_id))?.nombre || '—';
        }
        if (campo === 'banco') {
            const clave = String(registro.clabe || '').slice(0, 3);
            if (clave.length !== 3) return '—';
            const banco = catalogoBancos.value.find((item) => String(item.clabe_banco ?? '').padStart(3, '0') === clave);
            return banco?.descripcion || (cargandoBancos.value ? 'Consultando banco...' : 'Banco no encontrado en el catálogo');
        }
        return registro[campo] || '—';
    };
    const pestanaActiva = ref('fotografia');
    const urlArchivo = ref('');
    const tipoArchivo = ref('');
    const cargandoArchivo = ref(false);
    const mensajeVisor = ref('Selecciona un documento.');
    let secuenciaVisor = 0;
    const archivoDisponible = computed(() => Boolean(solicitudActual.value?.documentos?.[pestanaActiva.value]));
    const nombreArchivoActual = computed(() => solicitudActual.value?.documentos?.[pestanaActiva.value]?.nombre_original || documentosVisor.find((d) => d.campo === pestanaActiva.value)?.nombre || 'Documento');
    const limpiarVisor = () => {
        secuenciaVisor += 1;
        if (urlArchivo.value) URL.revokeObjectURL(urlArchivo.value);
        urlArchivo.value = '';
        tipoArchivo.value = '';
        cargandoArchivo.value = false;
    };
    const solicitarDocumento = async (campo) => {
        const id = solicitudActual.value?._id;
        if (!id) throw new Error('La solicitud no tiene identificador.');
        const respuesta = await axios.get(`/personal_registration/${encodeURIComponent(id)}/documentos/${encodeURIComponent(campo)}`, {
            baseURL: import.meta.env.VITE_API_URL,
            responseType: 'blob',
            headers: {
                Authorization: localStorage.getItem('token') || '',
                rutaActual: localStorage.getItem('rutaActual') || ''
            }
        });
        return respuesta.data;
    };
    const cambiarPestana = async (campo) => {
        pestanaActiva.value = campo;
        limpiarVisor();
        const solicitud = solicitudActual.value;
        if (!solicitud?.documentos?.[campo]) {
            mensajeVisor.value = 'Este documento no fue adjuntado a la solicitud.';
            return;
        }
        const secuencia = secuenciaVisor;
        cargandoArchivo.value = true;
        mensajeVisor.value = '';
        try {
            const blob = await solicitarDocumento(campo);
            if (secuencia !== secuenciaVisor) return;
            const nombre = solicitud.documentos[campo]?.nombre_original || '';
            const esPdf = blob.type === 'application/pdf' || /\.pdf$/i.test(nombre);
            const esImagen = blob.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(nombre);
            tipoArchivo.value = esPdf ? 'pdf' : esImagen ? 'imagen' : 'otro';
            urlArchivo.value = URL.createObjectURL(blob);
        } catch (error) {
            if (secuencia !== secuenciaVisor) return;
            mensajeVisor.value = error?.response?.status === 404 ? 'No se encontró el archivo en el servidor.' : 'No se pudo cargar el archivo. Verifica la conexión y los permisos.';
        } finally {
            if (secuencia === secuenciaVisor) cargandoArchivo.value = false;
        }
    };
    const descargarDocumento = async () => {
        const campo = pestanaActiva.value;
        if (!archivoDisponible.value) return;
        try {
            const blob = await solicitarDocumento(campo);
            const enlace = document.createElement('a');
            const urlTemporal = URL.createObjectURL(blob);
            enlace.href = urlTemporal;
            enlace.download = solicitudActual.value.documentos[campo]?.nombre_original || campo;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            setTimeout(() => URL.revokeObjectURL(urlTemporal), 10000);
        } catch (error) {
            notificar('error', 'No fue posible descargar el documento.');
        }
    };
    const mostrarHistorial = ref(false);
    const fechaMaxima = new Date();
    fechaMaxima.setHours(0, 0, 0, 0);
    const fechaHoy = `${fechaMaxima.getFullYear()}-${String(fechaMaxima.getMonth() + 1).padStart(2, '0')}-${String(fechaMaxima.getDate()).padStart(2, '0')}`;
    const fechaNacimiento = computed({
        get() {
            if (!frmPersonal.fecha_nacimiento) return null;
            const [y, m, d] = frmPersonal.fecha_nacimiento.split('-').map(Number);
            return new Date(y, m - 1, d);
        },
        set(value) {
            if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
                frmPersonal.fecha_nacimiento = '';
                return;
            }
            frmPersonal.fecha_nacimiento = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
        }
    });
    const notificar = (severity, detail) => toast.add({ severity, summary: severity === 'error' ? 'Error' : 'Alta de personal', detail, life: 4500 });
    const apiGet = (direccion) => store.dispatch('api/apiGetToken', { direccion });
    const apiPostFormData = (direccion, formData) => store.dispatch('api/apiPostTokenFormData', { direccion, formData });
    const edad = computed(() => {
        if (!frmPersonal.fecha_nacimiento) return 0;
        const nacimiento = new Date(`${frmPersonal.fecha_nacimiento}T12:00:00`);
        if (Number.isNaN(nacimiento.getTime())) return 0;
        const hoy = new Date();
        let anios = hoy.getFullYear() - nacimiento.getFullYear();
        if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) anios--;
        return Math.max(0, anios);
    });
    const nombreCompleto = computed(() => [frmPersonal.nombres, frmPersonal.apellido_paterno, frmPersonal.apellido_materno].filter(Boolean).join(' ').toUpperCase());
    const documentos = CAMPOS.filter((x) => !x.imagen);
    const solicitudesFiltradas = computed(() => {
        const q = busqueda.value.trim().toLowerCase();
        return !q
            ? solicitudes.value
            : solicitudes.value.filter((x) =>
                  [x.nombres, x.apellido_paterno, x.apellido_materno, x.rfc, x.curp, x.estatus].some((v) =>
                      String(v ?? '')
                          .toLowerCase()
                          .includes(q)
                  )
              );
    });
    const formatoFecha = (valor) => {
        if (!valor) return '—';
        return String(valor).slice(0, 10);
    };
    const validarDatos = () => {
        const requeridos = ['apellido_paterno', 'apellido_materno', 'nombres', 'fecha_nacimiento', 'rfc', 'curp', 'nss', 'clabe', 'area_id', 'puesto_id'];
        if (requeridos.some((k) => !String(frmPersonal[k] ?? '').trim())) return 'Completa todos los campos obligatorios.';
        if (!areasActivas.value.some((x) => String(x._id) === String(frmPersonal.area_id))) return 'Selecciona un área activa válida.';
        if (!puestosFiltrados.value.some((x) => String(x._id) === String(frmPersonal.puesto_id))) return 'Selecciona un puesto activo que pertenezca al área.';
        if (frmPersonal.fecha_nacimiento >= fechaHoy || edad.value < 1) return 'Revisa la fecha de nacimiento.';
        if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(frmPersonal.rfc.trim().toUpperCase())) return 'El RFC debe tener 12 o 13 caracteres válidos.';
        if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(frmPersonal.curp.trim().toUpperCase())) return 'La CURP debe tener 18 caracteres válidos.';
        if (!/^\d{11}$/.test(frmPersonal.nss.trim())) return 'El NSS debe tener 11 dígitos.';
        if (!/^\d{18}$/.test(frmPersonal.clabe.trim())) return 'La CLABE debe tener 18 dígitos.';
        return '';
    };
    const handleArchivo = (campo, event) => {
        const input = event.target;
        const archivo = input.files?.[0];
        if (!archivo) return;
        const configuracion = CAMPOS.find((x) => x.campo === campo);
        if (!configuracion) return;
        const extensiones = configuracion.imagen ? /\.(jpg|jpeg|png)$/i : /\.(pdf|jpg|jpeg|png)$/i;
        if (!extensiones.test(archivo.name) || archivo.size > configuracion.limite * 1024 * 1024) {
            input.value = '';
            notificar('warn', `${configuracion.nombre}: formato inválido o tamaño superior a ${configuracion.limite} MB.`);
            return;
        }
        archivos[campo] = archivo;
        if (campo === 'fotografia') {
            if (vistaPreviaFoto.value) URL.revokeObjectURL(vistaPreviaFoto.value);
            vistaPreviaFoto.value = URL.createObjectURL(archivo);
        }
    };
    const handleArchivoPrime = (campo, event) => {
        const archivo = event?.files?.[0];
        if (!archivo) return;
        handleArchivo(campo, { target: { files: [archivo], value: '' } });
    };
    const handleSiguiente = () => {
        if (paso.value === 1) {
            const error = validarDatos();
            if (error) return notificar('warn', error);
        }
        if (paso.value < 3) paso.value++;
    };
    const handleAnterior = () => {
        if (paso.value > 1) paso.value--;
    };
    const limpiar = () => {
        Object.assign(frmPersonal, datosIniciales());
        for (const key of Object.keys(archivos)) delete archivos[key];
        if (vistaPreviaFoto.value) URL.revokeObjectURL(vistaPreviaFoto.value);
        vistaPreviaFoto.value = '';
        paso.value = 1;
    };
    const handleCancelar = () =>
        confirm.require({
            header: 'Cancelar captura',
            message: '¿Deseas descartar la información capturada?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Descartar',
            rejectLabel: 'Continuar',
            accept: limpiar
        });
    const guardar = async () => {
        const error = validarDatos();
        if (error) {
            paso.value = 1;
            return notificar('warn', error);
        }
        if (guardando.value) return;
        guardando.value = true;
        try {
            const formData = new FormData();
            for (const [campo, valor] of Object.entries(frmPersonal)) formData.append(campo, String(valor ?? '').trim());
            for (const [campo, archivo] of Object.entries(archivos)) if (archivo instanceof File) formData.append(campo, archivo, archivo.name);
            const respuesta = await apiPostFormData('/personal_registration/', formData);
            if (![200, 201].includes(respuesta?.estatus)) throw new Error(respuesta?.mensaje || 'No se pudo guardar la solicitud.');
            notificar('success', respuesta?.mensaje || 'Solicitud de alta registrada correctamente.');
            limpiar();
            await handleListar();
            mostrarHistorial.value = true;
        } catch (e) {
            notificar('error', e?.message || 'Error al registrar la solicitud.');
        } finally {
            guardando.value = false;
        }
    };
    const handleGuardar = () =>
        confirm.require({
            header: 'Confirmar alta',
            message: `¿Registrar la solicitud de alta de ${nombreCompleto.value}?`,
            icon: 'pi pi-question-circle',
            acceptLabel: 'Guardar solicitud',
            rejectLabel: 'Cancelar',
            accept: guardar
        });
    const handleListar = async () => {
        try {
            const r = await apiGet('/personal_registration/');
            if (r?.estatus !== 200) {
                notificar('error', r?.mensaje || 'No fue posible consultar solicitudes.');
                return;
            }
            solicitudes.value = r?.datos?.solicitudes ?? [];
        } catch (error) {
            notificar('error', error?.message || 'No fue posible conectar con la API.');
        }
    };
    const handleVerObservacion = async (solicitud) => {
        try {
            const r = await apiGet(`/personal_registration/${encodeURIComponent(solicitud._id)}`);
            if (r?.estatus !== 200) return notificar('error', r?.mensaje || 'No fue posible consultar la observación.');
            const detalle = r?.datos?.solicitud ?? r?.datos?.registro ?? r?.datos ?? {};
            observacionActual.value = {
                nombre: [detalle.nombres, detalle.apellido_paterno, detalle.apellido_materno].filter(Boolean).join(' '),
                texto: detalle.observacion_rechazo || detalle.observacion || detalle.motivo_rechazo || 'No se registró una observación de rechazo.'
            };
            visibleObservacion.value = true;
        } catch (error) {
            notificar('error', error?.message || 'No fue posible consultar la observación.');
        }
    };
    const handleRetirar = (solicitud) => {
        if (solicitud.estatus !== 'RECHAZADA') return;
        confirm.require({
            header: 'Retirar solicitud rechazada',
            message: '¿Deseas quitar esta solicitud del listado? Se conservarán los datos, documentos y el historial.',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, retirar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    const r = await store.dispatch('api/apiPutToken', {
                        direccion: `/personal_registration/${encodeURIComponent(solicitud._id)}/retirar`,
                        datosJson: {}
                    });
                    if (r?.estatus !== 200) return notificar('error', r?.mensaje || 'No fue posible retirar la solicitud.');
                    notificar('success', r?.mensaje || 'Solicitud retirada correctamente.');
                    await handleListar();
                } catch (error) {
                    notificar('error', error?.message || 'Error al retirar la solicitud.');
                }
            }
        });
    };
    const handleVerDetalle = async (solicitud) => {
        const id = solicitud._id;
        const r = await apiGet(`/personal_registration/${encodeURIComponent(id)}`);
        if (r?.estatus !== 200) return notificar('error', r?.mensaje || 'No fue posible consultar el detalle.');
        solicitudActual.value = r?.datos?.solicitud ?? r?.datos?.registro ?? r?.datos;
        visibleDetalle.value = true;
        const primera = documentosVisor.find((doc) => solicitudActual.value?.documentos?.[doc.campo]);
        await cambiarPestana(primera?.campo || 'fotografia');
    };
    onMounted(() => {
        handleListar();
        cargarCatalogoBancos();
        cargarCatalogosRH();
    });
    return {
        frmPersonal,
        archivos,
        vistaPreviaFoto,
        paso,
        guardando,
        solicitudes,
        busqueda,
        areasActivas,
        puestosFiltrados,
        cargandoCatalogosRH,
        cambiarArea,
        nombreAreaSeleccionada,
        nombrePuestoSeleccionado,
        catalogoBancos,
        bancoDetectado,
        cargandoBancos,
        handleCambioClabePersonal,
        visibleDetalle,
        visibleObservacion,
        observacionActual,
        handleVerObservacion,
        handleRetirar,
        solicitudActual,
        mostrarHistorial,
        documentosVisor,
        camposDetalle,
        valorCampoDetalle,
        pestanaActiva,
        urlArchivo,
        tipoArchivo,
        cargandoArchivo,
        mensajeVisor,
        archivoDisponible,
        nombreArchivoActual,
        cambiarPestana,
        limpiarVisor,
        descargarDocumento,
        fechaHoy,
        fechaMaxima,
        fechaNacimiento,
        edad,
        nombreCompleto,
        documentos,
        solicitudesFiltradas,
        formatoFecha,
        handleArchivo,
        handleArchivoPrime,
        handleSiguiente,
        handleAnterior,
        handleCancelar,
        handleGuardar,
        handleListar,
        handleVerDetalle
    };
}
