import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import * as XLSX from 'xlsx';

export default function useProceso() {
    const store = useStore();
    const toast = useToast();
    const periodos = ref([]);
    const periodoId = ref(null);
    const empleados = ref([]);
    const busqueda = ref('');
    const cargando = ref(false);
    const cargandoPeriodos = ref(false);
    const guardandoId = ref(null);
    const exportando = ref(false);
    let secuencia = 0;

    const aviso = (severity, detail) => toast.add({ severity, summary: severity === 'error' ? 'Error' : 'Aviso', detail, life: 4000 });
    const nombre = (empleado) => [empleado?.nombres, empleado?.apellido_paterno, empleado?.apellido_materno].filter(Boolean).join(' ') || '—';
    const numero = (valor) => {
        if (valor === null || valor === undefined || valor === '') return 0;
        if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
        const resultado = Number(String(valor).replace(/[$,\s]/g, ''));
        return Number.isFinite(resultado) ? resultado : 0;
    };
    const moneda = (valor) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numero(valor));

    const periodoSeleccionado = computed(() => periodos.value.find((periodo) => periodo._id === periodoId.value) || null);
    const esVerdadero = (valor) => valor === true || valor === 1 || String(valor).toLowerCase() === 'true' || String(valor) === '1';
    const puedeCapturar = computed(() => Boolean(periodoSeleccionado.value && esVerdadero(periodoSeleccionado.value.activo) && esVerdadero(periodoSeleccionado.value.capturable)));
    const opcionesPeriodos = computed(() =>
        periodos.value.map((periodo) => ({
            value: periodo._id,
            label: [periodo.periodicidad_pago || 'Periodo', `${periodo.fecha_inicial} al ${periodo.fecha_final}`, esVerdadero(periodo.activo) && esVerdadero(periodo.capturable) ? '● CAPTURABLE' : 'SOLO CONSULTA'].join(' · ')
        }))
    );
    const filtrados = computed(() => {
        const texto = busqueda.value.trim().toLocaleLowerCase('es');
        return empleados.value.filter(
            (empleado) =>
                !texto ||
                [nombre(empleado), empleado.area_nombre, empleado.puesto_nombre].some((valor) =>
                    String(valor || '')
                        .toLocaleLowerCase('es')
                        .includes(texto)
                )
        );
    });
    const totalEmpleado = (empleado) => Math.round((numero(empleado.sueldo_1) + numero(empleado.sueldo_2)) * 100) / 100;
    const totales = computed(() => {
        let sueldo1Centavos = 0;
        let sueldo2Centavos = 0;
        filtrados.value.forEach((empleado) => {
            sueldo1Centavos += Math.round(numero(empleado.sueldo_1) * 100);
            sueldo2Centavos += Math.round(numero(empleado.sueldo_2) * 100);
        });
        return { sueldo1: sueldo1Centavos / 100, sueldo2: sueldo2Centavos / 100, general: (sueldo1Centavos + sueldo2Centavos) / 100 };
    });

    const cargarPeriodos = async () => {
        cargandoPeriodos.value = true;
        try {
            const respuesta = await store.dispatch('api/apiGetToken', { direccion: '/captura_sueldos/periodos' });
            if (respuesta?.estatus !== 200) throw new Error(respuesta?.mensaje || 'No fue posible cargar periodos');
            const registros = Array.isArray(respuesta?.datos?.periodos) ? respuesta.datos.periodos : [];
            periodos.value = [...registros].sort((a, b) => String(b.fecha_final || '').localeCompare(String(a.fecha_final || '')));
            const capturable = periodos.value.find((periodo) => esVerdadero(periodo.activo) && esVerdadero(periodo.capturable));
            const existente = periodos.value.find((periodo) => periodo._id === periodoId.value);
            periodoId.value = existente?._id || capturable?._id || periodos.value[0]?._id || null;
        } catch (error) {
            aviso('error', error?.message || 'Error al cargar periodos');
        } finally {
            cargandoPeriodos.value = false;
        }
    };

    const cargarEmpleados = async () => {
        const actual = ++secuencia;
        empleados.value = [];
        if (!periodoId.value) {
            cargando.value = false;
            return;
        }
        cargando.value = true;
        try {
            const respuesta = await store.dispatch('api/apiGetToken', { direccion: `/captura_sueldos/${encodeURIComponent(periodoId.value)}` });
            if (respuesta?.estatus !== 200) throw new Error(respuesta?.mensaje || 'No fue posible consultar sueldos');
            if (actual !== secuencia) return;
            const registros = Array.isArray(respuesta?.datos?.empleados) ? respuesta.datos.empleados : [];
            empleados.value = registros.map((empleado) => {
                const captura = empleado.captura || {};
                return {
                    ...empleado,
                    sueldo_1: captura.sueldo_1 === '' || captura.sueldo_1 == null ? null : Number(captura.sueldo_1),
                    sueldo_2: captura.sueldo_2 === '' || captura.sueldo_2 == null ? null : Number(captura.sueldo_2)
                };
            });
        } catch (error) {
            if (actual === secuencia) aviso('error', error?.message || 'No fue posible cargar empleados');
        } finally {
            if (actual === secuencia) cargando.value = false;
        }
    };

    const guardar = async (empleado) => {
        if (!puedeCapturar.value || guardandoId.value) return;
        const sueldo1 = empleado.sueldo_1;
        const sueldo2 = empleado.sueldo_2;
        if (![sueldo1, sueldo2].every((valor) => typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor <= 999999999.99)) {
            aviso('warn', 'Captura ambos importes válidos');
            return;
        }
        guardandoId.value = empleado._id;
        try {
            const datos = { sueldo_1: sueldo1.toFixed(2), sueldo_2: sueldo2.toFixed(2) };
            const respuesta = await store.dispatch('api/apiPutToken', {
                direccion: `/captura_sueldos/${encodeURIComponent(periodoId.value)}/empleados/${encodeURIComponent(empleado._id)}`,
                datosJson: datos
            });
            if (respuesta?.estatus !== 200) throw new Error(respuesta?.mensaje || 'No fue posible guardar');
            aviso('success', 'Sueldos guardados correctamente');
        } catch (error) {
            aviso('error', error?.message || 'No fue posible guardar');
        } finally {
            guardandoId.value = null;
        }
    };

    const exportarExcel = () => {
        if (!periodoSeleccionado.value || !filtrados.value.length) return;
        exportando.value = true;
        try {
            const periodo = periodoSeleccionado.value;
            const filas = filtrados.value.map((empleado) => ({
                'Nombre completo': nombre(empleado),
                Área: empleado.area_nombre || '',
                Puesto: empleado.puesto_nombre || '',
                'Estatus empleado': empleado.estatus || '',
                'Fecha de alta': String(empleado.fecha_alta || '').slice(0, 10),
                Periodicidad: String(periodo.periodicidad_pago || ''),
                'Fecha inicial': String(periodo.fecha_inicial || '').slice(0, 10),
                'Fecha final': String(periodo.fecha_final || '').slice(0, 10),
                Año: Number(periodo.anio || periodo.año || String(periodo.fecha_final || '').slice(0, 4)) || '',
                Mes: Number(periodo.mes || String(periodo.fecha_final || '').slice(5, 7)) || '',
                'Estatus periodo': puedeCapturar.value ? 'CAPTURABLE' : 'CONSULTA',
                'Sueldo 1': numero(empleado.sueldo_1),
                'Sueldo 2': numero(empleado.sueldo_2),
                Total: totalEmpleado(empleado)
            }));
            const hoja = XLSX.utils.json_to_sheet(filas);
            const ultima = filas.length + 1;
            XLSX.utils.sheet_add_aoa(hoja, [['TOTALES']], { origin: `A${ultima + 1}` });
            for (const [columna, valor] of [
                ['L', totales.value.sueldo1],
                ['M', totales.value.sueldo2],
                ['N', totales.value.general]
            ]) {
                hoja[`${columna}${ultima + 1}`] = { t: 'n', v: valor, z: '"$"#,##0.00' };
                for (let fila = 2; fila <= ultima; fila++) {
                    const celda = hoja[`${columna}${fila}`];
                    if (celda) celda.z = '"$"#,##0.00';
                }
            }
            hoja['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 17 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 9 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, 'Captura de sueldos');
            const fechaFinal = String(periodo.fecha_final || 'periodo').slice(0, 10);
            XLSX.writeFile(libro, `Captura_Sueldos_${fechaFinal}.xlsx`);
        } catch (error) {
            aviso('error', error?.message || 'No fue posible exportar el Excel');
        } finally {
            exportando.value = false;
        }
    };

    const actualizar = async () => {
        await cargarPeriodos();
        await cargarEmpleados();
    };
    onMounted(actualizar);
    return {
        periodos,
        periodoId,
        empleados,
        busqueda,
        cargando,
        cargandoPeriodos,
        guardandoId,
        exportando,
        nombre,
        numero,
        moneda,
        periodoSeleccionado,
        puedeCapturar,
        opcionesPeriodos,
        filtrados,
        totalEmpleado,
        totales,
        cargarPeriodos,
        cargarEmpleados,
        guardar,
        actualizar,
        exportarExcel
    };
}
