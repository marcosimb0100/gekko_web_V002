<template>
    <Button label="Deshacer catálogo base" icon="pi pi-undo" severity="danger" outlined :disabled="disabled" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Deshacer carga del catálogo base" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'58rem',maxWidth:'96vw'}">
        <div class="deshacer-base">
            <strong>{{ empresa.nombre }}</strong>
            <Message severity="warn" :closable="false">Se retirarán las cuentas creadas por la última carga y se desharán sus asociaciones. Los datos previos se conservan. No se permite si las cuentas ya se utilizaron o se modificaron después.</Message>
            <Button label="Revisar carga" icon="pi pi-refresh" outlined :disabled="ocupado" :loading="ocupado" @click="handleConsultar" />
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <template v-if="vista">
                <Message v-if="!vista.carga_id" severity="info" :closable="false">{{ mensaje }}</Message>
                <Message v-for="b in vista.bloqueos" :key="b" severity="error" :closable="false">{{ b }}</Message>
                <DataTable v-if="vista.elementos.length" :value="vista.elementos" paginator :rows="10" scrollable scrollHeight="20rem" size="small" class="deshacer-tabla"><Column field="tipo" header="Elemento" /><Column field="nombre" header="Dato de la carga" /></DataTable>
                <div v-if="vista.carga_id" class="deshacer-motivo"><label for="motivo-deshacer-base">Motivo <span>*</span></label><Textarea id="motivo-deshacer-base" v-model="motivo" rows="2" maxlength="500" :disabled="ocupado || !!vista.bloqueos.length" placeholder="Indica por qué deseas deshacer esta carga" /><small>Se conservará una bitácora de esta operación.</small></div>
            </template>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="ocupado" @click="mostrar=false" /><Button label="Confirmar y deshacer" icon="pi pi-undo" severity="danger" :loading="ocupado" :disabled="!puedeGuardar" @click="handleGuardar" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Textarea from 'primevue/textarea';
import proceso from './js/deshacerCatalogoBase';
export default {name:'DeshacerCatalogoBase',components:{Button,Dialog,Message,DataTable,Column,Textarea},props:{empresa:{type:Object,required:true},disabled:Boolean},emits:['guardado'],setup(props,{emit}){return {...proceso(props,emit)};}};
</script>
<style scoped>
@import './css/deshacerCatalogoBase.css';
</style>
