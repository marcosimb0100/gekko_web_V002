<template>
    <Button icon="pi pi-book" outlined rounded aria-label="Cuenta contable" title="Cuenta contable" :disabled="!registroId" @click="handleAbrir" />
    <Dialog v-model:visible="mostrar" header="Vínculo contable" modal :style="{width:'46rem'}" :breakpoints="{'760px':'95vw'}" :closable="!guardando" :closeOnEscape="!guardando">
        <div class="vinculo-contable">
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <div v-if="cargando" class="vinculo-cargando"><ProgressSpinner style="width:30px;height:30px" /><span>Consultando vínculo…</span></div>
            <template v-else-if="datos">
                <div class="vinculo-contexto"><i :class="tipo === 'banco' ? 'pi pi-building-columns' : 'pi pi-wallet'" /><strong>{{ datos.nombre }}</strong></div>
                <Message severity="info" :closable="false">Esta asignación es opcional. No cambia saldos ni movimientos y todavía no genera pólizas.</Message>
                <Tabs v-model:value="tab">
                    <TabList><Tab value="cuenta">Cuenta contable</Tab><Tab value="historial">Historial</Tab></TabList>
                    <TabPanels>
                        <TabPanel value="cuenta">
                            <div class="vinculo-campo"><label for="vinculo-empresa">Empresa <span class="requerido">*</span></label><Select inputId="vinculo-empresa" v-model="empresa" :options="datos.empresas" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una empresa" :disabled="tipo === 'banco' || guardando" @change="handleCargar" /></div>
                            <small v-if="tipo === 'caja'" class="vinculo-nota">La caja sigue siendo general. Selecciona la empresa únicamente para definir su cuenta contable.</small>
                            <Message v-if="empresa && !datos.contabilidad_habilitada" severity="info" :closable="false">La configuración contable de esta empresa está desactivada. Puedes consultar la asignación y el historial; para modificarlos, habilita la configuración en Empresas.</Message>
                            <div class="vinculo-campo"><label for="vinculo-cuenta">Cuenta contable</label><Select inputId="vinculo-cuenta" v-model="cuenta" :options="datos.cuentas" optionLabel="etiqueta" optionValue="id" filter showClear placeholder="Sin asignar" :disabled="!empresa || guardando || !datos.contabilidad_habilitada" emptyMessage="No hay cuentas disponibles" emptyFilterMessage="Sin coincidencias" /></div>
                            <small class="vinculo-nota">Solo cuentas de activo, de esta empresa, activas y que permitan movimientos. Para retirar el vínculo, limpia la selección y guarda.</small>
                            <Message v-if="datos.cuenta_id && !datos.cuentas.some(c=>c.id===datos.cuenta_id)" severity="warn" :closable="false">La cuenta guardada ya no está disponible. Para reemplazarla o retirar el vínculo, la configuración contable debe estar habilitada.</Message>
                            <div v-if="tipo === 'caja' && datos.vinculos.length" class="vinculo-asignaciones">
                                <strong>Asignaciones de esta caja</strong>
                                <DataTable :value="datos.vinculos" size="small" class="tabla-vinculo" paginator :rows="5"><Column field="empresa" header="Empresa" /><Column field="cuenta" header="Cuenta contable" /></DataTable>
                            </div>
                        </TabPanel>
                        <TabPanel value="historial">
                            <DataTable :value="datos.historial" paginator :rows="5" size="small" class="tabla-vinculo">
                                <Column header="Fecha"><template #body="{data}">{{ handleFecha(data.fecha) }}</template></Column><Column field="usuario" header="Responsable" /><Column field="anterior" header="Cuenta anterior" /><Column field="nuevo" header="Cuenta nueva" />
                                <template #empty>Sin cambios registrados para la empresa seleccionada.</template>
                            </DataTable>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>
        </div>
        <template #footer><Button label="Cerrar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="guardando || cargando" @click="handleCargar" /><Button label="Guardar vínculo" icon="pi pi-save" severity="success" :loading="guardando" :disabled="!valido" @click="handleGuardar" /></template>
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
export default {name:'VinculoContable',props:{tipo:{type:String,required:true},registroId:{type:String,default:''}},components:{Button,Column,DataTable,Dialog,Message,ProgressSpinner,Select,Tabs,Tab,TabList,TabPanel,TabPanels},setup(props){return {...proceso(props)};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
