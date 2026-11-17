<template>
    <Encabezado titulo="Tablero financiero" subtitulo="Clasificaci&oacute;n y conciliaci&oacute;n de movimientos bancarios" icono="pi pi-chart-pie" />
    <div class="card tablero-financiero">
        <div class="filtros-tablero">
            <div><label>Empresa <span class="text-red-500">*</span></label><Dropdown v-model="empresa" :options="empresas" optionLabel="razon_social" optionValue="_id" placeholder="Selecciona una empresa" filter :disabled="cargando" @change="handleCambiarEmpresa" /></div>
            <div><label>Cuenta bancaria</label><Dropdown v-model="cuenta" :options="cuentas" optionLabel="etiqueta" optionValue="clabe_bancaria" placeholder="Todas las cuentas" showClear filter :disabled="cargando || !empresa" /></div>
            <div><label>Desde</label><Calendar v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div><label>Hasta</label><Calendar v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div class="acciones-filtros"><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" /><Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="cargando || !empresa" @click="handleConsultar()" /></div>
        </div>
        <template v-if="consultado">
            <div class="fichas-tablero"><Button v-for="ficha in fichas" :key="ficha.clave" unstyled class="ficha-tablero" :class="{ seleccionada: estado === ficha.clave }" :disabled="cargando" @click="handleFicha(ficha.clave)"><i :class="ficha.icono"></i><span>{{ ficha.nombre }}<strong>{{ ficha.cantidad }}</strong></span></Button></div>
            <div class="graficas-tablero">
                <section class="panel-grafica">
                    <div class="titulo-grafica"><span><i class="pi pi-tags"></i> Clasificaci&oacute;n de movimientos</span><small>{{ resumen.total || 0 }} movimientos</small></div>
                    <div v-if="resumen.total" class="contenedor-anillo"><Chart type="doughnut" :data="clasificacionDatos" :options="opcionesAnillo" :canvasProps="{role:'img', 'aria-label':'Movimientos con concepto y factura, solo concepto, solo factura o sin ambos'}" /></div>
                    <div v-else class="grafica-vacia"><i class="pi pi-chart-pie"></i>Sin movimientos en este periodo</div>
                    <p>Cada movimiento pertenece a una sola categor&iacute;a.</p>
                </section>
                <section class="panel-grafica">
                    <div class="titulo-grafica"><span><i class="pi pi-link"></i> Avance de conciliaci&oacute;n</span><Tag :value="`${porcentajeCompleto}% completa`" severity="success" /></div>
                    <div v-if="resumen.total" class="contenedor-anillo"><Chart type="doughnut" :data="conciliacionDatos" :options="opcionesAnillo" :canvasProps="{role:'img', 'aria-label':'Conciliacion completa, parcial y sin importe aplicado'}" /></div>
                    <div v-else class="grafica-vacia"><i class="pi pi-chart-pie"></i>Sin movimientos en este periodo</div>
                    <p>Seg&uacute;n el importe aplicado de las facturas asociadas.</p>
                </section>
                <section class="panel-grafica">
                    <div class="titulo-grafica"><span><i class="pi pi-chart-bar"></i> Ingresos y egresos</span><small>MXN</small></div>
                    <div v-if="resumen.total" class="contenedor-barras"><Chart type="bar" :data="flujoDatos" :options="opcionesFlujo" :canvasProps="{role:'img', 'aria-label':'Comparacion de ingresos y egresos en pesos'}" /></div>
                    <div v-else class="grafica-vacia"><i class="pi pi-chart-bar"></i>Sin movimientos en este periodo</div>
                    <div class="totales-grafica"><span>Ingresos <strong class="text-green-600">{{ handleMoneda(resumen.ingresos) }}</strong></span><span>Egresos <strong class="text-red-500">{{ handleMoneda(resumen.egresos) }}</strong></span></div>
                </section>
            </div>
            <div class="resumen-importes"><span>Ingresos <strong class="text-green-600">{{ handleMoneda(resumen.ingresos) }}</strong></span><span>Egresos <strong class="text-red-500">{{ handleMoneda(resumen.egresos) }}</strong></span><span>Aplicaci&oacute;n parcial: <strong>{{ resumen.parcial }}</strong></span><span>Aplicaci&oacute;n completa: <strong>{{ resumen.completo }}</strong></span></div>
        </template>
        <div v-if="consultado" class="cabecera-detalle"><div><strong>Detalle de movimientos</strong><small>Consulta conceptos, notas y facturas asociadas.</small></div><Button :label="mostrarMovimientos ? 'Ocultar movimientos' : 'Ver movimientos'" :icon="mostrarMovimientos ? 'pi pi-chevron-up' : 'pi pi-list'" outlined :disabled="cargando" @click="mostrarMovimientos = !mostrarMovimientos" /></div>
        <div v-if="mostrarMovimientos">
        <div class="barra-tablero"><Dropdown v-model="estado" :options="estados" optionLabel="label" optionValue="value" :disabled="cargando" @change="consultado && handleConsultar()" /><InputText v-model="buscar" placeholder="Descripci&oacute;n, referencia, concepto o nota" :disabled="cargando" @keyup.enter="handleConsultar()" /><Button icon="pi pi-search" outlined aria-label="Buscar movimientos" :disabled="cargando || !empresa" @click="handleConsultar()" /><Tag :value="`${total} movimientos`" /></div>
        <small class="ayuda-tablero">Por revisar indica que falta concepto o factura; puede tratarse de una operaci&oacute;n que no requiere CFDI. Los indicadores resumen el periodo consultado. La aplicaci&oacute;n compara el importe vinculado con el importe del movimiento.</small>
        <DataTable :value="movimientos" :loading="cargando" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100]" @page="handlePagina" dataKey="_id" scrollable scrollHeight="48vh" class="tabla-encabezados tabla-tablero" :tableStyle="{ tableLayout: 'fixed', width: '100%' }">
            <template #empty>{{ consultado ? 'No hay movimientos con estos filtros.' : 'Selecciona una empresa y consulta el periodo.' }}</template>
            <Column field="fecha" header="Fecha" style="width: 10%" />
            <Column header="Movimiento" style="width: 26%"><template #body="{ data }"><strong>{{ data.descripcion }}</strong><small class="referencia">{{ data.descripcion_2 || data.referencia }}</small></template></Column>
            <Column header="Importe" style="width: 13%"><template #body="{ data }"><span :class="data.egreso ? 'text-red-500' : 'text-green-600'">{{ handleMoneda(data.egreso || data.ingreso) }}</span><small class="referencia">{{ data.egreso ? 'Egreso' : 'Ingreso' }}</small></template></Column>
            <Column header="Concepto" style="width: 19%"><template #body="{ data }"><Tag :value="data.concepto_nombre || 'Sin concepto'" :severity="data.concepto_nombre ? 'success' : 'secondary'" /></template></Column>
            <Column header="Aplicaci&oacute;n CFDI" style="width: 22%"><template #body="{ data }"><Tag :value="handleEstado(data.estado_aplicacion)" :severity="data.estado_aplicacion === 'completo' ? 'success' : data.estado_aplicacion === 'parcial' ? 'warning' : 'secondary'" /><small class="referencia">Aplicado: {{ handleMoneda(data.aplicado) }} &middot; Pendiente: {{ handleMoneda(data.pendiente) }}</small></template></Column>
            <Column header="Detalle" style="width: 10%"><template #body="{ data }"><Button icon="pi pi-copy" text :label="String(data.facturas_relacionadas)" :severity="data.facturas_relacionadas ? 'info' : 'secondary'" title="Facturas relacionadas" :disabled="cargandoDetalle || cargando" @click="handleFacturas(data)" /><Button icon="pi pi-file-edit" text :severity="data.nota_movimiento ? 'info' : 'secondary'" title="Ver nota" aria-label="Ver nota" :disabled="cargando" @click="handleNota(data)" /></template></Column>
        </DataTable>
        </div>
    </div>
    <Dialog v-model:visible="mostrarNota" modal header="Nota del movimiento" :style="{width:'35rem',maxWidth:'95vw'}"><p class="nota-tablero">{{ nota }}</p><template #footer><Button label="Cerrar" outlined @click="mostrarNota = false" /></template></Dialog>
    <Dialog v-model:visible="mostrarDetalle" modal header="Facturas relacionadas" :style="{width:'62rem',maxWidth:'95vw'}">
        <Message v-if="errorDetalle" severity="error" :closable="false">{{ errorDetalle }}</Message>
        <DataTable :value="facturas" :loading="cargandoDetalle" paginator :rows="10" class="tabla-encabezados detalle-tablero" :tableStyle="{tableLayout:'fixed',width:'100%'}"><template #empty>Sin facturas relacionadas.</template><Column header="Comprobante"><template #body="{data}"><strong>{{ data.serie }} / {{ data.folio }}</strong><small class="referencia">{{ data.uuid }}</small></template></Column><Column field="emisor" header="Emisor" /><Column field="receptor" header="Receptor" /><Column header="Total factura"><template #body="{data}">{{ data.total === null ? 'Sin dato' : handleMoneda(data.total) }}</template></Column><Column header="Aplicado al movimiento"><template #body="{data}">{{ handleMoneda(data.aplicado) }}</template></Column></DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarDetalle = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
import Chart from 'primevue/chart';
export default { name: 'TableroFinanciero', components: { Encabezado, Chart }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
