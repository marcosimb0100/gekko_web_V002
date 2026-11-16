<template>
    <Button icon="pi pi-calendar" text rounded class="cal-acceso" title="Calendario" aria-label="Abrir calendario de pagos y Juridico" @click="handleMostrar" />
    <Dialog v-model:visible="visible" modal header="Calendario" :style="{ width: '70rem', maxWidth: '96vw' }" :breakpoints="{ '960px': '95vw' }">
        <div class="cal-barra">
            <div class="cal-navegacion">
                <Button icon="pi pi-chevron-left" text rounded aria-label="Mes anterior" :disabled="anio === 1900 && mes === 0" @click="handleCambiarMes(-1)" />
                <h2 aria-live="polite">{{ tituloMes }}</h2>
                <Button icon="pi pi-chevron-right" text rounded aria-label="Mes siguiente" :disabled="anio === 2100 && mes === 11" @click="handleCambiarMes(1)" />
            </div>
            <div class="cal-acciones"><Button label="Hoy" outlined size="small" @click="handleIrHoy" /><Button icon="pi pi-refresh" outlined size="small" aria-label="Actualizar calendario" :loading="cargando" @click="handleCargar" /></div>
        </div>
        <div class="cal-barra">
            <SelectButton v-model="fuente" :options="fuentes" optionLabel="nombre" optionValue="valor" :allowEmpty="false" />
            <div class="cal-leyenda">
                <span v-if="puedePagos"><i class="cal-leyenda-pago" />Pagos: {{ cantidadPagos }}</span
                ><span v-if="puedeJuridico"><i />Jurídico: {{ cantidadJuridico }}</span>
            </div>
        </div>
        <Message v-if="errorPagos" severity="warn" :closable="false">Pagos: {{ errorPagos }}</Message
        ><Message v-if="errorJuridico" severity="warn" :closable="false">Jurídico: {{ errorJuridico }}</Message
        ><Message v-if="!puedePagos && !puedeJuridico" severity="info" :closable="false">Tu perfil no tiene acceso a pagos programados ni a la agenda jurídica.</Message>
        <ProgressBar v-if="cargando" mode="indeterminate" style="height: 0.25rem; margin-bottom: 0.8rem" />
        <div class="cal-contenido">
            <section aria-label="Días del mes">
                <div class="cal-semana">
                    <span v-for="d in diasSemana" :key="d">{{ d }}</span>
                </div>
                <div class="cal-cuadricula">
                    <template v-for="(celda, i) in celdas" :key="celda ? celda.fecha : i"
                        ><Button
                            v-if="celda"
                            class="cal-dia"
                            :class="{ 'cal-con-pagos': celda.cantidad, 'cal-seleccionado': seleccionado === celda.fecha, 'cal-hoy': hoy === celda.fecha }"
                            :aria-pressed="seleccionado === celda.fecha"
                            :aria-label="`${celda.fecha}: ${celda.pagos} pagos, ${celda.juridico} tareas jurídicas`"
                            @click="handleSeleccionar(celda.fecha)"
                            ><strong>{{ celda.dia }}</strong
                            ><span class="cal-cantidades"
                                ><span v-if="celda.pagos" class="cal-cantidad" title="Pagos">{{ celda.pagos }} P</span><span v-if="celda.juridico" class="cal-cantidad cal-cantidad-legal" title="Jurídico">{{ celda.juridico }} J</span></span
                            ></Button
                        >
                        <div v-else aria-hidden="true"
                    /></template>
                </div>
                <p class="cal-nota" style="margin-top: 0.8rem">Pagos: fechas previstas de acuerdos activos. Jurídico: tareas pendientes y vencidas de expedientes.</p>
            </section>
            <section class="cal-detalle" aria-live="polite">
                <h3>{{ fechaSeleccionada }}</h3>
                <article v-for="pago in pagosSeleccionados" :key="'pago-' + pago.id" class="cal-pago">
                    <Tag value="Pago programado" severity="info" /><strong>{{ pago.proveedor_nombre }}</strong>
                    <p>{{ pago.concepto }}</p>
                    <small>{{ pago.empresa_nombre }}</small>
                    <div class="cal-importe">{{ pago.variable ? 'Importe según factura' : handleMoneda(pago.importe) }}</div>
                    <small>{{ pago.medio }} - {{ pago.periodicidad }}</small>
                </article>
                <Message v-if="errorDia" severity="error" :closable="false">{{ errorDia }}</Message
                ><ProgressBar v-if="cargandoDia" mode="indeterminate" style="height: 0.25rem" />
                <template v-if="fuente !== 'Pagos'"
                    ><article v-for="tarea in tareas" :key="'legal-' + tarea.id" class="cal-pago cal-juridico">
                        <Tag :value="'Jurídico - ' + tarea.estado" :severity="tarea.estado === 'Vencida' ? 'danger' : 'secondary'" /><strong>{{ tarea.expediente_folio }}</strong>
                        <p>{{ tarea.actividad }}</p>
                        <small>{{ tarea.empresa_nombre }}</small
                        ><small>{{ tarea.responsable_nombre }}</small
                        ><Button label="Ver en Agenda" icon="pi pi-arrow-right" text size="small" @click="handleAbrirAgenda" />
                    </article>
                    <Paginator v-if="totalTareas > 10" :first="primeroTareas" :rows="10" :totalRecords="totalTareas" template="PrevPageLink CurrentPageReport NextPageLink" @page="handlePagina"
                /></template>
                <p v-if="!cargando && !cargandoDia && !pagosSeleccionados.length && !tareas.length" class="cal-nota">No hay eventos de los módulos seleccionados para este día.</p>
            </section>
        </div>
    </Dialog>
</template>
<script>
import proceso from './js/calendario';
export default {
    name: 'CalendarioPagos',
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/calendario.css';
</style>
