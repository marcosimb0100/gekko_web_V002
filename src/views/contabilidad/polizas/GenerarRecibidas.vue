<template>
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <template v-if="!detalle">
        <div class="compra-filtros">
            <div><label>Empresa <span class="requerido">*</span></label><Select v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter :disabled="ocupado" placeholder="Selecciona una empresa" @change="handleLimpiar" /></div>
            <div><label>Desde</label><DatePicker v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="ocupado" @update:modelValue="handleLimpiar" /></div>
            <div><label>Hasta</label><DatePicker v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="ocupado" @update:modelValue="handleLimpiar" /></div>
            <Button label="Consultar" icon="pi pi-search" outlined :disabled="ocupado || !empresa" @click="handleConsultar(0)" />
        </div>
        <Message severity="info" :closable="false">Facturas recibidas importadas a Gekko. Asigna una cuenta a cada concepto y revisa los impuestos antes de generar el borrador. El pago se registra por separado.</Message>
        <DataTable :value="filas" :loading="ocupado" size="small" scrollable scrollHeight="22rem" class="compra-tabla">
            <Column header="Factura"><template #body="{data}"><strong>{{ data.serie_folio }}</strong><small>{{ data.fecha }}</small><small>{{ data.uuid }}</small></template></Column>
            <Column header="Proveedor / importe"><template #body="{data}">{{ data.proveedor }}<small>{{ handleMoneda(data.total) }}</small></template></Column>
            <Column header="Validación"><template #body="{data}"><Tag :value="data.disponible ? 'Por asignar' : 'No disponible'" :severity="data.disponible ? 'info' : 'secondary'" /><small>{{ data.motivo }}</small></template></Column>
            <Column header="Opciones" style="width:9rem"><template #body="{data}"><Button label="Asignar" icon="pi pi-pencil" outlined :disabled="ocupado || !data.disponible" @click="handleDetalle(data)" /></template></Column>
            <template #empty>No hay facturas recibidas con estos filtros.</template>
        </DataTable>
        <Paginator :first="offset" :rows="25" :totalRecords="total" :disabled="ocupado" @page="!ocupado && handleConsultar($event.first)" />
    </template>
    <template v-else>
        <div class="compra-contexto"><strong>{{ detalle.proveedor }}</strong><small>{{ detalle.uuid }} · {{ detalle.fecha }}</small></div>
        <Message v-if="resultado" severity="success" :closable="false">{{ resultado }}</Message>
        <template v-else>
            <Fieldset legend="Cuenta sugerida del proveedor">
                <div class="compra-sugerencia">
                    <Select v-model="sugerida" :options="detalle.opciones" optionLabel="etiqueta" optionValue="id" filter showClear placeholder="Sin cuenta sugerida" :disabled="ocupado" />
                    <Button label="Guardar sugerencia" icon="pi pi-save" outlined :disabled="ocupado" @click="handleSugerencia" />
                    <Button label="Aplicar a conceptos" outlined :disabled="ocupado || !sugerida" @click="handleAplicar" />
                </div>
                <small>Solo para este proveedor y empresa. Es una sugerencia para futuras facturas; puedes cambiar la cuenta de cada concepto.</small>
            </Fieldset>
            <DataTable :value="detalle.conceptos" size="small" scrollable scrollHeight="19rem" class="compra-tabla">
                <Column header="Concepto"><template #body="{data}"><strong>{{ data.partida }} · {{ data.descripcion }}</strong><small>Clave SAT: {{ data.clave_sat }}</small></template></Column>
                <Column header="Importe / descuento" style="width:10rem"><template #body="{data}">{{ handleMoneda(data.importe) }}<small>Descuento: {{ handleMoneda(data.descuento) }}</small></template></Column>
                <Column header="Cuenta contable *"><template #body="{data}"><Select v-model="data.cuenta_id" :options="detalle.opciones" optionLabel="etiqueta" optionValue="id" filter placeholder="Selecciona una cuenta" :disabled="ocupado" class="compra-cuenta" @change="handleInvalidar" /></template></Column>
            </DataTable>
            <template v-if="vista">
                <Message v-for="a in vista.avisos" :key="a" severity="warn" :closable="false">{{ a }}</Message>
                <h3>Partidas propuestas</h3>
                <DataTable :value="vista.partidas" size="small" scrollable scrollHeight="14rem" class="compra-tabla">
                    <Column header="Cuenta"><template #body="{data}">{{ data.codigo }} · {{ data.nombre }}</template></Column><Column field="cargo" header="Cargo" /><Column field="abono" header="Abono" />
                </DataTable>
                <p>Cargos: {{ handleMoneda(vista.cargos) }} · Abonos: {{ handleMoneda(vista.abonos) }}</p>
                <small>Revisa la clasificación y el tratamiento de los impuestos. El borrador no afecta saldos hasta contabilizarlo.</small>
            </template>
        </template>
        <div class="compra-acciones">
            <Button label="Volver al listado" outlined :disabled="ocupado" @click="handleVolver" />
            <Button v-if="!resultado" label="Revisar partidas" icon="pi pi-eye" outlined :loading="ocupado" :disabled="ocupado || !completo" @click="handleRevisar" />
            <Button v-if="vista && !resultado" label="Generar borrador" icon="pi pi-check" :disabled="ocupado" @click="handleGenerar" />
        </div>
    </template>
</template>
<script>
import Button from 'primevue/button';
import Message from 'primevue/message';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Paginator from 'primevue/paginator';
import Tag from 'primevue/tag';
import Fieldset from 'primevue/fieldset';
import proceso from './js/generarRecibidas.js';
export default {name:'GenerarRecibidas',components:{Button,Message,Select,DatePicker,DataTable,Column,Paginator,Tag,Fieldset},emits:['generadas','ocupado'],setup(props,{emit}){return proceso(emit);}};
</script>
<style scoped>
@import './css/generarRecibidas.css';
</style>
