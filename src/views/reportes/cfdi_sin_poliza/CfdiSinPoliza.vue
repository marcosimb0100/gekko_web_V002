<template>
    <Encabezado titulo="CFDI sin póliza" subtitulo="Consulta por empresa de facturas vigentes" icono="pi pi-wallet">
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
            <Tag :value="total+' facturas'" severity="info" />
        </div>
        <small class="nota">{{ esPoliza ? 'Sin contabilizar: incluye sin vínculo, borradores y anuladas. No detecta referencias escritas libremente en pólizas manuales.' : 'Saldo según complementos vigentes y conciliación bancaria se muestran por separado. PUE no acredita por sí solo un cobro. No se determina vencimiento sin una fecha registrada.' }}</small>
        <DataTable :value="filas" dataKey="uuid" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-cartera" @page="handleConsultar">
            <Column header="Factura"><template #body="{data}"><div class="dato"><strong>{{ data.folio }}</strong><small>{{ data.uuid }}</small><small>{{ data.fecha }} · {{ data.metodo }}</small></div></template></Column>
            <Column header="Cliente / proveedor"><template #body="{data}"><div class="dato"><span>{{ data.nombre }}</span><small>{{ data.rfc }}</small></div></template></Column>
            <Column header="Total"><template #body="{data}">{{ handleImporte(data.total,data.moneda) }}</template></Column>
            <Column v-if="!esPoliza" header="Según complementos"><template #body="{data}"><div class="dato"><span>Pendiente: {{ handleImporte(data.pendiente,data.moneda) }}</span><small>Pagado: {{ handleImporte(data.pagado,data.moneda) }}</small></div></template></Column>
            <Column v-if="!esPoliza" header="Conciliación bancaria"><template #body="{data}"><div class="dato"><span>Pendiente: {{ handleImporte(data.pendiente_banco,data.moneda) }}</span><small>Aplicado: {{ handleImporte(data.aplicado_banco,data.moneda) }}</small></div></template></Column>
            <Column header="Estado"><template #body="{data}"><div class="dato"><Tag :value="data.estado" severity="info" /><small v-if="esPoliza">{{ data.polizas }}</small></div></template></Column>
            <template #empty>No hay facturas con estos filtros. Selecciona empresa y consulta el periodo de emisión.</template>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Sobre este reporte" modal :style="{width:'38rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Consulta facturas de ingreso vigentes de la empresa y periodo de emisión seleccionados. No modifica pagos, bancos ni pólizas.</p>
        <p v-if="!esPoliza">El saldo según complementos resta los pagos de complementos vigentes. El pendiente bancario resta las aplicaciones activas de conciliación. Son dos comprobaciones distintas: no deben sumarse. No incluye obligaciones sin CFDI ni sustituye Pagos programados. Los importes conservan la moneda de cada factura.</p>
        <p v-else>La relación se identifica por UUID de origen y empresa de la póliza. Una póliza contabilizada queda fuera; un borrador o una anulada aparecen con su estado. No incluye complementos de pago ni notas de crédito.</p>
        <p>Excel exporta todas las filas de la consulta, hasta 10,000 facturas. El buscador aplica a nombre, RFC, UUID y folio.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'CfdiSinPoliza',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
