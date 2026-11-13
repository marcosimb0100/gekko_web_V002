<template>
    <Encabezado titulo="Pagos programados" subtitulo="Acuerdos, vencimientos y medios de pago" icono="pi pi-calendar-clock">
        <Button label="Nueva programación" icon="pi pi-plus" class="btn-nuevo" :disabled="cargando || !!error" @click="handleNuevo" />
    </Encabezado>
    <div class="card pagos-programados">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="pagos-resumen"><div v-for="item in resumen" :key="item.etiqueta"><i :class="item.icono" /><div><small>{{ item.etiqueta }}</small><strong>{{ item.valor }}</strong></div></div></div>
        <div class="pagos-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar proveedor o concepto" /></IconField><Select v-model="vistaPagos" :options="vistasPagos" optionLabel="nombre" optionValue="id" aria-label="Vista de pagos" /><Select v-model="periodicidad" :options="periodicidades" placeholder="Todas las periodicidades" showClear /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargar" /></div>
        <DataTable :value="filas" :loading="cargando" paginator :rows="8" size="small" class="pagos-tabla">
            <template #empty>No hay vencimientos pendientes con estos filtros. Puedes consultar todas las programaciones en el selector de vista.</template>
            <Column header="Proveedor / concepto"><template #body="{ data }"><div class="pagos-identidad"><strong>{{ data.proveedor_nombre }}</strong><small>{{ data.concepto }}</small><small>{{ data.empresa_nombre }}</small></div></template></Column>
            <Column header="Calendario"><template #body="{ data }"><div class="pagos-identidad"><span>{{ data.periodicidad }}</span><small>{{ handleRegla(data) }}</small></div></template></Column>
            <Column header="Vencimiento"><template #body="{ data }"><div class="pagos-identidad"><span>{{ data.proxima_fecha ? handleFecha(data.proxima_fecha) : 'Sin pendientes' }}</span><Tag v-if="data.exigible && data.vencido" value="Vencido" severity="danger" /></div></template></Column>
            <Column header="Importe a pagar / saldo"><template #body="{ data }"><div class="pagos-identidad"><strong>{{ data.total_periodo === null ? 'Se indica en el primer pago' : 'Importe a pagar: ' + handleMoneda(data.total_periodo) }}</strong><small>Ya pagaste: {{ handleMoneda(data.abonado) }}</small><span>{{ data.pendiente === null ? 'Indica el importe al registrar el pago' : 'Te falta pagar: ' + handleMoneda(data.pendiente) }}</span></div></template></Column>
            <Column field="medio" header="Medio de pago" />
            <Column header="Recordatorio"><template #body="{ data }"><span>{{ data.aviso }} días antes</span></template></Column>
            <Column header="Estado"><template #body="{ data }"><Tag :value="handleEstadoPago(data)" :severity="data.estado_pago === 'parcial' || data.estado_pago === 'revisar' ? 'warn' : data.estado_pago === 'pagado' ? 'success' : 'secondary'" /></template></Column>
            <Column header="Opciones"><template #body="{ data }"><div class="pagos-acciones"><Button :label="data.estado_pago === 'parcial' ? 'Registrar abono' : 'Registrar pago'" icon="pi pi-wallet" outlined size="small" :disabled="!data.activo || !data.proxima_fecha || cargandoRegistro || guardandoRegistro" @click="handleRegistrarPago(data)" /><Button icon="pi pi-history" text rounded title="Historial de pagos" aria-label="Ver pagos registrados" @click="handleHistorialPago(data)" /><Button icon="pi pi-pencil" text rounded aria-label="Editar programación" @click="handleEditar(data)" /></div></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrarRegistro" modal header="Registrar pago" :style="{ width: '82rem', maxWidth: '96vw' }" :breakpoints="{ '1000px': '96vw' }" class="pagos-registro-dialog" :closable="!guardandoRegistro && !cargandoRegistro" :closeOnEscape="!guardandoRegistro && !cargandoRegistro">
        <Message v-if="errorRegistro" severity="error" :closable="false">{{ errorRegistro }}</Message>
        <ProgressBar v-if="cargandoRegistro" mode="indeterminate" style="height: .3rem" />
        <form v-if="!cargandoRegistro && programacionPago" id="registroPago" class="pagos-formulario" :inert="guardandoRegistro" @submit.prevent="handleGuardarPago">
            <div class="pagos-registro-resumen"><strong>{{ programacionPago.proveedor_nombre }}</strong><span>{{ programacionPago.concepto }}</span><small>{{ programacionPago.empresa_nombre }}</small></div>
            <div class="pagos-registro-layout">
                <section class="pagos-registro-datos" aria-label="Periodo y abono">
            <div class="pagos-rejilla">
                <div><label for="registro-origen">Origen del pago *</label><SelectButton id="registro-origen" v-model="pago.origen" :options="origenesPago" optionLabel="nombre" optionValue="id" :allowEmpty="false" aria-label="Origen del pago" @change="handleOrigenPago" /></div>
                <div><label for="registro-vencimiento">Vencimiento que se paga *</label><InputText id="registro-vencimiento" :modelValue="handleFecha(programacionPago.proxima_fecha)" readonly aria-readonly="true" class="pagos-vencimiento-fijo" /><small>Los abonos se acumulan en este vencimiento hasta cubrir el total.</small></div>
            </div>
            <div class="pagos-rejilla"><div class="pagos-ancho"><label for="registro-concepto">Concepto de salida *</label><Select inputId="registro-concepto" v-model="pago.concepto_id" :options="opcionesPago.conceptos || []" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un concepto" :disabled="pago.origen === 'banco' && !!movimientoPago?.concepto_id" /><small v-if="pago.origen === 'banco'">{{ movimientoPago?.concepto_id ? 'Se conserva el concepto que ya tiene el movimiento bancario.' : 'Este concepto se mostrará en Conciliación del movimiento bancario.' }}</small></div></div>
            <Fieldset legend="Resumen del pago"><div class="pagos-rejilla">
                <div v-if="totalPeriodoEditable"><label for="registro-total-periodo">Importe a pagar (MXN) *</label><InputNumber inputId="registro-total-periodo" v-model="pago.total_periodo" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="999999999999.99" :disabled="cargandoPeriodo" /><small>¿Cuánto debes pagar en total este periodo? Se guardará junto con este abono.</small></div>
                <div v-else class="pagos-importe-guardado"><span>Importe a pagar</span><strong>{{ saldoPeriodo?.total_periodo == null ? 'Consultando...' : handleMoneda(saldoPeriodo.total_periodo) }}</strong><small v-if="saldoPeriodo">{{ programacionPago.variable ? 'Ya quedó guardado para este periodo.' : 'Se toma de tu programación.' }}</small></div>
                <div class="pagos-identidad"><span>Ya pagaste: <strong>{{ handleMoneda(saldoPeriodo?.abonado) }}</strong></span><span>Te falta pagar: <strong>{{ pendientePeriodo === null ? 'Indica el importe a pagar' : handleMoneda(pendientePeriodo) }}</strong></span><Tag v-if="saldoPeriodo?.estado_pago === 'pagado'" value="Pagado" severity="success" /></div>
            </div></Fieldset>
            <Message v-if="pendientePeriodo !== null && pago.importe > pendientePeriodo" severity="warn" :closable="false">El abono supera el saldo pendiente del periodo. Reduce el importe o selecciona otra salida bancaria.</Message>
            <div class="pagos-rejilla">
                <div><label for="registro-importe">¿Cuánto pagarás ahora? (MXN) *</label><InputNumber inputId="registro-importe" v-model="pago.importe" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="999999999999.99" :disabled="pago.origen !== 'efectivo' || cargandoPeriodo" /><small>{{ pago.origen === 'efectivo' ? 'Puedes pagar todo o realizar un abono.' : 'Se toma de la salida bancaria seleccionada.' }}</small></div>
                <div><label for="registro-notas">Observaciones</label><Textarea id="registro-notas" v-model="pago.notas" rows="2" maxlength="500" /></div>
            </div>
                </section>
                <section class="pagos-registro-origen" aria-label="Origen del pago">
            <Fieldset v-if="pago.origen === 'efectivo'" legend="Salida de efectivo"><div class="pagos-rejilla">
                <div><label for="registro-caja">Caja *</label><Select inputId="registro-caja" v-model="pago.caja_id" :options="opcionesPago.cajas || []" optionLabel="nombre" optionValue="id" placeholder="Selecciona una caja" filter /></div>
                <div><label for="registro-fecha">Fecha de salida *</label><DatePicker inputId="registro-fecha" v-model="pago.fecha" dateFormat="dd/mm/yy" showIcon :manualInput="false" :maxDate="hoyPago" :minDate="cajaPago ? new Date(cajaPago.ultima_fecha + 'T12:00:00') : undefined" /></div>
                <div class="pagos-ancho" v-if="cajaPago"><Message :severity="cajaPago.jornada_id ? 'info' : 'warn'" :closable="false">Disponible: {{ handleMoneda(cajaPago.saldo) }}. {{ cajaPago.jornada_id ? 'Se generará una salida vinculada al pago.' : 'Abre una jornada en Cortes de caja antes de pagar.' }}</Message></div>
            </div></Fieldset>
            <Fieldset v-else legend="Vincular salida bancaria"><p class="pagos-banco-ayuda">Selecciona la empresa, su cuenta y una salida bancaria ya registrada para aplicarla a este pago.</p><div class="pagos-rejilla">
                <div><label for="registro-empresa">Empresa titular de la cuenta *</label><Select inputId="registro-empresa" v-model="pago.empresa_id" :options="empresas" optionLabel="nombre" optionValue="id" optionDisabled="deshabilitado" filter :disabled="cargandoCuentasPago || cargandoMovimientosPago" @change="handleCuentasPago" /></div>
                <div><label for="registro-cuenta">Cuenta bancaria *</label><Select inputId="registro-cuenta" v-model="pago.cuenta_id" :options="cuentasPago" optionLabel="nombre" optionValue="id" :disabled="cargandoCuentasPago || cargandoMovimientosPago" placeholder="Selecciona una cuenta" filter @change="handleMovimientosPago()" /></div>
                <div><label for="registro-desde">Movimientos desde</label><DatePicker inputId="registro-desde" v-model="pago.desde" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="cargandoMovimientosPago" /></div>
                <div><label for="registro-hasta">Hasta</label><DatePicker inputId="registro-hasta" v-model="pago.hasta" dateFormat="dd/mm/yy" showIcon :manualInput="false" :maxDate="hoyPago" :disabled="cargandoMovimientosPago" /></div>
                <div class="pagos-ancho"><Button label="Buscar salidas" icon="pi pi-search" outlined :loading="cargandoMovimientosPago" :disabled="!pago.cuenta_id || cargandoCuentasPago" @click="handleMovimientosPago()" /></div>
                <div class="pagos-ancho"><DataTable :value="movimientosPago" :loading="cargandoMovimientosPago" lazy paginator :rows="10" :first="primeroMovimientosPago" :totalRecords="totalMovimientosPago" size="small" class="pagos-movimientos-tabla" scrollable scrollHeight="15rem" @page="handlePaginaMovimientosPago">
                    <template #empty>No hay salidas disponibles en esta consulta.</template>
                    <Column header="Elegir" style="width:4rem"><template #body="{ data }"><RadioButton v-model="pago.movimiento_id" :value="data.id" :disabled="data.usado" :aria-label="'Seleccionar salida del ' + handleFecha(data.fecha)" @change="handleSeleccionarMovimientoPago" /></template></Column>
                    <Column header="Fecha / referencia"><template #body="{ data }"><div class="pagos-identidad"><span>{{ handleFecha(data.fecha) }}</span><small>{{ data.referencia }}</small></div></template></Column>
                    <Column header="Salida bancaria"><template #body="{ data }"><div class="pagos-identidad"><span>{{ data.descripcion }}</span><small>{{ data.beneficiario }}</small><Tag v-if="data.concepto_nombre" :value="data.concepto_nombre" severity="secondary" /><Tag v-if="data.usado" value="Ya utilizado en un pago" severity="secondary" /></div></template></Column>
                    <Column header="Importe"><template #body="{ data }">{{ handleMoneda(data.importe) }}</template></Column>
                </DataTable></div>
                <div class="pagos-ancho"><small>Se vincula el importe completo del movimiento existente. No se genera otra salida, no se altera el saldo bancario y se conserva la conciliación de CFDI. Se registra el concepto seleccionado.</small></div>
            </div></Fieldset>
                </section>
            </div>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardandoRegistro || cargandoRegistro" @click="mostrarRegistro = false" /><Button label="Confirmar pago" icon="pi pi-check" class="btn-guardar" type="submit" form="registroPago" :loading="guardandoRegistro" :disabled="!pagoValido || guardandoRegistro || cargandoPeriodo" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarHistorialPago" modal header="Pagos registrados" :style="{ width: '62rem' }" :breakpoints="{ '900px': '95vw' }">
        <Message v-if="errorHistorialPago" severity="error" :closable="false">{{ errorHistorialPago }}</Message>
        <DataTable :value="historialPago" :loading="cargandoHistorialPago" lazy paginator :rows="10" :first="primeroHistorialPago" :totalRecords="totalHistorialPago" size="small" class="pagos-movimientos-tabla" @page="handlePaginaHistorialPago">
            <template #empty>No hay pagos registrados para esta programación.</template>
            <Column header="Vencimiento / pago"><template #body="{ data }"><div class="pagos-identidad"><strong>{{ handleFecha(data.vencimiento) }}</strong><small>{{ data.tipo_registro === 'total' ? 'Importe registrado: ' : 'Abono: ' }}{{ handleFecha(data.fecha) }}</small></div></template></Column>
            <Column header="Origen"><template #body="{ data }"><div class="pagos-identidad"><Tag :value="data.tipo_registro === 'total' ? 'Importe del periodo' : data.origen === 'efectivo' ? 'Caja' : 'Banco'" /><span>{{ data.origen_nombre }}</span><small>{{ data.empresa }} {{ data.folio_caja ? '· Folio #' + data.folio_caja : '' }}</small><small>{{ data.referencia }}</small></div></template></Column>
            <Column header="Importe"><template #body="{ data }">{{ handleMoneda(data.tipo_registro === 'total' ? data.total_periodo : data.importe) }}</template></Column><Column header="Estado del periodo"><template #body="{ data }"><div class="pagos-identidad"><Tag :value="data.estado_pago === 'pagado' ? 'Pagado' : data.estado_pago === 'parcial' ? 'Parcial' : data.estado_pago === 'revisar' ? 'Revisar' : 'Pendiente'" :severity="data.estado_pago === 'pagado' ? 'success' : 'warn'" /><small>{{ data.pendiente_periodo === null ? 'Importe por indicar' : 'Te falta pagar: ' + handleMoneda(data.pendiente_periodo) }}</small></div></template></Column><Column field="usuario" header="Registrado por" /><Column field="notas" header="Observaciones" />
        </DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarHistorialPago = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrar" modal :header="formulario.id ? 'Editar programación' : 'Nueva programación'" :style="{ width: '76rem', maxWidth: '96vw' }" class="pagos-programacion-dialog" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <form :inert="guardando" id="programacionPago" class="pagos-formulario" @submit.prevent="handleGuardar">
            <div class="pagos-form-aviso"><i class="pi pi-info-circle" />Se guarda el acuerdo de pago. Los recordatorios automáticos están pendientes de integrar al programador de tareas.</div>
            <Fieldset legend="Acuerdo con el proveedor"><div class="pagos-rejilla">
                <div><label for="pago-proveedor">Proveedor</label><Select inputId="pago-proveedor" v-model="formulario.proveedor" :options="proveedores" optionLabel="nombre" optionValue="id" optionDisabled="deshabilitado" filter placeholder="Selecciona un proveedor" /></div>
                <div><label for="pago-empresa">Empresa que paga</label><Select inputId="pago-empresa" v-model="formulario.empresa" :options="empresas" optionLabel="nombre" optionValue="id" optionDisabled="deshabilitado" filter placeholder="Selecciona una empresa" /></div>
                <div class="pagos-ancho"><label for="pago-concepto">Concepto</label><InputText id="pago-concepto"  :modelValue="formulario.concepto" @update:modelValue="handleConcepto" placeholder="Ej. INTERNET DE OFICINA" maxlength="150" /></div>
            </div></Fieldset>
            <Fieldset legend="Calendario"><div class="pagos-rejilla">
                <div><label for="pago-periodicidad">Periodicidad</label><Select inputId="pago-periodicidad" v-model="formulario.periodicidad" :options="periodicidades" /></div>
                <div><label for="pago-inicio">Fecha de inicio</label><DatePicker inputId="pago-inicio" v-model="formulario.inicio" dateFormat="dd/mm/yy" showIcon /></div>
                <div v-if="formulario.periodicidad === 'Mensual'"><label for="pago-dia">Día del mes</label><InputNumber inputId="pago-dia" v-model="formulario.dia" :min="1" :max="31" showButtons /><small>Si no existe ese día, se usa el último del mes.</small></div>
                <div v-if="formulario.periodicidad === 'Personalizada'"><label for="pago-intervalo">Cada cuántos días</label><InputNumber inputId="pago-intervalo" v-model="formulario.intervalo" :min="1" showButtons /></div>
                <div><label for="pago-aviso">Avisar días antes</label><InputNumber inputId="pago-aviso" v-model="formulario.aviso" :min="0" :max="60" showButtons /></div>
                <div class="pagos-ancho" v-if="formulario.periodicidad === 'Quincenal'"><small>Calendario: día 15 y último día de cada mes.</small></div>
            </div></Fieldset>
            <Fieldset legend="Condiciones de pago"><div class="pagos-rejilla">
                <div><label for="pago-medio">Medio de pago preferido</label><Select inputId="pago-medio" v-model="formulario.medio" :options="medios" /></div>
                <div><label for="pago-plazo">Plazo desde la factura</label><Select inputId="pago-plazo" v-model="formulario.plazo" :options="plazos" /></div>
                <div v-if="formulario.plazo === 'Fecha acordada'"><label for="pago-acordada">Fecha acordada</label><DatePicker inputId="pago-acordada" v-model="formulario.fecha_acordada" dateFormat="dd/mm/yy" showIcon /></div>
                <div class="pagos-ancho pagos-check"><Checkbox inputId="pago-variable" v-model="formulario.variable" binary /><label for="pago-variable">El importe cambia en cada periodo</label></div>
                <div v-if="!formulario.variable"><label for="pago-importe">Importe a pagar en cada periodo (MXN)</label><InputNumber inputId="pago-importe" v-model="formulario.importe" mode="currency" currency="MXN" locale="es-MX" :min="0" /></div>
                <div class="pagos-ancho"><label for="pago-notas">Observaciones</label><Textarea id="pago-notas" v-model="formulario.notas" rows="2" maxlength="500" /></div>
                <div class="pagos-check"><ToggleSwitch inputId="pago-activo" v-model="formulario.activo" /><label for="pago-activo">Programación activa</label></div>
            </div></Fieldset>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Guardar" icon="pi pi-save" :loading="guardando" form="programacionPago" type="submit" :disabled="guardando || !formulario.proveedor || !formulario.empresa || !formulario.concepto.trim() || !formulario.inicio || (!formulario.variable && !(formulario.importe > 0)) || (formulario.plazo === 'Fecha acordada' && !formulario.fecha_acordada)" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'PagosProgramados', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
