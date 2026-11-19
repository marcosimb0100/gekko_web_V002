<template>
    <Button icon="pi pi-book" outlined rounded aria-label="Cuentas contables" title="Cuentas contables" :disabled="!registroId" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Cuentas contables de facturación" modal :style="{width:'49rem'}" :breakpoints="{'800px':'95vw'}" :closable="!guardando" :closeOnEscape="!guardando">
        <div class="vinculo-facturacion">
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <div v-if="cargando" class="vinculo-cargando"><ProgressSpinner style="width:30px;height:30px" /><span>Consultando asignación…</span></div>
            <template v-else-if="datos">
                <div class="vinculo-contexto"><div><strong>{{ datos.origen.nombre }}</strong><small v-if="tipo === 'impuesto'">{{ datos.origen.definicion.codigo_fiscal }} · {{ datos.origen.definicion.tipo }} · {{ datos.origen.definicion.tipo_factor }} · {{ datos.origen.definicion.tasa }}</small></div><Button icon="pi pi-question-circle" text rounded aria-label="Guía de asignaciones" title="Guía de asignaciones" @click="mostrarAyuda = true" /></div>
                <Message severity="info" :closable="false">Estas cuentas preparan la integración contable. No generan pólizas ni cambian tasas, cálculos o facturas existentes.</Message>
                <div class="vinculo-campo"><label for="facturacion-empresa">Empresa <span class="requerido">*</span></label><Select inputId="facturacion-empresa" v-model="empresa" :options="datos.empresas" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una empresa" :disabled="tipo === 'concepto' || guardando" @change="handleCargar" /></div>
                <Message v-if="empresa && !datos.contabilidad_habilitada" severity="info" :closable="false">La configuración contable está desactivada para esta empresa. Solo puedes consultar sus asignaciones e historial.</Message>
                <Message v-if="!datos.origen.activo" severity="warn" :closable="false">El registro está inactivo. Solo puedes retirar sus asignaciones con la contabilidad habilitada.</Message>
                <Message v-if="datos.origen.exento" severity="info" :closable="false">Este impuesto es exento y no requiere una cuenta de impuesto. Si tenía asignaciones, puedes retirarlas.</Message>
                <Message v-if="datos.definicion_modificada" severity="warn" :closable="false">El concepto o impuesto cambió desde la última asignación. Revisa sus cuentas y guarda para confirmar la revisión.</Message>
                <Tabs v-model:value="tab">
                    <TabList><Tab value="cuentas">Asignación</Tab><Tab value="historial">Historial</Tab></TabList>
                    <TabPanels>
                        <TabPanel value="cuentas">
                            <div class="vinculo-cuentas">
                                <div v-for="c in datos.origen.campos" :key="c.campo" class="vinculo-campo">
                                    <label :for="'facturacion-'+c.campo">{{ c.nombre }}</label>
                                    <Select :inputId="'facturacion-'+c.campo" v-model="cuentas[c.campo]" :options="handleOpciones(c.tipo)" optionLabel="etiqueta" optionValue="id" filter showClear placeholder="Sin asignar" :disabled="!modificable" emptyMessage="No hay cuentas disponibles" emptyFilterMessage="Sin coincidencias" />
                                    <small>Guardada: {{ datos.etiquetas[c.campo] }}</small>
                                    <small v-if="cuentas[c.campo] && !handleOpciones(c.tipo).some(a=>a.id===cuentas[c.campo])" class="requerido">La cuenta ya no está disponible. Reemplázala o retira la asignación.</small>
                                </div>
                            </div>
                            <p class="vinculo-nota">Solo aparecen cuentas activas de la empresa seleccionada que permiten movimientos y corresponden al tipo requerido.</p>
                            <Button v-if="Object.values(cuentas).some(Boolean)" label="Retirar asignaciones" icon="pi pi-times" severity="danger" text :disabled="!habilitada || guardando" @click="handleRetirar" />
                            <small class="vinculo-nota">Los cambios se aplican al presionar Guardar asignación. Retirar las cuentas no elimina el historial.</small>
                        </TabPanel>
                        <TabPanel value="historial">
                            <DataTable :value="datos.historial" paginator :rows="5" size="small" class="tabla-vinculo">
                                <Column header="Fecha"><template #body="{data}">{{ handleFecha(data.fecha) }}</template></Column><Column field="usuario" header="Responsable" />
                                <Column header="Cambios"><template #body="{data}"><div v-for="(c,i) in data.cambios" :key="i" class="vinculo-cambio"><strong>{{ c.campo }}</strong><small>Anterior: {{ c.anterior }}</small><small>Nuevo: {{ c.nuevo }}</small></div></template></Column>
                                <template #empty>No hay cambios para la empresa seleccionada.</template>
                            </DataTable>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>
        </div>
        <template #footer><Button label="Cerrar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="guardando || cargando" @click="handleCargar" /><Button label="Guardar asignación" icon="pi pi-save" severity="success" :loading="guardando" :disabled="!valido" @click="handleGuardar" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" header="Guía de cuentas contables" modal :style="{width:'40rem'}" :breakpoints="{'700px':'95vw'}">
        <div class="vinculo-guia">
            <p><strong>Conceptos.</strong> En Empresas → Conceptos de facturación, asigna la cuenta de ingreso del concepto. Solo aplica a la empresa propietaria del concepto.</p>
            <p><strong>Impuestos.</strong> En el catálogo de Impuestos, elige primero la empresa. El mismo impuesto puede utilizar cuentas diferentes en cada empresa.</p>
            <p><strong>Emitidas y recibidas.</strong> Configura por separado las cuentas que se utilizarán según el tipo de factura. Traslados: pasivo en emitidas y activo en recibidas. Retenciones: activo en emitidas y pasivo en recibidas. La cuenta específica debe revisarla quien lleva tu contabilidad.</p>
            <p><strong>Contabilidad desactivada.</strong> Puedes consultar cuentas e historial; para cambiar una asignación debes habilitar la configuración contable en Empresas.</p>
            <p><strong>Sin asignar.</strong> El vínculo es opcional y no bloquea la facturación. No se crean cuentas ni se generan pólizas automáticamente en esta etapa. Las reglas de reconocimiento y de cobro o pago se integrarán al conectar las pólizas.</p>
            <p><strong>Cambios posteriores.</strong> Si cambia la definición del concepto o impuesto, se mostrará un aviso para revisar sus cuentas. Las facturas y los cálculos anteriores se conservan.</p>
        </div>
        <template #footer><Button label="Cerrar" outlined @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import proceso from './js/proceso.js';
export default {name:'VinculoFacturacion',props:{tipo:{type:String,required:true},registroId:{type:String,default:''}},components:{Button,Column,DataTable,Dialog,Message,ProgressSpinner,Select,Tabs,Tab,TabList,TabPanel,TabPanels},setup(props){return {...proceso(props)};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
