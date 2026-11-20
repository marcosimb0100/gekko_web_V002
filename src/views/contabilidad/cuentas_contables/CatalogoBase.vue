<template>
    <Button label="Cargar catálogo base" icon="pi pi-sitemap" outlined :disabled="disabled" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Cargar catálogo base" modal :closable="!ocupado" :closeOnEscape="!ocupado" :style="{width:'68rem',maxWidth:'96vw'}">
        <div class="base-contenido">
            <Message severity="info" :closable="false">Plantilla General para {{ empresa.nombre }}. Completa cuentas y asociaciones vacías. No reemplaza datos existentes ni genera saldos, movimientos o pólizas.</Message>
            <div class="base-opciones"><div v-for="o in opciones" :key="o.campo"><Checkbox v-model="seleccion[o.campo]" :inputId="'base-'+o.campo" binary :disabled="ocupado" @change="handleLimpiar" /><label :for="'base-'+o.campo">{{ o.nombre }}</label></div></div>
            <small>Los conceptos se proponen contra Ventas e ingresos. Los impuestos pendientes se conservan para configuración manual; la carga no cambia el tratamiento de cobro o pago. Revisa la propuesta con tu contador.</small>
            <Button label="Ver propuesta" icon="pi pi-search" outlined :loading="ocupado" :disabled="ocupado" @click="handleConsultar" />
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <template v-if="vista">
                <Message v-for="c in vista.conflictos" :key="c" severity="error" :closable="false">{{ c }}</Message>
                <Message v-for="c in vista.pendientes" :key="c" severity="warn" :closable="false">{{ c }}</Message>
                <Tabs value="cuentas"><TabList><Tab value="cuentas">Cuentas ({{ vista.cuentas.length }})</Tab><Tab value="asociaciones">Asociaciones ({{ vista.asociaciones.length }})</Tab></TabList><TabPanels>
                    <TabPanel value="cuentas"><DataTable :value="vista.cuentas" paginator :rows="10" scrollable scrollHeight="flex" size="small"><Column field="codigo" header="Código" /><Column field="nombre" header="Cuenta" /><Column field="codigo_padre" header="Padre" /><Column header="Uso"><template #body="{data}">{{ data.permite_movimientos ? 'Movimientos' : 'Agrupadora' }}</template></Column><Column field="accion" header="Acción" /></DataTable></TabPanel>
                    <TabPanel value="asociaciones"><DataTable :value="vista.asociaciones" paginator :rows="10" size="small"><Column field="tipo" header="Origen" /><Column field="nombre" header="Registro" /><Column field="campo" header="Asignación" /><Column field="codigo" header="Cuenta propuesta" /></DataTable></TabPanel>
                </TabPanels></Tabs>
            </template>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="ocupado" @click="mostrar=false" /><Button label="Confirmar carga" icon="pi pi-check" :loading="ocupado" :disabled="ocupado || !vista || !!vista.conflictos.length" @click="handleGuardar" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import proceso from './js/catalogoBase';
export default {name:'CatalogoBase',components:{Button,Checkbox,Dialog,Message,DataTable,Column,Tabs,TabList,Tab,TabPanels,TabPanel},props:{empresa:{type:Object,required:true},disabled:Boolean},emits:['guardado'],setup(props,{emit}){return {...proceso(props,emit)};}};
</script>
<style scoped>
@import './css/catalogoBase.css';
</style>
