import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const frmSolicitudInit = () => ({
    company_id: '',
    bank_id: '',
    concepto_id: '',

    uso_cfdi: 'G03',
    metodo_pago: 'PPD',
    forma_pago: '99',

    fecha_factura: new Date(),

    cantidad: 0,
    valor_unitario: 0,
    importe: 0,

    archivo_adjunto: null,
    archivo_adjunto_nombre: '',

    conceptos: []
});

const useProceso = () => {
    const store = useStore();
    const toast = useToast();
    const router = useRouter();
    const route = useRoute();

    const frmSolicitud = reactive(frmSolicitudInit());

    const companias = ref([]);
    const conceptos = ref([]);
    const bancos = ref([]);

    const usoCfdi = ref([]);
    const metodoPago = ref([]);
    const formaPago = ref([]);

    const archivoAdjuntoRef = ref(null);

    const clientId = route.params.clientId;

    // ============================================================
    // AUXILIARES
    // ============================================================

    const notificar = (severity, detail) => {
        toast.add({
            severity,
            summary: 'Notificación',
            detail,
            life: 3000
        });
    };

    const redondear = (valor, decimales = 4) => Number((Number(valor) || 0).toFixed(decimales));

    const normalizarTasa = (tasa) => {
        const valor = Number(tasa) || 0;
        return valor > 1 ? valor / 100 : valor;
    };

    const calcularImporte = (cantidad, valorUnitario) => redondear((Number(cantidad) || 0) * (Number(valorUnitario) || 0), 4);

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (valor) => String(valor).padStart(2, '0');

        return `${fecha.getFullYear()}-` + `${pad(fecha.getMonth() + 1)}-` + `${pad(fecha.getDate())}T` + `${pad(fecha.getHours())}:` + `${pad(fecha.getMinutes())}:` + `${pad(fecha.getSeconds())}`;
    };

    // ============================================================
    // SESION
    // ============================================================

    const handleValidarSesion = () => {
        const token = localStorage.getItem('token_cliente');

        const clienteGuardado = localStorage.getItem('client_id');

        if (!token || !clienteGuardado || clienteGuardado !== clientId) {
            router.replace({
                name: 'cliente_acceso',
                params: {
                    clientId
                }
            });

            return false;
        }

        return true;
    };

    // ============================================================
    // IMPUESTOS
    // ============================================================

    const calcularImpuestosConcepto = (concepto, importeBase) => {
        const base = redondear(importeBase, 4);

        const traslado = (concepto.impuestos?.traslado ?? []).map((imp) => {
            const tasa = normalizarTasa(imp.tasa);

            return {
                ...imp,
                base,
                tasa,
                importe: redondear(base * tasa, 4)
            };
        });

        const retencion = (concepto.impuestos?.retencion ?? []).map((imp) => {
            const tasa = normalizarTasa(imp.tasa);

            return {
                ...imp,
                base,
                tasa,
                importe: redondear(base * tasa, 4)
            };
        });

        const totalTraslados = redondear(
            traslado.reduce((sum, item) => sum + Number(item.importe || 0), 0),
            4
        );

        const totalRetenciones = redondear(
            retencion.reduce((sum, item) => sum + Number(item.importe || 0), 0),
            4
        );

        return {
            traslado,
            retencion,
            total_traslados: totalTraslados,
            total_retenciones: totalRetenciones
        };
    };

    // ============================================================
    // TOTALES
    // ============================================================

    const totalesSolicitud = computed(() => {
        const subtotal = redondear(
            frmSolicitud.conceptos.reduce((sum, item) => sum + Number(item.importe || 0), 0),
            4
        );

        const traslados = redondear(
            frmSolicitud.conceptos.reduce((sum, item) => sum + Number(item.total_traslados || 0), 0),
            4
        );

        const retenciones = redondear(
            frmSolicitud.conceptos.reduce((sum, item) => sum + Number(item.total_retenciones || 0), 0),
            4
        );

        const total = redondear(subtotal + traslados - retenciones, 4);

        return {
            subtotal,
            traslados,
            retenciones,
            total
        };
    });

    // ============================================================
    // EMPRESAS
    // ============================================================

    const handleCargarCompanias = async () => {
        const res = await store.dispatch('api/apiGetTokenCliente', {
            direccion: '/clientes/portal/empresas',
            clientId
        });

        if (res.estatus === 200) {
            companias.value = res.datos?.companias ?? [];

            return;
        }

        companias.value = [];

        notificar('error', res.mensaje || 'No fue posible consultar las empresas.');
    };

    // ============================================================
    // CATALOGOS
    // ============================================================

    const handleCargarCatalogos = async () => {
        const res = await store.dispatch('api/apiGetTokenCliente', {
            direccion: '/clientes/portal/solicitud/catalogos',

            clientId
        });

        console.log('CATALOGOS:', res);

        if (res.estatus !== 200) {
            usoCfdi.value = [];
            metodoPago.value = [];
            formaPago.value = [];

            notificar('error', res.mensaje || 'No fue posible consultar los catálogos SAT.');

            return;
        }

        usoCfdi.value = (res.datos?.uso_cfdi ?? []).map((item) => ({
            ...item,

            descripcion_mostrar: `${item.uso_cfdi} - ${item.descripcion}`
        }));

        metodoPago.value = res.datos?.metodo_pago ?? [];

        formaPago.value = res.datos?.forma_pago ?? [];
    };

    // ============================================================
    // CONCEPTOS
    // ============================================================

    const handleCargarConceptos = async () => {
        conceptos.value = [];

        if (!frmSolicitud.company_id) {
            return;
        }

        const res = await store.dispatch('api/apiGetTokenCliente', {
            direccion: `/clientes/portal/conceptos/${frmSolicitud.company_id}`,
            clientId
        });

        if (res.estatus === 200) {
            conceptos.value = res.datos?.conceptos ?? [];

            return;
        }

        notificar('error', res.mensaje || 'No fue posible consultar los conceptos.');
    };

    // ============================================================
    // BANCOS
    // ============================================================

    const handleCargarBancos = async () => {
        bancos.value = [];

        if (!frmSolicitud.company_id) {
            return;
        }

        const res = await store.dispatch('api/apiGetTokenCliente', {
            direccion: `/clientes/portal/solicitud/bancos/${frmSolicitud.company_id}`,
            clientId
        });

        if (res.estatus === 200) {
            bancos.value = res.datos?.bancos ?? [];

            return;
        }

        notificar('error', res.mensaje || 'No fue posible consultar las cuentas bancarias.');
    };

    // ============================================================
    // CAMBIO EMPRESA
    // ============================================================

    const handleCambioCompania = async () => {
        frmSolicitud.bank_id = '';
        frmSolicitud.concepto_id = '';

        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;

        frmSolicitud.conceptos = [];

        conceptos.value = [];
        bancos.value = [];

        await Promise.all([handleCargarConceptos(), handleCargarBancos()]);
    };

    const handleCambioConcepto = () => {
        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;
    };

    // ============================================================
    // IMPORTE
    // ============================================================

    const handleCalcularImporte = () => {
        frmSolicitud.importe = calcularImporte(frmSolicitud.cantidad, frmSolicitud.valor_unitario);
    };

    // ============================================================
    // AGREGAR CONCEPTO
    // ============================================================

    const handleAgregarConcepto = () => {
        const conceptoSeleccionado = conceptos.value.find((item) => item._id === frmSolicitud.concepto_id);

        if (!conceptoSeleccionado) {
            notificar('warn', 'Selecciona un concepto.');

            return;
        }

        const cantidad = Number(frmSolicitud.cantidad);

        const valorUnitario = Number(frmSolicitud.valor_unitario);

        if (cantidad <= 0) {
            notificar('warn', 'La cantidad debe ser mayor a 0.');

            return;
        }

        if (valorUnitario <= 0) {
            notificar('warn', 'El valor unitario debe ser mayor a 0.');

            return;
        }

        const importe = calcularImporte(cantidad, valorUnitario);

        const impuestosCalculados = calcularImpuestosConcepto(conceptoSeleccionado, importe);

        /*
         * IMPORTANTE:
         * _id debe conservar el id REAL
         * del concepto de Mongo.
         *
         * Python valida este _id contra
         * clientes_prod_serv.
         */
        const nuevoConcepto = {
            _id: conceptoSeleccionado._id,

            company_id: frmSolicitud.company_id,

            prod_serv: conceptoSeleccionado.prod_serv,

            descripcion_sat: conceptoSeleccionado.descripcion_sat,

            descripcion: conceptoSeleccionado.descripcion,

            cuenta_predial: conceptoSeleccionado.cuenta_predial,

            clave_unidad: conceptoSeleccionado.clave_unidad,

            unidad: conceptoSeleccionado.unidad,

            objeto_imp: conceptoSeleccionado.objeto_imp,

            num_uso: conceptoSeleccionado.num_uso,

            cantidad,
            valor_unitario: valorUnitario,
            importe,
            descuento: 0,

            impuestos: {
                traslado: impuestosCalculados.traslado,

                retencion: impuestosCalculados.retencion
            },

            total_traslados: impuestosCalculados.total_traslados,

            total_retenciones: impuestosCalculados.total_retenciones,

            total: redondear(importe + impuestosCalculados.total_traslados - impuestosCalculados.total_retenciones, 4)
        };

        frmSolicitud.conceptos.push(nuevoConcepto);

        frmSolicitud.concepto_id = '';

        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;
    };

    const handleEliminarConcepto = (indice) => {
        frmSolicitud.conceptos.splice(indice, 1);
    };

    // ============================================================
    // ARCHIVO
    // ============================================================

    const handleArchivoAdjunto = (event) => {
        const archivo = event.files?.[0] ?? null;

        frmSolicitud.archivo_adjunto = archivo;

        frmSolicitud.archivo_adjunto_nombre = archivo?.name ?? '';
    };

    const handleQuitarArchivoAdjunto = () => {
        archivoAdjuntoRef.value?.clear();

        frmSolicitud.archivo_adjunto = null;

        frmSolicitud.archivo_adjunto_nombre = '';
    };

    // ============================================================
    // FECHA
    // ============================================================

    const fechaFacturaMinima = computed(() => {
        const fecha = new Date();

        fecha.setHours(fecha.getHours() - 72);

        return fecha;
    });

    const fechaFacturaMaxima = computed(() => new Date());

    const handleValidarFecha = () => {
        if (!frmSolicitud.fecha_factura) {
            return;
        }

        const ahora = new Date();

        const minimo = new Date();

        minimo.setHours(minimo.getHours() - 72);

        if (frmSolicitud.fecha_factura < minimo) {
            notificar('warn', 'Solo puedes seleccionar una fecha dentro de las últimas 72 horas.');

            frmSolicitud.fecha_factura = new Date();

            return;
        }

        if (frmSolicitud.fecha_factura > ahora) {
            notificar('warn', 'No puedes seleccionar una fecha u hora posterior a la actual.');

            frmSolicitud.fecha_factura = new Date();
        }
    };

    // ============================================================
    // VALIDACIONES
    // ============================================================

    const companiaValida = computed(() => Boolean(frmSolicitud.company_id));

    const bancoValido = computed(() => Boolean(frmSolicitud.bank_id));

    const cantidadValida = computed(() => {
        if (!frmSolicitud.concepto_id) {
            return true;
        }

        return Number(frmSolicitud.cantidad) > 0;
    });

    const valorUnitarioValido = computed(() => {
        if (!frmSolicitud.concepto_id) {
            return true;
        }

        return Number(frmSolicitud.valor_unitario) > 0;
    });

    const puedeAgregarConcepto = computed(() => Boolean(frmSolicitud.concepto_id) && Number(frmSolicitud.cantidad) > 0 && Number(frmSolicitud.valor_unitario) > 0);

    const botonGuardarDeshabilitado = computed(
        () => !frmSolicitud.company_id || !frmSolicitud.bank_id || !frmSolicitud.uso_cfdi || !frmSolicitud.metodo_pago || !frmSolicitud.forma_pago || !frmSolicitud.fecha_factura || !frmSolicitud.conceptos.length
    );

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleGuardarSolicitud = async () => {
        if (botonGuardarDeshabilitado.value) {
            notificar('warn', 'Complete la información requerida y agregue al menos un concepto.');

            return;
        }

        const payload = {
            company_id: frmSolicitud.company_id,

            bank_id: frmSolicitud.bank_id,

            uso_cfdi: frmSolicitud.uso_cfdi,

            metodo_pago: frmSolicitud.metodo_pago,

            forma_pago: frmSolicitud.forma_pago,

            fecha_factura: formatFechaLocal(frmSolicitud.fecha_factura),

            conceptos: frmSolicitud.conceptos,

            subtotal: totalesSolicitud.value.subtotal,

            traslados: totalesSolicitud.value.traslados,

            retenciones: totalesSolicitud.value.retenciones,

            total: totalesSolicitud.value.total
        };

        const formData = new FormData();

        formData.append('data', JSON.stringify(payload));

        if (frmSolicitud.archivo_adjunto) {
            formData.append('archivo_adjunto', frmSolicitud.archivo_adjunto);
        }

        const res = await store.dispatch('api/apiPostTokenClienteFormData', {
            direccion: '/clientes/portal/solicitud',

            formData,

            clientId
        });

        if (res.estatus !== 200) {
            notificar('error', res.mensaje || 'Error al guardar la solicitud.');

            return;
        }

        notificar('success', res.mensaje || 'Solicitud guardada correctamente.');

        Object.assign(frmSolicitud, frmSolicitudInit());

        conceptos.value = [];
        bancos.value = [];

        archivoAdjuntoRef.value?.clear();
    };

    // ============================================================
    // AUXILIARES VISTA
    // ============================================================

    const handleBancoSeleccionado = (idBanco) => {
        const banco = bancos.value.find((item) => item._id === idBanco);

        if (!banco) {
            return 'Selecciona cuenta';
        }

        return `${banco.banco} - ` + `${banco.cuenta_banco}`;
    };

    const handleMoney4 = (valor) => `$${Number(valor || 0).toFixed(4)}`;

    const handleRegresar = () => {
        router.push({
            name: 'cliente_portal',

            params: {
                clientId
            }
        });
    };

    // ============================================================
    // INIT
    // ============================================================

    const handleInit = async () => {
        if (!handleValidarSesion()) {
            return;
        }

        await Promise.all([handleCargarCompanias(), handleCargarCatalogos()]);
    };

    handleInit();

    return {
        frmSolicitud,

        companias,
        conceptos,
        bancos,

        usoCfdi,
        metodoPago,
        formaPago,

        archivoAdjuntoRef,

        totalesSolicitud,

        fechaFacturaMinima,
        fechaFacturaMaxima,

        companiaValida,
        bancoValido,
        cantidadValida,
        valorUnitarioValido,

        puedeAgregarConcepto,
        botonGuardarDeshabilitado,

        handleCambioCompania,
        handleCambioConcepto,
        handleCalcularImporte,

        handleAgregarConcepto,
        handleEliminarConcepto,

        handleArchivoAdjunto,
        handleQuitarArchivoAdjunto,

        handleValidarFecha,

        handleGuardarSolicitud,

        handleBancoSeleccionado,
        handleMoney4,

        handleRegresar
    };
};

export default useProceso;
