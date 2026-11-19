<template>
    <Encabezado :titulo="mostrarDetalle && seleccionado ? seleccionado.nombre + ' ' + seleccionado.anio : 'Periodos contables'" subtitulo="Apertura, cierre y seguimiento mensual por empresa" icono="pi pi-calendar">
        <Button icon="pi pi-question-circle" text rounded aria-label="Guía de periodos" title="Guía de periodos" @click="mostrarAyuda = true" />
        <Button v-if="mostrarDetalle" label="Volver" icon="pi pi-arrow-left" outlined @click="mostrarDetalle = false" />
    </Encabezado>
    <div v-if="!mostrarDetalle" class="card periodos-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="periodos-filtros">
            <div class="campo empresa-campo"><label for="periodo-empresa">Empresa <span class="requerido">*</span></label><Select inputId="periodo-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando" @change="handleEmpresa" /></div>
            <div class="campo"><label for="periodo-ejercicio">Ejercicio <span class="requerido">*</span></label><Select inputId="periodo-ejercicio" v-model="anio" :options="ejercicios" optionLabel="nombre" optionValue="valor" :disabled="cargando" @change="handleEjercicio" /></div>
            <Button label="Consultar" icon="pi pi-search" outlined :loading="cargando" :disabled="cargando || !empresa" @click="handleCargar" />
        </div>
        <template v-if="empresa">
            <Message v-if="ejercicioEstado !== 'abierto'" severity="info" :closable="false">El ejercicio está cerrado o en revisión. Para modificar un mes, primero reabre el ejercicio en Cierres contables.</Message>
            <div class="periodos-resumen"><div v-for="r in resumen" :key="r.nombre" class="resumen-item"><span class="resumen-icono"><i :class="r.icono" /></span><div><small>{{ r.nombre }}</small><strong>{{ r.valor }}</strong></div></div></div>
            <div class="periodos-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar mes" :disabled="cargando" /></IconField><Select v-model="estado" :options="estados" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los estados" :disabled="cargando" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" /></div>
            <DataTable :value="filas" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-periodos">
                <Column header="Periodo"><template #body="{data}"><div class="dato-doble"><strong>{{ data.nombre }}</strong><small>{{ data.anio }}-{{ String(data.mes).padStart(2,'0') }}</small></div></template></Column>
                <Column header="Estado"><template #body="{data}"><Tag :value="handleEstado(data.estado)" :severity="handleSeverity(data.estado)" /><small v-if="data.en_proceso" class="operacion-pendiente">{{ data.en_proceso }} operación(es) en curso</small></template></Column>
                <Column field="borradores" header="Borradores" />
                <Column field="contabilizadas" header="Contabilizadas" />
                <Column header="Cargos / abonos"><template #body="{data}"><div class="dato-doble"><span>{{ handleMoneda(data.cargos) }}</span><small>{{ handleMoneda(data.abonos) }}</small></div></template></Column>
                <Column header="Opciones"><template #body="{data}"><div class="acciones-periodo">
                    <Button v-if="data.estado === 'sin_abrir'" label="Abrir" icon="pi pi-lock-open" outlined :disabled="cargando || !empresaActual?.activo || ejercicioEstado !== 'abierto'" @click="handleCambio(data,'abrir')" />
                    <Button v-if="data.estado === 'abierto'" label="Cerrar" icon="pi pi-lock" severity="warn" outlined :disabled="cargando || !!data.en_proceso || !empresaActual?.activo || ejercicioEstado !== 'abierto'" @click="handleCambio(data,'cerrar')" />
                    <Button v-if="data.estado === 'cerrado'" label="Reabrir" icon="pi pi-lock-open" outlined :disabled="cargando || !empresaActual?.activo || ejercicioEstado !== 'abierto'" @click="handleCambio(data,'reabrir')" />
                    <Button v-if="data.estado !== 'sin_abrir'" icon="pi pi-eye" text title="Movimientos e historial" aria-label="Consultar periodo" :disabled="cargando" @click="handleDetalle(data)" />
                </div></template></Column>
                <template #empty>No hay meses con estos filtros. Consulta el ejercicio seleccionado.</template>
            </DataTable>
        </template>
        <div v-else class="periodos-vacio"><i class="pi pi-calendar" /><h2>Periodos contables</h2><p>Selecciona una empresa y el ejercicio para administrar sus meses de trabajo.</p></div>
    </div>
    <div v-else class="card periodos-detalle">
        <div class="periodo-contexto"><strong>{{ empresaActual?.nombre }}</strong><Tag :value="handleEstado(seleccionado.estado)" :severity="handleSeverity(seleccionado.estado)" /></div>
        <Tabs v-model:value="tab"><TabList><Tab value="saldos">Movimientos por cuenta</Tab><Tab value="historial">Historial</Tab></TabList>
            <TabPanels><TabPanel value="saldos">
                <p class="nota-saldos">Saldos en MXN calculados con las pólizas contabilizadas. El saldo inicial acumula los registros anteriores; el saldo final se presenta según la naturaleza de la cuenta. No incluye borradores.</p>
                <DataTable :value="saldos" paginator :rows="25" :rowsPerPageOptions="[10,25,50,100]" size="small" class="tabla-detalle">
                    <Column header="Cuenta"><template #body="{data}"><div class="dato-doble"><strong>{{ data.codigo }}</strong><span>{{ data.nombre }}</span><small>{{ data.naturaleza === 'deudora' ? 'Deudora' : 'Acreedora' }}</small></div></template></Column>
                    <Column header="Saldo inicial"><template #body="{data}">{{ handleMoneda(data.saldo_inicial) }}</template></Column><Column header="Cargos"><template #body="{data}">{{ handleMoneda(data.cargos) }}</template></Column><Column header="Abonos"><template #body="{data}">{{ handleMoneda(data.abonos) }}</template></Column><Column header="Saldo final"><template #body="{data}"><strong>{{ handleMoneda(data.saldo_final) }}</strong></template></Column>
                    <template #empty>No hay pólizas contabilizadas hasta este periodo.</template>
                </DataTable>
            </TabPanel><TabPanel value="historial">
                <DataTable :value="historial" paginator :rows="10" size="small" class="tabla-detalle">
                    <Column header="Fecha"><template #body="{data}">{{ handleFecha(data.fecha) }}</template></Column><Column field="usuario" header="Responsable" /><Column field="accion" header="Movimiento" /><Column field="motivo" header="Motivo" /><Column header="Estado"><template #body="{data}"><span>{{ handleEstado(data.anterior) }} → {{ handleEstado(data.nuevo) }}</span></template></Column>
                    <template #empty>No hay movimientos registrados.</template>
                </DataTable>
            </TabPanel></TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="mostrarCambio" :header="tituloCambio" modal :closable="!guardando" :closeOnEscape="!guardando" :style="{width:'38rem',maxWidth:'95vw'}">
        <div class="periodo-cambio">
            <strong>{{ empresaActual?.nombre }} · {{ anio }}</strong>
            <div v-if="formulario.accion === 'abrir'" class="campo"><label for="periodo-mes">Mes <span class="requerido">*</span></label><Select inputId="periodo-mes" v-model="formulario.mes" :options="sinAbrir" optionLabel="nombre" optionValue="mes" :disabled="guardando" @change="handleMes" /></div>
            <strong v-else>{{ periodoCambio?.nombre }}</strong>
            <Message v-if="formulario.accion === 'cerrar'" severity="warn" :closable="false">El cierre bloqueará cambios y nuevas contabilizaciones. {{ periodoCambio?.borradores || 0 }} borrador(es) permanecerán guardados sin afectar saldos.</Message>
            <Message v-if="formulario.accion === 'reabrir'" severity="info" :closable="false">La reapertura permitirá nuevamente registrar y contabilizar pólizas en este mes.</Message>
            <Message v-if="errorCambio" severity="error" :closable="false">{{ errorCambio }}</Message>
            <div class="campo"><label for="periodo-motivo">Motivo <span class="requerido">*</span></label><Textarea id="periodo-motivo" v-model="formulario.motivo" rows="3" maxlength="500" :disabled="guardando" /><small>Entre 5 y 500 caracteres.</small></div>
        </div>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrarCambio = false" /><Button :label="tituloCambio" icon="pi pi-check" :loading="guardando" :disabled="!valido || guardando" @click="handleGuardar" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" header="Guía de periodos contables" modal :style="{width:'48rem',maxWidth:'95vw'}"><div class="periodos-guia"><section v-for="g in guia" :key="g.titulo"><h3>{{ g.titulo }}</h3><p>{{ g.texto }}</p></section></div><template #footer><Button label="Entendido" @click="mostrarAyuda = false" /></template></Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
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
export default {name:'Periodos',components:{Encabezado,Button,Column,DataTable,Dialog,IconField,InputIcon,InputText,Message,Select,Tab,TabList,TabPanel,TabPanels,Tabs,Tag,Textarea},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
