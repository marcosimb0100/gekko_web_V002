<template>
    <Encabezado titulo="Cortes de caja" subtitulo="Apertura de jornada, conteo y cierre de efectivo" icono="pi pi-calculator">
        <Button label="Abrir jornada" icon="pi pi-lock-open" class="btn-nuevo" :disabled="!puedeAbrir" @click="handleAbrir" />
        <Button label="Realizar corte" icon="pi pi-check-square" class="btn-guardar" :disabled="!puedeCerrar" @click="handleCerrar" />
    </Encabezado>
    <div class="card cortes-contenedor">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="cortes-filtros">
            <div class="cortes-caja"><label for="corte-caja">Caja</label><Select inputId="corte-caja" v-model="cajaId" :options="cajas" optionLabel="nombre" optionValue="id" filter :disabled="cargando" placeholder="Selecciona una caja" @change="handleConsultar" /></div>
            <div><label for="corte-periodo">Periodo de cierres</label><Select inputId="corte-periodo" v-model="periodo" :options="periodos" optionLabel="nombre" optionValue="id" :disabled="cargando" @change="handlePeriodo" /></div>
            <div><label for="corte-desde">Desde</label><DatePicker inputId="corte-desde" v-model="desde" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="cargando" @update:modelValue="periodo = 'personalizado'" /></div>
            <div><label for="corte-hasta">Hasta</label><DatePicker inputId="corte-hasta" v-model="hasta" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="cargando" @update:modelValue="periodo = 'personalizado'" /></div>
            <Button label="Consultar" icon="pi pi-search" class="btn-nuevo" :loading="cargando" :disabled="!cajaId" @click="handleConsultar" />
            <Button icon="pi pi-refresh" outlined aria-label="Actualizar cajas y cortes" :disabled="cargando" @click="handleActualizar" />
        </div>
        <section v-if="detalle" class="cortes-jornada">
            <div class="cortes-jornada-titulo"><div><i class="pi pi-wallet" /><strong>{{ cajaActual?.nombre }}</strong></div><Tag :value="detalle.jornada ? 'Jornada abierta' : 'Sin jornada abierta'" :severity="detalle.jornada ? 'success' : 'secondary'" /></div>
            <div v-if="detalle.jornada" class="cortes-responsable"><span>Responsable: {{ detalle.jornada.responsable_nombre }}</span><span>Apertura: {{ handleFechaHora(detalle.jornada.apertura_fecha) }}</span></div>
            <div class="cortes-metricas"><div><small>{{ detalle.jornada ? 'Saldo al abrir' : 'Saldo contable' }}</small><strong>{{ handleMoneda(detalle.jornada?.apertura_saldo ?? detalle.saldo_actual) }}</strong></div><div><small>Entradas de la jornada</small><strong>{{ handleMoneda(detalle.jornada?.entradas || 0) }}</strong></div><div><small>Salidas de la jornada</small><strong>{{ handleMoneda(detalle.jornada?.salidas || 0) }}</strong></div><div><small>Efectivo esperado</small><strong>{{ handleMoneda(detalle.saldo_actual) }}</strong></div></div>
            <small v-if="!detalle.jornada">Abre una jornada para registrar entradas y salidas. El saldo no se reinicia al cambiar de día.</small>
        </section>
        <div class="cortes-subtitulo"><strong>Historial de cortes</strong><Tag :value="total + ' cierres'" severity="secondary" /></div>
        <DataTable :value="cortes" :loading="cargando" lazy paginator :rows="limite" :first="primero" :totalRecords="total" :rowsPerPageOptions="[10,25,50]" size="small" @page="handlePagina">
            <template #empty>No hay cortes en el periodo seleccionado.</template>
            <Column header="Jornada"><template #body="{ data }"><div class="cortes-dato"><strong>#{{ data.apertura_secuencia }}</strong><small>{{ data.responsable_nombre }}</small></div></template></Column>
            <Column header="Cierre"><template #body="{ data }"><div class="cortes-dato"><span>{{ handleFechaHora(data.fecha_creacion) }}</span><small>{{ data.usuario_nombre }}</small></div></template></Column>
            <Column header="Esperado"><template #body="{ data }">{{ handleMoneda(data.saldo) }}</template></Column>
            <Column header="Contado"><template #body="{ data }">{{ handleMoneda(data.contado) }}</template></Column>
            <Column header="Diferencia"><template #body="{ data }"><Tag :value="handleDiferencia(data.diferencia)" :severity="Number(data.diferencia) === 0 ? 'success' : 'warn'" /></template></Column>
            <Column header="Revisión"><template #body="{ data }"><Tag :value="handleEstadoRevision(data)" :severity="data.revision_diferencia?.estado === 'resuelta' ? 'success' : Number(data.diferencia) !== 0 ? 'warn' : 'secondary'" /></template></Column>
            <Column header="Detalle"><template #body="{ data }"><Button icon="pi pi-eye" text rounded aria-label="Ver corte" @click="handleDetalle(data)" /><Button v-if="Number(data.diferencia) !== 0" icon="pi pi-clipboard" text rounded title="Seguimiento de diferencia" aria-label="Revisar diferencia" @click="handleRevision(data)" /></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrar" modal :header="cerrando ? 'Realizar corte de caja' : 'Abrir jornada'" :style="{ width: '44rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <form id="formCorte" class="cortes-formulario" :inert="guardando" @submit.prevent="handleGuardar">
            <div class="cortes-saldo"><span>{{ cajaActual?.nombre }}</span><strong>{{ cerrando ? 'Esperado' : 'Saldo de apertura' }}: {{ handleMoneda(detalle?.saldo_actual) }}</strong></div>
            <template v-if="cerrando">
                <div class="cortes-check"><ToggleSwitch inputId="corte-desglose" v-model="usarDesglose" /><label for="corte-desglose">Contar por billetes y monedas</label></div>
                <div v-if="usarDesglose" class="cortes-denominaciones"><div v-for="d in denominaciones" :key="d.valor"><label :for="'den-' + d.valor">{{ handleMoneda(d.valor / 100) }}</label><InputNumber :inputId="'den-' + d.valor" v-model="d.cantidad" :min="0" :max="1000000" :maxFractionDigits="0" showButtons /></div></div>
                <div v-else class="cortes-campo"><label for="corte-contado">Efectivo contado (MXN) *</label><InputNumber inputId="corte-contado" v-model="contado" mode="currency" currency="MXN" locale="es-MX" :min="0" :max="999999999999.99" /></div>
                <div class="cortes-resultado"><span>Contado: <strong>{{ handleMoneda(totalContado) }}</strong></span><Tag :value="handleDiferencia(diferencia)" :severity="diferencia === 0 ? 'success' : 'warn'" /></div>
            </template>
            <div v-else class="cortes-campo"><label>Responsable de apertura</label><InputText :modelValue="nombreUsuario" readonly /><small>Se registra al usuario que abre la jornada.</small></div>
            <div class="cortes-campo"><label for="corte-observaciones">Observaciones {{ cerrando && diferencia !== 0 ? '*' : '' }}</label><Textarea id="corte-observaciones" v-model="observaciones" rows="3" autoResize maxlength="1000" :placeholder="cerrando && diferencia !== 0 ? 'Explica el faltante o sobrante' : 'Observaciones de la jornada'" /></div>
            <small>{{ cerrando ? 'El corte conserva el saldo contable. Un faltante o sobrante no genera un ajuste automático.' : 'La apertura toma el saldo contable disponible de la caja.' }}</small>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button :label="cerrando ? 'Confirmar corte' : 'Abrir jornada'" icon="pi pi-check" class="btn-guardar" form="formCorte" type="submit" :loading="guardando" :disabled="!formularioValido || guardando" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarRevision" modal header="Seguimiento de diferencia" :style="{ width: '46rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardandoRevision" :closeOnEscape="!guardandoRevision">
        <div v-if="corteRevision" class="cortes-formulario">
            <div class="cortes-saldo"><strong>Jornada #{{ corteRevision.apertura_secuencia }}</strong><Tag :value="handleDiferencia(corteRevision.diferencia)" severity="warn" /></div>
            <div class="cortes-revision-resumen"><Tag :value="handleEstadoRevision(corteRevision)" /><span>Responsable de caja: {{ corteRevision.responsable_nombre }}</span><span>Revisor: {{ corteRevision.revision_diferencia?.responsable || 'Sin asignar' }}</span><span>Motivo del corte: {{ corteRevision.observaciones }}</span></div>
            <Message v-if="errorRevision" severity="error" :closable="false">{{ errorRevision }}</Message>
            <DataTable class="cortes-revision-historial" :value="corteRevision.revision_diferencia?.historial || []" size="small" scrollable scrollHeight="14rem">
                <template #empty>La diferencia está pendiente de revisión.</template>
                <Column header="Fecha"><template #body="{ data }">{{ handleFechaHora(data.fecha) }}</template></Column><Column field="usuario_nombre" header="Responsable" /><Column field="motivo" header="Observaciones / resolución" />
            </DataTable>
            <template v-if="detalle?.puede_revisar && corteRevision.revision_diferencia?.estado !== 'resuelta'">
                <div class="cortes-campo"><label for="motivo-revision">{{ corteRevision.revision_diferencia?.estado === 'en_revision' ? 'Resolución y justificación *' : 'Observaciones de la revisión *' }}</label><Textarea id="motivo-revision" v-model="motivoRevision" rows="3" maxlength="1000" :disabled="guardandoRevision" /></div>
                <div v-if="corteRevision.revision_diferencia?.estado === 'en_revision'" class="cortes-check"><Checkbox inputId="autorizar-diferencia" v-model="autorizaResolucion" binary :disabled="guardandoRevision" /><label for="autorizar-diferencia">Autorizo esta resolución. El corte y el saldo contable se conservan.</label></div>
                <small>La revisión se firma con tu usuario. Cualquier corrección de efectivo debe registrarse por separado como un movimiento.</small>
            </template>
        </div>
        <template #footer><Button label="Cerrar" outlined :disabled="guardandoRevision" @click="mostrarRevision = false" /><Button v-if="detalle?.puede_revisar && corteRevision?.revision_diferencia?.estado !== 'resuelta'" :label="corteRevision?.revision_diferencia?.estado === 'en_revision' ? 'Autorizar resolución' : 'Tomar en revisión'" icon="pi pi-check" :loading="guardandoRevision" :disabled="!revisionValida || guardandoRevision" @click="handleGuardarRevision" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarDetalle" modal header="Detalle del corte" :style="{ width: '42rem' }" :breakpoints="{ '768px': '95vw' }">
        <dl class="cortes-detalle" v-if="seleccionado"><div v-for="d in datosDetalle" :key="d.nombre"><dt>{{ d.nombre }}</dt><dd>{{ d.valor || 'Sin observaciones' }}</dd></div></dl>
        <DataTable v-if="seleccionado?.denominaciones?.length" :value="seleccionado.denominaciones" size="small"><Column header="Denominación"><template #body="{ data }">{{ handleMoneda(data.valor) }}</template></Column><Column field="cantidad" header="Cantidad" /></DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarDetalle = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'CortesCaja', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
