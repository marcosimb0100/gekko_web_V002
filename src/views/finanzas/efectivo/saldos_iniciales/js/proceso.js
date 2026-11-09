import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const fechaMexico = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fechaLocal = (fecha) => (fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : null);

export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const empresas = ref([]);
    const cajaGlobal = ref(null);
    const modo = ref('empresa');
    const modoFijado = ref(null);
    const modos = [
        { label: 'Por empresa', value: 'empresa' },
        { label: 'Caja global', value: 'global' }
    ];
    const busqueda = ref('');
    const estado = ref(null);
    const cargando = ref(false);
    const guardandoId = ref(null);
    const error = ref('');
    const puedeModificar = ref(false);
    const mostrarCambio = ref(false);
    const preparandoCambio = ref(false);
    const aplicandoCambio = ref(false);
    const detalleCambio = ref(null);
    const errorCambio = ref('');
    const motivoCambio = ref('');
    const fechaCambio = ref(null);
    const empresasElegidas = ref([]);
    const distribucion = ref([]);
    const aceptaCambio = ref(false);
    let operacionCambio = null;
    const reparto = computed(() => distribucion.value.filter((fila) => empresasElegidas.value.includes(fila.id)));
    const totalDistribuido = computed(() => reparto.value.reduce((total, fila) => total + Math.round((Number(fila.importe) || 0) * 100), 0) / 100);
    const diferencia = computed(() => (Math.round(Number(detalleCambio.value?.saldo_total || 0) * 100) - Math.round(totalDistribuido.value * 100)) / 100);
    const cambioValido = computed(() => detalleCambio.value && aceptaCambio.value && motivoCambio.value.trim().length >= 3 && motivoCambio.value.trim().length <= 500 && fechaLocal(fechaCambio.value) &&
        (detalleCambio.value.destino === 'global' || (reparto.value.length > 0 && diferencia.value === 0 && reparto.value.every((fila) => typeof fila.importe === 'number' && Number.isFinite(fila.importe) && fila.importe >= 0 && fila.importe <= 999999999999.99))));
    const estados = [
        { label: 'Sin saldo inicial', value: 'pendiente' },
        { label: 'Saldo registrado', value: 'registrado' }
    ];
    const filas = computed(() => {
        if (modo.value === 'global') return cajaGlobal.value ? [cajaGlobal.value] : [];
        const texto = busqueda.value.trim().toLocaleLowerCase('es');
        return empresas.value.filter((empresa) => (!estado.value || empresa.tiene_saldo === (estado.value === 'registrado')) && `${empresa.nombre} ${empresa.rfc}`.toLocaleLowerCase('es').includes(texto));
    });
    const pendientes = computed(() => empresas.value.filter((empresa) => !empresa.tiene_saldo).length);
    const moneda = (saldo) => (saldo == null ? 'Sin registrar' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(saldo)));
    const puedeEditar = (empresa) => empresa.puede_editar === true && !error.value && !cargando.value && !guardandoId.value && !mostrarCambio.value;

    function preparar(empresa) {
        const fecha = empresa.fecha_saldo || fechaMexico();
        return { ...empresa, importe: empresa.saldo == null ? null : Number(empresa.saldo), fecha: new Date(`${fecha}T12:00:00`) };
    }
    async function cargar() {
        if (cargando.value || guardandoId.value || aplicandoCambio.value) return;
        cargando.value = true;
        error.value = '';
        empresas.value = [];
        cajaGlobal.value = null;
        puedeModificar.value = false;
        try {
            const res = await store.dispatch('api/apiGetTokenSinCargando', { direccion: '/efectivo/saldos_iniciales/' });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible consultar los saldos iniciales.');
            if (res.datos?.conflicto_modalidad) throw new Error('Existen saldos iniciales en ambas modalidades. Es necesario revisar esos registros antes de continuar. No se ha eliminado ningún saldo.');
            modoFijado.value = res.datos?.modalidad || null;
            if (modoFijado.value) modo.value = modoFijado.value;
            empresas.value = (res.datos?.empresas || []).map(preparar);
            if (res.datos?.caja_global) cajaGlobal.value = preparar({ ...res.datos.caja_global, id: 'global', nombre: 'Caja global', rfc: '' });
            puedeModificar.value = res.datos?.puede_modificar === true;
        } catch (ex) {
            error.value = ex.message || 'No fue posible conectar con el servidor.';
        } finally {
            cargando.value = false;
        }
    }
    async function guardar(empresa) {
        if (!puedeEditar(empresa)) return;
        const fecha = fechaLocal(empresa.fecha);
        if (typeof empresa.importe !== 'number' || !Number.isFinite(empresa.importe) || empresa.importe < 0 || empresa.importe > 999999999999.99 || !fecha || fecha < '1900-01-01' || fecha > '2100-12-31') {
            toast.add({ severity: 'warn', summary: 'Saldos iniciales', detail: 'Captura un importe válido y la fecha del saldo inicial.', life: 4000 });
            return;
        }
        guardandoId.value = empresa.id;
        let recargar = false;
        try {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: `/efectivo/saldos_iniciales/${encodeURIComponent(empresa.id)}`,
                datosJson: { saldo: empresa.importe.toFixed(2), fecha_saldo: fecha, revision: empresa.revision }
            });
            if (res.estatus !== 200) {
                // Una captura concurrente o un permiso revocado exige consultar de nuevo.
                if ([403, 409].includes(res.estatus)) empresa.puede_editar = false;
                recargar = res.estatus === 409;
                throw new Error(res.mensaje || 'No fue posible guardar el saldo inicial.');
            }
            Object.assign(empresa, preparar({ ...empresa, ...res.datos.saldo_inicial }));
            modoFijado.value = res.datos.modalidad || (empresa.id === 'global' ? 'global' : 'empresa');
            modo.value = modoFijado.value;
            toast.add({ severity: 'success', summary: 'Saldos iniciales', detail: res.mensaje, life: 4000 });
        } catch (ex) {
            toast.add({ severity: 'error', summary: 'Saldos iniciales', detail: ex.message || 'No fue posible guardar el saldo inicial.', life: 5000 });
        } finally {
            guardandoId.value = null;
            if (recargar) await cargar();
        }
    }
    async function abrirCambio() {
        if (!puedeModificar.value || !modoFijado.value || cargando.value || guardandoId.value || preparandoCambio.value || aplicandoCambio.value) return;
        mostrarCambio.value = true;
        preparandoCambio.value = true;
        errorCambio.value = '';
        detalleCambio.value = null;
        motivoCambio.value = '';
        empresasElegidas.value = [];
        distribucion.value = [];
        aceptaCambio.value = false;
        fechaCambio.value = new Date(`${fechaMexico()}T12:00:00`);
        operacionCambio = crypto.randomUUID();
        try {
            const res = await store.dispatch('api/apiPostTokenSinCargando', {
                direccion: '/efectivo/saldos_iniciales/modalidad/previsualizar',
                datosJson: { destino: modoFijado.value === 'global' ? 'empresa' : 'global' }
            });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible preparar el cambio.');
            detalleCambio.value = res.datos;
            distribucion.value = (res.datos.empresas || []).map((empresa) => ({ ...empresa, importe: 0 }));
        } catch (ex) {
            errorCambio.value = ex.message || 'No fue posible preparar el cambio.';
        } finally {
            preparandoCambio.value = false;
        }
    }
    async function confirmarCambio() {
        if (!cambioValido.value || aplicandoCambio.value) return;
        aplicandoCambio.value = true;
        errorCambio.value = '';
        try {
            const datosJson = {
                destino: detalleCambio.value.destino,
                version_estado: detalleCambio.value.version_estado,
                operacion_id: operacionCambio,
                fecha_saldo: fechaLocal(fechaCambio.value),
                motivo: motivoCambio.value.trim(),
                distribucion: detalleCambio.value.destino === 'empresa' ? reparto.value.map((fila) => ({ empresa_id: fila.id, saldo: fila.importe.toFixed(2) })) : []
            };
            const res = await store.dispatch('api/apiPostTokenSinCargando', { direccion: '/efectivo/saldos_iniciales/modalidad/cambiar', datosJson });
            if (res.estatus !== 200) {
                if ([403, 409].includes(res.estatus)) detalleCambio.value = null;
                throw new Error(res.mensaje || 'No fue posible cambiar la modalidad.');
            }
            mostrarCambio.value = false;
            busqueda.value = '';
            estado.value = null;
            toast.add({ severity: 'success', summary: 'Cambio de modalidad', detail: res.mensaje, life: 5000 });
        } catch (ex) {
            errorCambio.value = ex.message || 'No fue posible cambiar la modalidad.';
        } finally {
            aplicandoCambio.value = false;
        }
        if (!mostrarCambio.value) await cargar();
    }
    onMounted(cargar);
    return { empresas, cajaGlobal, modo, modoFijado, modos, busqueda, estado, estados, filas, pendientes, cargando, guardandoId, error, puedeModificar, puedeEditar, moneda, cargar, guardar,
        mostrarCambio, preparandoCambio, aplicandoCambio, detalleCambio, errorCambio, motivoCambio, fechaCambio, empresasElegidas, reparto, totalDistribuido, diferencia, aceptaCambio, cambioValido, abrirCambio, confirmarCambio };
}
