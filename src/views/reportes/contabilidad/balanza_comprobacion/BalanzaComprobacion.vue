<template>
    <Encabezado titulo="Balanza de comprobación" subtitulo="Saldos y movimientos contables por empresa" icono="pi pi-calculator">
        <Button icon="pi pi-question-circle" text rounded title="Guía de balanza" aria-label="Guía de balanza" @click="mostrarAyuda=true" />
        <Button label="Exportar Excel" icon="pi pi-file-excel" severity="success" :loading="exportando" :disabled="!resultado || cargando || exportando" @click="handleExportar" />
    </Encabezado>
    <div class="card balanza-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="balanza-filtros">
            <div class="campo empresa"><label for="balanza-empresa">Empresa <span class="requerido">*</span></label><Select inputId="balanza-empresa" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando || exportando" @change="handleLimpiarResultado" /></div>
            <div class="campo"><label for="balanza-desde">Desde <span class="requerido">*</span></label><DatePicker inputId="balanza-desde" v-model="desde" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="campo"><label for="balanza-hasta">Hasta <span class="requerido">*</span></label><DatePicker inputId="balanza-hasta" v-model="hasta" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="cargando || exportando" @update:modelValue="handleLimpiarResultado" /></div>
            <div class="opcion"><Checkbox inputId="balanza-ceros" v-model="incluirCeros" binary :disabled="cargando || exportando" @change="handleLimpiarResultado" /><label for="balanza-ceros">Incluir cuentas en cero</label></div>
            <div class="acciones"><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando || exportando" @click="handleLimpiar" /><Button label="Consultar" icon="pi pi-search" :loading="cargando" :disabled="!empresa || cargando || exportando" @click="handleConsultar()" /></div>
        </div>
        <template v-if="resultado">
            <div class="balanza-contexto"><div><strong>{{ resultado.empresa }}</strong><small>{{ resultado.desde }} al {{ resultado.hasta }} · MXN</small></div><Tag :value="resultado.cuadra ? 'Cuadra' : 'Con diferencias'" :severity="resultado.cuadra ? 'success' : 'danger'" /></div>
            <div class="balanza-resumen">
                <div><small>Cargos del periodo</small><strong>{{ handleMoneda(resultado.totales.cargos) }}</strong></div>
                <div><small>Abonos del periodo</small><strong>{{ handleMoneda(resultado.totales.abonos) }}</strong></div>
                <div><small>Diferencia de movimientos</small><strong :class="{'con-diferencia':Number(resultado.diferencias.movimientos)!==0}">{{ handleMoneda(resultado.diferencias.movimientos) }}</strong></div>
            </div>
            <Message v-if="!resultado.cuadra" severity="warn" :closable="false">Diferencias: saldo inicial {{ handleMoneda(resultado.diferencias.inicial) }}, movimientos {{ handleMoneda(resultado.diferencias.movimientos) }} y saldo final {{ handleMoneda(resultado.diferencias.final) }}. Revisa las pólizas contabilizadas.</Message>
            <div class="balanza-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar cuenta o nombre" :disabled="cargando || exportando" @keydown.enter="handleBuscar" /></IconField><Button icon="pi pi-search" outlined title="Buscar cuenta" aria-label="Buscar cuenta" :disabled="cargando || exportando" @click="handleBuscar" /><Tag :value="total+' cuentas'" severity="info" /></div>
            <DataTable :value="filas" dataKey="id" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[25,50,100,200]" :loading="cargando" scrollable scrollHeight="flex" size="small" class="tabla-balanza" @page="handlePagina">
                <Column header="Cuenta"><template #body="{data}"><div class="dato-doble"><strong>{{ data.codigo }}</strong><small>{{ data.nombre }}</small></div></template></Column>
                <Column field="naturaleza" header="Naturaleza" />
                <Column header="Saldo inicial"><template #body="{data}"><div class="dato-doble importes"><span><small>D</small> {{ handleMoneda(data.inicial_deudor) }}</span><span><small>A</small> {{ handleMoneda(data.inicial_acreedor) }}</span></div></template></Column>
                <Column header="Cargos"><template #body="{data}">{{ handleMoneda(data.cargos) }}</template></Column>
                <Column header="Abonos"><template #body="{data}">{{ handleMoneda(data.abonos) }}</template></Column>
                <Column header="Saldo final"><template #body="{data}"><div class="dato-doble importes"><span><small>D</small> {{ handleMoneda(data.final_deudor) }}</span><span><small>A</small> {{ handleMoneda(data.final_acreedor) }}</span></div></template></Column>
                <template #empty>No hay cuentas con saldo o movimientos para esta consulta.</template>
            </DataTable>
            <div class="balanza-totales"><strong>Totales de la consulta</strong><span>Inicial D {{ handleMoneda(resultado.totales.inicial_deudor) }} · A {{ handleMoneda(resultado.totales.inicial_acreedor) }}</span><span>Final D {{ handleMoneda(resultado.totales.final_deudor) }} · A {{ handleMoneda(resultado.totales.final_acreedor) }}</span></div>
            <small class="nota">D = Deudor · A = Acreedor. Los totales y el Excel incluyen todas las cuentas de la consulta; la búsqueda solo filtra la tabla. No se suman agrupadoras para evitar duplicar saldos.</small>
        </template>
        <div v-else class="balanza-vacio"><i class="pi pi-calculator" /><h3>Revisa los saldos de tu empresa</h3><p>Selecciona la empresa y el periodo para consultar su balanza.</p></div>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Guía de balanza de comprobación" modal :style="{width:'40rem'}" :breakpoints="{'640px':'95vw'}">
        <p>Selecciona una empresa y las fechas, incluyendo el primer y último día que deseas revisar. No es necesario que el periodo esté abierto para consultar.</p>
        <p>El saldo inicial acumula los asientos contabilizados anteriores a Desde. Cargos y abonos muestran la actividad dentro del periodo; el saldo final incluye ambos.</p>
        <p>Los saldos se separan por su lado deudor (D) y acreedor (A). La naturaleza identifica la cuenta, pero si su saldo es contrario se presenta en el lado que realmente corresponde.</p>
        <p>Cuadra significa que coinciden los saldos deudores y acreedores iniciales, los cargos y abonos del periodo y los saldos finales. No sustituye la revisión de las cuentas y conceptos usados en cada póliza.</p>
        <p>Se incluyen cuentas inactivas con historial. Incluir cuentas en cero agrega las cuentas de movimientos del catálogo sin actividad. Las agrupadoras no se acumulan nuevamente; así los totales no se duplican. Borradores y pólizas anuladas se excluyen.</p>
        <p>La búsqueda filtra la tabla; los indicadores y el Excel conservan todas las cuentas de la consulta. El Excel muestra los saldos deudores y acreedores en columnas separadas. Esta consulta no modifica la contabilidad.</p>
        <template #footer><Button label="Cerrar" @click="mostrarAyuda=false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {name:'BalanzaComprobacion',components:{Encabezado},setup(){return {...proceso()};}};
</script>
<style scoped>
@import './css/estilo.css';
</style>
