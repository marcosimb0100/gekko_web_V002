<template>
    <Button label="Generar desde CFDI" icon="pi pi-file-import" outlined @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Generar pólizas desde CFDI" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'70rem',maxWidth:'96vw'}" class="generar-cfdi">
        <SelectButton v-model="tipoOrigen" :options="[{nombre:'Emitidas',valor:'emitidas'},{nombre:'Recibidas',valor:'recibidas'}]" optionLabel="nombre" optionValue="valor" :allowEmpty="false" :disabled="ocupado" />
        <GenerarRecibidas v-if="tipoOrigen === 'recibidas'" @ocupado="ocupado=$event" @generadas="$emit('generadas')" />
        <template v-else>
        <Message severity="info" :closable="false">Facturas emitidas y timbradas desde Gekko. Se generan borradores para revisión; los saldos cambian al contabilizarlos. Los cobros se registran por separado.</Message>
        <div class="cfdi-filtros">
            <div><label>Empresa *</label><Select v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una empresa" :disabled="ocupado" @change="handleLimpiar" /></div>
            <div><label>Desde</label><DatePicker v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="ocupado" @update:modelValue="handleLimpiar" /></div>
            <div><label>Hasta</label><DatePicker v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="ocupado" @update:modelValue="handleLimpiar" /></div>
            <Button label="Consultar" icon="pi pi-search" outlined :disabled="ocupado || !empresa" @click="handleConsultar(0)" />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <small>Consulta hasta 366 días. Las facturas anteriores al inicio contable, canceladas o con póliza vinculada se muestran con su motivo.</small>
        <DataTable :value="filas" :loading="ocupado" size="small" scrollable scrollHeight="20rem" class="cfdi-tabla">
            <Column header="Elegir" style="width:5rem"><template #body="{data}"><Checkbox v-model="seleccion" :value="data.solicitud_id" :disabled="ocupado || !data.generable" :aria-label="'Elegir factura '+data.serie_folio" /></template></Column>
            <Column header="Factura"><template #body="{data}"><strong>{{ data.serie_folio }}</strong><small>{{ data.fecha }}</small><small class="cfdi-uuid">{{ data.uuid }}</small></template></Column>
            <Column header="Receptor / importe"><template #body="{data}">{{ data.receptor || 'Consulta el motivo' }}<small v-if="data.total">{{ handleMoneda(data.total) }}</small></template></Column>
            <Column header="Validación"><template #body="{data}"><Tag :value="data.generable ? 'Disponible' : 'No disponible'" :severity="data.generable ? 'success' : 'secondary'" /><small>{{ data.motivo }}</small></template></Column>
            <Column header="Revisar"><template #body="{data}"><Button icon="pi pi-eye" text title="Revisar partidas" :disabled="ocupado || !data.generable" @click="vista=data" /></template></Column>
            <template #empty>No hay facturas para mostrar con esta consulta.</template>
        </DataTable>
        <Paginator :first="offset" :rows="25" :totalRecords="total" :disabled="ocupado" @page="!ocupado && handleConsultar($event.first)" />
        <Message v-if="resultado" severity="success" :closable="false">{{ resultado }}</Message>
        </template>
        <template #footer><Button label="Cerrar" outlined :disabled="ocupado" @click="mostrar=false" /><Button v-if="tipoOrigen === 'emitidas'" label="Generar borradores seleccionados" icon="pi pi-book" :loading="ocupado" :disabled="ocupado || !seleccion.length" @click="confirmar=true" /></template>
    </Dialog>
    <Dialog :visible="!!vista" header="Partidas propuestas" modal :style="{width:'55rem',maxWidth:'95vw'}" @update:visible="vista=null">
        <template v-if="vista">
            <p>{{ vista.serie_folio }} · {{ vista.receptor }}</p>
            <Message v-for="a in vista.avisos" :key="a" severity="warn" :closable="false">{{ a }}</Message>
            <DataTable :value="vista.partidas" size="small"><Column header="Cuenta"><template #body="{data}">{{ data.codigo }} · {{ data.nombre }}</template></Column><Column field="cargo" header="Cargo" /><Column field="abono" header="Abono" /></DataTable>
            <p>Cargos: {{ handleMoneda(vista.cargos) }} · Abonos: {{ handleMoneda(vista.abonos) }}</p>
        </template>
    </Dialog>
    <Dialog v-model:visible="confirmar" header="Confirmar generación" modal :style="{width:'30rem'}">
        <p>Se crearán {{ seleccion.length }} borradores, uno por factura. Revísalos en Pólizas antes de contabilizar.</p>
        <template #footer><Button label="Cancelar" outlined @click="confirmar=false" /><Button label="Generar borradores" icon="pi pi-check" @click="handleGenerar" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Checkbox from 'primevue/checkbox';
import Paginator from 'primevue/paginator';
import Tag from 'primevue/tag';
import proceso from './js/generarCfdi.js';
import SelectButton from 'primevue/selectbutton';
import GenerarRecibidas from './GenerarRecibidas.vue';
import { ref } from 'vue';
export default {name:'GenerarCfdi',components:{GenerarRecibidas,SelectButton,Button,Dialog,Message,Select,DatePicker,DataTable,Column,Checkbox,Paginator,Tag},emits:['generadas'],setup(props,{emit}){return {...proceso(emit),tipoOrigen:ref('emitidas')};}};
</script>
<style scoped>
@import './css/generarCfdi.css';
</style>
