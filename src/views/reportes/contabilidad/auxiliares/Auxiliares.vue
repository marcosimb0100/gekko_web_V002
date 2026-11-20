<template>
    <Encabezado titulo="Auxiliares contables" subtitulo="Detalle de movimientos y saldos por cuenta" icono="pi pi-search">
        <Button icon="pi pi-question-circle" text rounded title="Guía de auxiliares" aria-label="Guía de auxiliares" @click="mostrarAyuda=true" />
        <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" :disabled="!resultado || cargando || exportando" :loading="exportando" @click="handleExportar" />
    </Encabezado>
    <div class="card auxiliar-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="auxiliar-filtros">
            <div class="campo empresa"><label for="aux-empresa">Empresa <span class="requerido">*</span></label><Select inputId="aux-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || exportando" @change="handleEmpresa" /></div>
            <div class="campo cuenta"><label for="aux-cuenta">Cuenta contable <span class="requerido">*</span></label><Select inputId="aux-cuenta" v-model="cuenta" :options="cuentas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una cuenta" :disabled="!empresa || cargando || exportando" @change="handleLimpiarResultado" /></div>
            <div class="campo"><label for="aux-desde">Desde <span class="requerido">*</span></label><DatePicker inputId="aux-desde" v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="campo"><label for="aux-hasta">Hasta <span class="requerido">*</span></label><DatePicker inputId="aux-hasta" v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="acciones"><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando || exportando" @click="handleLimpiar" /><Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || !cuenta || cargando || exportando" @click="handleConsultar()" /></div>
        </div>
        <template v-if="resultado">
            <div class="auxiliar-contexto"><div><strong>{{ resultado.cuenta.codigo }} · {{ resultado.cuenta.nombre }}</strong><small>{{ resultado.empresa }} · {{ resultado.desde }} al {{ resultado.hasta }}</small></div><Tag :value="'Naturaleza '+resultado.cuenta.naturaleza" severity="info" /></div>
            <div class="auxiliar-resumen"><div v-for="r in [{campo:'saldo_inicial',nombre:'Saldo inicial'},{campo:'cargos',nombre:'Cargos del periodo'},{campo:'abonos',nombre:'Abonos del periodo'},{campo:'saldo_final',nombre:'Saldo final'}]" :key="r.campo"><small>{{ r.nombre }}</small><strong>{{ handleMoneda(resultado.resumen[r.campo]) }}</strong></div></div>
            <DataTable :value="filas" dataKey="id" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100,200]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-auxiliar" @page="handleConsultar">
                <Column field="fecha" header="Fecha" />
                <Column header="Póliza"><template #body="{data}"><div class="dato-doble"><strong>{{ data.folio }}</strong><small>{{ data.tipo }}</small></div></template></Column>
                <Column header="Concepto / referencia"><template #body="{data}"><div class="dato-doble concepto"><span>{{ data.concepto }}</span><small>{{ data.referencia }}</small></div></template></Column>
                <Column header="Cargo"><template #body="{data}">{{ handleMoneda(data.cargo) }}</template></Column>
                <Column header="Abono"><template #body="{data}">{{ handleMoneda(data.abono) }}</template></Column>
                <Column header="Saldo"><template #body="{data}"><strong>{{ handleMoneda(data.saldo) }}</strong></template></Column>
                <template #empty>No hay movimientos contabilizados en este periodo. El saldo inicial se conserva.</template>
            </DataTable>
            <small class="nota">{{ total }} partidas. El saldo se presenta según la naturaleza de la cuenta; los borradores y las pólizas anuladas no se incluyen.</small>
        </template>
        <div v-else class="auxiliar-vacio"><i class="pi pi-book" /><h3>Consulta el movimiento de una cuenta</h3><p>Selecciona la empresa, la cuenta y el periodo.</p></div>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Guía de auxiliares contables" modal :style="{width:'38rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Selecciona una empresa y una cuenta. Puedes consultar cuentas activas e inactivas para revisar su historial.</p>
        <p>El saldo inicial acumula los asientos contabilizados anteriores a Desde. Los cargos y abonos corresponden al periodo seleccionado, incluyendo ambas fechas.</p>
        <p>En cuentas deudoras el cargo aumenta el saldo; en acreedoras lo aumenta el abono. El detalle se ordena por fecha y registro de póliza; conserva el orden de sus partidas.</p>
        <p>La exportación incluye todas las partidas del periodo, aunque la tabla esté paginada. Si supera 50,000 partidas, reduce el periodo. Esta consulta no modifica pólizas ni saldos.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'Auxiliares',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
