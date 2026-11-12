<template>
    <Encabezado titulo="Movimientos de caja" subtitulo="Entradas y salidas de efectivo" icono="pi pi-arrow-right-arrow-left">
        <Button v-if="detalle?.puede_traspasar" label="Traspaso" icon="pi pi-arrow-right-arrow-left" outlined :disabled="cargando || guardando" @click="handleTraspaso" />
        <Button label="Entrada" icon="pi pi-plus-circle" class="btn-guardar" :disabled="!puedeRegistrar" @click="handleNuevo('entrada')" />
        <Button label="Salida" icon="pi pi-minus-circle" severity="danger" outlined :disabled="!puedeRegistrar" @click="handleNuevo('salida')" />
    </Encabezado>
    <div class="card efectivo-movimientos">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="efectivo-filtros">
            <div class="efectivo-caja"><label for="filtro-caja">Caja</label><Select inputId="filtro-caja" v-model="cajaId" :options="cajas" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una caja" :disabled="cargando" @change="handleCambiarCaja" /></div>
            <div><label for="efectivo-desde">Desde</label><DatePicker inputId="efectivo-desde" v-model="desde" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div><label for="efectivo-hasta">Hasta</label><DatePicker inputId="efectivo-hasta" v-model="hasta" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="cargando" /></div>
            <div><label for="efectivo-tipo">Movimiento</label><Select inputId="efectivo-tipo" v-model="tipoFiltro" :options="tipos" optionLabel="nombre" optionValue="id" placeholder="Todos" showClear :disabled="cargando" /></div>
            <Button label="Consultar" icon="pi pi-search" class="btn-nuevo" :loading="cargando" :disabled="!cajaId" @click="handleConsultar" />
            <Button icon="pi pi-refresh" outlined aria-label="Actualizar cajas y movimientos" :disabled="cargando" @click="handleActualizar" />
        </div>
        <Message v-if="detalle && !detalle.jornada_id" severity="info" :closable="false">Abre una jornada en Cortes de caja para registrar entradas y salidas.</Message>
        <div class="efectivo-contexto" v-if="cajaActual"><span><i class="pi pi-wallet" /> {{ cajaActual.nombre }}</span><Tag v-if="!cajaActual.activo" value="Caja inactiva" severity="secondary" /><small v-if="detalle">Saldo inicial: {{ handleMoneda(detalle.saldo_inicial) }} · {{ handleFecha(detalle.fecha_saldo) }}</small></div>
        <div class="efectivo-resumen" v-if="detalle">
            <div><i class="pi pi-wallet" /><span>Saldo actual de caja<strong>{{ handleMoneda(detalle.saldo_actual) }}</strong></span></div>
            <div class="efectivo-entrada"><i class="pi pi-arrow-down-left" /><span>Entradas del filtro<strong>{{ handleMoneda(detalle.entradas) }}</strong></span></div>
            <div class="efectivo-salida"><i class="pi pi-arrow-up-right" /><span>Salidas del filtro<strong>{{ handleMoneda(detalle.salidas) }}</strong></span></div>
        </div>
        <DataTable :value="movimientos" :loading="cargando" lazy paginator :rows="limite" :first="primero" :totalRecords="total" :rowsPerPageOptions="[10,25,50]" size="small" @page="handlePagina">
            <template #empty>{{ cajaId ? 'No hay movimientos en el periodo seleccionado.' : 'Selecciona una caja para consultar sus movimientos.' }}</template>
            <Column header="Fecha / folio"><template #body="{ data }"><div class="efectivo-dato"><strong>{{ handleFecha(data.fecha) }}</strong><small>#{{ data.secuencia }}</small></div></template></Column>
            <Column header="Concepto"><template #body="{ data }"><div class="efectivo-dato"><span>{{ data.concepto }}</span><small>{{ data.descripcion }}</small></div></template></Column>
            <Column header="Tipo"><template #body="{ data }"><Tag :value="data.tipo === 'entrada' ? 'Entrada' : 'Salida'" :severity="data.tipo === 'entrada' ? 'success' : 'danger'" /></template></Column>
            <Column header="Importe"><template #body="{ data }"><strong :class="data.tipo === 'entrada' ? 'importe-entrada' : 'importe-salida'">{{ handleMoneda(data.importe) }}</strong></template></Column>
            <Column header="Saldo posterior"><template #body="{ data }">{{ handleMoneda(data.saldo) }}</template></Column>
            <Column field="usuario" header="Registrado por" />
            <Column header="Estado"><template #body="{ data }"><Tag :value="data.traspaso_id ? 'Traspaso' : data.reversa_de ? 'Contramovimiento' : data.anulado ? 'Anulado' : 'Vigente'" :severity="data.anulado ? 'secondary' : data.reversa_de ? 'warn' : 'success'" /></template></Column>
            <Column header="Opciones"><template #body="{ data }"><div class="efectivo-acciones"><Button icon="pi pi-paperclip" text rounded title="Comprobantes" aria-label="Comprobantes del movimiento" @click="handleComprobantes(data)" /><Button icon="pi pi-eye" text rounded aria-label="Ver movimiento" @click="handleDetalle(data)" /><Button v-if="detalle?.puede_anular && !data.anulado && !data.reversa_de && !data.traspaso_id && !data.pago_programado_id" icon="pi pi-ban" severity="danger" outlined rounded :disabled="!puedeAnular(data)" title="Anular mediante contramovimiento" aria-label="Anular movimiento" @click="handleAnular(data)" /></div></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrar" modal :header="formulario.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida'" :style="{ width: '43rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <form id="formMovimientoCaja" class="efectivo-formulario" :inert="guardando" @submit.prevent="handleGuardar">
            <div class="efectivo-saldo-dialog"><span>{{ cajaActual?.nombre }}</span><strong>Disponible: {{ handleMoneda(detalle?.saldo_actual) }}</strong></div>
            <div class="efectivo-rejilla">
                <div><label for="movimiento-fecha">Fecha *</label><DatePicker inputId="movimiento-fecha" v-model="formulario.fecha" dateFormat="dd/mm/yy" showIcon :manualInput="false" :minDate="minFecha" :maxDate="hoy" /></div>
                <div><label for="movimiento-importe">Importe (MXN) *</label><InputNumber inputId="movimiento-importe" v-model="formulario.importe" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="999999999999.99" /></div>
                <div class="efectivo-ancho"><label for="movimiento-concepto">Concepto *</label><Select inputId="movimiento-concepto" v-model="formulario.concepto_id" :options="conceptos" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un concepto" /></div>
                <div class="efectivo-ancho"><label for="movimiento-referencia">Referencia</label><InputText id="movimiento-referencia" v-model="formulario.referencia" maxlength="100" placeholder="Ej. Recibo o comprobante" /></div>
                <div class="efectivo-ancho"><label for="movimiento-descripcion">Descripción</label><Textarea id="movimiento-descripcion" v-model="formulario.descripcion" rows="3" autoResize maxlength="500" /></div>
            </div>
            <small>El registro modifica el saldo de la caja. Revisa los datos antes de confirmar.</small>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Registrar movimiento" icon="pi pi-check" form="formMovimientoCaja" type="submit" :loading="guardando" :disabled="!formularioValido || guardando" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAnulacion" modal header="Anular movimiento de caja" :style="{ width: '42rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardandoAnulacion" :closeOnEscape="!guardandoAnulacion">
        <Message v-if="errorAnulacion" severity="error" :closable="false">{{ errorAnulacion }}</Message>
        <form id="formAnularMovimiento" class="efectivo-formulario" :inert="guardandoAnulacion" @submit.prevent="handleConfirmarAnulacion">
            <div class="efectivo-saldo-dialog"><span>{{ cajaActual?.nombre }} · Movimiento #{{ movimientoAnular?.secuencia }}</span><strong>{{ handleMoneda(movimientoAnular?.importe) }}</strong></div>
            <div class="efectivo-anulacion-datos" v-if="movimientoAnular"><span>{{ movimientoAnular.concepto }}</span><small>{{ handleFecha(movimientoAnular.fecha) }} · {{ movimientoAnular.usuario }}</small></div>
            <Message severity="warn" :closable="false">Se registrará una {{ movimientoAnular?.tipo === 'entrada' ? 'salida' : 'entrada' }} por el mismo importe en la jornada actual. El original y los cortes anteriores se conservan.</Message>
            <div class="efectivo-saldo-dialog"><span>Saldo después de la corrección</span><strong>{{ handleMoneda(saldoTrasAnular) }}</strong></div>
            <Message v-if="saldoTrasAnular < 0" severity="error" :closable="false">No hay efectivo suficiente para anular esta entrada.</Message>
            <div class="efectivo-campo-anulacion"><label for="motivo-anulacion">Motivo de la anulación *</label><Textarea id="motivo-anulacion" v-model="motivoAnulacion" rows="3" autoResize maxlength="1000" placeholder="Explica por qué se anula el movimiento" /></div>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardandoAnulacion" @click="mostrarAnulacion = false" /><Button label="Confirmar anulación" icon="pi pi-ban" severity="danger" form="formAnularMovimiento" type="submit" :loading="guardandoAnulacion" :disabled="!anulacionValida || guardandoAnulacion" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarComprobantes" modal header="Comprobantes del movimiento" :style="{ width: '49rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardandoComprobante && !retirandoComprobante" :closeOnEscape="!guardandoComprobante && !retirandoComprobante">
        <div class="efectivo-formulario">
            <div class="efectivo-saldo-dialog"><span>Movimiento #{{ movimientoComprobante?.secuencia }}</span><strong>{{ handleMoneda(movimientoComprobante?.importe) }}</strong></div>
            <Message v-if="errorComprobante" severity="error" :closable="false">{{ errorComprobante }}</Message>
            <small>PDF, JPG o PNG. Hasta 10 MB por archivo y 10 comprobantes vigentes por movimiento. Se conservan incluso si el movimiento se anula.</small>
            <FileUpload :key="movimientoComprobante?.id + '-' + intentoComprobante" mode="basic" chooseLabel="Adjuntar comprobante" accept="application/pdf,image/jpeg,image/png" :maxFileSize="10485760" customUpload auto :disabled="guardandoComprobante || retirandoComprobante || cargandoComprobantes || comprobantesVigentes.length >= 10" @uploader="handleSubirComprobante" />
            <div class="efectivo-comprobantes-filtro"><Tag :value="comprobantesVigentes.length + ' vigentes'" severity="secondary" /><Checkbox inputId="ver-retirados" v-model="verRetirados" binary /><label for="ver-retirados">Ver también los retirados</label></div>
            <DataTable class="efectivo-comprobantes" :value="comprobantesVisibles" :loading="cargandoComprobantes || guardandoComprobante" size="small">
                <template #empty>Sin comprobantes adjuntos.</template>
                <Column header="Archivo"><template #body="{ data }"><div class="efectivo-dato"><span>{{ data.nombre }}</span><Tag v-if="data.retirado" value="Retirado" severity="secondary" /><small v-if="data.retirado">{{ data.retiro_motivo }}<br />{{ data.retiro_usuario_nombre }} · {{ handleFechaComprobante(data.retiro_fecha) }}</small></div></template></Column><Column field="usuario_nombre" header="Adjuntado por" />
                <Column header="Opciones" style="width: 7rem"><template #body="{ data }"><div class="efectivo-acciones"><Button icon="pi pi-download" text rounded aria-label="Descargar comprobante" @click="handleDescargarComprobante(data)" /><Button v-if="!data.retirado" icon="pi pi-trash" severity="danger" text rounded title="Retirar comprobante" aria-label="Retirar comprobante" :disabled="guardandoComprobante || retirandoComprobante" @click="handleRetirarComprobante(data)" /></div></template></Column>
            </DataTable>
        </div>
        <template #footer><Button label="Cerrar" outlined :disabled="guardandoComprobante || retirandoComprobante" @click="mostrarComprobantes = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarRetiro" modal header="Retirar comprobante" :style="{ width: '36rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!retirandoComprobante" :closeOnEscape="!retirandoComprobante">
        <form id="formRetirarComprobante" class="efectivo-formulario" :inert="retirandoComprobante" @submit.prevent="handleConfirmarRetiro">
            <strong class="efectivo-archivo-retirar">{{ comprobanteRetirar?.nombre }}</strong>
            <Message severity="warn" :closable="false">El comprobante quedará marcado como retirado. Se conservará el archivo y se registrará tu usuario, fecha y motivo. El saldo del movimiento no cambia.</Message>
            <Message v-if="errorRetiro" severity="error" :closable="false">{{ errorRetiro }}</Message>
            <div class="efectivo-campo-anulacion"><label for="motivo-retiro">Motivo del retiro *</label><Textarea id="motivo-retiro" v-model="motivoRetiro" rows="3" autoResize maxlength="1000" placeholder="Explica por qué se adjuntó incorrectamente" /></div>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="retirandoComprobante" @click="mostrarRetiro = false" /><Button label="Confirmar retiro" icon="pi pi-trash" severity="danger" type="submit" form="formRetirarComprobante" :loading="retirandoComprobante" :disabled="!retiroValido || retirandoComprobante" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarTraspaso" modal header="Traspaso entre cajas" :style="{ width: '42rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardandoTraspaso" :closeOnEscape="!guardandoTraspaso">
        <Message v-if="!soporteTraspasos" severity="warn" :closable="false">Los traspasos requieren configurar MongoDB con replica set para registrar ambas cajas en una sola transacción. Actualmente esta operación no está disponible.</Message>
        <Message v-if="errorTraspaso" severity="error" :closable="false">{{ errorTraspaso }}</Message>
        <form id="formTraspaso" class="efectivo-formulario" :inert="guardandoTraspaso || !soporteTraspasos" @submit.prevent="handleGuardarTraspaso">
            <div class="efectivo-saldo-dialog"><span>Origen</span><strong>{{ cajaActual?.nombre }}</strong></div>
            <div class="efectivo-campo-anulacion"><label for="traspaso-destino">Caja destino *</label><Select inputId="traspaso-destino" v-model="traspaso.destino" :options="destinos" optionLabel="nombre" optionValue="id" placeholder="Selecciona otra caja" :disabled="cargandoTraspaso" @change="handleConsultarTraspaso" /></div>
            <div v-if="saldosTraspaso" class="efectivo-saldo-dialog"><span>Disponible en origen: {{ handleMoneda(saldosTraspaso.origen) }}</span><span>Saldo destino: {{ handleMoneda(saldosTraspaso.destino) }}</span></div>
            <div class="efectivo-campo-anulacion"><label for="traspaso-importe">Importe *</label><InputNumber inputId="traspaso-importe" v-model="traspaso.importe" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="999999999999.99" /></div>
            <div class="efectivo-campo-anulacion"><label for="traspaso-motivo">Motivo *</label><Textarea id="traspaso-motivo" v-model="traspaso.motivo" rows="3" maxlength="500" /></div>
            <small>Ambas cajas deben tener jornada abierta. Se registra una salida y una entrada vinculadas; el efectivo total se conserva.</small>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardandoTraspaso" @click="mostrarTraspaso = false" /><Button label="Confirmar traspaso" icon="pi pi-check" :loading="guardandoTraspaso || cargandoTraspaso" :disabled="!soporteTraspasos || !traspasoValido || guardandoTraspaso" form="formTraspaso" type="submit" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarDetalle" modal header="Detalle del movimiento" :style="{ width: '36rem' }" :breakpoints="{ '768px': '95vw' }">
        <dl class="efectivo-detalle" v-if="seleccionado"><div v-for="dato in datosDetalle" :key="dato.nombre"><dt>{{ dato.nombre }}</dt><dd>{{ dato.valor || 'Sin registro' }}</dd></div></dl>
        <template #footer><Button label="Cerrar" outlined @click="mostrarDetalle = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'MovimientosCaja', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
