<template>
    <Encabezado titulo="Mesa de Control de Cancelaciones" subtitulo="Seguimiento de solicitudes y confirmación ante el SAT" icono="pi pi-ban">
        <Button label="Guía" icon="pi pi-info-circle" outlined @click="handleMostrarGuia" />
        <Button label="Actualizar" icon="pi pi-refresh" :loading="cargando" :disabled="ocupado" @click="handleActualizar" />
    </Encabezado>
    <div class="card mesa-cancelaciones">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="cancelaciones-indicadores">
            <div v-for="estado in estados" :key="estado.value" class="cancelaciones-indicador">
                <Tag :value="estado.label" :severity="estado.severity" /><strong>{{ resumen[estado.value] || 0 }}</strong>
            </div>
        </div>
        <div class="cancelaciones-filtros">
            <div>
                <label for="cancelacion-empresa">Empresa emisora</label
                ><Select inputId="cancelacion-empresa" v-model="filtros.company_id" :options="empresas" optionLabel="label" optionValue="value" placeholder="Todas las empresas" filter showClear :disabled="ocupado" />
            </div>
            <div>
                <label for="cancelacion-estado">Estado</label><Select inputId="cancelacion-estado" v-model="filtros.estatus" :options="estados" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear :disabled="ocupado" />
            </div>
            <div><label for="cancelacion-inicial">Fecha inicial (UTC)</label><DatePicker inputId="cancelacion-inicial" v-model="filtros.fecha_inicial" dateFormat="dd/mm/yy" showIcon :disabled="ocupado" /></div>
            <div><label for="cancelacion-final">Fecha final (UTC)</label><DatePicker inputId="cancelacion-final" v-model="filtros.fecha_final" dateFormat="dd/mm/yy" showIcon :disabled="ocupado" /></div>
            <div class="cancelaciones-busqueda"><label for="cancelacion-buscar">UUID, RFC, receptor o folio</label><InputText id="cancelacion-buscar" v-model="filtros.buscar" maxlength="120" :disabled="ocupado" @keyup.enter="handleBuscar" /></div>
            <div class="cancelaciones-acciones"><Button label="Consultar" icon="pi pi-search" :disabled="ocupado" @click="handleBuscar" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="ocupado" @click="handleLimpiar" /></div>
        </div>
        <DataTable :value="registros" :loading="cargando" dataKey="_id" scrollable size="small" class="tabla-encabezados" tableStyle="min-width: 85rem">
            <template #empty>No hay solicitudes con los filtros seleccionados.</template>
            <Column header="Solicitud"
                ><template #body="{ data }">{{ handleFecha(data.fecha_creacion) }}</template></Column
            >
            <Column header="Emisor / receptor"
                ><template #body="{ data }"
                    ><strong>{{ data.cfdi?.emisor_nombre || data.emisor_rfc }}</strong>
                    <div>{{ data.cfdi?.receptor_nombre || '—' }}</div></template
                ></Column
            >
            <Column header="UUID / serie y folio"
                ><template #body="{ data }"
                    ><div class="cancelaciones-uuid">{{ data.uuid }}</div>
                    <small>{{ data.cfdi?.serie || '—' }} / {{ data.cfdi?.folio || '—' }}</small></template
                ></Column
            >
            <Column header="Importe"
                ><template #body="{ data }">{{ handleImporte(data.cfdi?.total) }}</template></Column
            >
            <Column field="motivo_sat" header="Motivo SAT" />
            <Column header="Solicitante"
                ><template #body="{ data }">{{ data.solicitante?.nombre || 'Sin registro previo' }}</template></Column
            >
            <Column header="Estado"
                ><template #body="{ data }"><Tag :value="handleEstado(data.estatus).label" :severity="handleEstado(data.estatus).severity" /></template
            ></Column>
            <Column header="Opciones"
                ><template #body="{ data }"
                    ><div class="cancelaciones-opciones">
                        <Button label="Detalle" icon="pi pi-eye" outlined :disabled="ocupado" @click="handleDetalle(data)" /><Button
                            v-if="data.estatus === 'pendiente'"
                            label="Aceptar"
                            icon="pi pi-check"
                            severity="success"
                            :disabled="ocupado"
                            @click="handleAceptar(data)"
                        /></div></template
            ></Column>
        </DataTable>
        <Paginator :first="offset" :rows="limite" :totalRecords="total" :rowsPerPageOptions="[20, 50, 100]" :disabled="ocupado" @page="handlePaginar" />
    </div>
    <Dialog v-model:visible="detalleVisible" header="Detalle de cancelación" modal class="cancelaciones-dialogo" :closable="!ocupado" :closeOnEscape="!ocupado">
        <ProgressBar v-if="cargandoDetalle" mode="indeterminate" style="height: 4px" />
        <Message v-if="errorDetalle" severity="error" :closable="false">{{ errorDetalle }}</Message>
        <div v-if="seleccionado" class="cancelaciones-detalle">
            <Tag :value="handleEstado(seleccionado.estatus).label" :severity="handleEstado(seleccionado.estatus).severity" />
            <Message v-if="seleccionado.sincronizacion_cfdi_pendiente" severity="warn" :closable="false">El SAT confirmó la cancelación, pero el CFDI local requiere revisión de sincronización.</Message>
            <div class="cancelaciones-datos">
                <div>
                    <small>UUID</small><span class="cancelaciones-uuid">{{ seleccionado.uuid }}</span>
                </div>
                <div>
                    <small>Emisor</small><span>{{ seleccionado.cfdi?.emisor_nombre || seleccionado.emisor_rfc }}</span>
                </div>
                <div>
                    <small>Receptor</small><span>{{ seleccionado.cfdi?.receptor_nombre || seleccionado.cfdi?.receptor_rfc || '—' }}</span>
                </div>
                <div>
                    <small>Serie / folio</small><span>{{ seleccionado.cfdi?.serie || '—' }} / {{ seleccionado.cfdi?.folio || '—' }}</span>
                </div>
                <div>
                    <small>Importe</small><span>{{ handleImporte(seleccionado.cfdi?.total) }}</span>
                </div>
                <div>
                    <small>Solicitante</small><span>{{ seleccionado.solicitante?.nombre || 'Sin registro previo' }}</span>
                </div>
                <div>
                    <small>Motivo SAT</small><span>{{ handleMotivo(seleccionado.motivo_sat) }}</span>
                </div>
                <div v-if="seleccionado.uuid_sustituto">
                    <small>UUID sustituto</small><span>{{ seleccionado.uuid_sustituto }}</span>
                </div>
            </div>
            <p v-if="seleccionado.aceptada_por">Aceptada por {{ seleccionado.aceptada_por.nombre || seleccionado.aceptada_por.id }} el {{ handleFecha(seleccionado.fecha_aceptacion) }}.</p>
            <div>
                <strong>Observaciones</strong>
                <p>{{ seleccionado.observaciones || 'Sin observaciones.' }}</p>
            </div>
            <DataTable :value="seleccionado.historial_estatus || []" size="small" scrollable scrollHeight="16rem">
                <template #empty>Sin historial registrado.</template>
                <Column header="Fecha"
                    ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
                >
                <Column header="Estado"
                    ><template #body="{ data }">{{ handleEstado(data.estatus).label }}</template></Column
                >
                <Column field="detalle" header="Descripción" />
            </DataTable>
            <div v-if="seleccionado.resultado_sdk">
                <strong>Respuesta de CONTPAQi</strong>
                <pre>{{ handleTexto(seleccionado.resultado_sdk) }}</pre>
            </div>
            <div v-if="seleccionado.evidencia_sat">
                <strong>Evidencia SAT</strong>
                <pre>{{ handleTexto(seleccionado.evidencia_sat) }}</pre>
            </div>
            <Message v-if="accionPendiente && accionPendiente !== 'aceptar' && accionPendiente !== 'retirar'" severity="warn" :closable="false">{{ handleMensajeAccion() }}</Message>
            <div v-if="accionPendiente === 'retirar'" class="cancelaciones-retiro">
                <p>Se retirará esta solicitud sin cancelar el CFDI ante el SAT. El historial se conserva y podrás registrar una nueva solicitud.</p>
                <label for="motivo-retiro">Motivo del retiro (mínimo 10 caracteres)</label>
                <Textarea id="motivo-retiro" v-model="motivoRetiro" rows="3" maxlength="1000" autoResize :disabled="ocupado" />
            </div>
            <p v-if="seleccionado.estatus === 'retirada'">Retirada por {{ seleccionado.retirada_por?.nombre || seleccionado.retirada_por?.id }} el {{ handleFecha(seleccionado.fecha_retiro) }}. {{ seleccionado.motivo_retiro }}</p>
        </div>
        <template #footer>
            <Button label="Cerrar" outlined :disabled="ocupado" @click="handleCerrarDetalle" />
            <Button v-if="seleccionado?.acuse_sat" label="Descargar acuse" icon="pi pi-download" outlined :disabled="ocupado" @click="handleDescargarAcuse" />
            <Button v-if="puedeRetirar && !accionPendiente" label="Retirar solicitud" icon="pi pi-times" severity="danger" outlined :disabled="ocupado" @click="handlePrepararAccion('retirar')" />
            <Button v-if="puedeAceptar && !accionPendiente" label="Aceptar solicitud" icon="pi pi-check" severity="success" :disabled="ocupado" @click="handlePrepararAccion('aceptar')" />
            <Button v-if="puedeConsultar && !accionPendiente" label="Consultar estado SAT" icon="pi pi-refresh" outlined :disabled="ocupado" @click="handlePrepararAccion('consultar-estado')" />
            <Button v-if="puedeReintentar && !accionPendiente" label="Reintentar" icon="pi pi-replay" severity="warn" :disabled="ocupado" @click="handlePrepararAccion('reintentar')" />
            <Button v-if="accionPendiente" label="Volver" outlined :disabled="ocupado" @click="handlePrepararAccion('')" />
            <Button
                v-if="accionPendiente"
                :label="accionPendiente === 'retirar' ? 'Confirmar retiro' : 'Confirmar'"
                icon="pi pi-check"
                :loading="guardando"
                :disabled="ocupado || (accionPendiente === 'retirar' && motivoRetiro.trim().length < 10)"
                @click="handleConfirmarAccion"
            />
        </template>
    </Dialog>
    <Dialog v-model:visible="guiaVisible" header="Seguimiento de cancelaciones" modal class="cancelaciones-dialogo">
        <p>Las solicitudes quedan pendientes de revisar. Pulsa Aceptar para autorizar su envio a CONTPAQi. Solo las aceptadas pueden ser tomadas por .NET para una nueva cancelacion; las que ya fueron enviadas se consultan para seguimiento.</p>
        <p>Puedes retirar una solicitud pendiente o aceptada si el ejecutor todavía no la ha tomado. Se conserva el historial y se permite volver a solicitar desde CFDI. Retirar en Gekko no revierte solicitudes ya enviadas al SAT.</p>
        <p>Registra la solicitud desde la consulta de CFDI emitidos. Aquí puedes consultar su avance y la respuesta del ejecutor de CONTPAQi.</p>
        <p>Registrar o enviar una solicitud no significa que el CFDI está cancelado. Puede requerir aceptación del receptor. Solo se confirma con evidencia del SAT.</p>
        <p>Consultar estado solicita una verificación al ejecutor .NET. Reintentar solo está disponible cuando este confirmó que no envió la operación anterior. Si el ejecutor no está conectado, las solicitudes permanecen en cola.</p>
        <p>Los indicadores respetan empresa, búsqueda y fechas, e incluyen todos los estados. Las fechas del filtro corresponden a días UTC; las horas del detalle se muestran en tu zona local.</p>
        <template #footer><Button label="Entendido" @click="handleCerrarGuia" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {
    name: 'MesaControlCancelaciones',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
