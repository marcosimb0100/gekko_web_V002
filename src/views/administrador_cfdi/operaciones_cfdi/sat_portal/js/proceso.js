import { useToast } from 'primevue/usetoast';

import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

import { useStore } from 'vuex';

import * as XLSX from 'xlsx';

const useProceso = () => {
    const mostrarDetalleEfirma = ref(false);
    const handleMostrarDetalleEfirma = () => { mostrarDetalleEfirma.value = true; };
    const handleCerrarDetalleEfirma = () => { mostrarDetalleEfirma.value = false; };
    const store = useStore();

    const toast = useToast();

    // ==========================================================

    // EMPRESAS

    // ==========================================================

    const empresas = ref([]);

    const companyId = ref('');

    const cargandoEmpresas = ref(false);

    const empresaSeleccionada = computed(() => {
        if (!companyId.value) {
            return null;
        }

        return empresas.value.find((item) => String(item._id) === String(companyId.value)) || null;
    });

    // ==========================================================

    // CONEXION SAT

    // ==========================================================

    const validando = ref(false);

    const conectando = ref(false);

    const cerrandoSesion = ref(false);

    const efirmaValidada = ref(false);

    const datosEfirma = ref({});

    const sesionSat = ref(null);

    // ==========================================================

    // CONSULTA CFDI

    // ==========================================================

    const consultandoCfdi = ref(false);

    const actualizandoCfdiBase = ref(false);
    const totalCfdiActualizando = ref(0);

    const handleOcultarCargandoGlobal = () => {
        const cargandoGlobal = document.getElementById('cargando');

        if (cargandoGlobal) {
            cargandoGlobal.classList.add('oculto');
        }
    };

    const tipoConsulta = ref('recibidos');

    const tiposConsulta = ref([
        {
            label: 'Recibidos',

            value: 'recibidos'
        },

        {
            label: 'Emitidos',

            value: 'emitidos'
        }
    ]);

    const estadoCfdi = ref('todos');

    const estadosCfdi = ref([
        {
            label: 'Todos',

            value: 'todos'
        },

        {
            label: 'Vigentes',

            value: 'vigente'
        },

        {
            label: 'Cancelados',

            value: 'cancelado'
        }
    ]);

    // ==========================================================

    // FECHAS

    // ==========================================================

    const fechaHoy = ref(new Date());

    const handlePrimerDiaMes = () => {
        const ahora = new Date();

        return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    };

    const fechaInicial = ref(handlePrimerDiaMes());

    const fechaFinal = ref(new Date());

    // ==========================================================

    // RESULTADOS

    // ==========================================================

    const cfdis = ref([]);

    const busquedaCfdi = ref('');

    // ==========================================================

    // PROCESANDO

    // ==========================================================

    const procesando = computed(() => {
        return cargandoEmpresas.value || validando.value || conectando.value || cerrandoSesion.value || consultandoCfdi.value;
    });

    // ==========================================================

    // BOTON VALIDAR

    // ==========================================================

    const botonValidarDeshabilitado = computed(() => {
        return !companyId.value || validando.value || conectando.value || cerrandoSesion.value || actualizandoCfdiBase.value;
    });

    // ==========================================================

    // PUEDE CONSULTAR

    // ==========================================================

    const puedeConsultarCfdi = computed(() => {
        return !!sesionSat.value?.sesion_id && !!fechaInicial.value && !!fechaFinal.value && !consultandoCfdi.value && !cerrandoSesion.value && !actualizandoCfdiBase.value;
    });

    // ==========================================================

    // PRIMER VALOR DISPONIBLE

    // ==========================================================

    const handlePrimerValor = (item, claves) => {
        for (const clave of claves) {
            const valor = item?.[clave];

            if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
                return valor;
            }
        }

        return '';
    };

    // ==========================================================

    // FORMATO FECHA ISO

    //

    // 2026-04-30T01:47:11

    // ==========================================================

    const handleFormatoFechaHora = (fecha) => {
        if (!fecha) {
            return '-';
        }

        const texto = String(fecha).trim();

        const coincidencia = texto.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);

        if (coincidencia) {
            return `${coincidencia[1]}T${coincidencia[2]}`;
        }

        const valor = new Date(texto);

        if (Number.isNaN(valor.getTime())) {
            return texto;
        }

        const anio = valor.getFullYear();

        const mes = String(valor.getMonth() + 1).padStart(2, '0');

        const dia = String(valor.getDate()).padStart(2, '0');

        const hora = String(valor.getHours()).padStart(2, '0');

        const minuto = String(valor.getMinutes()).padStart(2, '0');

        const segundo = String(valor.getSeconds()).padStart(2, '0');

        return `${anio}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
    };

    // ==========================================================

    // CAMPOS CFDI

    // ==========================================================

    const handleObtenerRfcEmisor = (item) => {
        return handlePrimerValor(item, ['rfc_emisor', 'rfc_del_emisor', 'rfcemisor']) || '-';
    };

    const handleObtenerNombreEmisor = (item) => {
        return handlePrimerValor(item, ['nombre_o_razon_social_del_emisor', 'nombre_razon_social_emisor', 'nombre_emisor', 'razon_social_emisor']) || '-';
    };

    const handleObtenerRfcReceptor = (item) => {
        return handlePrimerValor(item, ['rfc_receptor', 'rfc_del_receptor', 'rfcreceptor']) || '-';
    };

    const handleObtenerNombreReceptor = (item) => {
        return handlePrimerValor(item, ['nombre_o_razon_social_del_receptor', 'nombre_razon_social_receptor', 'nombre_receptor', 'razon_social_receptor']) || '-';
    };

    const handleObtenerFechaCfdi = (item) => {
        const fecha = handlePrimerValor(item, ['fecha_emision', 'fecha_de_emision', 'fecha', 'fecha_expedicion']);

        if (!fecha) {
            return '-';
        }

        return handleFormatoFechaHora(fecha);
    };

    const handleObtenerFechaCancelacion = (item) => {
        const estado = String(handlePrimerValor(item, ['estado_cfdi', 'estado_del_comprobante', 'estado', 'estado_comprobante', 'estatus']) || '')
            .trim()

            .toLowerCase();

        if (!estado.includes('cancelado')) {
            return '-';
        }

        const fecha = handlePrimerValor(item, ['fecha_cancelacion', 'fecha_de_cancelacion', 'fecha_cancelado', 'fecha_cancelación']);

        if (!fecha) {
            return '-';
        }

        return handleFormatoFechaHora(fecha);
    };

    const handleObtenerTotal = (item) => {
        const valor = handlePrimerValor(item, ['total', 'monto_total', 'importe_total']);

        if (valor === '' || valor === null || valor === undefined) {
            return 0;
        }

        if (typeof valor === 'number') {
            return valor;
        }

        const limpio = String(valor).replace(/\$/g, '').replace(/,/g, '').trim();

        const numero = Number(limpio);

        return Number.isNaN(numero) ? 0 : numero;
    };

    const handleObtenerTipoComprobante = (item) => {
        return handlePrimerValor(item, ['efecto_del_comprobante', 'tipo_de_comprobante', 'tipo_comprobante', 'tipo']) || '-';
    };

    const handleObtenerEstado = (item) => {
        return handlePrimerValor(item, ['estado_cfdi', 'estado_del_comprobante', 'estado', 'estado_comprobante', 'estatus']) || '-';
    };

    // ==========================================================

    // ESTADO CSS

    // ==========================================================

    const handleClaseEstado = (estado) => {
        const valor = String(estado || '').toLowerCase();

        if (valor.includes('vigente')) {
            return 'estado-cfdi ' + 'estado-vigente';
        }

        if (valor.includes('cancel')) {
            return 'estado-cfdi ' + 'estado-cancelado';
        }

        return 'estado-cfdi';
    };

    // ==========================================================

    // FORMATO MONEDA

    // ==========================================================

    const handleFormatoMoneda = (valor) => {
        const numero = Number(valor || 0);

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',

            currency: 'MXN',

            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }).format(Number.isNaN(numero) ? 0 : numero);
    };

    // ==========================================================

    // CFDI FILTRADOS

    // ==========================================================

    const cfdisFiltrados = computed(() => {
        const texto = String(busquedaCfdi.value || '')
            .trim()

            .toLowerCase();

        if (!texto) {
            return cfdis.value;
        }

        return cfdis.value.filter((item) => {
            const valores = [
                item.uuid,

                handleObtenerRfcEmisor(item),

                handleObtenerNombreEmisor(item),

                handleObtenerRfcReceptor(item),

                handleObtenerNombreReceptor(item),

                handleObtenerFechaCfdi(item),

                handleObtenerFechaCancelacion(item),

                handleObtenerTotal(item),

                handleObtenerTipoComprobante(item),

                handleObtenerEstado(item)
            ];

            return valores.filter((valor) => valor !== null && valor !== undefined).some((valor) => String(valor).toLowerCase().includes(texto));
        });
    });

    // ==========================================================

    // CARGAR EMPRESAS

    // ==========================================================

    const handleCargarEmpresas = async () => {
        cargandoEmpresas.value = true;

        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: '/operacion_sat/companias_descarga_cfdi_sat'
            });

            if (res.estatus !== 200) {
                empresas.value = [];

                toast.add({
                    severity: 'error',

                    summary: 'Portal SAT',

                    detail: res.mensaje ?? 'No fue posible cargar las empresas disponibles.',

                    life: 3500
                });

                return;
            }

            empresas.value = res.datos?.companias ?? [];
        } catch (error) {
            console.error('ERROR CARGAR EMPRESAS SAT:', error);

            empresas.value = [];

            toast.add({
                severity: 'error',

                summary: 'Portal SAT',

                detail: 'Ocurrió un error al cargar las empresas.',

                life: 3500
            });
        } finally {
            cargandoEmpresas.value = false;
        }
    };

    // ==========================================================

    // CAMBIAR EMPRESA

    // ==========================================================

    const handleCambiarEmpresa = () => {
        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;

        cfdis.value = [];

        busquedaCfdi.value = '';
    };

    // ==========================================================

    // VALIDAR E.FIRMA

    // ==========================================================

    const handleValidarEfirma = async () => {
        if (!companyId.value) {
            toast.add({
                severity: 'warn',

                summary: 'Portal SAT',

                detail: 'Selecciona una empresa.',

                life: 3000
            });

            return;
        }

        validando.value = true;

        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;

        cfdis.value = [];

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/sat_portal/validar_efirma',

                datosJson: {
                    company_id: companyId.value
                }
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'e.firma',

                    detail: res.mensaje ?? 'No fue posible validar la e.firma registrada.',

                    life: 4500
                });

                return;
            }

            datosEfirma.value = res.datos || {};

            efirmaValidada.value = true;

            toast.add({
                severity: 'success',

                summary: 'e.firma',

                detail: res.mensaje ?? 'La e.firma registrada fue validada correctamente.',

                life: 3000
            });
        } catch (error) {
            console.error('ERROR VALIDAR EFIRMA:', error);

            toast.add({
                severity: 'error',

                summary: 'e.firma',

                detail: 'No fue posible validar la e.firma registrada.',

                life: 3500
            });
        } finally {
            validando.value = false;
        }
    };

    // ==========================================================

    // INICIAR SESION SAT

    // ==========================================================

    const handleIniciarSesion = async () => {
        if (!companyId.value) {
            toast.add({
                severity: 'warn',

                summary: 'Portal SAT',

                detail: 'Selecciona una empresa.',

                life: 3000
            });

            return;
        }

        if (!efirmaValidada.value) {
            toast.add({
                severity: 'warn',

                summary: 'Portal SAT',

                detail: 'Primero valida la e.firma registrada.',

                life: 3000
            });

            return;
        }

        conectando.value = true;

        sesionSat.value = null;

        cfdis.value = [];

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: '/sat_portal/iniciar_sesion',

                datosJson: {
                    company_id: companyId.value
                }
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'Portal SAT',

                    detail: res.mensaje ?? 'No fue posible iniciar sesión con el SAT.',

                    life: 5000
                });

                return;
            }

            sesionSat.value = {
                sesion_id: res.datos?.sesion_id,

                rfc: res.datos?.rfc || res.datos?.rfc_empresa,

                empresa: res.datos?.empresa
            };

            toast.add({
                severity: 'success',

                summary: 'Portal SAT',

                detail: res.mensaje ?? 'Sesión SAT iniciada correctamente.',

                life: 3000
            });
        } catch (error) {
            console.error('ERROR INICIAR SESION SAT:', error);

            toast.add({
                severity: 'error',

                summary: 'Portal SAT',

                detail: 'No fue posible iniciar sesión con el SAT.',

                life: 3500
            });
        } finally {
            conectando.value = false;
        }
    };

    // ==========================================================

    // CERRAR SESION SAT

    // ==========================================================

    const handleCerrarSesion = async () => {
        if (!sesionSat.value?.sesion_id) {
            return;
        }

        cerrandoSesion.value = true;

        try {
            const sesionId = sesionSat.value.sesion_id;

            const res = await store.dispatch('api/apiDeleteToken', {
                direccion: `/sat_portal/sesion/${sesionId}`
            });

            if (res?.estatus && res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'Portal SAT',

                    detail: res.mensaje ?? 'No fue posible cerrar la sesión SAT.',

                    life: 4000
                });

                return;
            }

            sesionSat.value = null;

            cfdis.value = [];

            busquedaCfdi.value = '';

            handleLimpiarConsulta();

            toast.add({
                severity: 'success',

                summary: 'Portal SAT',

                detail: 'La sesión SAT se cerró correctamente.',

                life: 3000
            });
        } catch (error) {
            console.error('ERROR CERRAR SESION SAT:', error);

            toast.add({
                severity: 'error',

                summary: 'Portal SAT',

                detail: 'No fue posible cerrar la sesión SAT.',

                life: 4000
            });
        } finally {
            cerrandoSesion.value = false;
        }
    };

    // ==========================================================

    // FORMATO FECHA API

    // ==========================================================

    const handleFormatoFechaApi = (fecha) => {
        if (!fecha) {
            return '';
        }

        const valor = fecha instanceof Date ? fecha : new Date(fecha);

        if (Number.isNaN(valor.getTime())) {
            return '';
        }

        const anio = valor.getFullYear();

        const mes = String(valor.getMonth() + 1).padStart(2, '0');

        const dia = String(valor.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    };

    // ==========================================================

    // CONSULTAR CFDI

    // ==========================================================

    const handleConsultarCfdi = async () => {
        if (!sesionSat.value?.sesion_id) {
            toast.add({
                severity: 'warn',

                summary: 'Portal SAT',

                detail: 'Primero debes conectarte al SAT.',

                life: 3000
            });

            return;
        }

        if (!fechaInicial.value || !fechaFinal.value) {
            toast.add({
                severity: 'warn',

                summary: 'Consulta CFDI',

                detail: 'Selecciona la fecha inicial y final.',

                life: 3000
            });

            return;
        }

        const inicio = new Date(fechaInicial.value);

        const fin = new Date(fechaFinal.value);

        if (fin.getTime() < inicio.getTime()) {
            toast.add({
                severity: 'warn',

                summary: 'Consulta CFDI',

                detail: 'La fecha final no puede ser menor a la fecha inicial.',

                life: 3500
            });

            return;
        }

        consultandoCfdi.value = true;

        cfdis.value = [];

        busquedaCfdi.value = '';

        try {
            const direccion = tipoConsulta.value === 'emitidos' ? '/sat_portal/' + 'consultar_emitidos/' + sesionSat.value.sesion_id : '/sat_portal/' + 'consultar_recibidos/' + sesionSat.value.sesion_id;

            const res = await store.dispatch('api/apiPostToken', {
                direccion,

                datosJson: {
                    company_id: companyId.value,

                    fecha_inicial: handleFormatoFechaApi(fechaInicial.value),

                    fecha_final: handleFormatoFechaApi(fechaFinal.value),

                    estado: estadoCfdi.value
                }
            });

            if (res.estatus !== 200) {
                toast.add({
                    severity: res.estatus === 401 ? 'warn' : 'error',

                    summary: 'Consulta CFDI',

                    detail: res.mensaje ?? 'No fue posible consultar los CFDI.',

                    life: 5000
                });

                if (res.estatus === 401) {
                    sesionSat.value = null;
                }

                return;
            }

            cfdis.value = Array.isArray(res.datos?.registros) ? res.datos.registros : [];

            toast.add({
                severity: 'success',

                summary: 'Consulta CFDI',

                detail: `${cfdis.value.length} registro(s) encontrado(s).`,

                life: 3000
            });
        } catch (error) {
            console.error('ERROR CONSULTAR CFDI SAT:', error);

            toast.add({
                severity: 'error',

                summary: 'Consulta CFDI',

                detail: 'No fue posible consultar los CFDI.',

                life: 4000
            });
        } finally {
            consultandoCfdi.value = false;
        }
    };

    // ==========================================================
    // ACTUALIZAR CFDI BASE
    //
    // - No utiliza el loader global.
    // - Usa apiPostTokenSinCargando.
    // - Procesa todos los CFDI de la consulta.
    // - Mantiene el spinner solamente en el botón.
    // ==========================================================

    const avanceActualizacion = ref({ porcentaje: 0, fase: 'preparando', completados: 0 });
    const claveTrabajo = 'gekko_sat_actualizacion';
    let vistaActiva = true;
    const descripcionActualizacion = computed(() => {
        const avance = avanceActualizacion.value;
        const fases = { preparando: 'Preparando CFDI', descargando: 'Revisando y descargando XML', procesando: 'Procesando XML en la base', sincronizando: 'Actualizando estatus SAT' };
        return `${fases[avance.fase] || 'Actualizando CFDI'}: ${avance.completados || 0} de ${avance.total_fase || avance.total || 0}`;
    });
    const handleSeguirActualizacion = async (trabajo) => {
        actualizandoCfdiBase.value = true;
        let fallos = 0;
        while (vistaActiva) {
            try {
                const respuesta = await store.dispatch('api/apiPostTokenSinCargando', {
                    direccion: '/sat_portal/actualizacion_estado/' + trabajo, datosJson: {}
                });
                if (!vistaActiva) return;
                if (respuesta.estatus !== 200) {
                    if ([401, 402, 403, 404].includes(respuesta.estatus)) {
                        sessionStorage.removeItem(claveTrabajo);
                        actualizandoCfdiBase.value = false;
                        toast.add({ severity: 'warn', summary: 'Actualizar CFDI', detail: respuesta.mensaje || 'No fue posible consultar la actualizacion.', life: 6000 });
                        return;
                    }
                    throw new Error('Estado temporalmente no disponible');
                }
                fallos = 0;
                avanceActualizacion.value = respuesta.datos;
                const datos = respuesta.datos;
                if (datos.estado !== 'procesando') {
                    sessionStorage.removeItem(claveTrabajo);
                    actualizandoCfdiBase.value = false;
                    const resultado = datos.resultado;
                    const resumen = resultado?.datos || {};
                    const correcto = datos.estado === 'finalizado' && resultado?.estatus === 200;
                    toast.add({
                        severity: correcto ? (resumen.errores ? 'warn' : 'success') : 'error', summary: 'Actualizar CFDI',
                        detail: correcto ? `${resumen.procesados || 0} de ${resumen.total || 0} CFDI procesados. ${resumen.errores || 0} errores.` : (datos.mensaje || resultado?.mensaje || 'La actualizacion se interrumpio.'), life: 7000
                    });
                    return;
                }
            } catch (error) {
                fallos += 1;
                if (fallos === 3 && vistaActiva) toast.add({ severity: 'warn', summary: 'Actualizar CFDI', detail: 'Se perdio temporalmente la conexion. El trabajo no se vuelve a enviar; seguiremos consultando su avance.', life: 6000 });
            }
            await new Promise((resolve) => setTimeout(resolve, fallos ? 5000 : 1500));
        }
    };
    const handleActualizarCfdiBase = async () => {
        if (actualizandoCfdiBase.value || !sesionSat.value?.sesion_id || !companyId.value) return;
        const registros = cfdis.value.filter((item) => (item?.uuid || item?.folio_fiscal) && item?.url_xml);
        if (!registros.length) {
            toast.add({ severity: 'warn', summary: 'Actualizar CFDI', detail: 'Primero consulta CFDI que contengan ligas XML.', life: 4000 });
            return;
        }
        actualizandoCfdiBase.value = true;
        avanceActualizacion.value = { porcentaje: 0, fase: 'preparando', total: registros.length };
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', {
                direccion: '/sat_portal/actualizar_cfdi_base/' + sesionSat.value.sesion_id,
                datosJson: { company_id: companyId.value, tipo_consulta: tipoConsulta.value, registros }
            });
            if (res.estatus !== 202 || !res.datos?.trabajo_id) {
                throw new Error(res.mensaje || 'No fue posible iniciar la actualizacion.');
            }
            sessionStorage.setItem(claveTrabajo, res.datos.trabajo_id);
            if (vistaActiva) await handleSeguirActualizacion(res.datos.trabajo_id);
        } catch (error) {
            if (vistaActiva) {
                actualizandoCfdiBase.value = false;
                toast.add({ severity: 'error', summary: 'Actualizar CFDI', detail: error.message, life: 6000 });
            }
        }
    };
    onMounted(() => {
        const trabajo = sessionStorage.getItem(claveTrabajo);
        if (trabajo) handleSeguirActualizacion(trabajo);
    });
    onBeforeUnmount(() => { vistaActiva = false; });

    // ==========================================================

    // EXPORTAR RESULTADOS CFDI A EXCEL

    // ==========================================================

    const handleExportarExcel = () => {
        if (!cfdisFiltrados.value.length) {
            toast.add({
                severity: 'warn',

                summary: 'Excel',

                detail: 'No existen CFDI para exportar.',

                life: 3000
            });

            return;
        }

        try {
            const datosExcel = cfdisFiltrados.value.map((item, index) => {
                return {
                    '#': index + 1,

                    'Folio Fiscal': item.uuid || '',

                    'RFC Emisor': handleObtenerRfcEmisor(item),

                    'Razón Social Emisor': handleObtenerNombreEmisor(item),

                    'RFC Receptor': handleObtenerRfcReceptor(item),

                    'Razón Social Receptor': handleObtenerNombreReceptor(item),

                    'Fecha Emisión': handleObtenerFechaCfdi(item),

                    'Fecha Cancelación': handleObtenerFechaCancelacion(item) === '-' ? '' : handleObtenerFechaCancelacion(item),

                    Total: Number(handleObtenerTotal(item) || 0),

                    Tipo: handleObtenerTipoComprobante(item),

                    Estado: handleObtenerEstado(item)
                };
            });

            const hoja = XLSX.utils.json_to_sheet(datosExcel);

            hoja['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 18 }, { wch: 42 }, { wch: 18 }, { wch: 42 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];

            hoja['!autofilter'] = {
                ref: `A1:K${datosExcel.length + 1}`
            };

            for (let fila = 2; fila <= datosExcel.length + 1; fila++) {
                const celda = hoja[`I${fila}`];

                if (celda) {
                    celda.z = '$#,##0.00';
                }
            }

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(libro, hoja, 'CFDI SAT');

            const empresa = empresaSeleccionada.value?.rfc || datosEfirma.value?.rfc || 'SAT';

            const tipo = tipoConsulta.value === 'emitidos' ? 'Emitidos' : 'Recibidos';

            const estado = estadoCfdi.value === 'todos' ? 'Todos' : estadoCfdi.value === 'vigente' ? 'Vigentes' : 'Cancelados';

            const fechaInicio = handleFormatoFechaApi(fechaInicial.value);

            const fechaFin = handleFormatoFechaApi(fechaFinal.value);

            const nombreArchivo = `CFDI_SAT_${empresa}_` + `${tipo}_` + `${estado}_` + `${fechaInicio}_` + `${fechaFin}.xlsx`;

            XLSX.writeFile(libro, nombreArchivo);

            toast.add({
                severity: 'success',

                summary: 'Excel',

                detail: `${datosExcel.length} CFDI exportados correctamente.`,

                life: 3000
            });
        } catch (error) {
            console.error('ERROR EXPORTAR CFDI SAT:', error);

            toast.add({
                severity: 'error',

                summary: 'Excel',

                detail: 'No fue posible generar el archivo Excel.',

                life: 3500
            });
        }
    };

    // ==========================================================

    // LIMPIAR CONSULTA

    // ==========================================================

    const handleLimpiarConsulta = () => {
        tipoConsulta.value = 'recibidos';

        estadoCfdi.value = 'todos';

        fechaInicial.value = handlePrimerDiaMes();

        fechaFinal.value = new Date();

        cfdis.value = [];

        busquedaCfdi.value = '';
    };

    // ==========================================================

    // DESCARGAR XML CFDI SAT

    // ==========================================================

    const handleDescargarXml = async (item) => {
        const uuid = String(item?.uuid || item?.folio_fiscal || '').trim();

        const urlXml = String(item?.url_xml || '').trim();

        if (!uuid) {
            toast.add({
                severity: 'warn',

                summary: 'XML',

                detail: 'El registro no contiene folio fiscal.',

                life: 3000
            });

            return;
        }

        if (!sesionSat.value?.sesion_id) {
            toast.add({
                severity: 'warn',

                summary: 'Portal SAT',

                detail: 'Primero debes conectarte al SAT.',

                life: 3000
            });

            return;
        }

        if (!urlXml) {
            toast.add({
                severity: 'warn',

                summary: 'XML',

                detail: 'El SAT no devolvió ' + 'la liga de descarga XML.',

                life: 4500
            });

            return;
        }

        try {
            const res = await store.dispatch('api/apiPostToken', {
                direccion: `/sat_portal/descargar_xml/${sesionSat.value.sesion_id}`,

                datosJson: {
                    uuid,

                    url_xml: urlXml
                }
            });

            if (!res || res.estatus !== 200) {
                toast.add({
                    severity: 'error',

                    summary: 'XML',

                    detail: res?.mensaje || 'No fue posible descargar el XML.',

                    life: 5000
                });

                return;
            }

            const xmlBase64 = res.datos?.xml_base64;

            if (!xmlBase64) {
                toast.add({
                    severity: 'error',

                    summary: 'XML',

                    detail: 'El servidor no devolvió el contenido del XML.',

                    life: 4000
                });

                return;
            }

            const binario = window.atob(xmlBase64);

            const bytes = new Uint8Array(binario.length);

            for (let i = 0; i < binario.length; i++) {
                bytes[i] = binario.charCodeAt(i);
            }

            const blob = new Blob([bytes], {
                type: 'application/xml;charset=utf-8'
            });

            const nombreArchivo = res.datos?.nombre_archivo || `${uuid}.xml`;

            const url = window.URL.createObjectURL(blob);

            const enlace = document.createElement('a');

            enlace.href = url;

            enlace.download = nombreArchivo;

            enlace.style.display = 'none';

            document.body.appendChild(enlace);

            enlace.click();

            document.body.removeChild(enlace);

            window.URL.revokeObjectURL(url);

            toast.add({
                severity: 'success',

                summary: 'XML',

                detail: `XML ${uuid} descargado correctamente.`,

                life: 3000
            });
        } catch (error) {
            console.error('ERROR DESCARGAR XML SAT:', error);

            toast.add({
                severity: 'error',

                summary: 'XML',

                detail: 'No fue posible descargar el XML.',

                life: 4000
            });
        }
    };

    // ==========================================================

    // FECHA VISUAL E.FIRMA

    // ==========================================================

    const handleFecha = (fecha) => {
        if (!fecha) {
            return '-';
        }

        try {
            const valor = new Date(fecha);

            if (Number.isNaN(valor.getTime())) {
                return fecha;
            }

            return valor.toLocaleDateString('es-MX', {
                year: 'numeric',

                month: '2-digit',

                day: '2-digit'
            });
        } catch {
            return fecha;
        }
    };

    // ==========================================================

    // LIMPIAR TODO

    // ==========================================================

    const handleLimpiar = () => {
        if (sesionSat.value?.sesion_id) {
            return;
        }

        companyId.value = '';

        efirmaValidada.value = false;

        datosEfirma.value = {};

        sesionSat.value = null;

        cfdis.value = [];

        busquedaCfdi.value = '';

        tipoConsulta.value = 'recibidos';

        estadoCfdi.value = 'todos';

        fechaInicial.value = handlePrimerDiaMes();

        fechaFinal.value = new Date();
    };

    // ==========================================================

    // INIT

    // ==========================================================

    handleCargarEmpresas();

    // ==========================================================

    // RETURN

    // ==========================================================

    return {
        avanceActualizacion, descripcionActualizacion,
        mostrarDetalleEfirma, handleMostrarDetalleEfirma, handleCerrarDetalleEfirma,
        empresas,

        companyId,

        cargandoEmpresas,

        empresaSeleccionada,

        validando,

        conectando,

        cerrandoSesion,

        procesando,

        efirmaValidada,

        datosEfirma,

        sesionSat,

        botonValidarDeshabilitado,

        consultandoCfdi,

        actualizandoCfdiBase,
        totalCfdiActualizando,

        tipoConsulta,

        tiposConsulta,

        estadoCfdi,

        estadosCfdi,

        fechaHoy,

        fechaInicial,

        fechaFinal,

        cfdis,

        busquedaCfdi,

        cfdisFiltrados,

        puedeConsultarCfdi,

        handleCargarEmpresas,

        handleCambiarEmpresa,

        handleValidarEfirma,

        handleIniciarSesion,

        handleCerrarSesion,

        handleConsultarCfdi,

        handleActualizarCfdiBase,

        handleLimpiarConsulta,

        handleObtenerRfcEmisor,

        handleObtenerNombreEmisor,

        handleObtenerRfcReceptor,

        handleObtenerNombreReceptor,

        handleObtenerFechaCfdi,

        handleObtenerFechaCancelacion,

        handleObtenerTotal,

        handleObtenerTipoComprobante,

        handleObtenerEstado,

        handleClaseEstado,

        handleFormatoMoneda,

        handleDescargarXml,

        handleFecha,

        handleLimpiar,

        handleExportarExcel
    };
};

export default useProceso;
