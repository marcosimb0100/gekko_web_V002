<template>
    <div class="sync-excel" :aria-busy="cargando">
        <div v-if="cargando" role="status" class="sync-excel-estado"><i class="pi pi-spin pi-spinner" aria-hidden="true" /> Leyendo hoja de cálculo...</div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <template v-if="vista && !error">
            <div class="sync-excel-formula"><span>{{ seleccion?.address || 'Celda' }}</span><b aria-hidden="true">fx</b><div :title="seleccion?.formula ? `=${seleccion.formula}` : seleccion?.text">{{ seleccion?.formula ? `=${seleccion.formula}` : seleccion?.text || 'Selecciona una celda para consultar su contenido' }}</div><Tag value="Solo lectura" severity="success" /></div>
            <div ref="tabla" class="sync-excel-tabla" tabindex="0" role="region" aria-label="Contenido de la hoja de cálculo">
                <table :aria-label="hojas.find(hoja => hoja.index === hojaActual)?.name" :style="{ width: `${48 + vista.columns.reduce((total, columna) => total + columna.width, 0)}px` }">
                    <colgroup><col style="width: 48px" /><col v-for="columna in vista.columns" :key="columna.label" :style="{ width: `${columna.width}px` }" /></colgroup>
                    <thead><tr><th class="sync-excel-esquina" aria-label="Fila" /><th v-for="columna in vista.columns" :key="columna.label" scope="col">{{ columna.label }}</th></tr></thead>
                    <tbody><tr v-for="fila in vista.rows" :key="fila.number"><th scope="row">{{ fila.number }}</th><td v-for="celda in fila.cells" :key="celda.address" :colspan="celda.colspan" :rowspan="celda.rowspan" :class="{ 'sync-excel-numero': celda.numeric, 'sync-excel-seleccion': seleccion?.address === celda.address, 'sync-excel-sin-resultado': celda.missingResult }" :title="celda.formula ? `${celda.text}\n=${celda.formula}` : celda.text" @click="seleccion = celda">{{ celda.text }}</td></tr></tbody>
                </table>
            </div>
            <div class="sync-excel-navegacion">
                <div><Button type="button" icon="pi pi-angle-left" title="Filas anteriores" aria-label="Filas anteriores" text :disabled="cargando || vista.rowStart === 0" @click="cambiarVentana(-ROWS_PER_PAGE, 0)" /><span>Filas {{ vista.rowStart + 1 }}–{{ vista.rowEnd }} de {{ vista.rowCount }}</span><Button type="button" icon="pi pi-angle-right" title="Filas siguientes" aria-label="Filas siguientes" text :disabled="cargando || vista.rowEnd >= vista.rowCount" @click="cambiarVentana(ROWS_PER_PAGE, 0)" /></div>
                <div v-if="vista.columnCount > COLUMNS_PER_PAGE"><Button type="button" icon="pi pi-angle-left" title="Columnas anteriores" aria-label="Columnas anteriores" text :disabled="cargando || vista.columnStart === 0" @click="cambiarVentana(0, -COLUMNS_PER_PAGE)" /><span>Columnas {{ vista.columns[0]?.label }}–{{ vista.columns.at(-1)?.label }} de {{ vista.columnCount }}</span><Button type="button" icon="pi pi-angle-right" title="Columnas siguientes" aria-label="Columnas siguientes" text :disabled="cargando || vista.columnEnd >= vista.columnCount" @click="cambiarVentana(0, COLUMNS_PER_PAGE)" /></div>
            </div>
            <div class="sync-excel-hojas" role="group" aria-label="Hojas del libro"><button v-for="hoja in hojas" :key="hoja.index" type="button" :class="{ activa: hojaActual === hoja.index }" :aria-pressed="hojaActual === hoja.index" :disabled="cargando" @click="cambiarHoja(hoja.index)"><i class="pi pi-table" aria-hidden="true" />{{ hoja.name }}</button></div>
            <small>Valores guardados en el archivo. Las fórmulas no se recalculan; gráficos y formatos avanzados no se reproducen.</small>
        </template>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, shallowRef, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { utils } from 'xlsx';
import { ROWS_PER_PAGE, COLUMNS_PER_PAGE } from '../../../helpers/spreadsheetPreviewLimits';

const props = defineProps({ archivo: { type: Object, required: true } });
const store = useStore();
const hojas = ref([]);
const hojaActual = ref(null);
const vista = shallowRef(null);
const seleccion = ref(null);
const cargando = ref(false);
const error = ref('');
const tabla = ref(null);
let solicitud = 0;
const detener = () => { solicitud++; };
const cargarVentana = async (row = 0, column = 0) => {
    const actual = ++solicitud;
    cargando.value = true; error.value = '';
    try {
        const parametros = new URLSearchParams({ revision: props.archivo.revision, fila: row, columna: column });
        if (hojaActual.value !== null) parametros.set('hoja', hojaActual.value);
        const respuesta = await store.dispatch('api/apiGetTokenSinCargando', { direccion: `/sync/archivos/${props.archivo.id}/visualizacion/hojas?${parametros}` });
        if (actual !== solicitud) return;
        if (respuesta.estatus !== 200) throw new Error(respuesta.mensaje || 'No fue posible leer la hoja.');
        const data = respuesta.datos;
        for (const fila of data.view.rows) for (const celda of fila.cells) {
            celda.numeric = celda.valueType === 'number';
            celda.missingResult = !!celda.formula && celda.value == null;
            const tipo = celda.numeric ? 'n' : celda.valueType === 'boolean' ? 'b' : celda.valueType === 'date' ? 'd' : 's';
            const valor = tipo === 'd' ? new Date(celda.value) : celda.value;
            celda.text = celda.missingResult ? 'Sin resultado guardado' : valor == null ? '' : utils.format_cell({ t: tipo, v: valor, z: celda.format });
        }
        hojas.value = data.sheets; hojaActual.value = data.sheetIndex;
        vista.value = data.view; seleccion.value = null;
        await nextTick(); tabla.value?.scrollTo({ top: 0, left: 0 });
    } catch (e) {
        if (actual === solicitud) error.value = e.message;
    } finally {
        if (actual === solicitud) cargando.value = false;
    }
};
watch(() => props.archivo, archivo => {
    detener(); vista.value = null; seleccion.value = null; hojas.value = []; hojaActual.value = null;
    if (archivo) cargarVentana();
}, { immediate: true });
const pedirVentana = (row, column) => {
    if (!cargando.value) cargarVentana(row, column);
};
const cambiarHoja = index => { if (cargando.value) return; hojaActual.value = index; pedirVentana(0, 0); };
const cambiarVentana = (row, column) => pedirVentana(vista.value.rowStart + row, vista.value.columnStart + column);
onBeforeUnmount(detener);
</script>

<style scoped>
.sync-excel { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: .4rem; }
.sync-excel-formula { display: flex; align-items: center; gap: .6rem; min-width: 0; border: 1px solid var(--surface-border); padding: .35rem .5rem; font-size: .8rem; }
.sync-excel-formula > span { min-width: 3rem; text-align: center; }
.sync-excel-formula > b { color: #217346; font-style: italic; }
.sync-excel-formula > div { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.sync-excel-tabla { overflow: auto; flex: 1; min-height: 12rem; border: 1px solid #cbd5cf; background: #fff; color: #202722; }
table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: max-content; min-width: 100%; font: 12px Calibri, Arial, sans-serif; }
th, td { border-right: 1px solid #dce3de; border-bottom: 1px solid #dce3de; padding: 5px 8px; height: 27px; min-width: 90px; max-width: 360px; white-space: pre; overflow: hidden; text-overflow: ellipsis; cursor: cell; }
thead th { position: sticky; top: 0; z-index: 2; background: #edf3ef; text-align: center; font-weight: 500; color: #40564a; }
tbody th { position: sticky; left: 0; z-index: 1; min-width: 48px; background: #edf3ef; text-align: center; font-weight: 400; color: #40564a; }
.sync-excel-esquina { position: sticky; left: 0; z-index: 3; min-width: 48px; }
.sync-excel-numero { text-align: right; }
.sync-excel-seleccion { box-shadow: inset 0 0 0 2px #217346; background: #edf8f1; }
.sync-excel-sin-resultado { color: #9a6700; }
.sync-excel-navegacion { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .25rem; font-size: .72rem; color: var(--text-color-secondary); }
.sync-excel-navegacion > div { display: flex; align-items: center; gap: .25rem; }
.sync-excel-navegacion :deep(.p-button) { width: 1.6rem; height: 1.6rem; padding: 0; }
.sync-excel-hojas { display: flex; gap: .2rem; overflow-x: auto; border-top: 1px solid var(--surface-border); padding-top: .25rem; flex-shrink: 0; }
.sync-excel-hojas button { display: flex; align-items: center; gap: .4rem; white-space: nowrap; border: 0; border-bottom: 3px solid transparent; background: var(--surface-ground); color: var(--text-color); padding: .5rem .8rem; cursor: pointer; font-size: .8rem; }
.sync-excel-hojas button.activa { border-bottom-color: #217346; color: #217346; font-weight: 600; }
.sync-excel-estado { padding: .5rem; font-size: .8rem; }
small { font-size: .7rem; color: var(--text-color-secondary); }
</style>
