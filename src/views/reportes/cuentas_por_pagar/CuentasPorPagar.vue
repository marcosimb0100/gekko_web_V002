<template>
    <Encabezado titulo="Cuentas por pagar" subtitulo="Consulta por empresa de facturas vigentes" icono="pi pi-wallet">
        <Button icon="pi pi-question-circle" text rounded aria-label="Ayuda" @click="mostrarAyuda=true" />
        <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" :disabled="!total || cargando" :loading="exportando" @click="handleExportar" />
    </Encabezado>
    <div class="card cartera-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="cartera-filtros">
            <div class="campo empresa"><label>Empresa <span class="requerido">*</span></label><Select v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || exportando" @change="handleLimpiarResultado" /></div>
            <div class="campo"><label>Emisión desde</label><DatePicker v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="campo"><label>Hasta</label><DatePicker v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div v-if="esPoliza" class="campo"><label>Facturas</label><Select v-model="direccion" :options="direcciones" optionLabel="label" optionValue="value" :disabled="cargando || exportando" @change="handleLimpiarResultado" /></div>
            <Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || cargando || exportando" @click="handleConsultar()" />
        </div>
        <div class="cartera-herramientas">
            <InputText v-model="buscar" placeholder="Nombre, RFC, UUID o folio" :disabled="cargando || exportando" @keyup.enter="handleConsultar()" />
            <Select v-model="estado" :options="estados" optionLabel="label" optionValue="value" :disabled="cargando || exportando" @change="handleConsultar()" />
            <Button label="Buscar" icon="pi pi-search" outlined :disabled="!empresa || cargando || exportando" @click="handleConsultar()" />
            <Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando || exportando" @click="handleLimpiar" />
            <Select v-model="antiguedad" :options="opcionesEdad" optionLabel="label" optionValue="value" :disabled="cargando" @change="handleConsultar()" />
            <Tag :value="total+' facturas'" severity="info" />
        </div>
        <div class="resumen-cartera" v-for="(dato,moneda) in resumen" :key="moneda">
            <Tag :value="moneda" /><span>Pendiente: <strong>{{ handleImporte(dato.pendiente,moneda) }}</strong></span><span>Vencido: <strong>{{ handleImporte(dato.vencido,moneda) }}</strong></span><span>Próximos 7 días: <strong>{{ handleImporte(dato.proximos,moneda) }}</strong></span><span>Sin vencimiento: {{ handleImporte(dato.sin_fecha,moneda) }}</span>
        </div>
        <small class="nota">El saldo usa una sola fuente por factura; complementos y banco no se suman. Los resúmenes corresponden a los filtros consultados y a la fecha de hoy.</small>
        <DataTable :value="filas" dataKey="uuid" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-cartera" @page="handleConsultar">
            <Column header="Factura"><template #body="{data}"><div class="dato"><strong>{{ data.folio }}</strong><small>{{ data.uuid }}</small><small>{{ data.fecha }} · {{ data.metodo }}</small></div></template></Column>
            <Column header="Cliente / proveedor"><template #body="{data}"><div class="dato"><span>{{ data.nombre }}</span><small>{{ data.rfc }}</small></div></template></Column>
            <Column header="Total"><template #body="{data}">{{ handleImporte(data.total,data.moneda) }}</template></Column>
            <Column header="Saldo de cartera"><template #body="{data}"><div class="dato"><strong>{{ handleImporte(data.saldo_cartera,data.moneda) }}</strong><small>Abonado: {{ handleImporte(data.abonado_cartera,data.moneda) }}</small><small>{{ data.fuente==='banco'?'Fuente: banco':'Fuente: complementos' }}</small></div></template></Column>
            <Column header="Vencimiento"><template #body="{data}"><div class="dato"><span>{{ data.vencimiento || 'Sin confirmar' }}</span><Tag :value="data.antiguedad" :severity="data.dias_atraso?'danger':'info'" /><small v-if="data.dias_atraso">{{ data.dias_atraso }} días de atraso</small></div></template></Column>
            <Column header="Opciones"><template #body="{data}"><Button icon="pi pi-pencil" label="Vencimiento" text :disabled="cargando" @click="handleVencimiento(data)" /></template></Column>
            <Column header="Estado"><template #body="{data}"><div class="dato"><Tag :value="data.estado" severity="info" /><small v-if="esPoliza">{{ data.polizas }}</small></div></template></Column>
            <template #empty>No hay facturas con estos filtros. Selecciona empresa y consulta el periodo de emisión.</template>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrarVencimiento" header="Vencimiento de la factura" modal :closable="!guardando" :style="{width:'40rem'}" :breakpoints="{'640px':'95vw'}">
        <div class="formulario-vencimiento">
            <strong>{{ formulario.nombre }} · {{ formulario.folio }}</strong>
            <label>Plazo en días</label><InputNumber v-model="formulario.dias" :min="0" :max="3650" :disabled="guardando" />
            <Button label="Proponer desde la emisión" outlined :disabled="guardando" @click="handleProponer" />
            <div><Checkbox v-model="formulario.guardar_plazo" binary inputId="guardarPlazo" :disabled="guardando" /><label for="guardarPlazo"> Usar este plazo para este cliente o proveedor en esta empresa</label></div>
            <label>Vencimiento confirmado <span class="requerido">*</span></label><DatePicker v-model="formulario.vencimiento" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="guardando" />
            <label>Fuente para calcular los abonos</label><Select v-model="formulario.fuente" :options="fuentes" optionLabel="label" optionValue="value" :disabled="guardando" />
            <small>Elige la fuente que acredita los pagos de esta factura. Se toma solo esa fuente, sin sumarla a la otra. PUE no equivale a un pago confirmado.</small>
            <label>Motivo <span class="requerido">*</span></label><Textarea v-model="formulario.motivo" rows="2" maxlength="500" :disabled="guardando" />
            <small>El plazo guardado no cambia otras facturas. Confirma sus vencimientos por separado; cada cambio conserva historial.</small>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrarVencimiento=false" /><Button label="Guardar" icon="pi pi-save" :loading="guardando" :disabled="!formulario.vencimiento || !formulario.motivo.trim() || guardando" @click="handleGuardarVencimiento" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" header="Sobre este reporte" modal :style="{width:'38rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Consulta facturas de ingreso vigentes de la empresa y periodo de emisión seleccionados. No modifica pagos, bancos ni pólizas.</p>
        <p v-if="!esPoliza">El saldo de cartera usa complementos vigentes o aplicaciones bancarias, según la fuente elegida por factura. Nunca los suma. No incluye obligaciones sin CFDI ni sustituye Pagos programados. Confirma los vencimientos desde el botón de cada factura; las facturas anteriores no reciben fechas supuestas. La antigüedad se calcula respecto a hoy y cada moneda se presenta por separado.</p>
        <p v-else>La relación se identifica por UUID de origen y empresa de la póliza. Una póliza contabilizada queda fuera; un borrador o una anulada aparecen con su estado. No incluye complementos de pago ni notas de crédito.</p>
        <p>Excel exporta todas las filas de la consulta, hasta 10,000 facturas. El buscador aplica a nombre, RFC, UUID y folio.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'CuentasPorPagar',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
