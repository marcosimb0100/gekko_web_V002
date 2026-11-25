import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';

const frmSolicitudInit = (usoCfdi = 'G03') => ({
    _id: '',

    company_id: '',
    client_id: '',
    concepto_id: '',
    bank_id: '',

    uso_cfdi: usoCfdi,
    metodo_pago: 'PPD',
    forma_pago: '99',

    fecha_factura: new Date(),

    cantidad: 0,
    valor_unitario: 0,
    importe: 0,

    archivo_adjunto: null,
    archivo_adjunto_nombre: '',

    conceptos: [],
    anticipos: []
});

const useProceso = (modoNota = false) => {
    const store = useStore();
    const toast = useToast();

    const frmSolicitud = reactive(frmSolicitudInit(modoNota ? 'G02' : 'G03'));

    const clientes = ref([]);
    const companias = ref([]);
    const conceptos = ref([]);
    const bancos = ref([]);

    const usoCfdi = ref([]);
    const metodoPago = ref([]);
    const formaPago = ref([]);

    const archivoAdjuntoRef = ref(null);
    const dialogoAnticipos = ref(false);
    const busquedaAnticipos = ref('');
    const resultadosAnticipos = ref([]);
    const seleccionAnticipos = ref([]);
    const buscandoAnticipos = ref(false);
    const errorAnticipos = ref('');
    let consultaAnticipos = 0;

    const tiposNota = [
        { value: 'E', label: 'E - Egreso (nota de crédito)' },
        { value: 'E_ANTICIPO', label: 'E - Egreso (aplicación de anticipo)' },
        { value: 'I', label: 'I - Ingreso (nota de débito)' }
    ];
    const tipoNota = ref('E');
    const esNotaPorAnticipo = computed(() => modoNota && tipoNota.value === 'E_ANTICIPO');
    const claveRelacionPorTipoNota = { E: '01', E_ANTICIPO: '07', I: '02' };
    const relacionNota = computed(() => claveRelacionPorTipoNota[tipoNota.value]);
    const formasPagoDisponibles = computed(() => modoNota && !esNotaPorAnticipo.value
        ? formaPago.value.filter(({ forma_pago }) => forma_pago !== '30')
        : formaPago.value);
    let datosPagoAnteriores;

    watch(tipoNota, () => {
        consultaAnticipos++;
        frmSolicitud.anticipos = [];
        seleccionAnticipos.value = [];
        dialogoAnticipos.value = false;
        buscandoAnticipos.value = false;

        if (esNotaPorAnticipo.value) {
            datosPagoAnteriores = {
                uso_cfdi: frmSolicitud.uso_cfdi,
                metodo_pago: frmSolicitud.metodo_pago,
                forma_pago: frmSolicitud.forma_pago
            };
            Object.assign(frmSolicitud, { uso_cfdi: 'G02', metodo_pago: 'PUE', forma_pago: '30' });
        } else {
            if (datosPagoAnteriores) {
                Object.assign(frmSolicitud, datosPagoAnteriores);
                datosPagoAnteriores = undefined;
            }
            frmSolicitud.uso_cfdi = tipoNota.value === 'E' ? 'G02' : 'G03';
        }
    });
    const catalogoRelaciones = ref([]);
    const relacionesNota = computed(() => catalogoRelaciones.value
        .filter(({ clave }) => clave === relacionNota.value)
        .map(({ clave, descripcion }) => ({ value: clave, label: clave + ' - ' + descripcion })));
    const cargandoRelacionesNota = ref(false);
    const errorRelacionesNota = ref('');

    const cargarRelacionesNota = async () => {
        if (catalogoRelaciones.value.length || cargandoRelacionesNota.value) return;
        cargandoRelacionesNota.value = true;
        errorRelacionesNota.value = '';
        try {
            const res = await store.dispatch('api/apiGetToken', { direccion: '/sat/sat_tipo_relacion' });
            const datos = res.datos?.tipos_relacion;
            if (res.estatus !== 200 || !Array.isArray(datos) || !Object.values(claveRelacionPorTipoNota).every((clave) => datos.some((tipo) => tipo.clave === clave))) {
                throw new Error('Catalogo incompleto');
            }
            catalogoRelaciones.value = datos;
        } catch {
            errorRelacionesNota.value = 'No se pudo consultar el catálogo de tipos de relación.';
        } finally {
            cargandoRelacionesNota.value = false;
        }
    };

    const buscarAnticipos = async () => {
        const consulta = ++consultaAnticipos;
        const { client_id, company_id } = frmSolicitud;
        const q = encodeURIComponent(busquedaAnticipos.value.trim());
        buscandoAnticipos.value = true;
        resultadosAnticipos.value = [];
        errorAnticipos.value = '';
        try {
            const res = await store.dispatch('api/apiGetToken', {
                direccion: `/solicitud_detallada/${modoNota ? 'facturas_relacionables' : 'anticipos'}/${client_id}/${company_id}?q=${q}`
            });
            if (consulta !== consultaAnticipos) return;
            if (res.estatus === 200) {
                resultadosAnticipos.value = res.datos?.[modoNota ? 'facturas' : 'anticipos'] ?? [];
            } else {
                errorAnticipos.value = res.mensaje || (modoNota ? 'No se pudieron consultar las facturas.' : 'No se pudieron consultar los anticipos.');
            }
        } catch {
            if (consulta === consultaAnticipos) errorAnticipos.value = (modoNota ? 'No se pudieron consultar las facturas.' : 'No se pudieron consultar los anticipos.');
        } finally {
            if (consulta === consultaAnticipos) buscandoAnticipos.value = false;
        }
    };

    const abrirAnticipos = () => {
        seleccionAnticipos.value = [...frmSolicitud.anticipos];
        busquedaAnticipos.value = '';
        dialogoAnticipos.value = true;
        if (modoNota) cargarRelacionesNota();
        buscarAnticipos();
    };

    const anticipoSeleccionado = (uuid) => seleccionAnticipos.value.some((anticipo) => anticipo.uuid === uuid);

    const alternarAnticipo = (anticipo) => {
        if (anticipoSeleccionado(anticipo.uuid)) {
            seleccionAnticipos.value = seleccionAnticipos.value.filter(({ uuid }) => uuid !== anticipo.uuid);
        } else {
            seleccionAnticipos.value.push(anticipo);
        }
    };

    const aplicarAnticipos = () => {
        frmSolicitud.anticipos = [...seleccionAnticipos.value];
        dialogoAnticipos.value = false;
    };

    const redondear = (valor, decimales = 4) => {
        return Number((Number(valor) || 0).toFixed(decimales));
    };

    const normalizarTasa = (tasa) => {
        const valor = Number(tasa) || 0;

        return valor > 1 ? valor / 100 : valor;
    };

    const calcularImporte = (cantidad, valorUnitario) => {
        return redondear((Number(cantidad) || 0) * (Number(valorUnitario) || 0), 4);
    };

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

    // -------------------------------------------------------------------------
    // CLIENTES
    // -------------------------------------------------------------------------

    const handleCargarClientes = async () => {
        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/clientes/`
        });

        if (res.estatus === 200) {
            clientes.value = res.datos?.clientes ?? [];
        } else {
            clientes.value = [];

            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje,
                life: 3000
            });
        }
    };

    // -------------------------------------------------------------------------
    // SAT
    // -------------------------------------------------------------------------

    const handleCargarCatalogosSat = async () => {
        const [resUso, resMetodo, resForma] = await Promise.all([
            store.dispatch('api/apiGetToken', {
                direccion: `/sat/sat_uso_cfdi`
            }),

            store.dispatch('api/apiGetToken', {
                direccion: `/sat/sat_metodo_pago`
            }),

            store.dispatch('api/apiGetToken', {
                direccion: `/sat/sat_forma_pago`
            })
        ]);

        if (resUso.estatus === 200) {
            usoCfdi.value = (resUso.datos?.uso_cfdi ?? []).map((item) => ({
                ...item,

                descripcion_mostrar: `${item.uso_cfdi} - ${item.descripcion}`
            }));
        } else {
            usoCfdi.value = [];
        }

        metodoPago.value = resMetodo.estatus === 200 ? (resMetodo.datos?.metodo_pago ?? []) : [];

        formaPago.value = resForma.estatus === 200 ? (resForma.datos?.forma_pago ?? []) : [];
    };

    // -------------------------------------------------------------------------
    // EMPRESAS POR CLIENTE
    // -------------------------------------------------------------------------

    const handleCargarCompanias = async () => {
        companias.value = [];

        if (!frmSolicitud.client_id) {
            return;
        }

        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/solicitud_detallada/por_cliente/${frmSolicitud.client_id}`
        });

        if (res.estatus === 200) {
            companias.value = res.datos?.companias ?? [];
        }
    };

    // -------------------------------------------------------------------------
    // CONCEPTOS
    // -------------------------------------------------------------------------

    const handleCargarConceptos = async () => {
        conceptos.value = [];

        if (!frmSolicitud.client_id || !frmSolicitud.company_id) {
            return;
        }

        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/solicitud_detallada/conceptos/${frmSolicitud.client_id}/${frmSolicitud.company_id}`
        });

        if (res.estatus === 200) {
            conceptos.value = res.datos?.conceptos ?? [];
        }
    };

    // -------------------------------------------------------------------------
    // BANCOS
    // -------------------------------------------------------------------------

    const handleCargarBancos = async () => {
        bancos.value = [];

        if (!frmSolicitud.company_id) {
            return;
        }

        const res = await store.dispatch('api/apiGetToken', {
            direccion: `/solicitud_detallada/bancos/${frmSolicitud.company_id}`
        });

        if (res.estatus === 200) {
            bancos.value = res.datos?.bancos ?? [];
        }
    };

    // -------------------------------------------------------------------------
    // CAMBIOS DEPENDIENTES
    // -------------------------------------------------------------------------

    const handleCambioCliente = async () => {
        frmSolicitud.anticipos = [];
        frmSolicitud.company_id = '';
        frmSolicitud.concepto_id = '';
        frmSolicitud.bank_id = '';

        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;

        frmSolicitud.conceptos = [];

        companias.value = [];
        conceptos.value = [];
        bancos.value = [];

        await handleCargarCompanias();
    };

    const handleCambioCompania = async () => {
        frmSolicitud.anticipos = [];
        frmSolicitud.concepto_id = '';
        frmSolicitud.bank_id = '';

        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;

        frmSolicitud.conceptos = [];

        conceptos.value = [];
        bancos.value = [];

        await Promise.all([handleCargarConceptos(), modoNota ? undefined : handleCargarBancos()]);
    };

    const handleCambioConcepto = () => {
        frmSolicitud.cantidad = 0;
        frmSolicitud.valor_unitario = 0;
        frmSolicitud.importe = 0;
    };

    // -------------------------------------------------------------------------
    // IMPORTE
    // -------------------------------------------------------------------------

    const handleCalcularImporte = () => {
        frmSolicitud.importe = calcularImporte(frmSolicitud.cantidad, frmSolicitud.valor_unitario);
    };

    // -------------------------------------------------------------------------
    // AGREGAR CONCEPTO
    // -------------------------------------------------------------------------

    const handleAgregarConcepto = () => {
        const conceptoSeleccionado = conceptos.value.find((item) => item._id === frmSolicitud.concepto_id);

        if (!conceptoSeleccionado) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Selecciona un concepto.',
                life: 3000
            });

            return;
        }

        if (Number(frmSolicitud.cantidad) <= 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'La cantidad debe ser mayor a 0.',
                life: 3000
            });

            return;
        }

        if (Number(frmSolicitud.valor_unitario) <= 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'El valor unitario debe ser mayor a 0.',
                life: 3000
            });

            return;
        }

        const cantidad = Number(frmSolicitud.cantidad);

        const valorUnitario = Number(frmSolicitud.valor_unitario);

        const importe = calcularImporte(cantidad, valorUnitario);

        const impuestosCalculados = calcularImpuestosConcepto(conceptoSeleccionado, importe);

        const nuevoConcepto = {
            _id: crypto.randomUUID(),

            company_id: frmSolicitud.company_id,

            concepto_id: conceptoSeleccionado._id,

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

    const handleEliminarConcepto = (id) => {
        frmSolicitud.conceptos = frmSolicitud.conceptos.filter((item) => item._id !== id);
    };

    // -------------------------------------------------------------------------
    // ARCHIVO
    // -------------------------------------------------------------------------

    const handleArchivoAdjunto = (event) => {
        const archivo = event.files?.[0] ?? null;

        frmSolicitud.archivo_adjunto = archivo;

        frmSolicitud.archivo_adjunto_nombre = archivo?.name ?? '';
    };

    const handleQuitarArchivoAdjunto = () => {
        if (archivoAdjuntoRef.value) {
            archivoAdjuntoRef.value.clear();
        }

        frmSolicitud.archivo_adjunto = null;

        frmSolicitud.archivo_adjunto_nombre = '';
    };

    // -------------------------------------------------------------------------
    // FECHA
    // -------------------------------------------------------------------------

    const fechaFacturaMinima = computed(() => {
        const fecha = new Date();

        fecha.setHours(fecha.getHours() - 72);

        return fecha;
    });

    const fechaFacturaMaxima = computed(() => {
        return new Date();
    });

    const handleValidarFecha = () => {
        if (!frmSolicitud.fecha_factura) {
            return;
        }

        const ahora = new Date();

        const minimo = new Date();

        minimo.setHours(minimo.getHours() - 96);

        if (frmSolicitud.fecha_factura < minimo) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Solo puedes seleccionar una fecha dentro de las últimas 72 horas.',
                life: 3000
            });

            frmSolicitud.fecha_factura = new Date();

            return;
        }

        if (frmSolicitud.fecha_factura > ahora) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'No puedes seleccionar una fecha u hora posterior a la actual.',
                life: 3000
            });

            frmSolicitud.fecha_factura = new Date();
        }
    };

    const formatFechaLocal = (fecha) => {
        if (!fecha) {
            return null;
        }

        const pad = (n) => String(n).padStart(2, '0');

        return `${fecha.getFullYear()}-` + `${pad(fecha.getMonth() + 1)}-` + `${pad(fecha.getDate())}T` + `${pad(fecha.getHours())}:` + `${pad(fecha.getMinutes())}:` + `${pad(fecha.getSeconds())}`;
    };

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    const clienteValido = computed(() => Boolean(frmSolicitud.client_id));

    const companiaValida = computed(() => Boolean(frmSolicitud.company_id));

    const bancoValido = computed(() => Boolean(frmSolicitud.bank_id));

    const conceptoValido = computed(() => {
        if (!frmSolicitud.concepto_id) {
            return true;
        }

        return true;
    });

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

    const puedeAgregarConcepto = computed(() => {
        return Boolean(frmSolicitud.concepto_id) && Number(frmSolicitud.cantidad) > 0 && Number(frmSolicitud.valor_unitario) > 0;
    });

    const guardandoNota = ref(false);
    const botonGuardarDeshabilitado = computed(() => {
        if (modoNota && (!frmSolicitud.anticipos.length || guardandoNota.value)) return true;
        if (!frmSolicitud.client_id) return true;

        if (!frmSolicitud.company_id) return true;

        if (!modoNota && !frmSolicitud.bank_id) return true;

        if (!frmSolicitud.uso_cfdi) return true;

        if (!frmSolicitud.metodo_pago) return true;

        if (!frmSolicitud.forma_pago) return true;

        if (!frmSolicitud.fecha_factura) return true;

        if (!frmSolicitud.conceptos.length) return true;

        return false;
    });

    // -------------------------------------------------------------------------
    // GUARDAR
    // -------------------------------------------------------------------------

    const handleGuardarSolicitud = async () => {
        if (botonGuardarDeshabilitado.value) {
            toast.add({
                severity: 'warn',
                summary: 'Notificación',
                detail: 'Complete la información requerida y agregue al menos un concepto.',
                life: 3000
            });

            return;
        }

        const payload = {
            client_id: frmSolicitud.client_id,

            company_id: frmSolicitud.company_id,

            bank_id: frmSolicitud.bank_id,

            uso_cfdi: frmSolicitud.uso_cfdi,

            metodo_pago: frmSolicitud.metodo_pago,

            forma_pago: frmSolicitud.forma_pago,

            fecha_factura: formatFechaLocal(frmSolicitud.fecha_factura),

            conceptos: frmSolicitud.conceptos,
            anticipos_uuids: frmSolicitud.anticipos.map(({ uuid }) => uuid),

            subtotal: totalesSolicitud.value.subtotal,

            traslados: totalesSolicitud.value.traslados,

            retenciones: totalesSolicitud.value.retenciones,

            total: totalesSolicitud.value.total
        };

        if (modoNota) {
            guardandoNota.value = true;
            try {
                const res = await store.dispatch('api/apiPostToken', {
                    direccion: '/solicitud_detallada/notas',
                    datosJson: { ...payload, tipo_nota: tipoNota.value, uuids_relacionados: payload.anticipos_uuids }
                });
                if (res.estatus !== 200) throw new Error(res.mensaje || 'No se pudo guardar la nota.');
                toast.add({ severity: 'success', summary: 'Solicitud Nota', detail: res.mensaje, life: 3500 });
                Object.assign(frmSolicitud, frmSolicitudInit(tipoNota.value === 'I' ? 'G03' : 'G02'));
                if (esNotaPorAnticipo.value) Object.assign(frmSolicitud, { metodo_pago: 'PUE', forma_pago: '30' });
                companias.value = [];
                conceptos.value = [];
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Solicitud Nota', detail: error.message, life: 4000 });
            } finally {
                guardandoNota.value = false;
            }
            return;
        }

        const formData = new FormData();

        formData.append('data', JSON.stringify(payload));

        if (frmSolicitud.archivo_adjunto) {
            formData.append('archivo_adjunto', frmSolicitud.archivo_adjunto);
        }

        const res = await store.dispatch('api/apiPostTokenFormData', {
            direccion: `/solicitud_detallada/guardar`,

            formData
        });

        if (res.estatus !== 200) {
            toast.add({
                severity: 'error',
                summary: 'Notificación',
                detail: res.mensaje ?? 'Error al guardar la solicitud.',
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

        Object.assign(frmSolicitud, frmSolicitudInit());

        companias.value = [];
        conceptos.value = [];
        bancos.value = [];

        if (archivoAdjuntoRef.value) {
            archivoAdjuntoRef.value.clear();
        }
    };

    // -------------------------------------------------------------------------
    // AUXILIARES
    // -------------------------------------------------------------------------

    const handleBancoSeleccionado = (idBanco) => {
        const banco = bancos.value.find((item) => item._id === idBanco);

        if (!banco) {
            return 'Selecciona cuenta';
        }

        return `${banco.banco} - ${banco.cuenta_banco}`;
    };

    const handleMoney4 = (valor) => {
        return `$${Number(valor || 0).toFixed(4)}`;
    };

    // -------------------------------------------------------------------------
    // INICIAL
    // -------------------------------------------------------------------------

    const handleInit = async () => {
        await Promise.all([handleCargarClientes(), handleCargarCatalogosSat()]);
    };

    handleInit();

    return {
        frmSolicitud,

        clientes,
        companias,
        conceptos,
        bancos,

        usoCfdi,
        metodoPago,
        formasPagoDisponibles,
        esNotaPorAnticipo,

        archivoAdjuntoRef,
        tipoNota,
        tiposNota,
        relacionNota,
        relacionesNota,
        cargandoRelacionesNota,
        errorRelacionesNota,
        dialogoAnticipos,
        busquedaAnticipos,
        resultadosAnticipos,
        seleccionAnticipos,
        buscandoAnticipos,
        errorAnticipos,
        buscarAnticipos,
        abrirAnticipos,
        anticipoSeleccionado,
        alternarAnticipo,
        aplicarAnticipos,

        totalesSolicitud,

        fechaFacturaMinima,
        fechaFacturaMaxima,

        clienteValido,
        companiaValida,
        bancoValido,
        conceptoValido,
        cantidadValida,
        valorUnitarioValido,

        puedeAgregarConcepto,
        botonGuardarDeshabilitado,
        guardandoNota,

        handleCambioCliente,
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
        handleMoney4
    };
};

export default useProceso;
