import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

import { computed, reactive, ref } from 'vue';

import { useStore } from 'vuex';

const regex_rfc = /^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/;

const regex_correo_electronico = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const regex_codigo_postal = /^\d{5}$/;

const regex_telefono = /^\(\d{3}\)-\d{3}-\d{4}$/;

/* ============================================================
   FORM CLIENTE
============================================================ */

const frmClienteInit = () => ({
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
    promotor: '',
    empresa_facturadora: '',

    activo: true,

    prod_serv: [],

    cif: {
        _id: ''
    }
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();

    // =========================================================
    // ESTADO GENERAL
    // =========================================================

    const mostrarTablaFormulario = ref(false);

    const movimiento = ref('');

    const tablaClientes = ref([]);

    const frmCliente = reactive(frmClienteInit());

    // =========================================================
    // FILTRO
    // =========================================================

    const filtros = ref({
        global: {
            value: null,

            matchMode: FilterMatchMode.CONTAINS
        }
    });

    // =========================================================
    // CATÁLOGOS
    // =========================================================

    const catalogoSat = ref(null);

    const promotores = ref([]);

    const companias = ref([]);

    // =========================================================
    // LOGO
    // =========================================================

    const logosClientes = reactive({});

    const logoArchivo = ref(null);

    const logoPreview = ref(null);

    const logoInput = ref(null);

    // =========================================================
    // CONCEPTOS
    // =========================================================

    const empresaProdServ = ref('');

    const prodServ = ref('');

    const catProdServ = ref([]);

    // =========================================================
    // CIF
    // =========================================================

    const visibleCIF = ref(false);

    const cifArchivo = ref(null);

    const cifPreview = ref(null);

    const frmAccesoCliente = reactive({
        usuario: '',
        password: '',
        activo: false
    });

    const accesoClienteExiste = ref(false);

    // =========================================================
    // CARGAR CLIENTES
    // =========================================================

    const handleCargarClientes = async (silencioso = false) => {
        const accion = silencioso ? 'api/apiGetTokenSinCargando' : 'api/apiGetToken';

        const res = await store.dispatch(accion, {
            direccion: `/clientes/`
        });

        if (res.estatus === 200) {
            tablaClientes.value = res.datos?.clientes ?? [];

            await Promise.all(tablaClientes.value.map((cliente) => handleCargarLogo(cliente._id)));
        } else {
            tablaClientes.value = [];

            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });
        }
    };

    // =========================================================
    // CATÁLOGOS SAT
    // =========================================================

    const handleCargarCatalogosSat = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/sat/sat_empresa`
        });

        if (res.estatus === 200) {
            catalogoSat.value = res.datos;
        } else {
            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });
        }
    };

    // =========================================================
    // PROMOTORES
    // =========================================================

    const handleCargarPromotores = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/promotores/`
        });

        if (res.estatus === 200) {
            promotores.value = res.datos?.promotores ?? [];
        } else {
            promotores.value = [];
        }
    };

    // =========================================================
    // EMPRESAS
    // =========================================================

    const handleCargarCompanias = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/companias/`
        });

        if (res.estatus === 200) {
            companias.value = res.datos?.companias ?? [];
        } else {
            companias.value = [];
        }
    };

    // =========================================================
    // LOGO CLIENTE
    // =========================================================

    const handleCargarLogo = async (id, recargar = false) => {
        if (!id) {
            return;
        }

        if (logosClientes[id] && !recargar) {
            return;
        }

        if (logosClientes[id] && recargar) {
            URL.revokeObjectURL(logosClientes[id]);

            delete logosClientes[id];
        }

        const res = await store.dispatch('api/apiGetblobSinCargando', {
            direccion: `/clientes/logo/${id}`
        });

        if (res.estatus === 200 && res.data instanceof Blob) {
            logosClientes[id] = URL.createObjectURL(res.data);
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

        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];

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

    // =========================================================
    // CARGAR CLIENTE
    // =========================================================

    const handleCargarCliente = (data) => {
        const inicial = frmClienteInit();

        Object.assign(frmCliente, inicial, data, {
            prod_serv: data?.prod_serv ?? [],

            cif: {
                ...inicial.cif,
                ...(data?.cif ?? {})
            }
        });
    };

    // =========================================================
    // MOSTRAR FORMULARIO
    // =========================================================

    const handleMostrarFormulario = async (tipo, data) => {
        if (tipo === 'N') {
            handleLimpiarFormulario();

            movimiento.value = 'N';

            frmCliente.activo = true;

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'E') {
            handleLimpiarFormulario();

            movimiento.value = 'E';

            /*
             * El React original trabaja
             * directamente con la fila.
             *
             * Si después tienes endpoint
             * clientes_id podemos cambiarlo.
             */

            handleCargarCliente(data);

            await handleCargarLogo(data._id);

            await handleCargarCIF(data);

            await handleCargarAccesoCliente(data._id);

            mostrarTablaFormulario.value = true;
        } else if (tipo === 'C') {
            mostrarTablaFormulario.value = false;

            movimiento.value = '';

            handleLimpiarFormulario();
        }
    };

    // =========================================================
    // LIMPIAR FORMULARIO
    // =========================================================

    const handleLimpiarFormulario = () => {
        Object.assign(frmCliente, frmClienteInit());

        empresaProdServ.value = '';

        prodServ.value = '';

        catProdServ.value = [];

        logoArchivo.value = null;

        if (logoPreview.value) {
            URL.revokeObjectURL(logoPreview.value);

            logoPreview.value = null;
        }

        if (logoInput.value) {
            logoInput.value.value = '';
        }

        if (cifPreview.value) {
            URL.revokeObjectURL(cifPreview.value);

            cifPreview.value = null;
        }

        cifArchivo.value = null;

        visibleCIF.value = false;

        frmAccesoCliente.usuario = '';
        frmAccesoCliente.password = '';
        frmAccesoCliente.activo = false;

        accesoClienteExiste.value = false;
    };

    // =========================================================
    // FILTROS
    // =========================================================

    const handleLimpiarFiltro = () => {
        filtros.value.global.value = null;
    };

    // =========================================================
    // ESTADOS
    // =========================================================

    const estadosFiltrados = computed(() => {
        if (!catalogoSat.value || !frmCliente.pais) {
            return [];
        }

        return (catalogoSat.value.estado ?? [])

            .filter((item) => item.pais === frmCliente.pais)

            .map((item) => ({
                ...item,

                texto: `${item.estado} - ${item.nombre_estado}`.toUpperCase()
            }));
    });

    // =========================================================
    // REGIMEN FISCAL
    // =========================================================

    const regimenFiscalFiltrado = computed(() => {
        if (!catalogoSat.value) {
            return [];
        }

        const lista = catalogoSat.value.regimen_fiscal ?? [];

        const tipoPersona = String(frmCliente.tipo_persona || '')
            .trim()
            .toLowerCase();

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

    // =========================================================
    // ETIQUETA
    // =========================================================

    const etiquetaRazonSocial = computed(() => {
        const tipo = String(frmCliente.tipo_persona || '')
            .trim()
            .toLowerCase();

        if (tipo === 'moral') {
            return 'Razón Social';
        }

        if (tipo === 'fisica') {
            return 'Nombre Completo';
        }

        return 'Razón Social / Nombre Completo';
    });

    // =========================================================
    // VALIDACIONES
    // =========================================================

    const rfcValido = computed(() => {
        if (!frmCliente.rfc) {
            return true;
        }

        return regex_rfc.test(frmCliente.rfc.trim());
    });

    const correoValido = computed(() => {
        if (!frmCliente.correo_electronico) {
            return true;
        }

        return regex_correo_electronico.test(frmCliente.correo_electronico.trim());
    });

    const codigoPostalValido = computed(() => {
        if (!frmCliente.codigo_postal) {
            return true;
        }

        return regex_codigo_postal.test(frmCliente.codigo_postal.trim());
    });

    const contactoPrincipalValido = computed(() => {
        if (!frmCliente.numero_contacto_principal) {
            return true;
        }

        return regex_telefono.test(frmCliente.numero_contacto_principal);
    });

    const botonGuardarDeshabilitado = computed(() => {
        if (
            !frmCliente.tipo_persona ||
            !frmCliente.rfc.trim() ||
            !frmCliente.razon_social_nombre_completo.trim() ||
            !frmCliente.calle.trim() ||
            !frmCliente.numero_ext.trim() ||
            !frmCliente.colonia.trim() ||
            !frmCliente.poblacion.trim() ||
            !frmCliente.municipio.trim() ||
            !frmCliente.codigo_postal.trim() ||
            !frmCliente.pais ||
            !frmCliente.estado ||
            !frmCliente.correo_electronico.trim() ||
            !frmCliente.numero_contacto_principal.trim() ||
            !frmCliente.regimen_fiscal ||
            !frmCliente.empresa_facturadora
        ) {
            return true;
        }

        if (!rfcValido.value || !correoValido.value || !codigoPostalValido.value || !contactoPrincipalValido.value) {
            return true;
        }

        return false;
    });

    // =========================================================
    // CAMBIO EMPRESA PRODUCTO SERVICIO
    // =========================================================

    const handleCambioEmpresaProdServ = () => {
        prodServ.value = '';

        if (!empresaProdServ.value) {
            catProdServ.value = [];

            return;
        }

        const empresa = companias.value.find((item) => String(item._id) === String(empresaProdServ.value));

        catProdServ.value = empresa?.prod_serv ?? [];
    };

    // =========================================================
    // CONCEPTOS SELECCIONADOS
    // =========================================================

    const prodServSeleccionados = computed(() => {
        return (frmCliente.prod_serv ?? [])

            .map((item) => {
                const empresa = companias.value.find((company) => String(company._id) === String(item.empresa_facturadora));

                const concepto = empresa?.prod_serv?.find((producto) => String(producto._id) === String(item.prod_serv));

                return {
                    ...concepto,

                    empresa_facturadora: item.empresa_facturadora,

                    empresa_nombre: empresa?.razon_social_nombre_completo ?? '',

                    prod_serv_id: item.prod_serv
                };
            })

            .filter((item) => item?._id);
    });

    // =========================================================
    // AGREGAR PRODUCTO SERVICIO
    // =========================================================

    const handleAgregarProdServ = () => {
        if (!empresaProdServ.value || !prodServ.value) {
            return;
        }

        const existe = frmCliente.prod_serv.some((item) => String(item.empresa_facturadora) === String(empresaProdServ.value) && String(item.prod_serv) === String(prodServ.value));

        if (existe) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'El concepto ya está agregado.',

                life: 3000
            });

            return;
        }

        frmCliente.prod_serv.push({
            empresa_facturadora: empresaProdServ.value,

            prod_serv: prodServ.value
        });

        prodServ.value = '';
    };

    // =========================================================
    // ELIMINAR CONCEPTO
    // =========================================================

    const handleEliminarProdServ = (rowData) => {
        frmCliente.prod_serv = frmCliente.prod_serv.filter((item) => !(String(item.empresa_facturadora) === String(rowData.empresa_facturadora) && String(item.prod_serv) === String(rowData.prod_serv_id)));
    };

    // =========================================================
    // OBJETO IMPUESTO
    // =========================================================

    const handleObjetoImpDesc = (rowData) => {
        if (!rowData?.objeto_imp) {
            return '';
        }

        return catalogoSat.value?.objeto_imp?.find((item) => item.objeto_imp === rowData.objeto_imp)?.descripcion ?? '';
    };

    // =========================================================
    // CIF - CARGAR EXISTENTE
    // =========================================================

    const handleCargarCIF = async (data) => {
        if (cifPreview.value) {
            URL.revokeObjectURL(cifPreview.value);

            cifPreview.value = null;
        }

        if (!data?.cif?._id || !data?.rfc) {
            return;
        }

        const res = await store.dispatch('api/apiGetblobSinCargando', {
            direccion: `/clientes/cif/${data.rfc}/${data.cif._id}`
        });

        if (res.estatus === 200 && res.data instanceof Blob) {
            cifPreview.value = URL.createObjectURL(res.data);
        }
    };

    // =========================================================
    // CIF - DIALOG
    // =========================================================

    const handleMostrarCIF = () => {
        cifArchivo.value = null;

        visibleCIF.value = true;
    };

    const handleCancelarCIF = () => {
        cifArchivo.value = null;

        visibleCIF.value = false;
    };

    const handleSeleccionarCIF = (event) => {
        const archivo = event.files?.[0];

        if (!archivo) {
            return;
        }

        if (archivo.type !== 'application/pdf') {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'El archivo CIF debe ser PDF.',

                life: 3000
            });

            return;
        }

        cifArchivo.value = archivo;
    };

    // =========================================================
    // GENERAR ID LOCAL CIF
    // =========================================================

    const generarIdCif = () => {
        if (crypto?.randomUUID) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    // =========================================================
    // GUARDAR CIF LOCAL EN FORMULARIO
    // =========================================================

    const handleGuardarCIF = () => {
        if (!cifArchivo.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Seleccione el archivo CIF.',

                life: 3000
            });

            return;
        }

        const idCif = frmCliente.cif?._id || generarIdCif();

        frmCliente.cif = {
            ...(frmCliente.cif ?? {}),
            _id: idCif
        };

        if (cifPreview.value) {
            URL.revokeObjectURL(cifPreview.value);
        }

        cifPreview.value = URL.createObjectURL(cifArchivo.value);

        visibleCIF.value = false;

        toast.add({
            severity: 'info',

            summary: 'Notificación',

            detail: 'Archivo CIF cargado correctamente.',

            life: 3000
        });
    };

    // =========================================================
    // NORMALIZAR TEXTO
    // =========================================================

    const handlePrepararCliente = () => {
        return {
            ...frmCliente,

            tipo_persona: frmCliente.tipo_persona?.toLowerCase() ?? '',

            rfc: frmCliente.rfc?.trim().toUpperCase() ?? '',

            razon_social_nombre_completo: frmCliente.razon_social_nombre_completo?.trim().toUpperCase() ?? '',

            calle: frmCliente.calle?.trim().toUpperCase() ?? '',

            numero_ext: frmCliente.numero_ext?.trim().toUpperCase() ?? '',

            numero_int: frmCliente.numero_int?.trim().toUpperCase() ?? '',

            colonia: frmCliente.colonia?.trim().toUpperCase() ?? '',

            poblacion: frmCliente.poblacion?.trim().toUpperCase() ?? '',

            municipio: frmCliente.municipio?.trim().toUpperCase() ?? '',

            codigo_postal: frmCliente.codigo_postal ?? '',

            pais: frmCliente.pais?.toUpperCase() ?? '',

            estado: frmCliente.estado?.toUpperCase() ?? '',

            correo_electronico: frmCliente.correo_electronico?.trim().toLowerCase() ?? '',

            numero_contacto_principal: frmCliente.numero_contacto_principal ?? '',

            numero_contacto_alterno: frmCliente.numero_contacto_alterno ?? '',

            regimen_fiscal: frmCliente.regimen_fiscal ?? '',

            promotor: frmCliente.promotor ?? '',

            empresa_facturadora: frmCliente.empresa_facturadora ?? '',

            prod_serv: frmCliente.prod_serv ?? [],

            cif: {
                ...(frmCliente.cif ?? {})
            }
        };
    };

    // =========================================================
    // GUARDAR CLIENTE
    // =========================================================

    const handleGuardar = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',

                summary: 'Notificación',

                detail: 'Complete correctamente los campos obligatorios.',

                life: 3000
            });

            return;
        }

        const datos = handlePrepararCliente();

        const formData = new FormData();

        Object.keys(datos).forEach((key) => {
            if (key === 'prod_serv') {
                formData.append('prod_serv', JSON.stringify(datos.prod_serv ?? []));

                return;
            }

            if (key === 'cif') {
                formData.append('cif', JSON.stringify(datos.cif ?? {}));

                return;
            }

            formData.append(key, datos[key] ?? '');
        });

        /*
         * El React enviaba el PDF CIF
         * dentro del mismo FormData.
         */
        if (cifArchivo.value instanceof File) {
            formData.append('archivo_cif', cifArchivo.value);
        }

        const accion = movimiento.value === 'N' ? 'api/apiPostTokenFormData' : 'api/apiPutTokenFormData';

        const res = await store.dispatch(accion, {
            direccion: `/clientes/`,

            formData: formData
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',

                summary: 'Notificación',

                detail: res.mensaje,

                life: 3000
            });

            return;
        }

        /*
         * Guardar logo después
         * del registro principal,
         * igual que en React.
         */
        if (logoArchivo.value) {
            const logoFormData = new FormData();

            logoFormData.append('logo', logoArchivo.value);

            const accionLogo = movimiento.value === 'N' ? 'api/apiPostTokenFormData' : 'api/apiPutTokenFormData';

            const resLogo = await store.dispatch(accionLogo, {
                direccion: `/clientes/logo/${frmCliente.rfc}`,

                formData: logoFormData
            });

            if (resLogo.estatus !== 200) {
                toast.add({
                    severity: 'warn',

                    summary: 'Notificación',

                    detail: resLogo.mensaje,

                    life: 3000
                });
            }
        }

        toast.add({
            severity: 'success',

            summary: 'Notificación',

            detail: res.mensaje,

            life: 3000
        });

        mostrarTablaFormulario.value = false;

        movimiento.value = '';

        handleLimpiarFormulario();

        await handleCargarClientes();
    };

    // =========================================================
    // INIT
    // =========================================================

    const handleInit = async () => {
        await Promise.all([handleCargarClientes(), handleCargarCatalogosSat(), handleCargarPromotores(), handleCargarCompanias()]);
    };

    handleInit();

    const botonGuardarAccesoDeshabilitado = computed(() => {
        if (!frmCliente._id) {
            return true;
        }

        if (!frmAccesoCliente.usuario.trim()) {
            return true;
        }

        /*
         * Si todavía no existe acceso,
         * la contraseña sí es obligatoria.
         */
        if (!accesoClienteExiste.value && !frmAccesoCliente.password.trim()) {
            return true;
        }

        return false;
    });

    const handleCargarAccesoCliente = async (clientId) => {
        frmAccesoCliente.usuario = '';
        frmAccesoCliente.password = '';
        frmAccesoCliente.activo = false;

        accesoClienteExiste.value = false;

        if (!clientId) {
            return;
        }

        const res = await store.dispatch('api/apiGetTokenSinCargando', {
            direccion: `/clientes/acceso/${clientId}`
        });

        /*
         * Si no existe acceso todavía,
         * no es realmente un error para la pantalla.
         */
        if (res.estatus === 404) {
            return;
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

        const acceso = res.datos?.acceso ?? null;

        if (!acceso) {
            return;
        }

        accesoClienteExiste.value = true;

        frmAccesoCliente.usuario = acceso.usuario ?? '';

        frmAccesoCliente.password = '';

        frmAccesoCliente.activo = acceso.activo === true;
    };

    const handleGuardarAccesoCliente = async () => {
        if (botonGuardarAccesoDeshabilitado.value) {
            return;
        }

        const payload = {
            client_id: frmCliente._id,
            usuario: frmAccesoCliente.usuario.trim().toLowerCase(),
            password: frmAccesoCliente.password,
            activo: frmAccesoCliente.activo
        };

        const accion = accesoClienteExiste.value ? 'api/apiPutToken' : 'api/apiPostToken';

        const res = await store.dispatch(accion, {
            direccion: '/clientes/acceso',
            datosJson: payload
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });

            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Notificación',
            detail: res.mensaje,
            life: 3000
        });

        frmAccesoCliente.password = '';

        await handleCargarAccesoCliente(frmCliente._id);
    };

    const urlAccesoCliente = computed(() => {
        if (!frmCliente._id) {
            return '';
        }

        return `${window.location.origin}/clientes/acceso/${frmCliente._id}`;
    });

    const handleCopiarRutaAcceso = async () => {
        if (!urlAccesoCliente.value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(urlAccesoCliente.value);

            toast.add({
                severity: 'success',
                summary: 'Notificación',
                detail: 'Ruta de acceso copiada.',
                life: 3000
            });
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: 'No fue posible copiar la ruta.',
                life: 3000
            });
        }
    };

    return {
        // GENERAL
        mostrarTablaFormulario,
        movimiento,

        tablaClientes,

        frmCliente,

        // FILTRO
        filtros,

        // CATÁLOGOS
        catalogoSat,
        promotores,
        companias,

        estadosFiltrados,
        regimenFiscalFiltrado,

        etiquetaRazonSocial,

        // VALIDACIONES
        rfcValido,
        correoValido,
        codigoPostalValido,
        contactoPrincipalValido,

        botonGuardarDeshabilitado,

        // LOGO
        logosClientes,
        logoArchivo,
        logoPreview,
        logoInput,

        // CONCEPTOS
        empresaProdServ,
        prodServ,
        catProdServ,

        prodServSeleccionados,

        // CIF
        visibleCIF,
        cifArchivo,
        cifPreview,

        // GENERAL
        handleMostrarFormulario,
        handleGuardar,
        handleLimpiarFiltro,

        // LOGO
        handleAbrirLogo,
        handleSeleccionarLogo,

        // CONCEPTOS
        handleCambioEmpresaProdServ,
        handleAgregarProdServ,
        handleEliminarProdServ,
        handleObjetoImpDesc,

        // CIF
        handleMostrarCIF,
        handleCancelarCIF,
        handleSeleccionarCIF,
        handleGuardarCIF,

        // ACCESO CLIENTE
        frmAccesoCliente,
        accesoClienteExiste,
        botonGuardarAccesoDeshabilitado,

        handleCargarAccesoCliente,
        handleGuardarAccesoCliente,
        urlAccesoCliente,
        handleCopiarRutaAcceso
    };
};

export default useProceso;
