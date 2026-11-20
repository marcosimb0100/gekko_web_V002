<template>
    <Encabezado titulo="Estado de resultados" subtitulo="Ingresos, costos, gastos y resultado del periodo" icono="pi pi-chart-line">
        <Button icon="pi pi-question-circle" text rounded title="Guía del estado de resultados" aria-label="Guía del estado de resultados" @click="mostrarAyuda=true" />
        <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" :loading="exportando" :disabled="!resultado || cargando || exportando" @click="handleExportar" />
    </Encabezado>
    <div class="card resultados-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="resultados-filtros">
            <div class="campo empresa"><label for="resultados-empresa">Empresa <span class="requerido">*</span></label><Select inputId="resultados-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || exportando" @change="handleLimpiarResultado" /></div>
            <div class="campo"><label for="resultados-desde">Desde <span class="requerido">*</span></label><DatePicker inputId="resultados-desde" v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="campo"><label for="resultados-hasta">Hasta <span class="requerido">*</span></label><DatePicker inputId="resultados-hasta" v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="opcion"><Checkbox inputId="resultados-ceros" v-model="incluirCeros" binary :disabled="cargando || exportando" @change="handleLimpiarResultado" /><label for="resultados-ceros">Incluir cuentas en cero</label></div>
            <div class="acciones"><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando || exportando" @click="handleLimpiar" /><Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || cargando || exportando" @click="handleConsultar()" /></div>
        </div>
        <template v-if="resultado">
            <div class="resultados-contexto"><div><strong>{{ resultado.empresa }}</strong><small>{{ resultado.desde }} al {{ resultado.hasta }} · MXN</small></div><Tag :value="!resultado.clasificacion_completa ? 'Revisar clasificación' : Number(resultado.totales.resultado)>0 ? 'Utilidad' : Number(resultado.totales.resultado)<0 ? 'Pérdida' : 'Sin utilidad ni pérdida'" :severity="!resultado.clasificacion_completa ? 'warn' : Number(resultado.totales.resultado)<0 ? 'danger' : 'success'" /></div>
            <div class="resultados-resumen">
                <div v-for="r in [{campo:'ingresos',nombre:'Ingresos netos'},{campo:'costos',nombre:'Costos netos'},{campo:'utilidad_bruta',nombre:'Utilidad / pérdida bruta'},{campo:'gastos',nombre:'Gastos netos'},{campo:'resultado',nombre:'Resultado del periodo'}]" :key="r.campo" :class="{'resultado-final':r.campo==='resultado'}"><small>{{ r.nombre }}</small><strong :class="{'resultado-negativo':Number(resultado.totales[r.campo])<0}">{{ handleMoneda(resultado.totales[r.campo]) }}</strong></div>
            </div>
            <Message v-if="!resultado.clasificacion_completa" severity="warn" :closable="false">Hay {{ resultado.sin_clasificar }} cuentas con movimientos sin clasificación reconocida. Se muestran en el detalle, pero no se incluyen en el resultado. Revisa el catálogo contable.</Message>
            <div class="resultados-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar cuenta o nombre" :disabled="cargando || exportando" @keydown.enter="handleBuscar" /></IconField><Button icon="pi pi-search" outlined title="Buscar cuenta" aria-label="Buscar cuenta" :disabled="cargando || exportando" @click="handleBuscar" /><Tag :value="total+' cuentas'" severity="info" /></div>
            <DataTable :value="filas" dataKey="id" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100,200]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-resultados" @page="handlePagina">
                <Column header="Grupo"><template #body="{data}"><Tag :value="data.grupo_nombre" :severity="data.grupo==='sin_clasificar' ? 'danger' : 'secondary'" /></template></Column>
                <Column header="Cuenta"><template #body="{data}"><div class="dato-doble"><strong>{{ data.codigo }}</strong><small>{{ data.nombre }}</small></div></template></Column>
                <Column header="Cargos"><template #body="{data}">{{ handleMoneda(data.cargos) }}</template></Column>
                <Column header="Abonos"><template #body="{data}">{{ handleMoneda(data.abonos) }}</template></Column>
                <Column header="Importe neto"><template #body="{data}"><strong :class="{'resultado-negativo':Number(data.neto)<0}">{{ handleMoneda(data.neto) }}</strong></template></Column>
                <template #empty>No hay movimientos de ingresos, costos o gastos para esta consulta.</template>
            </DataTable>
            <div class="resultados-totales"><strong>Ingresos − costos = utilidad bruta</strong><span>Utilidad bruta − gastos = <strong>{{ handleMoneda(resultado.totales.resultado) }}</strong></span></div>
            <small class="nota">Solo asientos contabilizados del periodo, incluidos ajustes y traspasos de cierre registrados. La búsqueda filtra la tabla; los totales y el Excel incluyen toda la consulta. No se generan pólizas ni se calculan impuestos automáticamente.</small>
        </template>
        <div v-else class="resultados-vacio"><i class="pi pi-chart-line" /><h3>Consulta el resultado de tu empresa</h3><p>Selecciona la empresa y el periodo.</p></div>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Guía del estado de resultados" modal :style="{width:'42rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Selecciona una empresa y el periodo. Se incluyen ambas fechas. Solo se suman asientos de pólizas contabilizadas; borradores y anuladas no afectan el reporte. No necesitas abrir el periodo para consultar.</p>
        <p>Las cuentas se agrupan según su tipo en el catálogo: Ingresos, Costos o Gastos. Se incluyen cuentas inactivas con historial y se evita sumar agrupadoras dos veces.</p>
        <p>Ingresos netos = abonos menos cargos. Costos y gastos netos = cargos menos abonos. Devoluciones, bonificaciones, ajustes y reversos registrados reducen o aumentan sus respectivos importes.</p>
        <p>Utilidad bruta = ingresos − costos. Resultado del periodo = utilidad bruta − gastos. Un resultado negativo representa pérdida. Los impuestos solo forman parte si fueron registrados en cuentas de resultados; no se calcula ISR u otros impuestos automáticamente.</p>
        <p>Si registraste pólizas manuales de cierre que saldan ingresos, costos y gastos dentro de estas fechas, sus movimientos también se incluyen y pueden dejar el resultado en cero. El reporte no crea ni excluye cierres automáticamente.</p>
        <p>Para cotejar con Balance general, consulta del 1 de enero hasta la misma fecha de corte: el resultado coincide con Resultado del ejercicio según saldos contabilizados, usando la misma clasificación.</p>
        <p>Incluir cuentas en cero agrega las cuentas de movimientos de resultados sin actividad. La búsqueda solo limita la tabla; los indicadores y el Excel incluyen todas las cuentas de la consulta. El Excel incluye cargos, abonos e importe neto por cuenta, sin importar la página.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'EstadoResultados',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
