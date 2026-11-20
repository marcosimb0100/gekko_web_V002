<template>
    <Encabezado :titulo="seleccionado?.folio || 'Mesa de solicitudes'" subtitulo="Revision y pago de solicitudes de servicios" icono="fa-solid fa-list-check">
        <template #icono><font-icon icon="fa-solid fa-list-check" /></template>
        <Button icon="pi pi-question-circle" text rounded aria-label="Guia de Mesa de solicitudes" @click="mostrarAyuda = true" />
        <Button v-if="seleccionado" label="Volver" icon="pi pi-arrow-left" outlined :disabled="cargando" @click="handleVolver" />
        <template v-if="seleccionado?.estado === 'Pendiente'"
            ><Button label="Rechazar" icon="pi pi-times" severity="danger" outlined :disabled="cargando" @click="handleDecision('Rechazada')" /><Button
                label="Autorizar"
                icon="pi pi-check"
                severity="success"
                :disabled="cargando"
                @click="handleDecision('Autorizada')"
        /></template>
        <Button v-if="seleccionado?.estado === 'Autorizada'" label="Registrar pago" icon="pi pi-wallet" severity="success" :disabled="cargando" @click="handlePagar" />
    </Encabezado>
    <div class="card mesa-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <template v-if="!seleccionado">
            <div class="mesa-herramientas">
                <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Folio, empresa o descripcion" maxlength="100" :disabled="cargando" /></IconField
                ><Select v-model="estado" :options="estados" showClear placeholder="Todos los estados" :disabled="cargando" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" /><Button
                    label="Actualizar"
                    icon="pi pi-refresh"
                    outlined
                    :loading="cargando"
                    @click="handleCargar"
                /><Tag :value="total + ' solicitudes'" severity="secondary" />
            </div>
            <DataTable :value="registros" lazy paginator :first="primero" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[10, 25, 50]" :loading="cargando" scrollable scrollHeight="flex" @page="handlePagina">
                <Column header="Solicitud"
                    ><template #body="{ data }"
                        ><strong>{{ data.folio }}</strong
                        ><small>{{ data.fecha_solicitud }}</small></template
                    ></Column
                >
                <Column field="empresa_nombre" header="Empresa" /><Column field="descripcion" header="Descripcion" /><Column field="solicitante_nombre" header="Solicitante" />
                <Column header="Importe"
                    ><template #body="{ data }">{{ handleMoneda(data.importe) }}</template></Column
                ><Column field="fecha_pago" header="Fecha propuesta" />
                <Column header="Estado"
                    ><template #body="{ data }"><Tag :value="data.estado" :severity="data.estado === 'Rechazada' ? 'danger' : data.estado === 'Pagada' ? 'success' : 'info'" /></template
                ></Column>
                <Column header="Opciones"
                    ><template #body="{ data }"><Button icon="pi pi-eye" text title="Revisar solicitud" :disabled="cargando" @click="handleAbrir(data)" /></template
                ></Column>
                <template #empty>No hay solicitudes con estos filtros.</template>
            </DataTable>
        </template>
        <Tabs v-else v-model:value="tab"
            ><TabList><Tab value="datos">Datos</Tab><Tab value="comprobantes">Comprobantes</Tab><Tab value="historial">Historial</Tab></TabList
            ><TabPanels>
                <TabPanel value="datos"
                    ><div class="mesa-resumen">
                        <div>
                            <small>Empresa</small><strong>{{ seleccionado.empresa_nombre }}</strong>
                        </div>
                        <div>
                            <small>Solicitante</small><strong>{{ seleccionado.solicitante_nombre }}</strong>
                        </div>
                        <div>
                            <small>Importe solicitado</small><strong>{{ handleMoneda(seleccionado.importe) }}</strong>
                        </div>
                        <div><small>Estado</small><Tag :value="seleccionado.estado" /></div>
                        <div><small>Fecha de solicitud</small>{{ seleccionado.fecha_solicitud }}</div>
                        <div><small>Fecha propuesta de pago</small>{{ seleccionado.fecha_pago }}</div>
                        <div class="mesa-ancho">
                            <small>Descripcion del pago</small>
                            <p>{{ seleccionado.descripcion }}</p>
                        </div>
                    </div><ResumenPago :pago="seleccionado.pago_resumen" /></TabPanel
                >
                <TabPanel value="comprobantes"
                    ><div class="mesa-herramientas"><Checkbox v-model="verRetirados" binary inputId="mesa-retirados" /><label for="mesa-retirados">Ver retirados</label></div>
                    <DataTable :value="archivos" paginator :rows="10"
                        ><Column field="nombre" header="Documento" /><Column field="usuario" header="Adjuntado por" /><Column header="Estado"
                            ><template #body="{ data }">{{ data.retirado ? 'Retirado' : 'Vigente' }}</template></Column
                        ><Column header="Opciones"
                            ><template #body="{ data }"><VistaComprobante :archivo="data" :direccion="'/finanzas/solicitudes/mesa/' + seleccionado.id + '/archivos/' + data.id" :disabled="cargando" /><Button icon="pi pi-download" text title="Descargar comprobante" :disabled="cargando" @click="handleDescargar(data)" /></template></Column
                        ><template #empty>No hay documentos adjuntos.</template></DataTable
                    ></TabPanel
                >
                <TabPanel value="historial"
                    ><DataTable :value="seleccionado.historial" paginator :rows="10"
                        ><Column header="Fecha"
                            ><template #body="{ data }">{{ data.fecha?.replace('T', ' ').slice(0, 19) }}</template></Column
                        ><Column field="usuario" header="Responsable" /><Column field="accion" header="Movimiento" /><Column header="Cambios"
                            ><template #body="{ data }"
                                ><div v-for="(c, i) in data.cambios" :key="i">
                                    <strong>{{ c.campo }}:</strong> {{ c.anterior }} → {{ c.nuevo }}
                                </div></template
                            ></Column
                        ></DataTable
                    ></TabPanel
                >
            </TabPanels></Tabs
        >
    </div>
    <Dialog
        :visible="!!decision"
        modal
        :header="decision === 'Rechazada' ? 'Rechazar solicitud' : 'Autorizar solicitud'"
        :style="{ width: '34rem' }"
        :breakpoints="{ '600px': '95vw' }"
        :closable="!cargando"
        @update:visible="
            (v) => {
                if (!v) decision = null;
            }
        "
        ><p>{{ seleccionado?.folio }} · {{ handleMoneda(seleccionado?.importe) }}</p>
        <p v-if="decision === 'Autorizada'">Autorizar permite registrar el pago despues. Todavia no se movera dinero.</p>
        <label for="mesa-motivo">{{ decision === 'Rechazada' ? 'Motivo del rechazo' : 'Observaciones' }} <span v-if="decision === 'Rechazada'" class="requerido">*</span></label
        ><Textarea id="mesa-motivo" v-model="motivo" rows="4" maxlength="1000" fluid :disabled="cargando" /><template #footer
            ><Button label="Cancelar" outlined :disabled="cargando" @click="decision = null" /><Button
                label="Confirmar"
                icon="pi pi-check"
                :loading="cargando"
                :disabled="cargando || (decision === 'Rechazada' && motivo.trim().length < 3)"
                @click="handleConfirmar" /></template
    ></Dialog>
    <Dialog v-model:visible="mostrarPago" modal header="Registrar pago" :style="{ width: '65rem' }" :breakpoints="{ '900px': '95vw' }" :closable="!cargando">
        <div class="mesa-pago-resumen">
            <strong>{{ seleccionado?.folio }} · {{ seleccionado?.empresa_nombre }}</strong
            ><span
                >Importe a pagar: <strong>{{ handleMoneda(seleccionado?.importe) }}</strong></span
            >
        </div>
        <div class="mesa-pago-grid">
            <div class="mesa-campos">
                <label>Origen del pago <span class="requerido">*</span></label
                ><Select
                    v-model="pago.origen"
                    :options="[
                        { nombre: 'Caja', id: 'efectivo', inactivo: !opciones.puede_efectivo },
                        { nombre: 'Banco', id: 'bancario', inactivo: !opciones.puede_bancario }
                    ]"
                    optionLabel="nombre"
                    optionValue="id"
                    optionDisabled="inactivo"
                    :disabled="cargando"
                /><label>Concepto de salida <span class="requerido">*</span></label
                ><Select v-model="pago.concepto_id" :options="opciones.conceptos || []" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un concepto" :disabled="cargando" />
                <label>¿Requiere factura? <span class="requerido">*</span></label>
                <Select v-model="pago.requiere_factura" :options="[{nombre:'Si, requiere factura',valor:true},{nombre:'No requiere factura',valor:false}]" optionLabel="nombre" optionValue="valor" placeholder="Selecciona una opcion" :disabled="cargando" />
                <template v-if="pago.requiere_factura === false"><label for="motivo-sin-factura">Motivo sin factura <span class="requerido">*</span></label><Textarea id="motivo-sin-factura" v-model="pago.motivo_sin_factura" maxlength="1000" rows="2" :disabled="cargando" /></template>
                <small v-if="pago.requiere_factura">La factura quedara pendiente de relacionar. Esto no impide registrar el pago.</small>
                <Message v-if="pago.origen === 'efectivo'" severity="info" :closable="false">El comprobante es opcional. Al confirmar se registrara la salida con su concepto y la recepcion quedara pendiente de firma. La firma desde la app se integrara despues.</Message>
                <Message severity="info" :closable="false"
                    >Se registra el pago completo de esta solicitud. Autorizar y pagar son pasos separados.</Message
                >
            </div>
            <Fieldset v-if="pago.origen === 'efectivo'" legend="Salida de caja"
                ><div class="mesa-campos">
                    <label>Caja <span class="requerido">*</span></label
                    ><Select v-model="pago.caja_id" :options="opciones.cajas || []" optionLabel="nombre" optionValue="id" placeholder="Selecciona una caja" :disabled="cargando" /><small v-if="caja"
                        >Disponible: {{ handleMoneda(caja.saldo) }} · {{ caja.jornada_id ? 'Jornada abierta' : 'Abre una jornada antes de pagar' }}</small
                    ><label>Fecha de salida <span class="requerido">*</span></label
                    ><DatePicker v-model="pago.fecha" dateFormat="yy-mm-dd" showIcon :disabled="cargando" /></div
            ></Fieldset>
            <Fieldset v-else legend="Vincular salida bancaria"
                ><div class="mesa-campos">
                    <label>Cuenta bancaria de {{ seleccionado?.empresa_nombre }} <span class="requerido">*</span></label
                    ><Select v-model="pago.cuenta_id" :options="cuentas" optionLabel="nombre" optionValue="id" placeholder="Selecciona una cuenta" :disabled="cargando" />
                    <div class="mesa-fechas">
                        <DatePicker v-model="pago.desde" dateFormat="yy-mm-dd" showIcon placeholder="Desde" :disabled="cargando" /><DatePicker v-model="pago.hasta" dateFormat="yy-mm-dd" showIcon placeholder="Hasta" :disabled="cargando" />
                    </div>
                    <Button label="Buscar salidas" icon="pi pi-search" outlined :disabled="cargando || !pago.cuenta_id" @click="handleBuscarBanco()" /><DataTable
                        :value="movimientos"
                        lazy
                        paginator
                        :first="primeroBanco"
                        :rows="10"
                        :totalRecords="totalBanco"
                        scrollable
                        scrollHeight="16rem"
                        @page="handleBuscarBanco"
                        ><Column header="Elegir"
                            ><template #body="{ data }"
                                ><RadioButton
                                    :modelValue="pago.movimiento_id"
                                    :value="data.id"
                                    :disabled="cargando || data.usado || Number(data.importe) !== Number(seleccionado.importe)"
                                    @update:modelValue="handleElegirBanco(data)" /></template></Column
                        ><Column field="fecha" header="Fecha" /><Column field="descripcion" header="Salida" /><Column header="Importe"
                            ><template #body="{ data }">{{ handleMoneda(data.importe) }}<small v-if="data.usado">Ya utilizada</small></template></Column
                        ><template #empty>No hay salidas disponibles en esta consulta.</template></DataTable
                    ><small>Selecciona una salida por el importe completo. No se generara otra salida ni se descontara nuevamente.</small>
                </div></Fieldset
            >
        </div>
        <template #footer
            ><Button label="Cancelar" outlined :disabled="cargando" @click="mostrarPago = false" /><Button
                label="Confirmar pago"
                icon="pi pi-check"
                severity="success"
                :loading="cargando"
                :disabled="cargando || !validoPago"
                @click="handleConfirmarPago"
        /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guia de Mesa de solicitudes" :style="{ width: '38rem' }" :breakpoints="{ '700px': '95vw' }"
        ><ol>
            <li>Revisa la descripcion, el importe y los comprobantes.</li>
            <li>Autoriza o rechaza. Para rechazar debes indicar el motivo.</li>
            <li>El solicitante recibe un aviso informativo con el resultado, sin enlace a esta mesa.</li>
            <li>Una solicitud autorizada puede pagarse desde una caja con jornada abierta o vinculando una salida bancaria existente de su empresa.</li>
            <li>Indica si requiere factura. Si no la requiere, registra el motivo. Adjuntar un comprobante es opcional.</li>
            <li>El efectivo conserva su concepto de salida y queda con recepción pendiente de firma. La firma desde la app y el recibo firmado se integrarán después.</li>
        </ol>
        <p>Necesitas el acceso a Movimientos de caja o Movimientos bancarios para usar cada origen. Los nuevos avisos de revision si incluyen “Ver en Mesa”.</p>
        <template #footer><Button label="Entendido" @click="mostrarAyuda = false" /></template
    ></Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import VistaComprobante from '../../../../components/comprobantes/VistaComprobante.vue';
import ResumenPago from '../../../../components/comprobantes/ResumenPago.vue';
import proceso from './js/proceso';
export default {
    name: 'FinanzasMesaSolicitudes',
    components: { Encabezado, VistaComprobante, ResumenPago },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
