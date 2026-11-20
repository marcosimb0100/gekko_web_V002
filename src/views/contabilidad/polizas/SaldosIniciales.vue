<template>
    <Button label="Saldos iniciales" icon="pi pi-wallet" outlined :disabled="disabled" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Saldos iniciales contables" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'70rem',maxWidth:'96vw'}">
        <div class="apertura-contenido">
            <div class="apertura-contexto"><div><strong>{{ empresa.nombre }}</strong><small>Una apertura vigente por empresa · MXN</small></div><div><small>Inicio contable</small><strong>{{ datos?.fecha_inicio || 'Sin configurar' }}</strong></div></div>
            <Message v-if="datos?.fecha" severity="info" :closable="false">Fecha de la póliza de apertura: <strong>{{ datos.fecha }}</strong>. Se registra al cierre del periodo anterior y se administra desde el primer mes de operación.</Message>
            <Message severity="info" :closable="false">Captura los saldos que la empresa tenía justo antes de comenzar a registrar operaciones en Gekko. No incluyas nuevamente movimientos ya registrados. Tu contador debe revisar los importes; la diferencia no se ajusta automáticamente.</Message>
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <template v-if="datos">
                <Message v-if="!datos.habilitada" severity="warn" :closable="false">Habilita la integración contable y configura su fecha de inicio en Empresas.</Message>
                <Message v-else-if="!datos.periodo_abierto" severity="warn" :closable="false">Abre el mes de la fecha de inicio en Periodos contables.</Message>
                <Message v-if="datos.existente" severity="info" :closable="false">Ya existe la apertura {{ datos.existente.folio }} ({{ datos.existente.estado }}). Puedes revisarla desde Pólizas. Solo un borrador se puede modificar o anular.</Message>
                <Button v-if="datos.existente" label="Abrir póliza de apertura" icon="pi pi-folder-open" outlined :disabled="ocupado" @click="handleExistente" />
                <template v-else>
                    <div class="apertura-herramientas"><span>{{ partidas.length }} de 200 cuentas</span><Button label="Agregar cuenta" icon="pi pi-plus" outlined :disabled="ocupado || partidas.length>=200" @click="handleAgregar" /></div>
                    <DataTable :value="partidas" size="small" scrollable scrollHeight="20rem">
                        <Column header="Cuenta" style="min-width:18rem"><template #body="{data,index}"><Select v-model="data.cuenta_id" :inputId="'apertura-cuenta-'+index" :options="datos.cuentas" optionLabel="etiqueta" optionValue="id" filter placeholder="Selecciona una cuenta" :disabled="ocupado" fluid /></template></Column>
                        <Column header="Saldo deudor (cargo)" style="min-width:12rem"><template #body="{data,index}"><InputNumber v-model="data.cargo" :inputId="'apertura-cargo-'+index" mode="decimal" locale="es-MX" :min="0" :max="999999999999.99" :minFractionDigits="2" :maxFractionDigits="2" :disabled="ocupado" fluid /></template></Column>
                        <Column header="Saldo acreedor (abono)" style="min-width:12rem"><template #body="{data,index}"><InputNumber v-model="data.abono" :inputId="'apertura-abono-'+index" mode="decimal" locale="es-MX" :min="0" :max="999999999999.99" :minFractionDigits="2" :maxFractionDigits="2" :disabled="ocupado" fluid /></template></Column>
                        <Column style="width:3rem"><template #body="{index}"><Button icon="pi pi-trash" text severity="danger" aria-label="Quitar cuenta" :disabled="ocupado || partidas.length<=2" @click="handleQuitar(index)" /></template></Column>
                        <template #empty>Agrega las cuentas con saldo.</template>
                    </DataTable>
                    <div class="apertura-totales"><div><small>Total cargos</small><strong>{{ handleMoneda(totales.cargos) }}</strong></div><div><small>Total abonos</small><strong>{{ handleMoneda(totales.abonos) }}</strong></div><div><small>Diferencia</small><strong :class="totales.diferencia ? 'apertura-error' : 'apertura-ok'">{{ handleMoneda(totales.diferencia) }}</strong></div></div>
                    <small>Una partida por cuenta, con importe en cargo o abono. Los totales deben coincidir y ser mayores a cero. Guardar crea un borrador; después ábrelo, revísalo y pulsa Contabilizar para afectar balanza, auxiliares y estados financieros.</small>
                </template>
            </template>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="ocupado" @click="mostrar=false" /><Button v-if="!datos?.existente" label="Guardar apertura en borrador" icon="pi pi-save" :disabled="ocupado || !valido" :loading="ocupado" @click="handleGuardar" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import proceso from './js/saldosIniciales';
export default {name:'SaldosIniciales',components:{Button,Dialog,Message,DataTable,Column,Select,InputNumber},props:{empresa:{type:Object,required:true},disabled:Boolean},emits:['abrir','guardada'],setup(props,{emit}){return {...proceso(props,emit)};}};
</script>
<style scoped>
@import './css/saldosIniciales.css';
</style>
