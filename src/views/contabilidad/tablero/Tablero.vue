<template>
    <Encabezado titulo="Tablero contable" subtitulo="Pendientes de revisión por empresa y periodo" icono="pi pi-chart-pie">
        <Button icon="pi pi-question-circle" text rounded aria-label="Ayuda" @click="ayuda=true" />
    </Encabezado>
    <div class="card tablero-contable">
        <div class="filtros">
            <div class="campo empresa"><label>Empresa <span class="requerido">*</span></label><Select v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando" @change="handleLimpiar" /></div>
            <div class="campo"><label>Desde</label><DatePicker v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" @update:modelValue="handleLimpiar" /></div>
            <div class="campo"><label>Hasta</label><DatePicker v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando" @update:modelValue="handleLimpiar" /></div>
            <Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || cargando" @click="handleConsultar" />
        </div>
        <div class="indicadores">
            <Button v-for="opcion in opciones" :key="opcion.clave" outlined :class="{seleccionado:seleccion===opcion.clave}" :disabled="cargando" @click="handleSeleccionar(opcion.clave)">
                <i :class="opcion.icono"></i><span>{{ opcion.nombre }}<strong>{{ consultado ? grupos[opcion.clave].length : '—' }}</strong></span>
            </Button>
        </div>
        <div class="herramientas"><strong>{{ titulo }}</strong><InputText v-model="buscar" placeholder="Buscar en los resultados" :disabled="cargando" /></div>
        <small class="nota">{{ seleccion==='cuentas' ? 'Configuración actual: cuentas generales obligatorias y bancos activos. No depende de las fechas.' : 'Registros del periodo consultado. Selecciona Abrir para continuar en la pantalla de origen.' }}</small>
        <DataTable :value="filas" paginator :rows="25" :rowsPerPageOptions="[25,50,100]" :first="primero" @page="primero=$event.first" dataKey="id" scrollable scrollHeight="flex" size="small" :loading="cargando" class="tabla-pendientes">
            <Column field="fecha" header="Fecha" /><Column field="referencia" header="Referencia" /><Column field="descripcion" header="Descripción" />
            <Column header="Revisión"><template #body="{data}"><Tag :value="data.estado" severity="warn" /></template></Column>
            <Column header="Opciones"><template #body="{data}"><Button label="Abrir" icon="pi pi-arrow-right" text @click="handleAbrir(data)" /></template></Column>
            <template #empty>{{ consultado ? 'No hay pendientes de este tipo.' : 'Selecciona una empresa y consulta el periodo.' }}</template>
        </DataTable>
    </div>
    <Dialog v-model:visible="ayuda" header="Guía del tablero contable" modal :style="{width:'42rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Este tablero reúne revisiones pendientes; no genera ni contabiliza pólizas.</p>
        <p>CFDI: facturas de ingreso vigentes, emitidas y recibidas, sin póliza de origen contabilizada. Incluye borradores. Las referencias escritas libremente en pólizas manuales no establecen el vínculo.</p>
        <p>Bancos: movimientos activos sin aplicación completa a CFDI. Algunos movimientos no requieren factura; aparecer aquí no impide por sí mismo cerrar un periodo.</p>
        <p>Cuentas: revisa las tres cuentas generales obligatorias y los vínculos de bancos activos, incluyendo cuentas que dejaron de estar disponibles. No es una revisión completa de impuestos, conceptos o cajas.</p>
        <p>Borradores: pólizas del periodo que requieren revisión. Las aperturas se ubican en su primer periodo operativo. Abrir lleva al módulo correspondiente; se respetan los permisos de tu perfil.</p>
        <template #footer><Button label="Cerrar" @click="ayuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'TableroContable',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
