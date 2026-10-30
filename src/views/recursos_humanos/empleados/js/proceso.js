import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

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
    ['banco_nombre', 'Banco'],
    ['clabe', 'CLABE interbancaria'],
    ['tipo_nomina', 'Tipo de nómina'],
    ['periodicidad_pago', 'Periodicidad de pago'],
    ['fecha_alta', 'Fecha de alta'],
    ['estatus', 'Estatus']
];

const ESTATUS_VALIDOS = ['ALTA', 'REINGRESO', 'BAJA'];

export default function useProceso() {
    const store = useStore();
    const toast = useToast();

    // LISTADO
    const empleados = ref([]);
    const cargando = ref(false);
    const busqueda = ref('');
    const filtroArea = ref(null);
    const filtroEstatus = ref(null);

    const opcionesEstatus = [
        { label: 'Alta', value: 'ALTA' },
        { label: 'Reingreso', value: 'REINGRESO' },
        { label: 'Baja', value: 'BAJA' }
    ];

    // EXPEDIENTE
    const visibleDetalle = ref(false);
    const detalle = ref(null);
    const pestanaDocumento = ref('fotografia');
    const urlArchivo = ref('');
    const tipoArchivo = ref('');
    const cargandoArchivo = ref(false);
    const mensajeArchivo = ref('');

    // EXPORTACIÓN
    const exportando = ref(false);
    const catalogosSat = ref({
        tipo_nomina: [],
        periodicidad_pago: []
    });

    let secuencia = 0;

    const avisar = (severity, detail) => {
        toast.add({
            severity,
            summary: severity === 'error' ? 'Error' : 'Aviso',
            detail,
            life: 3500
        });
    };

    const nombre = (empleado) => {
        return [empleado?.nombres, empleado?.apellido_paterno, empleado?.apellido_materno].filter(Boolean).join(' ') || '—';
    };

    const fecha = (valor) => {
        return String(valor || '').slice(0, 10) || '—';
    };

    const normalizarRespuesta = (respuesta) => {
        const contenido = respuesta?.data ?? respuesta;

        return {
            estatus: respuesta?.estatus ?? respuesta?.status ?? contenido?.estatus ?? contenido?.status ?? 200,

            mensaje: contenido?.mensaje ?? respuesta?.mensaje ?? '',

            datos: contenido?.datos ?? respuesta?.datos ?? {}
        };
    };

    const opcionesAreas = computed(() => {
        const areas = empleados.value.map((empleado) => empleado.area_nombre).filter(Boolean);

        return Array.from(new Set(areas))
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map((area) => ({
                label: area,
                value: area
            }));
    });

    const severidadEstatus = (estatus) => {
        switch (
            String(estatus || '')
                .trim()
                .toUpperCase()
        ) {
            case 'ALTA':
                return 'success';

            case 'REINGRESO':
                return 'info';

            case 'BAJA':
                return 'danger';

            default:
                return 'secondary';
        }
    };

    const filtrados = computed(() => {
        const texto = busqueda.value.trim().toLocaleLowerCase('es');

        return empleados.value.filter((empleado) => {
            if (filtroArea.value && empleado.area_nombre !== filtroArea.value) {
                return false;
            }

            if (
                filtroEstatus.value &&
                String(empleado.estatus || '')
                    .trim()
                    .toUpperCase() !== filtroEstatus.value
            ) {
                return false;
            }

            if (!texto) return true;

            return [nombre(empleado), empleado.rfc, empleado.curp, empleado.area_nombre, empleado.puesto_nombre].some((valor) =>
                String(valor || '')
                    .toLocaleLowerCase('es')
                    .includes(texto)
            );
        });
    });

    // CONSULTAR EMPLEADOS
    const cargarEmpleados = async () => {
        cargando.value = true;

        try {
            const direccion = filtroEstatus.value ? `/empleados/?estatus=${encodeURIComponent(filtroEstatus.value)}` : '/empleados/';

            const respuesta = await store.dispatch('api/apiGetToken', {
                direccion
            });

            console.log('RESPUESTA API EMPLEADOS:', respuesta);

            if (!respuesta) {
                throw new Error('No se recibió respuesta del servidor');
            }

            const resultado = normalizarRespuesta(respuesta);

            console.log('RESPUESTA NORMALIZADA:', resultado);

            if (Number(resultado.estatus) !== 200) {
                throw new Error(resultado.mensaje || 'No fue posible consultar empleados');
            }

            const registros = resultado.datos?.empleados;

            console.log('REGISTROS EMPLEADOS:', registros);

            if (!Array.isArray(registros)) {
                throw new Error('La API no devolvió la lista de empleados esperada');
            }

            empleados.value = registros;

            console.log('TOTAL EMPLEADOS:', empleados.value.length);
            console.log('TOTAL FILTRADOS:', filtrados.value.length);
        } catch (error) {
            console.error('ERROR CONSULTANDO EMPLEADOS:', error);

            empleados.value = [];

            avisar('error', error?.message || 'No fue posible consultar empleados');
        } finally {
            cargando.value = false;
        }
    };

    // CONSULTAR EXPEDIENTE
    const cargarDetalle = async (idEmpleado) => {
        const respuesta = await store.dispatch('api/apiGetToken', {
            direccion: `/empleados/${encodeURIComponent(idEmpleado)}`
        });

        if (!respuesta) {
            throw new Error('No se recibió respuesta del servidor');
        }

        const resultado = normalizarRespuesta(respuesta);

        if (Number(resultado.estatus) !== 200) {
            throw new Error(resultado.mensaje || 'No se pudo consultar el expediente');
        }

        return resultado.datos?.empleado || null;
    };

    const camposDetalle = CAMPOS.map(([key, label]) => ({
        key,
        label
    }));

    const documentosVisor = DOCUMENTOS;

    const valorDetalle = (key) => {
        const valor = detalle.value?.[key];

        if (key === 'sexo') {
            return (
                {
                    F: 'Femenino',
                    M: 'Masculino',
                    N: 'No especificado'
                }[String(valor || '').toUpperCase()] ||
                valor ||
                '—'
            );
        }

        if (key === 'tipo_nomina') {
            return descripcionCatalogo('tipo_nomina', valor) || valor || '—';
        }

        if (key === 'periodicidad_pago') {
            return descripcionCatalogo('periodicidad_pago', valor) || valor || '—';
        }

        if (valor === null || valor === undefined || valor === '') {
            return '—';
        }

        return String(valor);
    };

    // VISOR DE DOCUMENTOS
    const archivoDisponible = computed(() => {
        return Boolean(detalle.value?.documentos?.[pestanaDocumento.value]);
    });

    const nombreArchivo = computed(() => {
        return detalle.value?.documentos?.[pestanaDocumento.value]?.nombre_original || 'Sin documento';
    });

    const limpiarVisor = () => {
        secuencia++;

        if (urlArchivo.value) {
            URL.revokeObjectURL(urlArchivo.value);
        }

        urlArchivo.value = '';
        tipoArchivo.value = '';
        cargandoArchivo.value = false;
        mensajeArchivo.value = '';
    };

    const obtenerBlob = async (campo) => {
        if (!detalle.value?._id) {
            throw new Error('No hay un empleado seleccionado');
        }

        const respuesta = await axios.get(`/empleados/${encodeURIComponent(detalle.value._id)}/documentos/${encodeURIComponent(campo)}`, {
            baseURL: import.meta.env.VITE_API_URL,
            responseType: 'blob',
            headers: {
                Authorization: localStorage.getItem('token') || '',
                rutaActual: localStorage.getItem('rutaActual') || ''
            }
        });

        return respuesta.data;
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

            const archivo = nombreArchivo.value;

            if (blob.type === 'application/pdf' || /\.pdf$/i.test(archivo)) {
                tipoArchivo.value = 'pdf';
            } else if (blob.type.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(archivo)) {
                tipoArchivo.value = 'imagen';
            } else {
                tipoArchivo.value = 'otro';
            }

            urlArchivo.value = URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error al cargar documento:', error);

            if (actual === secuencia) {
                mensajeArchivo.value = 'No fue posible cargar el documento';
            }
        } finally {
            if (actual === secuencia) {
                cargandoArchivo.value = false;
            }
        }
    };

    const verDetalle = async (empleado) => {
        try {
            const registro = await cargarDetalle(empleado._id);

            if (!registro) {
                throw new Error('El expediente está vacío');
            }

            limpiarVisor();

            detalle.value = registro;
            visibleDetalle.value = true;

            const primero = DOCUMENTOS.find((documento) => registro.documentos?.[documento.campo]);

            await cambiarDocumento(primero?.campo || 'fotografia');
        } catch (error) {
            console.error('Error al abrir expediente:', error);

            avisar('error', error?.message || 'No fue posible abrir el expediente');
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

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        } catch (error) {
            console.error('Error al descargar documento:', error);

            avisar('error', 'No fue posible descargar el documento');
        }
    };

    // CATÁLOGOS SAT
    const cargarCatalogosSat = async () => {
        try {
            const respuesta = await store.dispatch('api/apiGetToken', {
                direccion: '/sat/sat_empresa'
            });

            if (!respuesta) return;

            const resultado = normalizarRespuesta(respuesta);

            const datos = resultado.datos || {};

            catalogosSat.value = {
                tipo_nomina: Array.isArray(datos.tipo_nomina) ? datos.tipo_nomina : [],
                periodicidad_pago: Array.isArray(datos.periodicidad_pago) ? datos.periodicidad_pago : []
            };
        } catch (error) {
            console.error('No fue posible consultar catálogos SAT:', error);
        }
    };

    const descripcionCatalogo = (tipo, clave) => {
        if (clave === null || clave === undefined || clave === '') {
            return '';
        }

        const codigo = String(clave).trim();

        const catalogo = catalogosSat.value[tipo] || [];

        const camposClave = tipo === 'tipo_nomina' ? ['tipo_nomina', 'c_TipoNomina', 'clave'] : ['periodicidad_pago', 'c_PeriodicidadPago', 'clave'];

        const registro = catalogo.find((item) => camposClave.some((campo) => String(item[campo] ?? '').trim() === codigo));

        if (!registro) return codigo;

        const descripcion = registro.descripcion || registro.nombre || '';

        return descripcion ? `${codigo} - ${descripcion}` : codigo;
    };

    // EXPORTACIÓN A EXCEL
    const obtenerEmpleadosCompletos = async () => {
        const registros = [];

        for (const empleado of filtrados.value) {
            const completo = await cargarDetalle(empleado._id);

            if (completo) {
                registros.push(completo);
            }
        }

        return registros;
    };

    const exportarExcel = async () => {
        if (exportando.value) return;

        if (!filtrados.value.length) {
            avisar('warn', 'No hay empleados para exportar');
            return;
        }

        exportando.value = true;

        try {
            const registros = await obtenerEmpleadosCompletos();

            const filas = registros.map((empleado) => ({
                'Nombre completo': nombre(empleado),
                'Nombre(s)': empleado.nombres || '',
                'Apellido paterno': empleado.apellido_paterno || '',
                'Apellido materno': empleado.apellido_materno || '',
                'Fecha de nacimiento': fecha(empleado.fecha_nacimiento),
                Sexo:
                    {
                        M: 'Masculino',
                        F: 'Femenino',
                        N: 'No especificado'
                    }[String(empleado.sexo || '').toUpperCase()] ||
                    empleado.sexo ||
                    '',
                RFC: empleado.rfc || '',
                CURP: empleado.curp || '',
                NSS: String(empleado.nss || ''),
                Área: empleado.area_nombre || '',
                Puesto: empleado.puesto_nombre || '',
                Banco: empleado.banco_nombre || '',
                'Clave banco': empleado.banco_clave || '',
                'CLABE interbancaria': String(empleado.clabe || ''),
                'Tipo de nómina': descripcionCatalogo('tipo_nomina', empleado.tipo_nomina),
                'Periodicidad de pago': descripcionCatalogo('periodicidad_pago', empleado.periodicidad_pago),
                'Fecha de alta': fecha(empleado.fecha_alta),
                Estatus: empleado.estatus || ''
            }));

            const hoja = XLSX.utils.json_to_sheet(filas);

            hoja['!cols'] = [
                { wch: 35 },
                { wch: 22 },
                { wch: 22 },
                { wch: 22 },
                { wch: 20 },
                { wch: 18 },
                { wch: 20 },
                { wch: 23 },
                { wch: 18 },
                { wch: 24 },
                { wch: 24 },
                { wch: 30 },
                { wch: 15 },
                { wch: 25 },
                { wch: 35 },
                { wch: 35 },
                { wch: 20 },
                { wch: 18 }
            ];

            // RFC, CURP, NSS y CLABE como texto.
            const columnasTexto = [6, 7, 8, 12, 13];

            for (let fila = 2; fila <= filas.length + 1; fila++) {
                for (const columna of columnasTexto) {
                    const referencia = XLSX.utils.encode_cell({
                        r: fila - 1,
                        c: columna
                    });

                    const celda = hoja[referencia];

                    if (celda) {
                        celda.t = 's';
                        celda.v = String(celda.v ?? '');
                        celda.z = '@';
                    }
                }
            }

            hoja['!autofilter'] = {
                ref: hoja['!ref']
            };

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'Empleados');

            const hoy = new Date();

            const nombreArchivoExcel = `Empleados_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}.xlsx`;

            XLSX.writeFile(libro, nombreArchivoExcel);

            avisar('success', 'Archivo Excel generado correctamente');
        } catch (error) {
            console.error('Error exportando empleados:', error);

            avisar('error', error?.message || 'No fue posible exportar empleados');
        } finally {
            exportando.value = false;
        }
    };

    // CAMBIOS DE FILTRO
    watch(filtroEstatus, () => {
        cargarEmpleados();
    });

    // INICIALIZACIÓN
    onMounted(async () => {
        await Promise.all([cargarEmpleados(), cargarCatalogosSat()]);
    });

    onBeforeUnmount(() => {
        limpiarVisor();
    });

    return {
        // LISTADO
        empleados,
        cargando,
        busqueda,
        filtroArea,
        filtroEstatus,
        opcionesEstatus,
        opcionesAreas,
        filtrados,
        nombre,
        fecha,
        cargarEmpleados,

        // EXPEDIENTE
        visibleDetalle,
        detalle,
        pestanaDocumento,
        urlArchivo,
        tipoArchivo,
        cargandoArchivo,
        mensajeArchivo,
        camposDetalle,
        documentosVisor,
        valorDetalle,
        archivoDisponible,
        nombreArchivo,
        limpiarVisor,
        cambiarDocumento,
        verDetalle,
        descargarDocumento,
        severidadEstatus,

        // CATÁLOGOS
        catalogosSat,
        cargarCatalogosSat,
        descripcionCatalogo,

        // EXPORTACIÓN
        exportando,
        exportarExcel
    };
}
