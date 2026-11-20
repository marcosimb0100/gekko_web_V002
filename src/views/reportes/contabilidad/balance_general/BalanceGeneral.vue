<template>
    <Encabezado titulo="Balance general" subtitulo="Activo, pasivo y capital a una fecha de corte" icono="pi pi-building">
        <Button icon="pi pi-question-circle" text rounded title="Guía del balance general" aria-label="Guía del balance general" @click="mostrarAyuda=true" />
        <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" :loading="exportando" :disabled="!resultado || cargando || exportando" @click="handleExportar" />
    </Encabezado>
    <div class="card balance-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="balance-filtros">
            <div class="campo empresa"><label for="balance-empresa">Empresa <span class="requerido">*</span></label><Select inputId="balance-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || exportando" @change="handleLimpiarResultado" /></div>
            <div class="campo"><label for="balance-corte">Fecha de corte <span class="requerido">*</span></label><DatePicker inputId="balance-corte" v-model="corte" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="opcion"><Checkbox inputId="balance-ceros" v-model="incluirCeros" binary :disabled="cargando || exportando" @change="handleLimpiarResultado" /><label for="balance-ceros">Incluir cuentas en cero</label></div>
            <div class="acciones"><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando || exportando" @click="handleLimpiar" /><Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || cargando || exportando" @click="handleConsultar()" /></div>
        </div>
        <template v-if="resultado">
            <div class="balance-contexto"><div><strong>{{ resultado.empresa }}</strong><small>Al {{ resultado.corte }} · MXN</small></div><Tag :value="resultado.cuadra ? 'Cuadra' : 'Revisar balance'" :severity="resultado.cuadra ? 'success' : 'danger'" /></div>
            <div class="balance-resumen">
                <div><small>Activo</small><strong>{{ handleMoneda(resultado.totales.activo) }}</strong></div>
                <div><small>Pasivo</small><strong>{{ handleMoneda(resultado.totales.pasivo) }}</strong></div>
                <div><small>Capital con resultados</small><strong>{{ handleMoneda(resultado.totales.capital) }}</strong></div>
                <div><small>Resultado del ejercicio</small><strong :class="{'negativo':Number(resultado.totales.resultado_ejercicio)<0}">{{ handleMoneda(resultado.totales.resultado_ejercicio) }}</strong></div>
            </div>
            <Message v-if="!resultado.cuadra" severity="warn" :closable="false">Diferencia entre Activo y Pasivo + Capital: {{ handleMoneda(resultado.totales.diferencia) }}.<span v-if="resultado.sin_clasificar"> Hay {{ resultado.sin_clasificar }} cuentas con saldo sin clasificación reconocida.</span> Revisa las cuentas y pólizas contabilizadas.</Message>
            <div class="balance-resultado"><span>Capital registrado: <strong>{{ handleMoneda(resultado.totales.capital_registrado) }}</strong></span><span>Resultados anteriores pendientes de traspaso: <strong>{{ handleMoneda(resultado.totales.resultado_anterior) }}</strong></span></div>
            <DataTable :value="filas" dataKey="id" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100,200]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-balance" @page="handleConsultar">
                <Column header="Grupo"><template #body="{data}"><Tag :value="data.grupo_nombre" :severity="data.grupo==='sin_clasificar' ? 'danger' : 'secondary'" /></template></Column>
                <Column header="Cuenta"><template #body="{data}"><span>{{ data.codigo || 'Calculado' }}</span></template></Column>
                <Column header="Nombre"><template #body="{data}"><div class="dato-doble"><span>{{ data.nombre }}</span><small v-if="data.calculado">Solo presentación del reporte; no genera una póliza.</small></div></template></Column>
                <Column header="Saldo"><template #body="{data}"><strong :class="{'negativo':Number(data.saldo)<0}">{{ handleMoneda(data.saldo) }}</strong></template></Column>
                <template #empty>No hay cuentas con saldo para esta fecha.</template>
            </DataTable>
            <div class="balance-comprobacion"><span>Activo <strong>{{ handleMoneda(resultado.totales.activo) }}</strong></span><span>Pasivo + Capital <strong>{{ handleMoneda(resultado.totales.pasivo_capital) }}</strong></span><span>Diferencia <strong>{{ handleMoneda(resultado.totales.diferencia) }}</strong></span></div>
            <small class="nota">Solo pólizas contabilizadas. Los resultados incluyen saldos no traspasados a capital. No se duplican agrupadoras ni se incluyen cuentas de orden.</small>
        </template>
        <div v-else class="balance-vacio"><i class="pi pi-building" /><h3>Consulta la situación de tu empresa</h3><p>Selecciona la empresa y la fecha de corte.</p></div>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Guía del balance general" modal :style="{width:'42rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Selecciona empresa y fecha de corte. El reporte acumula los asientos de todas las pólizas contabilizadas hasta esa fecha, incluyendo cuentas inactivas con historial. No requiere periodos abiertos ni modifica la operación.</p>
        <p>Las cuentas se presentan según su tipo en el catálogo: Activo, Pasivo o Capital. Un saldo contrario al lado habitual del grupo aparece negativo. Las cuentas agrupadoras no se vuelven a sumar y las cuentas de orden quedan fuera del balance.</p>
        <p>Capital incluye el saldo registrado en sus cuentas y los resultados que aún permanezcan en ingresos, costos y gastos. Se separan los resultados anteriores al 1 de enero y los del ejercicio de la fecha de corte.</p>
        <p>Si ya contabilizaste el traspaso de resultados a Capital, los saldos trasladados dejan de sumarse como resultado calculado. El reporte no crea una póliza de cierre. Después de un traspaso, Resultado del ejercicio muestra el saldo que aún permanezca en esas cuentas.</p>
        <p>Cuadra comprueba Activo = Pasivo + Capital. Una diferencia o una cuenta con saldo sin clasificación requiere revisión; no se ajustan importes automáticamente.</p>
        <p>La exportación incluye todas las cuentas de la consulta, sin importar la página de la tabla. Incluir cuentas en cero agrega las cuentas de movimientos de Activo, Pasivo y Capital que no tienen saldo.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'BalanceGeneral',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
