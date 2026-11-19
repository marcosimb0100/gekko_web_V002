<template>
    <Encabezado titulo="Cierres contables" subtitulo="Revisión y cierre del ejercicio por empresa" icono="pi pi-lock">
        <Button icon="pi pi-question-circle" text rounded aria-label="Guía de cierres" title="Guía de cierres" @click="mostrarAyuda = true" />
        <Button v-if="datos" :label="estado === 'cerrado' ? 'Reabrir ejercicio' : 'Cerrar ejercicio'" :icon="estado === 'cerrado' ? 'pi pi-lock-open' : 'pi pi-lock'" outlined :disabled="!puedeCambiar" @click="handleCambio" />
    </Encabezado>
    <div class="card cierres-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="cierres-filtros">
            <div class="campo empresa-campo"><label for="cierre-empresa">Empresa <span class="requerido">*</span></label><Select inputId="cierre-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || guardando" @change="handleFiltro" /></div>
            <div class="campo"><label for="cierre-anio">Ejercicio <span class="requerido">*</span></label><Select inputId="cierre-anio" v-model="anio" :options="ejercicios" optionLabel="nombre" optionValue="valor" :disabled="cargando || guardando" @change="handleFiltro" /></div>
            <Button label="Consultar" icon="pi pi-search" outlined :loading="cargando" :disabled="cargando || guardando || !empresa" @click="handleCargar" />
            <Tag v-if="datos" :value="'Ejercicio ' + handleEstado(estado).toLowerCase()" :severity="handleSeverity(estado)" />
        </div>
        <template v-if="datos">
            <div class="cierres-resumen">
                <div><small>Meses cerrados</small><strong>{{ datos.resumen.cerrados }} / 12</strong></div>
                <div><small>Pólizas en borrador</small><strong>{{ datos.resumen.borradores }}</strong></div>
                <div><small>Pólizas contabilizadas</small><strong>{{ datos.resumen.contabilizadas }}</strong></div>
                <div><small>Cargos / abonos del ejercicio</small><strong class="importe">{{ handleMoneda(datos.resumen.cargos) }}</strong><small>{{ handleMoneda(datos.resumen.abonos) }}</small></div>
            </div>
            <Tabs v-model:value="tab">
                <TabList><Tab value="revision">Revisión del ejercicio</Tab><Tab value="saldos">Saldos por cuenta</Tab><Tab value="historial">Historial</Tab></TabList>
                <TabPanels>
                    <TabPanel value="revision">
                        <div class="validaciones"><div v-for="v in datos.validaciones" :key="v.nombre"><i :class="v.correcto ? 'pi pi-check-circle correcto' : 'pi pi-exclamation-circle pendiente'" /><span>{{ v.nombre }}</span></div></div>
                        <Message severity="info" :closable="false" class="nota-cierre">Cierre operativo del ejercicio. No genera automáticamente la póliza de resultados. Consulta la guía antes de cerrar.</Message>
                        <DataTable :value="datos.periodos" scrollable scrollHeight="flex" size="small" class="tabla-cierres">
                            <Column field="nombre" header="Periodo" /><Column header="Estado"><template #body="{data}"><Tag :value="handleEstado(data.estado)" :severity="handleSeverity(data.estado)" /></template></Column>
                            <Column field="borradores" header="Borradores" /><Column field="contabilizadas" header="Contabilizadas" />
                            <Column header="Cargos"><template #body="{data}">{{ handleMoneda(data.cargos) }}</template></Column>
                            <Column header="Abonos"><template #body="{data}">{{ handleMoneda(data.abonos) }}</template></Column>
                        </DataTable>
                    </TabPanel>
                    <TabPanel value="saldos">
                        <p class="nota">Saldos acumulados hasta el 31 de diciembre de {{ anio }}. Solo incluyen pólizas contabilizadas.</p>
                        <DataTable :value="datos.saldos" paginator :rows="10" :rowsPerPageOptions="[10,25,50,100]" scrollable scrollHeight="flex" size="small" class="tabla-cierres">
                            <Column field="codigo" header="Cuenta" /><Column field="nombre" header="Nombre" /><Column header="Saldo inicial"><template #body="{data}">{{ handleMoneda(data.saldo_inicial) }}</template></Column>
                            <Column header="Cargos"><template #body="{data}">{{ handleMoneda(data.cargos) }}</template></Column>
                            <Column header="Abonos"><template #body="{data}">{{ handleMoneda(data.abonos) }}</template></Column>
                            <Column header="Saldo final"><template #body="{data}">{{ handleMoneda(data.saldo_final) }}</template></Column>
                            <template #empty>No hay movimientos contabilizados.</template>
                        </DataTable>
                    </TabPanel>
                    <TabPanel value="historial">
                        <DataTable :value="datos.historial" paginator :rows="10" scrollable scrollHeight="flex" size="small" class="tabla-cierres">
                            <Column header="Fecha"><template #body="{data}">{{ handleFecha(data.fecha) }}</template></Column><Column field="usuario" header="Responsable" /><Column field="accion" header="Movimiento" /><Column field="motivo" header="Motivo" />
                            <Column header="Resumen al realizar el movimiento"><template #body="{data}">{{ data.resumen.contabilizadas }} pólizas · {{ handleMoneda(data.resumen.cargos) }} en cargos / {{ handleMoneda(data.resumen.abonos) }} en abonos</template></Column>
                            <template #empty>Aún no se han registrado cierres.</template>
                        </DataTable>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </template>
        <div v-else-if="!cargando" class="cierres-vacio"><i class="pi pi-calendar" /><p>Selecciona una empresa y un ejercicio para revisar su cierre.</p></div>
    </div>
    <Dialog v-model:visible="mostrarCambio" :header="estado === 'cerrado' ? 'Reabrir ejercicio' : 'Cerrar ejercicio'" modal :style="{width:'36rem'}" :breakpoints="{'640px':'95vw'}" :closable="!guardando" :closeOnEscape="!guardando">
        <div class="cierre-cambio">
            <Message v-if="errorCambio" severity="error" :closable="false">{{ errorCambio }}</Message>
            <strong>{{ empresaActual?.nombre }} · {{ anio }}</strong>
            <p>{{ estado === 'cerrado' ? 'El ejercicio se habilitará para reabrir meses. Los periodos conservan su estado actual.' : 'Se bloqueará la reapertura de los doce meses. Las pólizas y los saldos contabilizados se conservan.' }}</p>
            <div class="campo"><label for="cierre-motivo">Motivo <span class="requerido">*</span></label><Textarea inputId="cierre-motivo" v-model="motivo" rows="3" maxlength="500" :disabled="guardando" /><small>Mínimo 5 caracteres.</small></div>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrarCambio = false" /><Button label="Confirmar" icon="pi pi-check" :loading="guardando" :disabled="!valido || guardando" @click="handleGuardar" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" header="Guía de cierres contables" modal :style="{width:'44rem'}" :breakpoints="{'720px':'95vw'}">
        <section v-for="g in guia" :key="g.titulo" class="guia-cierre"><strong>{{ g.titulo }}</strong><p>{{ g.texto }}</p></section>
        <template #footer><Button label="Cerrar" outlined @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import proceso from './js/proceso.js';
export default {name:'Cierres',components:{Encabezado,Button,Column,DataTable,Dialog,Message,Select,Tab,TabList,TabPanel,TabPanels,Tabs,Tag,Textarea},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
