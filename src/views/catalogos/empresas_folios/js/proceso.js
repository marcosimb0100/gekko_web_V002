import { computed, reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';

export default function usoFolios() {
    const store = useStore();
    const toast = useToast();
    const tipos = [
        { clave: 'factura', nombre: 'Factura' },
        { clave: 'nota_credito', nombre: 'Nota de Crédito' },
        { clave: 'nota_debito', nombre: 'Nota de Débito' },
        { clave: 'complemento_pago', nombre: 'Complemento de Pago' }
    ];
    const visible = ref(false);
    const empresa = ref(null);
    const pestana = ref('folios');
    const folios = reactive({});
    const valoresOriginales = ref(null);
    const historial = ref([]);
    const cargando = ref(false);
    const guardando = ref(false);
    const error = ref('');
    const direccion = computed(() => '/companias/folios/' + empresa.value?._id);
    const campos = computed(() => Object.fromEntries(tipos.flatMap(({ clave }) => [
        [clave + '_serie', (folios[clave + '_serie'] || '').trim().toLowerCase()],
        [clave + '_folio', folios[clave + '_folio']]
    ])));
    const puedeGuardar = computed(() => valoresOriginales.value && tipos.every(({ clave }) => {
        const folio = campos.value[clave + '_folio'];
        return Number.isSafeInteger(folio) && folio >= 0;
    }) && Object.entries(campos.value).some(([campo, valor]) => {
        const anterior = valoresOriginales.value[campo];
        return valor !== (campo.endsWith('_folio') ? Number(anterior ?? 0) : String(anterior ?? '').trim().toLowerCase());
    }));
    let consulta = 0;

    const cargar = async () => {
        const actual = ++consulta;
        cargando.value = true;
        try {
            const res = await store.dispatch('api/apiGetToken', { direccion: direccion.value });
            if (actual !== consulta || !visible.value) return;
            if (res.estatus !== 200 || !res.datos?.folios) throw new Error(res.mensaje || 'No se pudo consultar la configuración.');
            valoresOriginales.value = res.datos.folios;
            for (const { clave } of tipos) {
                folios[clave + '_serie'] = String(res.datos.folios[clave + '_serie'] ?? '').toUpperCase();
                folios[clave + '_folio'] = Number(res.datos.folios[clave + '_folio'] ?? 0);
            }
            historial.value = (res.datos.historial ?? []).flatMap(({ cambios, fecha, usuario }) =>
                cambios.map(({ tipo, antes, despues }) => ({
                    fecha, usuario, antes, despues,
                    documento: tipos.find(({ clave }) => clave === tipo)?.nombre ?? tipo
                }))
            );
        } catch (ex) {
            if (actual === consulta && visible.value) error.value = ex.message;
        } finally {
            if (actual === consulta) cargando.value = false;
        }
    };
    const abrir = async (fila) => {
        empresa.value = fila;
        pestana.value = 'folios';
        valoresOriginales.value = null;
        historial.value = [];
        for (const campo of Object.keys(folios)) delete folios[campo];
        error.value = '';
        visible.value = true;
        await cargar();
    };
    const guardar = async () => {
        if (guardando.value || cargando.value || !puedeGuardar.value) return;
        guardando.value = true;
        error.value = '';
        try {
            const res = await store.dispatch('api/apiPutToken', {
                direccion: direccion.value,
                datosJson: { ...campos.value, folios_esperados: valoresOriginales.value }
            });
            if (res.estatus !== 200) throw new Error(res.mensaje || 'No fue posible guardar los folios.');
            toast.add({ severity: res.datos?.folios_conservados?.length ? 'warn' : 'success', summary: 'Series / Folios', detail: res.mensaje, life: 4000 });
            valoresOriginales.value = null;
            await cargar();
        } catch (ex) {
            error.value = ex.message;
        } finally {
            guardando.value = false;
        }
    };
    const mostrarFecha = (fecha) => new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Mexico_City'
    }).format(new Date(fecha));
    const mostrarValores = ({ serie, folio }) => (serie ? serie.toUpperCase() + ' / ' : '') + folio;

    return { visible, empresa, pestana, tipos, folios, historial, cargando, guardando, error, valoresOriginales, puedeGuardar, abrir, guardar, mostrarFecha, mostrarValores };
}
