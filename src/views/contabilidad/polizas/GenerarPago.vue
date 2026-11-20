<template>
    <Button label="Póliza de pago" icon="pi pi-book" outlined size="small" :disabled="disabled" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Póliza del pago bancario" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'52rem',maxWidth:'95vw'}">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="datos.existente" severity="info" :closable="false">Esta conciliación ya tiene la póliza {{ datos.folio }} ({{ datos.estado }}). Puedes revisarla en Contabilidad → Pólizas.</Message>
        <template v-else-if="datos.huella">
            <div class="pago-contexto"><strong>{{ datos.empresa }}</strong><span>{{ datos.banco }}</span><small>{{ datos.uuid }}</small></div>
            <div class="pago-resumen"><span>Fecha bancaria: <strong>{{ datos.fecha }}</strong></span><span>Importe aplicado: <strong>{{ handleMoneda(datos.importe) }}</strong></span></div>
            <Message severity="info" :closable="false">Los impuestos pendientes configurados en la póliza original se reclasifican proporcionalmente. Las facturas anteriores sin ese desglose conservan su tratamiento directo.</Message>
            <DataTable :value="datos.partidas" size="small" class="pago-tabla">
                <Column header="Cuenta"><template #body="{data}">{{ data.codigo }} · {{ data.nombre }}</template></Column>
                <Column header="Cargo"><template #body="{data}">{{ handleMoneda(data.cargo) }}</template></Column>
                <Column header="Abono"><template #body="{data}">{{ handleMoneda(data.abono) }}</template></Column>
            </DataTable>
            <Message severity="info" :closable="false">Se generará un borrador por esta aplicación. No registra otro depósito ni modifica la factura. Revisa y contabiliza la póliza desde Contabilidad → Pólizas.</Message>
        </template>
        <template #footer><Button label="Cerrar" outlined :disabled="ocupado" @click="mostrar=false" /><Button v-if="datos.huella && !datos.existente" label="Generar borrador" icon="pi pi-check" :loading="ocupado" :disabled="ocupado" @click="handleGenerar" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import proceso from './js/generarPago.js';
export default {name:'GenerarPago',components:{Button,Dialog,Message,DataTable,Column},props:{conciliacionId:{type:String,required:true},disabled:Boolean},setup(props){return proceso(props);}};
</script>
<style scoped>
@import './css/generarPago.css';
</style>
