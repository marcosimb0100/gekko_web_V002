import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';

import { regex_clabe_banco, regex_cuenta_banco } from '../../../../helpers/regex';

const frmEmpresaInit = () => ({
    _id: '',
    tipo_persona: '',
    rfc: '',
    razon_social_nombre_completo: '',
    calle: '',
    numero_ext: '',
    numero_int: '',
    colonia: '',
    poblacion: '',
    municipio: '',
    codigo_postal: '',
    pais: '',
    estado: '',
    correo_electronico: '',
    numero_contacto_principal: '',
    numero_contacto_alterno: '',
    regimen_fiscal: '',
    correo_electronico_agente: '',
    activo: true,

    bancos: [],
    prod_serv: [],

    csd: {
        _id: '',
        archivoCer: '',
        archivoKey: '',
        archivo_cer: null,
        archivo_key: null,
        clave: '',
        fecha_vencimiento: '',
        serie: '',
        nombre: '',
        rfc: '',
        certificado: '',
        no_certificado: '',
        tipo_certificado: '',
        activo: false
    },

    fiel: {
        _id: '',
        archivoCer: '',
        archivoKey: '',
        archivo_cer: null,
        archivo_key: null,
        clave: '',
        fecha_vencimiento: '',
        serie: '',
        nombre: '',
        rfc: '',
        certificado: '',
        no_certificado: '',
        tipo_certificado: '',
        descarga_cfdi_sat: false,
        activo: false
    },

    plantillas: [],

    ruta_contpaq: '',

    factura_serie: '',
    factura_folio: 0,

    nota_credito_serie: '',
    nota_credito_folio: 0,

    complemento_pago_serie: '',
    complemento_pago_folio: 0
});

const frmBancoInit = () => ({
    _id: '',
    banco: '',
    clabe_banco: '',
    cuenta_banco: '',
    activo: true
});

const frmConceptoInit = () => ({
    _id: '',

    prod_serv: null,
    descripcion_sat: '',
    descripcion: '',
    cuenta_predial: '',

    clave_unidad: 'E48',
    unidad: 'UNIDAD DE SERVICIO',

    objeto_imp: '02',
    objeto_imp_des: 'Sí objeto de impuesto.',

    num_uso: '0',

    impuestos: {
        traslado: [],
        retencion: []
    },

    tax_transfer_id: '',
    tax_withholding_id: '',

    activo: true
});

const frmCSDInit = () => ({
    archivo_cer: null,
    archivo_key: null,
    clave: '',
    activo: true
});

const frmFIELInit = () => ({
    archivo_cer: null,
    archivo_key: null,
    clave: '',
    descarga_cfdi_sat: false,
    activo: true
});

const frmPlantillaInit = () => ({
    _id: '',
    tipo_plantilla: '',
    archivo: null,
    nombre_archivo: ''
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    // ------------------------------------------------------------------
    // ESTADO GENERAL
    // ------------------------------------------------------------------

    const mostrarTablaFormulario = ref(false);
    const movimiento = ref('');

    const tablaEmpresas = ref([]);

    const frmEmpresa = reactive(frmEmpresaInit());

    // ------------------------------------------------------------------
    // FILTROS
    // ------------------------------------------------------------------

    const filtros = ref({
        global: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // ------------------------------------------------------------------
    // LOGOS
    // ------------------------------------------------------------------

    const logosEmpresas = reactive({});

    const logoArchivo = ref(null);
    const logoPreview = ref(null);
    const logoInput = ref(null);

    // ------------------------------------------------------------------
    // CATÁLOGOS
    // ------------------------------------------------------------------

    const catalogoSat = ref(null);

    const catalogoPlantillas = ref([
        {
            label: 'FACTURA',
            value: 'FACTURA'
        },
        {
            label: 'NOTA DE CRÉDITO',
            value: 'NOTA_CREDITO'
        },
        {
            label: 'COMPLEMENTO DE PAGO',
            value: 'COMPLEMENTO_PAGO'
        }
    ]);

    // ------------------------------------------------------------------
    // DIALOGS
    // ------------------------------------------------------------------

    const visibleBanco = ref(false);
    const visibleConcepto = ref(false);
    const visibleCSD = ref(false);
    const visibleFIEL = ref(false);
    const visiblePlantilla = ref(false);

    const visibleConsultaBancos = ref(false);
    const visibleConsultaConceptos = ref(false);

    const empresaConsulta = ref(null);

    // ------------------------------------------------------------------
    // FORMULARIOS DIALOG
    // ------------------------------------------------------------------

    const frmBanco = reactive(frmBancoInit());

    const frmConcepto = reactive(frmConceptoInit());

    const taxTransfers = ref([]);

    const taxWithholdings = ref([]);

    let timeoutBusquedaProdServ = null;

    const frmCSD = reactive(frmCSDInit());

    const frmFIEL = reactive(frmFIELInit());

    const frmPlantilla = reactive(frmPlantillaInit());

    const indiceBanco = ref(-1);
    const indiceConcepto = ref(-1);

    const listaProdServ = ref([]);
    const valorBuscado = ref(null);

    // ------------------------------------------------------------------
    // CARGAR EMPRESAS
    // ------------------------------------------------------------------

    const handleCargarEmpresas = async (silencioso = false) => {
        const accion = silencioso ? 'api/apiGetTokenSinCargando' : 'api/apiGetToken';

        const res = await store.dispatch(accion, {
            direccion: `/companias/`
        });

        if (res.estatus === 200) {
            tablaEmpresas.value = res.datos?.companias ?? [];

            await Promise.all(tablaEmpresas.value.map((empresa) => handleCargarLogo(empresa._id, false)));
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    const handleVerBancos = async (data) => {
        const resRegistro = await store.dispatch('api/apiGetToken', {
            direccion: `/companias/companias_id/${data._id}`
        });

        if (resRegistro.estatus === 200) {
            empresaConsulta.value = resRegistro?.datos?.compania ?? null;

            visibleConsultaBancos.value = true;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: resRegistro.mensaje,
                life: 3000
            });
        }
    };

    const handleVerConceptos = async (data) => {
        const resRegistro = await store.dispatch('api/apiGetToken', {
            direccion: `/companias/companias_id/${data._id}`
        });

        if (resRegistro.estatus === 200) {
            empresaConsulta.value = resRegistro?.datos?.compania ?? null;

            visibleConsultaConceptos.value = true;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: resRegistro.mensaje,
                life: 3000
            });
        }
    };

    // ------------------------------------------------------------------
    // CARGAR CATÁLOGOS
    // ------------------------------------------------------------------

    const handleCargarCatalogos = async () => {
        const resSat = await store.dispatch('api/apiGetToken', {
            direccion: `/sat/sat_empresa`
        });

        if (resSat.estatus === 200) {
            catalogoSat.value = resSat.datos;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: resSat.mensaje,
                life: 3000
            });
        }
    };

    const handleCargarImpuestos = async () => {
        const res = await store.dispatch('api/apiGetTokenSinCargando', {
            direccion: `/impuestos/`
        });

        if (res.estatus === 200) {
            const impuestos = res.datos?.impuestos ?? [];

            taxTransfers.value = impuestos.filter((item) => item.tipo === 'traslado' && item.activo === true);

            taxWithholdings.value = impuestos.filter((item) => item.tipo === 'retencion' && item.activo === true);
        } else {
            taxTransfers.value = [];
            taxWithholdings.value = [];
        }
    };

    const handleBuscarProdServ = (event) => {
        const query = String(event.query || '').trim();

        clearTimeout(timeoutBusquedaProdServ);

        if (!query) {
            listaProdServ.value = [];
            return;
        }

        timeoutBusquedaProdServ = setTimeout(async () => {
            const res = await store.dispatch('api/apiGetTokenSinCargando', {
                direccion: `/sat/sat_productos_servicios/${encodeURIComponent(query)}`
            });

            if (res.estatus === 200) {
                listaProdServ.value = res.datos?.prod_serv ?? [];
            } else {
                listaProdServ.value = [];
            }
        }, 500);
    };

    const handleCambioValorProdServ = (valor) => {
        valorBuscado.value = valor;

        // Si está escribiendo texto nuevamente,
        // todavía NO tenemos un producto SAT válido.
        if (typeof valor === 'string') {
            frmConcepto.prod_serv = null;
            frmConcepto.descripcion_sat = '';
        }

        if (!valor) {
            frmConcepto.prod_serv = null;
            frmConcepto.descripcion_sat = '';
        }
    };

    const handleSeleccionarProdServ = (event) => {
        const item = event.value;

        if (!item) {
            frmConcepto.prod_serv = null;
            frmConcepto.descripcion_sat = '';

            return;
        }

        valorBuscado.value = item;

        frmConcepto.prod_serv = item;

        frmConcepto.descripcion_sat = item.descripcion ?? '';
    };

    // ------------------------------------------------------------------
    // CARGA INICIAL
    // ------------------------------------------------------------------

    const cargarInicial = async () => {
        await Promise.all([handleCargarEmpresas(), handleCargarCatalogos(), handleCargarImpuestos()]);
    };

    // ------------------------------------------------------------------
    // LOGOS
    // ------------------------------------------------------------------

    const handleCargarLogo = async (id, recargar = false) => {
        if (!id) {
            return;
        }

        if (logosEmpresas[id] && !recargar) {
            return;
        }

        if (logosEmpresas[id] && recargar) {
            URL.revokeObjectURL(logosEmpresas[id]);

            delete logosEmpresas[id];
        }

        const res = await store.dispatch('api/apiGetblobSinCargando', {
            direccion: `/companias/logo/${id}`
        });

        if (res.estatus === 200 && res.data instanceof Blob) {
            logosEmpresas[id] = URL.createObjectURL(res.data);
        }
    };

    const handleAbrirLogo = () => {
        logoInput.value?.click();
    };

    const handleSeleccionarLogo = (event) => {
        const archivo = event.target.files?.[0];

        if (!archivo) {
            return;
        }

        const tiposPermitidos = ['image/jpeg', 'image/png'];

        if (!tiposPermitidos.includes(archivo.type)) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Solo se permiten imágenes JPG y PNG.',
                life: 3000
            });

            event.target.value = '';

            return;
        }

        logoArchivo.value = archivo;

        if (logoPreview.value) {
            URL.revokeObjectURL(logoPreview.value);
        }

        logoPreview.value = URL.createObjectURL(archivo);
    };

    // ------------------------------------------------------------------
    // CARGAR EMPRESA EN FORMULARIO
    // ------------------------------------------------------------------

    const handleCargarEmpresa = (data) => {
        const inicial = frmEmpresaInit();

        Object.assign(frmEmpresa, inicial, data, {
            bancos: data?.bancos ?? [],

            prod_serv: data?.prod_serv ?? [],

            plantillas: data?.plantillas ?? [],

            csd: {
                ...inicial.csd,
                ...(data?.csd ?? {})
            },

            fiel: {
                ...inicial.fiel,
                ...(data?.fiel ?? {})
            }
        });
    };

    // ------------------------------------------------------------------
    // MOSTRAR FORMULARIO
    // ------------------------------------------------------------------

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            handleLimpiarFormulario();

            movimiento.value = 'N';

            frmEmpresa.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            handleLimpiarFormulario();

            movimiento.value = 'E';

            const resRegistro = await store.dispatch('api/apiGetToken', {
                direccion: `/companias/companias_id/${data._id}`
            });

            if (resRegistro.estatus === 200) {
                const empresa = resRegistro?.datos?.compania;

                handleCargarEmpresa(empresa);

                mostrarTablaFormulario.value = true;
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Notificación',
                    detail: resRegistro.mensaje,
                    life: 3000
                });
            }
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;
            movimiento.value = '';

            handleLimpiarFormulario();
        }
    };

    // ------------------------------------------------------------------
    // LIMPIAR FORMULARIO
    // ------------------------------------------------------------------

    const handleLimpiarFormulario = () => {
        Object.assign(frmEmpresa, frmEmpresaInit());

        logoArchivo.value = null;

        if (logoPreview.value) {
            URL.revokeObjectURL(logoPreview.value);

            logoPreview.value = null;
        }

        if (logoInput.value) {
            logoInput.value.value = '';
        }
    };

    // ------------------------------------------------------------------
    // FECHAS
    // ------------------------------------------------------------------

    const handleFecha = (fecha) => {
        if (!fecha) {
            return '';
        }

        const date = new Date(fecha);

        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ------------------------------------------------------------------
    // FILTROS
    // ------------------------------------------------------------------

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // ------------------------------------------------------------------
    // SOLO NÚMEROS
    // ------------------------------------------------------------------

    const soloNumeros = (event) => {
        const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

        if (teclasPermitidas.includes(event.key)) {
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            return;
        }

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    };

    // ------------------------------------------------------------------
    // CLABE
    // ------------------------------------------------------------------

    const handleCambioClabe = (valor) => {
        const clabe = String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 18);

        frmBanco.clabe_banco = clabe;

        if (clabe.length < 3) {
            frmBanco.banco = '';
            return;
        }

        const claveBanco = clabe.substring(0, 3);

        const bancoEncontrado = catalogoBancos.value.find((item) => item.clabe_banco === claveBanco);

        frmBanco.banco = bancoEncontrado ? bancoEncontrado.clabe_banco : '';
    };

    // ------------------------------------------------------------------
    // CUENTA BANCO
    // ------------------------------------------------------------------

    const handleCambioCuentaBanco = (valor) => {
        frmBanco.cuenta_banco = String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 11);
    };

    // ------------------------------------------------------------------
    // ESTADOS
    // ------------------------------------------------------------------

    const estadosFiltrados = computed(() => {
        if (!catalogoSat.value || !frmEmpresa.pais) {
            return [];
        }

        return (catalogoSat.value.estado || [])
            .filter((item) => item.pais === frmEmpresa.pais)
            .map((item) => ({
                ...item,

                texto: `${item.estado} - ${item.nombre_estado}`.toUpperCase()
            }));
    });

    // ------------------------------------------------------------------
    // REGIMEN FISCAL
    // ------------------------------------------------------------------

    const regimenFiscalFiltrado = computed(() => {
        if (!catalogoSat.value) {
            return [];
        }

        const lista = catalogoSat.value.regimen_fiscal || [];

        const tipoPersona = (frmEmpresa.tipo_persona || '').toString().trim().toLowerCase();

        if (tipoPersona === 'fisica') {
            return lista
                .filter((item) => item.fisica === true)
                .map((item) => ({
                    ...item,

                    texto: `${item.regimen_fiscal} - ${item.descripcion}`.toUpperCase()
                }));
        }

        if (tipoPersona === 'moral') {
            return lista
                .filter((item) => item.moral === true)
                .map((item) => ({
                    ...item,

                    texto: `${item.regimen_fiscal} - ${item.descripcion}`.toUpperCase()
                }));
        }

        return [];
    });

    // ------------------------------------------------------------------
    // CATÁLOGO BANCOS
    // ------------------------------------------------------------------

    const catalogoBancos = computed(() => {
        return catalogoSat.value?.banco || [];
    });

    // ------------------------------------------------------------------
    // VALIDACIONES BANCO
    // ------------------------------------------------------------------

    const clabeValida = computed(() => {
        if (!frmBanco.clabe_banco) {
            return true;
        }

        return regex_clabe_banco.test(frmBanco.clabe_banco.trim());
    });

    const cuentaBancoValida = computed(() => {
        if (!frmBanco.cuenta_banco) {
            return true;
        }

        return regex_cuenta_banco.test(frmBanco.cuenta_banco.trim());
    });

    const botonGuardarBancoDeshabilitado = computed(() => {
        if (!frmBanco.clabe_banco || !frmBanco.cuenta_banco || !frmBanco.banco) {
            return true;
        }

        if (!clabeValida.value || !cuentaBancoValida.value) {
            return true;
        }

        return false;
    });

    // ------------------------------------------------------------------
    // ETIQUETA PERSONA
    // ------------------------------------------------------------------

    const etiquetaRazonSocial = computed(() => {
        const tipoPersona = (frmEmpresa.tipo_persona || '').toString().trim().toLowerCase();

        if (tipoPersona === 'moral') {
            return 'Razón Social';
        }

        if (tipoPersona === 'fisica') {
            return 'Nombre Completo';
        }

        return 'Razón Social / Nombre Completo';
    });

    // ------------------------------------------------------------------
    // VALIDACIÓN PRINCIPAL
    // ------------------------------------------------------------------

    const botonGuardarDeshabilitado = computed(() => {
        if (
            !frmEmpresa.tipo_persona ||
            !frmEmpresa.rfc.trim() ||
            !frmEmpresa.razon_social_nombre_completo.trim() ||
            !frmEmpresa.calle.trim() ||
            !frmEmpresa.numero_ext.trim() ||
            !frmEmpresa.colonia.trim() ||
            !frmEmpresa.poblacion.trim() ||
            !frmEmpresa.municipio.trim() ||
            !frmEmpresa.codigo_postal.trim() ||
            !frmEmpresa.pais ||
            !frmEmpresa.estado ||
            !frmEmpresa.correo_electronico.trim() ||
            !frmEmpresa.numero_contacto_principal.trim() ||
            !frmEmpresa.regimen_fiscal
        ) {
            return true;
        }

        return false;
    });

    // ------------------------------------------------------------------
    // BANCOS
    // ------------------------------------------------------------------

    const handleNuevoBanco = () => {
        Object.assign(frmBanco, frmBancoInit());

        indiceBanco.value = -1;

        visibleBanco.value = true;
    };

    const handleEditarBanco = (data, index) => {
        Object.assign(frmBanco, frmBancoInit(), data);

        indiceBanco.value = index;

        visibleBanco.value = true;
    };

    const handleGuardarBanco = () => {
        if (!frmBanco.clabe_banco) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese la CLABE bancaria.',
                life: 3000
            });

            return;
        }

        if (!clabeValida.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La CLABE bancaria debe contener 18 dígitos.',
                life: 3000
            });

            return;
        }

        if (!frmBanco.banco) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'No se encontró el banco correspondiente a la CLABE.',
                life: 3000
            });

            return;
        }

        if (!frmBanco.cuenta_banco) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Ingrese la cuenta bancaria.',
                life: 3000
            });

            return;
        }

        if (!cuentaBancoValida.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La cuenta bancaria debe contener 11 dígitos.',
                life: 3000
            });

            return;
        }

        const existe = frmEmpresa.bancos.some((item, index) => index !== indiceBanco.value && (item.clabe_banco === frmBanco.clabe_banco || item.cuenta_banco === frmBanco.cuenta_banco));

        if (existe) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La CLABE o la cuenta bancaria ya están registradas.',
                life: 3000
            });

            return;
        }

        const registro = {
            ...frmBanco,

            banco: frmBanco.banco.trim().toUpperCase(),

            clabe_banco: frmBanco.clabe_banco.trim(),

            cuenta_banco: frmBanco.cuenta_banco.trim()
        };

        if (indiceBanco.value >= 0) {
            frmEmpresa.bancos.splice(indiceBanco.value, 1, registro);
        } else {
            frmEmpresa.bancos.push(registro);
        }

        visibleBanco.value = false;

        Object.assign(frmBanco, frmBancoInit());

        indiceBanco.value = -1;
    };

    // ------------------------------------------------------------------
    // CONCEPTOS
    // ------------------------------------------------------------------

    const handleNuevoConcepto = () => {
        Object.assign(frmConcepto, frmConceptoInit());

        valorBuscado.value = null;

        listaProdServ.value = [];

        indiceConcepto.value = -1;

        visibleConcepto.value = true;
    };

    const handleEditarConcepto = (data, index) => {
        Object.assign(frmConcepto, frmConceptoInit(), {
            ...data,

            prod_serv: data?.prod_serv ?? '',

            descripcion_sat: data?.descripcion_sat ?? '',

            descripcion: data?.descripcion ?? '',

            cuenta_predial: data?.cuenta_predial ?? '',

            clave_unidad: data?.clave_unidad ?? 'E48',

            unidad: data?.unidad ?? 'UNIDAD DE SERVICIO',

            objeto_imp: data?.objeto_imp ?? '02',

            objeto_imp_des: data?.objeto_imp_des ?? '',

            num_uso: String(data?.num_uso ?? '0'),

            impuestos: {
                traslado: data?.impuestos?.traslado ?? [],

                retencion: data?.impuestos?.retencion ?? []
            },

            tax_transfer_id: '',

            tax_withholding_id: '',

            activo: data?.activo ?? false
        });

        /*
         * Al editar solamente mostramos
         * la clave/descripción y bloqueamos
         * el AutoComplete.
         */
        valorBuscado.value = data?.descripcion_sat ? `${data.prod_serv} - ${data.descripcion_sat}` : (data?.prod_serv ?? '');

        listaProdServ.value = [];

        indiceConcepto.value = index;

        visibleConcepto.value = true;
    };

    const handleCancelarConcepto = () => {
        visibleConcepto.value = false;

        indiceConcepto.value = -1;

        valorBuscado.value = null;

        listaProdServ.value = [];

        Object.assign(frmConcepto, frmConceptoInit());
    };

    const handleAgregarTaxProdServ = (tipo) => {
        const lista = tipo === 'traslado' ? taxTransfers.value : taxWithholdings.value;

        const idSeleccionado = tipo === 'traslado' ? frmConcepto.tax_transfer_id : frmConcepto.tax_withholding_id;

        if (!idSeleccionado) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione un impuesto.',
                life: 3000
            });

            return;
        }

        const impuestoSeleccionado = lista.find((item) => item._id === idSeleccionado);

        if (!impuestoSeleccionado) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Impuesto no encontrado.',
                life: 3000
            });

            return;
        }

        const existe = frmConcepto.impuestos[tipo].some((item) => item._id === impuestoSeleccionado._id);

        if (existe) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Este impuesto ya fue agregado.',
                life: 3000
            });

            return;
        }

        frmConcepto.impuestos[tipo].push({
            ...impuestoSeleccionado
        });

        if (tipo === 'traslado') {
            frmConcepto.tax_transfer_id = '';
        } else {
            frmConcepto.tax_withholding_id = '';
        }
    };

    const handleEliminarTaxProdServ = (tipo, taxId) => {
        frmConcepto.impuestos[tipo] = frmConcepto.impuestos[tipo].filter((item) => item._id !== taxId);
    };

    const productoServicioValido = computed(() => {
        // Estamos editando un concepto que ya está
        // en frmEmpresa.prod_serv, aunque todavía no
        // haya sido guardado en Mongo.
        if (indiceConcepto.value >= 0) {
            return !!frmConcepto.prod_serv;
        }

        // Nuevo concepto:
        // debe seleccionar un elemento del AutoComplete.
        return typeof frmConcepto.prod_serv === 'object' && frmConcepto.prod_serv !== null && !!frmConcepto.prod_serv.clave_prod_serv;
    });

    const descripcionConceptoValida = computed(() => {
        return !!(frmConcepto.descripcion || '').trim();
    });

    const claveUnidadValida = computed(() => {
        return !!frmConcepto.clave_unidad;
    });

    const objetoImpValido = computed(() => {
        return !!frmConcepto.objeto_imp;
    });

    const botonGuardarConceptoDeshabilitado = computed(() => {
        if (!productoServicioValido.value) {
            return true;
        }

        if (!descripcionConceptoValida.value) {
            return true;
        }

        if (!claveUnidadValida.value) {
            return true;
        }

        if (!objetoImpValido.value) {
            return true;
        }

        return false;
    });

    const handleGuardarConcepto = () => {
        if (botonGuardarConceptoDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete correctamente los campos obligatorios.',
                life: 3000
            });

            return;
        }

        // ------------------------------------------------------------
        // CLAVE PROD / SERV
        // ------------------------------------------------------------

        let claveProdServ = '';
        let descripcionSat = '';

        if (typeof frmConcepto.prod_serv === 'object' && frmConcepto.prod_serv !== null) {
            claveProdServ = frmConcepto.prod_serv?.clave_prod_serv ?? '';

            descripcionSat = frmConcepto.prod_serv?.descripcion ?? '';
        } else {
            // Editando un concepto ya guardado/local
            claveProdServ = frmConcepto.prod_serv ?? '';

            descripcionSat = frmConcepto.descripcion_sat ?? '';
        }

        // ------------------------------------------------------------
        // UNIDAD
        // ------------------------------------------------------------

        const unidad = (catalogoSat.value?.clave_unidad || []).find((item) => item.clave_unidad === frmConcepto.clave_unidad);

        // ------------------------------------------------------------
        // OBJETO IMPUESTO
        // ------------------------------------------------------------

        const objetoImp = (catalogoSat.value?.objeto_imp || []).find((item) => item.objeto_imp === frmConcepto.objeto_imp);

        // ------------------------------------------------------------
        // DESCRIPCION OBJETO IMPUESTO
        // ------------------------------------------------------------

        const descripcionObjetoImp = objetoImp?.descripcion ?? objetoImp?.descripcion_objeto_imp ?? objetoImp?.descripcion_2 ?? '';

        // ------------------------------------------------------------
        // REGISTRO
        // ------------------------------------------------------------

        const registro = {
            _id: frmConcepto._id ?? '',

            prod_serv: claveProdServ,

            descripcion_sat: descripcionSat,

            descripcion: (frmConcepto.descripcion || '').trim().toUpperCase(),

            cuenta_predial: (frmConcepto.cuenta_predial || '').trim().toUpperCase(),

            clave_unidad: frmConcepto.clave_unidad,

            unidad: unidad?.descripcion ?? unidad?.descripcion_2 ?? frmConcepto.unidad ?? '',

            objeto_imp: frmConcepto.objeto_imp,

            objeto_imp_des: descripcionObjetoImp,

            num_uso: String(frmConcepto.num_uso ?? '0'),

            impuestos: {
                traslado: [...(frmConcepto.impuestos?.traslado ?? [])],

                retencion: [...(frmConcepto.impuestos?.retencion ?? [])]
            },

            activo: frmConcepto.activo
        };

        // ------------------------------------------------------------
        // EDITAR
        // ------------------------------------------------------------

        if (indiceConcepto.value >= 0) {
            frmEmpresa.prod_serv.splice(indiceConcepto.value, 1, registro);
        }

        // ------------------------------------------------------------
        // NUEVO
        // ------------------------------------------------------------
        else {
            frmEmpresa.prod_serv.push(registro);
        }

        // ------------------------------------------------------------
        // LIMPIAR
        // ------------------------------------------------------------

        visibleConcepto.value = false;

        indiceConcepto.value = -1;

        valorBuscado.value = null;

        listaProdServ.value = [];

        Object.assign(frmConcepto, frmConceptoInit());
    };

    const handleObjetoImpDesc = (rowData) => {
        if (!rowData?.objeto_imp) {
            return '';
        }

        const objetoImp = (catalogoSat.value?.objeto_imp || []).find((item) => item.objeto_imp === rowData.objeto_imp);

        return objetoImp?.descripcion ?? '';
    };

    // ------------------------------------------------------------------
    // CSD
    // ------------------------------------------------------------------

    const botonVerificarCSDDeshabilitado = computed(() => {
        return !frmCSD.archivo_cer || !frmCSD.archivo_key || !frmCSD.clave?.trim();
    });

    const handleMostrarCSD = () => {
        Object.assign(frmCSD, frmCSDInit(), {
            activo: frmEmpresa.csd?.activo ?? true
        });

        visibleCSD.value = true;
    };

    const handleArchivoCSDCer = (event) => {
        frmCSD.archivo_cer = event.files?.[0] ?? null;
    };

    const handleArchivoCSDKey = (event) => {
        frmCSD.archivo_key = event.files?.[0] ?? null;
    };

    const handleVerificarCSD = async () => {
        if (botonVerificarCSDDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione los archivos .cer, .key e ingrese la clave.',
                life: 3000
            });

            return;
        }

        const formData = new FormData();

        formData.append('archivo_cer_csd', frmCSD.archivo_cer);

        formData.append('archivo_key_csd', frmCSD.archivo_key);

        formData.append('clave', frmCSD.clave);

        formData.append('activo', frmCSD.activo ? '1' : '0');

        formData.append('_id', frmEmpresa.csd?._id || '');

        formData.append('fecha_vencimiento', frmEmpresa.csd?.fecha_vencimiento || '');

        const res = await store.dispatch('api/apiPostTokenFormData', {
            direccion: `/companias/verificarcsd/`,
            formData
        });

        if (res.estatus === 200) {
            Object.assign(frmEmpresa.csd, res.datos ?? {}, {
                archivo_cer: frmCSD.archivo_cer,

                archivo_key: frmCSD.archivo_key,

                clave: frmCSD.clave,

                activo: frmCSD.activo
            });

            visibleCSD.value = false;

            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // ------------------------------------------------------------------
    // FIEL
    // ------------------------------------------------------------------

    const botonVerificarFIELDeshabilitado = computed(() => {
        return !frmFIEL.archivo_cer || !frmFIEL.archivo_key || !frmFIEL.clave?.trim();
    });

    const handleMostrarFIEL = () => {
        Object.assign(frmFIEL, frmFIELInit(), {
            activo: frmEmpresa.fiel?.activo ?? true,

            descarga_cfdi_sat: frmEmpresa.fiel?.descarga_cfdi_sat ?? false
        });

        visibleFIEL.value = true;
    };

    const handleArchivoFIELCer = (event) => {
        frmFIEL.archivo_cer = event.files?.[0] ?? null;
    };

    const handleArchivoFIELKey = (event) => {
        frmFIEL.archivo_key = event.files?.[0] ?? null;
    };

    const handleVerificarFIEL = async () => {
        if (botonVerificarFIELDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione los archivos .cer, .key e ingrese la clave.',
                life: 3000
            });

            return;
        }

        const formData = new FormData();

        formData.append('archivo_cer_fiel', frmFIEL.archivo_cer);

        formData.append('archivo_key_fiel', frmFIEL.archivo_key);

        formData.append('clave', frmFIEL.clave);

        formData.append('activo', frmFIEL.activo ? '1' : '0');

        formData.append('_id', frmEmpresa.fiel?._id || '');

        formData.append('fecha_vencimiento', frmEmpresa.fiel?.fecha_vencimiento || '');

        const res = await store.dispatch('api/apiPostTokenFormData', {
            direccion: `/companias/verificarfiel/`,
            formData
        });

        if (res.estatus === 200) {
            Object.assign(frmEmpresa.fiel, res.datos ?? {}, {
                archivo_cer: frmFIEL.archivo_cer,

                archivo_key: frmFIEL.archivo_key,

                clave: frmFIEL.clave,

                descarga_cfdi_sat: frmFIEL.descarga_cfdi_sat,

                activo: frmFIEL.activo
            });

            visibleFIEL.value = false;

            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // ------------------------------------------------------------------
    // PLANTILLAS
    // ------------------------------------------------------------------

    const botonGuardarPlantillaDeshabilitado = computed(() => {
        return !frmPlantilla.tipo_plantilla || !frmPlantilla.archivo;
    });

    const handleMostrarPlantillas = () => {
        Object.assign(frmPlantilla, frmPlantillaInit());

        visiblePlantilla.value = true;
    };

    const handleArchivoPlantilla = (event) => {
        const archivo = event.files?.[0] ?? null;

        frmPlantilla.archivo = archivo;

        frmPlantilla.nombre_archivo = archivo?.name ?? '';
    };

    const handleCancelarPlantilla = () => {
        visiblePlantilla.value = false;

        Object.assign(frmPlantilla, frmPlantillaInit());
    };

    const handleGuardarPlantilla = () => {
        if (botonGuardarPlantillaDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Seleccione el tipo de plantilla y el archivo.',
                life: 3000
            });

            return;
        }

        const indice = frmEmpresa.plantillas.findIndex((item) => item.tipo_plantilla === frmPlantilla.tipo_plantilla);

        const plantillaAnterior = indice >= 0 ? frmEmpresa.plantillas[indice] : null;

        const registro = {
            _id: plantillaAnterior?._id ?? '',

            tipo_plantilla: frmPlantilla.tipo_plantilla,

            archivo_html: frmPlantilla.nombre_archivo,

            archivo: frmPlantilla.archivo,

            campo_file: plantillaAnterior?.campo_file ?? `plantilla_${frmPlantilla.tipo_plantilla.toLowerCase()}_${Date.now()}`,

            fecha_creacion: plantillaAnterior?.fecha_creacion ?? null,

            fecha_actualizacion: plantillaAnterior?.fecha_actualizacion ?? null
        };

        if (indice >= 0) {
            frmEmpresa.plantillas.splice(indice, 1, registro);
        } else {
            frmEmpresa.plantillas.push(registro);
        }

        visiblePlantilla.value = false;

        Object.assign(frmPlantilla, frmPlantillaInit());
    };

    // ------------------------------------------------------------------
    // ACTUALIZAR CONCEPTOS
    // ------------------------------------------------------------------

    const handleActualizarConceptos = async () => {
        if (!frmEmpresa._id) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Primero debe guardar la empresa.',
                life: 3000
            });

            return;
        }

        const res = await store.dispatch('api/apiPutToken', {
            direccion: `/companias/sincronizar_conceptos_solicitudes/${frmEmpresa._id}`,

            datosJson: {}
        });

        if (res.estatus === 200) {
            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // ------------------------------------------------------------------
    // CONSTRUIR FORMDATA
    // ------------------------------------------------------------------

    const construirFormDataEmpresa = () => {
        const formData = new FormData();

        const campos = [
            '_id',
            'tipo_persona',
            'rfc',
            'razon_social_nombre_completo',
            'calle',
            'numero_ext',
            'numero_int',
            'colonia',
            'poblacion',
            'municipio',
            'codigo_postal',
            'pais',
            'estado',
            'correo_electronico',
            'numero_contacto_principal',
            'numero_contacto_alterno',
            'regimen_fiscal',
            'correo_electronico_agente',
            'ruta_contpaq',
            'factura_serie',
            'factura_folio',
            'nota_credito_serie',
            'nota_credito_folio',
            'complemento_pago_serie',
            'complemento_pago_folio'
        ];

        campos.forEach((campo) => {
            const valor = frmEmpresa[campo] ?? '';

            formData.append(campo, typeof valor === 'string' ? valor.trim() : String(valor));
        });

        formData.append('activo', frmEmpresa.activo ? 'true' : 'false');

        const csdJson = {
            ...frmEmpresa.csd
        };

        delete csdJson.archivo_cer;

        delete csdJson.archivo_key;

        const fielJson = {
            ...frmEmpresa.fiel
        };

        delete fielJson.archivo_cer;

        delete fielJson.archivo_key;

        const plantillasJson = frmEmpresa.plantillas.map((item) => {
            const copia = {
                ...item
            };

            delete copia.archivo;

            return copia;
        });

        formData.append('bancos', JSON.stringify(frmEmpresa.bancos ?? []));

        formData.append('prod_serv', JSON.stringify(frmEmpresa.prod_serv ?? []));

        formData.append('csd', JSON.stringify(csdJson));

        formData.append('fiel', JSON.stringify(fielJson));

        formData.append('plantillas', JSON.stringify(plantillasJson));

        if (frmEmpresa.csd?.archivo_cer instanceof File) {
            formData.append('archivo_cer_csd', frmEmpresa.csd.archivo_cer);
        }

        if (frmEmpresa.csd?.archivo_key instanceof File) {
            formData.append('archivo_key_csd', frmEmpresa.csd.archivo_key);
        }

        if (frmEmpresa.fiel?.archivo_cer instanceof File) {
            formData.append('archivo_cer_fiel', frmEmpresa.fiel.archivo_cer);
        }

        if (frmEmpresa.fiel?.archivo_key instanceof File) {
            formData.append('archivo_key_fiel', frmEmpresa.fiel.archivo_key);
        }

        frmEmpresa.plantillas.forEach((item) => {
            if (item?.archivo instanceof File && item?.campo_file) {
                formData.append(item.campo_file, item.archivo);
            }
        });

        return formData;
    };

    // ------------------------------------------------------------------
    // GUARDAR LOGO
    // ------------------------------------------------------------------

    const handleGuardarLogo = async (rfc, esNuevo) => {
        if (!logoArchivo.value || !rfc) {
            return {
                estatus: 200
            };
        }

        const formData = new FormData();

        formData.append('logo', logoArchivo.value);

        if (esNuevo) {
            return await store.dispatch('api/apiPostTokenFormData', {
                direccion: `/companias/logo/${rfc}`,

                formData
            });
        }

        return await store.dispatch('api/apiPutTokenFormData', {
            direccion: `/companias/logo/${rfc}`,

            formData
        });
    };

    // ------------------------------------------------------------------
    // GUARDAR EMPRESA
    // ------------------------------------------------------------------

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete los campos obligatorios.',
                life: 3000
            });

            return;
        }

        const esNuevo = movimiento.value === 'N';

        const idActual = frmEmpresa._id;

        const rfcActual = frmEmpresa.rfc;

        const formData = construirFormDataEmpresa();

        let res;

        if (esNuevo) {
            res = await store.dispatch('api/apiPostTokenFormData', {
                direccion: `/companias/`,

                formData
            });
        } else {
            res = await store.dispatch('api/apiPutTokenFormData', {
                direccion: `/companias/`,

                formData
            });
        }

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        const resLogo = await handleGuardarLogo(rfcActual, esNuevo);

        if (resLogo.estatus !== 200) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La empresa se guardó, pero el logo no pudo guardarse.',
                life: 4000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }

        // Si editamos y hubo cambio de logo,
        // limpiamos su ObjectURL anterior.
        if (!esNuevo && logoArchivo.value && idActual) {
            await handleCargarLogo(idActual, true);
        }

        mostrarTablaFormulario.value = false;

        movimiento.value = '';

        handleLimpiarFormulario();

        // Refrescamos únicamente empresas.
        // No volvemos a pedir catálogos SAT.
        // Tampoco mostramos otro loading.
        await handleCargarEmpresas(true);
    };

    // ------------------------------------------------------------------
    // INICIALIZAR
    // ------------------------------------------------------------------

    cargarInicial();

    // ------------------------------------------------------------------
    // RETURN
    // ------------------------------------------------------------------

    return {
        filtros,
        tablaEmpresas,
        mostrarTablaFormulario,
        movimiento,
        frmEmpresa,

        logosEmpresas,
        logoArchivo,
        logoPreview,
        logoInput,

        catalogoSat,
        catalogoBancos,
        catalogoPlantillas,
        estadosFiltrados,
        regimenFiscalFiltrado,
        etiquetaRazonSocial,

        clabeValida,
        cuentaBancoValida,
        botonGuardarBancoDeshabilitado,
        botonGuardarDeshabilitado,

        visibleBanco,
        visibleConcepto,
        visibleCSD,
        visibleFIEL,
        visiblePlantilla,

        frmBanco,
        frmConcepto,
        frmCSD,
        frmFIEL,
        frmPlantilla,

        indiceConcepto,

        valorBuscado,
        listaProdServ,

        taxTransfers,
        taxWithholdings,

        productoServicioValido,
        descripcionConceptoValida,
        claveUnidadValida,
        objetoImpValido,
        botonGuardarConceptoDeshabilitado,

        botonVerificarCSDDeshabilitado,
        botonVerificarFIELDeshabilitado,
        botonGuardarPlantillaDeshabilitado,

        visibleConsultaBancos,
        visibleConsultaConceptos,
        empresaConsulta,

        handleVerBancos,
        handleVerConceptos,

        soloNumeros,

        handleMostrarFormulario,
        handleLimpiarFiltro,

        handleAbrirLogo,
        handleSeleccionarLogo,
        handleFecha,

        handleCambioClabe,
        handleCambioCuentaBanco,

        handleNuevoBanco,
        handleEditarBanco,
        handleGuardarBanco,

        handleNuevoConcepto,
        handleEditarConcepto,
        handleCancelarConcepto,
        handleBuscarProdServ,
        handleCambioValorProdServ,
        handleSeleccionarProdServ,
        handleAgregarTaxProdServ,
        handleEliminarTaxProdServ,
        handleGuardarConcepto,
        handleObjetoImpDesc,

        // CSD
        handleMostrarCSD,
        handleArchivoCSDCer,
        handleArchivoCSDKey,
        handleVerificarCSD,

        // FIEL
        handleMostrarFIEL,
        handleArchivoFIELCer,
        handleArchivoFIELKey,
        handleVerificarFIEL,

        // PLANTILLAS
        handleMostrarPlantillas,
        handleArchivoPlantilla,
        handleCancelarPlantilla,
        handleGuardarPlantilla,

        handleActualizarConceptos,
        handleGuardar
    };
};

export default useProceso;
