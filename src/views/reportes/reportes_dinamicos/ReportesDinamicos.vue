<template>
    <Encabezado titulo="Reportes din&aacute;micos" subtitulo="Consulta de reportes financieros con datos reales" icono="pi pi-table"><Button icon="pi pi-question-circle" text rounded aria-label="Gu&iacute;a" @click="mostrarAyuda = true" /><Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando" @click="handleActualizar" /></Encabezado>
    <div class="card reportes-dinamicos">
        <div class="filtros-dinamicos">
            <div class="campo"><label>Reporte <span>*</span></label><Dropdown v-model="reporteId" :options="reportes" optionLabel="nombre" optionValue="_id" filter placeholder="Selecciona un reporte" :disabled="cargando" @change="handleCambiarReporte" /></div>
            <div class="campo"><label>Empresa <span>*</span></label><Dropdown v-model="empresa" :options="empresas" optionLabel="razon_social" optionValue="_id" filter placeholder="Selecciona una empresa" :disabled="cargando" @change="handleCambiarEmpresa" /></div>
            <div class="campo"><label>Desde <span>*</span></label><Calendar v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div class="campo"><label>Hasta <span>*</span></label><Calendar v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div v-if="handleFiltro('banco')" class="campo"><label>Banco</label><Dropdown v-model="banco" :options="bancos" optionLabel="label" optionValue="value" placeholder="Todos los bancos" showClear :disabled="cargando || !empresa" @change="cuenta = null" /></div>
            <div v-if="handleFiltro('cuenta')" class="campo"><label>Cuenta</label><Dropdown v-model="cuenta" :options="cuentasFiltradas" optionLabel="etiqueta" optionValue="clabe_bancaria" placeholder="Todas las cuentas" filter showClear :disabled="cargando || !empresa" /></div>
            <div v-if="handleFiltro('concepto')" class="campo"><label>Concepto contiene</label><InputText v-model="concepto" maxlength="100" placeholder="Todos los conceptos" :disabled="cargando" /></div>
            <div v-if="handleFiltro('tipo_movimiento')" class="campo"><label>Movimiento</label><Dropdown v-model="tipo" :options="tipos" placeholder="Ingresos y egresos" showClear :disabled="cargando" /></div>
            <div v-if="handleFiltro('estado_aplicacion')" class="campo"><label>Aplicaci&oacute;n CFDI</label><Dropdown v-model="estado" :options="estados" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear :disabled="cargando" /></div>
            <div v-if="handleFiltro('con_facturas')" class="campo"><label>Facturas asociadas</label><Dropdown v-model="conFacturas" :options="facturasOpciones" placeholder="Con y sin facturas" showClear :disabled="cargando" /></div>
        </div>
        <div class="acciones-reporte"><small>{{ reporte?.descripcion || 'Selecciona un diseno guardado para consultar el reporte.' }}</small><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" /><Button label="Generar reporte" icon="pi pi-search" :loading="cargando" :disabled="cargando || !reporteId || !empresa" @click="handleGenerar" /></div>
        <Message v-if="errorConsulta" severity="error" :closable="false">{{ errorConsulta }}</Message>
        <div v-if="!reportes.length && !cargando" class="sin-reporte"><i class="pi pi-table"></i>No hay reportes activos. Crea o activa un dise&ntilde;o en el configurador.</div>
    </div>
    <div v-if="resultado" class="card resultado-dinamico">
        <div class="titulo-resultado"><div><h3>{{ resultado.reporte.nombre }}</h3><p>{{ resultado.empresa }} &middot; {{ resultado.desde }} al {{ resultado.hasta }}</p></div><Tag :value="`${resultado.movimientos} movimientos`" severity="info" /></div>
        <section v-if="resultado.reporte.mostrar_grafica !== false && resultado.grafica.length" class="grafica-reporte"><div class="titulo-grafica"><strong>Resumen por {{ handleEtiqueta(resultado.reporte.filas[0]).toLowerCase() }}</strong><Dropdown v-model="valorGrafica" :options="valoresGrafica" optionLabel="label" optionValue="value" aria-label="Valor de la gr&aacute;fica" /></div><Chart type="bar" :data="graficaDatos" :options="graficaOpciones" :style="{height:`${Math.max(240,Math.min(15,resultado.grafica.length)*35)}px`}" :canvasProps="{role:'img','aria-label':'Resumen del reporte real por agrupacion'}" /><small>Se muestran las primeras {{ Math.min(15,resultado.grafica.length) }} agrupaciones de {{ resultado.grafica.length }}, en orden alfab&eacute;tico. {{ ['movimientos','facturas'].includes(valorGrafica) ? 'Valores en cantidad.' : 'Importes en MXN.' }}</small></section>
        <DataTable :value="resultado.filas" :rowClass="handleClase" dataKey="id" paginator :rows="25" :rowsPerPageOptions="[25,50,100]" scrollable scrollHeight="55vh" class="tabla-encabezados tabla-reporte-real" :tableStyle="{minWidth:`${Math.max(750,resultado.reporte.filas.length*150+resultado.columnas.length*160)}px`}"><template #empty>No hay movimientos con los filtros seleccionados.</template><Column v-for="campo in resultado.reporte.filas" :key="campo" :field="campo" :header="handleEtiqueta(campo)" style="min-width:150px" /><Column v-for="columna in resultado.columnas" :key="columna.field" :field="columna.field" :header="columna.header" style="min-width:160px;text-align:right"><template #body="{data}">{{ handleFormato(data[columna.field],columna.valor) }}</template></Column></DataTable>
        <small class="nota-resultado">Datos reales de movimientos y conciliaciones activas. Los conteos de facturas diferentes se recalculan por agrupaci&oacute;n: los subtotales pueden ser menores que la suma de sus filas. El desplazamiento horizontal permanece dentro del reporte.</small>
    </div>
    <Dialog v-model:visible="mostrarAyuda" modal header="Reportes din&aacute;micos" :style="{width:'40rem',maxWidth:'95vw'}"><ol class="guia-dinamicos"><li>Selecciona un reporte activo del configurador.</li><li>Elige empresa y periodo de fechas.</li><li>Aplica los filtros disponibles y pulsa Generar reporte.</li><li>Revisa la tabla con sus agrupaciones, subtotales y totales. La gr&aacute;fica aparece si est&aacute; habilitada en el dise&ntilde;o.</li></ol><p>Al cambiar un filtro se retira el resultado anterior para evitar confundirlo con la nueva consulta. Si modificas el dise&ntilde;o en otra pantalla, pulsa Actualizar para recargarlo.</p><p>Los movimientos no se duplican por tener varias facturas. S&oacute;lo se incluyen conciliaciones activas. Para consultas muy amplias, reduce el periodo o la cantidad de columnas.</p><template #footer><Button label="Cerrar" outlined @click="mostrarAyuda = false" /></template></Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Chart from 'primevue/chart';
import proceso from './js/proceso.js';
export default { name:'ReportesDinamicos',components:{Encabezado,Chart},setup(){return {...proceso()};} };
</script>
<style scoped>
@import './css/estilo.css';
</style>
