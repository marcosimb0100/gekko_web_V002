<template>
    <Button label="Revertir" icon="pi pi-undo" severity="danger" outlined :disabled="disabled || ocupado" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Revertir cobro o pago" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'38rem',maxWidth:'95vw'}">
        <div class="reversion-contenido">
            <div class="reversion-contexto"><strong>{{ poliza.folio }}</strong><span>{{ poliza.concepto }}</span></div>
            <Message severity="warn" :closable="false">Se registrará una póliza inversa contabilizada, incluidos sus impuestos. El original se conserva. Se retirará la aplicación de conciliación para poder corregirla; no se elimina ni se modifica el importe del movimiento bancario.</Message>
            <div class="reversion-campo"><label for="reversion-fecha">Fecha de reversión <span>*</span></label><DatePicker inputId="reversion-fecha" v-model="fecha" dateFormat="yy-mm-dd" showIcon :manualInput="false" :minDate="fechaMinima" :disabled="ocupado" /><small>Debe pertenecer a un periodo abierto y ser igual o posterior a la póliza original. Su mes original puede estar cerrado.</small></div>
            <div class="reversion-campo"><label for="reversion-motivo">Motivo <span>*</span></label><Textarea inputId="reversion-motivo" v-model="motivo" rows="3" maxlength="500" :disabled="ocupado" /><small>De 5 a 500 caracteres. Los abonos con impuestos se revierten desde el más reciente.</small></div>
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="ocupado" @click="mostrar=false" /><Button label="Confirmar reversión" icon="pi pi-undo" severity="danger" :loading="ocupado" :disabled="!valido || ocupado" @click="handleRevertir" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import proceso from './js/revertirPoliza.js';
export default {name:'RevertirPoliza',components:{Button,Dialog,Message,DatePicker,Textarea},props:{poliza:{type:Object,required:true},disabled:Boolean},emits:['revertida'],setup(props,{emit}){return {...proceso(props,emit)};}};
</script>
<style scoped>
@import './css/revertirPoliza.css';
</style>
