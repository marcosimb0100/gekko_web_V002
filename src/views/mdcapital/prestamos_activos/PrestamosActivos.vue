<template>
    <div class="mdp-page">
        <div class="mdp-header">
            <div class="mdp-header-title">
                <span class="mdp-header-icon"><i class="pi pi-wallet"></i></span>
                <div>
                    <h2>Préstamos activos · MD Capital</h2>
                    <p>Consulta de préstamos PT, amortizaciones y análisis de CFDI en Gekko.</p>
                </div>
            </div>
            <div class="mdp-header-buttons">
                <Button label="Conciliación global" icon="pi pi-sync" class="mdp-global-button" :disabled="cargando || conciliandoGlobal" :loading="conciliandoGlobal" @click="handleConciliarGlobal" />
                <Button label="Actualizar" :loading="cargando" :disabled="conciliandoGlobal" @click="handleConsultar"
                    ><template #icon><i class="pi pi-refresh mr-2"></i></template
                ></Button>
            </div>
        </div>

        <div class="mdp-summary">
            <div class="mdp-metric">
                <span>Préstamos PT</span><strong>{{ resumen.totalPrestamos }}</strong
                ><small>Activos en MD Capital</small>
            </div>
            <div class="mdp-metric">
                <span>Periodos programados</span><strong>{{ resumen.periodosTotales }}</strong
                ><small>Tabla de amortización</small>
            </div>
            <div class="mdp-metric">
                <span>Periodos pagados</span><strong>{{ resumen.periodosPagados }}</strong
                ><small>Según MD Capital</small>
            </div>
            <div class="mdp-metric">
                <span>Con UUID registrado</span><strong>{{ resumen.periodosConUuid }}</strong
                ><small>Sin validar aún en Gekko</small>
            </div>
        </div>

        <div class="card mdp-panel">
            <div class="mdp-panel-heading">
                <h3>Consulta de préstamos</h3>
                <small>Selecciona un préstamo para revisar su amortización</small>
            </div>
            <div class="mdp-filters">
                <div class="mdp-field mdp-grow"><label for="mdp-buscar">Buscar cliente, RFC o préstamo</label><InputText id="mdp-buscar" v-model="buscar" placeholder="Nombre, RFC o identificador" class="w-full" /></div>
                <div class="mdp-field"><label for="mdp-estado">Avance de pago</label><Dropdown inputId="mdp-estado" v-model="filtroPago" :options="opcionesPago" optionLabel="label" optionValue="value" class="w-full" /></div>
                <Button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" outlined @click="handleLimpiar" />
            </div>
            <div v-if="mensajeError" class="mdp-error" role="alert">{{ mensajeError }}</div>
            <DataTable :value="prestamosFiltrados" dataKey="idPrestamo" :loading="cargando" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" scrollable scrollHeight="55vh" size="small" stripedRows class="mdp-table">
                <Column header="Cliente" style="min-width: 220px"
                    ><template #body="{ data }"
                        ><strong>{{ data.cliente?.nombreCompleto || 'Sin nombre' }}</strong>
                        <div class="mdp-muted">{{ data.cliente?.rfc || 'RFC no registrado' }}</div></template
                    ></Column
                >
                <Column field="idPrestamo" header="ID préstamo" style="min-width: 145px" />
                <Column header="Préstamo" style="min-width: 170px"
                    ><template #body="{ data }"
                        >{{ data.prestamo?.nombrePrestamo || '—' }}
                        <div class="mdp-muted">{{ data.prestamo?.periodicidad || '' }}</div></template
                    ></Column
                >
                <Column header="Monto" style="min-width: 130px"
                    ><template #body="{ data }">{{ formatoMoneda(data.prestamo?.montoPrestamo) }}</template></Column
                >
                <Column header="Pagados" style="min-width: 145px"
                    ><template #body="{ data }"
                        ><strong>{{ data.resumen?.periodosPagados || 0 }} / {{ data.resumen?.totalPeriodos || 0 }}</strong>
                        <div class="mdp-progress"><span :style="{ width: porcentaje(data.resumen?.periodosPagados, data.resumen?.totalPeriodos) + '%' }"></span></div></template
                ></Column>
                <Column header="UUID registrados" style="min-width: 145px"
                    ><template #body="{ data }">{{ data.resumen?.periodosConUuid || 0 }} / {{ data.resumen?.totalPeriodos || 0 }}</template></Column
                >
                <Column header="Detalle" style="min-width: 100px"
                    ><template #body="{ data }"><Button icon="pi pi-eye" label="Ver" text size="small" @click="handleSeleccionar(data)" /></template
                ></Column>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="mostrarDialogAmortizacion"
            modal
            header="Detalle de amortización"
            :style="{ width: '96vw', maxWidth: '1500px' }"
            :breakpoints="{ '960px': '98vw' }"
            :draggable="false"
            :dismissableMask="false"
            @hide="handleCerrarDetalle"
            class="mdp-amortizacion-dialog"
        >
            <div v-if="prestamoSeleccionado" class="mdp-dialog-body">
                <div class="mdp-detail-header">
                    <div>
                        <h3>{{ prestamoSeleccionado.cliente?.nombreCompleto }}</h3>
                        <p>Préstamo {{ prestamoSeleccionado.idPrestamo }} · {{ prestamoSeleccionado.prestamo?.nombrePrestamo || '—' }}</p>
                    </div>
                </div>
                <div class="mdp-detail-info">
                    <div>
                        <small>RFC</small><strong>{{ prestamoSeleccionado.cliente?.rfc || '—' }}</strong>
                    </div>
                    <div>
                        <small>Periodicidad</small><strong>{{ prestamoSeleccionado.prestamo?.periodicidad || '—' }}</strong>
                    </div>
                    <div>
                        <small>Plazos pagados</small><strong>{{ prestamoSeleccionado.resumen?.periodosPagados || 0 }} / {{ prestamoSeleccionado.resumen?.totalPeriodos || 0 }}</strong>
                    </div>
                    <div>
                        <small>UUID registrados</small><strong>{{ prestamoSeleccionado.resumen?.periodosConUuid || 0 }}</strong>
                    </div>
                </div>
                <div class="mdp-notice"><i class="pi pi-info-circle"></i> Los importes de intereses e IVA son los registrados en la amortización. Tener UUID no confirma que el CFDI esté vigente en Gekko.</div>
                <div class="mdp-actions mdp-actions-top">
                    <div class="mdp-emisor"><label for="mdp-rfc-emisor">RFC emisor (opcional)</label><InputText id="mdp-rfc-emisor" v-model="rfcEmisor" maxlength="13" placeholder="Filtrar empresa emisora" /></div>
                    <Button class="mdp-analyze-button" label="Analizar conciliación" icon="pi pi-sync" :loading="conciliandoIndividual" :disabled="conciliandoIndividual || conciliandoGlobal" @click="handleConciliarIndividual" />
                    <Button class="mdp-stamp-button" label="Timbrar siguiente periodo" icon="pi pi-file" disabled />
                    <small>El análisis no modifica datos. El guardado de UUID requiere selección y confirmación. No se timbran facturas.</small>
                </div>
                <DataTable :value="prestamoSeleccionado.amortizacion || []" dataKey="plazo" paginator :rows="12" :rowsPerPageOptions="[12, 24, 50]" scrollable scrollHeight="48vh" size="small" stripedRows class="mdp-table">
                    <Column field="plazo" header="Plazo" sortable style="min-width: 80px" />
                    <Column header="Fecha programada" style="min-width: 140px"
                        ><template #body="{ data }">{{ formatoFecha(data.fechaPago) }}</template></Column
                    >
                    <Column header="Fecha aplicada" style="min-width: 140px"
                        ><template #body="{ data }">{{ formatoFecha(data.fechaAplicacionPago) }}</template></Column
                    >
                    <Column header="Capital" style="min-width: 115px"
                        ><template #body="{ data }">{{ formatoMoneda(data.capital) }}</template></Column
                    >
                    <Column header="Intereses" style="min-width: 115px"
                        ><template #body="{ data }">{{ formatoMoneda(data.intereses) }}</template></Column
                    >
                    <Column header="IVA" style="min-width: 100px"
                        ><template #body="{ data }">{{ formatoMoneda(data.iva) }}</template></Column
                    >
                    <Column header="Interés + IVA" style="min-width: 130px"
                        ><template #body="{ data }">{{ formatoMoneda(data.interesMasIvaProgramado ?? Number(data.intereses || 0) + Number(data.iva || 0)) }}</template></Column
                    >
                    <Column header="Pago" style="min-width: 110px"
                        ><template #body="{ data }"><Tag :value="Number(data.pagado) === 1 ? 'Pagado' : 'Pendiente'" :severity="Number(data.pagado) === 1 ? 'success' : 'warning'" /></template
                    ></Column>
                    <Column header="UUID" style="min-width: 235px"
                        ><template #body="{ data }"
                            ><span v-if="data.facturaUuid" class="mdp-uuid" :title="data.facturaUuid">{{ data.facturaUuid }}</span
                            ><span v-else class="mdp-muted">Sin UUID</span></template
                        ></Column
                    >
                    <Column header="Fecha CFDI" style="min-width: 135px"
                        ><template #body="{ data }">{{ formatoFecha(data.facturaFecha) }}</template></Column
                    >
                    <Column header="Estatus CFDI" style="min-width: 125px"
                        ><template #body="{ data }">{{ data.facturaEstatus || 'No verificado' }}</template></Column
                    >
                </DataTable>
            </div>
        </Dialog>

        <Dialog
            v-model:visible="mostrarDialogConciliacion"
            modal
            header="Resultado de conciliación · Revisión y guardado"
            :style="{ width: '96vw', maxWidth: '1450px' }"
            :breakpoints="{ '960px': '98vw' }"
            :draggable="false"
            class="mdp-conciliacion-dialog"
        >
            <div v-if="resultadoIndividual" class="mdp-dialog-body">
                <div class="mdp-detail-header">
                    <div>
                        <h3>{{ resultadoIndividual.cliente?.nombreCompleto || 'Cliente' }}</h3>
                        <p>{{ resultadoIndividual.idPrestamo }} · {{ resultadoIndividual.cliente?.rfc || 'RFC no registrado' }}</p>
                    </div>
                    <Tag value="Propuestas sin guardar" severity="info" />
                </div>
                <div class="mdp-conciliacion-metrics">
                    <div>
                        <small>Periodos analizados</small><strong>{{ resultadoIndividual.periodos?.length || 0 }}</strong>
                    </div>
                    <div>
                        <small>Sin coincidencia</small><strong>{{ resumenConciliacion.sin_coincidencia || 0 }}</strong>
                    </div>
                    <div>
                        <small>Propuestas</small><strong>{{ resumenConciliacion.propuesta_cronologica || 0 }}</strong>
                    </div>
                    <div>
                        <small>Ambiguos</small><strong>{{ resumenConciliacion.ambiguo || 0 }}</strong>
                    </div>
                    <div>
                        <small>UUID sin verificar</small><strong>{{ resumenConciliacion.uuid_registrado_sin_verificar || 0 }}</strong>
                    </div>
                </div>
                <div class="mdp-notice"><i class="pi pi-exclamation-triangle"></i> Las propuestas cronológicas son asignaciones preliminares, no facturas conciliadas. Revisar emisor, periodo y vigencia fiscal antes de asignar UUID.</div>
                <div class="mdp-field mdp-filter-estado"><label>Filtrar resultado</label><Dropdown v-model="filtroConciliacion" :options="opcionesConciliacion" optionLabel="label" optionValue="value" /></div>
                <div class="mdp-save-bar">
                    <div>
                        <strong>{{ seleccionVigente.length }} asignaciones seleccionadas ({{ totalElegibles }} propuestas automáticas elegibles)</strong><small>Incluye propuestas automáticas y selecciones manuales en periodos ambiguos. Revisa UUID, emisor e importes antes de confirmar.</small>
                    </div>
                    <div class="mdp-selection-actions">
                        <Button
                            :label="todasSeleccionadas ? 'Desmarcar todas' : 'Seleccionar todas las propuestas'"
                            icon="pi pi-check-square"
                            severity="secondary"
                            outlined
                            :disabled="!totalElegibles || guardandoCFDI || conciliandoGlobal"
                            @click="seleccionarTodas"
                        />
                        <Button label="Guardar conciliación seleccionada" icon="pi pi-save" severity="success" :disabled="!seleccionVigente.length || guardandoCFDI || conciliandoGlobal" @click="abrirConfirmacionGuardado" />
                    </div>
                </div>
                <DataTable :value="periodosIndividuales" dataKey="plazo" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" scrollable scrollHeight="48vh" size="small" stripedRows class="mdp-table">
                    <Column header="Guardar" style="min-width: 95px"
                        ><template #body="{ data }"
                            ><Checkbox
                                :binary="true"
                                :modelValue="estaSeleccionado(resultadoIndividual, data)"
                                :disabled="!esPropuesta(data) || uuidConflictos.has(String(data.uuidPropuesto || '').toUpperCase()) || guardandoCFDI"
                                @update:modelValue="(v) => alternarSeleccion(resultadoIndividual, data, v)" /></template
                    ></Column>
                    <Column field="plazo" header="Plazo" sortable style="min-width: 80px" />
                    <Column header="Fecha programada" style="min-width: 135px"
                        ><template #body="{ data }">{{ formatoFecha(data.fechaProgramada) }}</template></Column
                    >
                    <Column header="Intereses" style="min-width: 115px"
                        ><template #body="{ data }">{{ formatoMoneda(data.intereses) }}</template></Column
                    >
                    <Column header="IVA" style="min-width: 100px"
                        ><template #body="{ data }">{{ formatoMoneda(data.iva) }}</template></Column
                    >
                    <Column header="Total esperado" style="min-width: 135px"
                        ><template #body="{ data }">{{ formatoMoneda(data.importeEsperado) }}</template></Column
                    >
                    <Column header="Resultado" style="min-width: 190px"
                        ><template #body="{ data }"><Tag :value="estadoConciliacion(data.estado)" :severity="severidadConciliacion(data.estado)" /></template
                    ></Column>
                    <Column header="Coincidencias" style="min-width: 110px"
                        ><template #body="{ data }">{{ data.totalCandidatos || 0 }}</template></Column
                    >
                    <Column header="UUID MD Capital" style="min-width: 200px"
                        ><template #body="{ data }"
                            ><span class="mdp-uuid">{{ data.uuidMdCapital || '—' }}</span></template
                        ></Column
                    >
                    <Column header="Factura propuesta / candidatos en Gekko" style="min-width: 350px"
                        ><template #body="{ data }"
                            ><div v-if="data.candidatos?.length" class="mdp-candidatos">
                                <div v-for="c in data.estado === 'propuesta_cronologica' ? data.candidatos.slice(0, 1) : data.candidatos" :key="c.uuid" class="mdp-candidato">
                                    <strong class="mdp-uuid">{{ c.uuid }}</strong
                                    ><small>{{ formatoFecha(c.fecha) }} · {{ c.rfcEmisor || 'Sin emisor' }} · {{ formatoMoneda(c.total) }} · {{ c.metodoPago || '—' }}</small>
                                </div>
                                <small v-if="data.estado === 'propuesta_cronologica'">Propuesta cronológica · {{ data.totalCandidatos || 0 }} coincidencias originales</small>
                                <div v-if="data.estado === 'ambiguo'" class="mdp-manual-select">
                                    <label :for="'mdp-manual-' + data.plazo">Seleccionar CFDI para este periodo</label>
                                    <Dropdown
                                        :inputId="'mdp-manual-' + data.plazo"
                                        :modelValue="uuidManualSeleccion(resultadoIndividual, data)"
                                        :options="data.candidatos"
                                        optionLabel="uuid"
                                        optionValue="uuid"
                                        placeholder="Elige un CFDI candidato"
                                        :showClear="true"
                                        :disabled="guardandoCFDI"
                                        class="w-full"
                                        @update:modelValue="(uuid) => seleccionarCandidatoManual(resultadoIndividual, data, uuid)"
                                    />
                                    <small v-if="data.motivoAmbiguedad">{{ data.motivoAmbiguedad }}</small>
                                    <small v-if="data.totalCandidatos > data.candidatos.length">Se muestran {{ data.candidatos.length }} de {{ data.totalCandidatos }} candidatos; el backend valida nuevamente el UUID elegido.</small>
                                    <small v-if="estaManualSeleccionado(resultadoIndividual, data)" class="mdp-manual-selected">Selección manual preparada para confirmación.</small>
                                </div>
                                <small v-else-if="data.totalCandidatos > data.candidatos.length">Se muestran {{ data.candidatos.length }} de {{ data.totalCandidatos }} candidatos</small>
                            </div>
                            <span v-else class="mdp-muted">Sin candidatos</span></template
                        ></Column
                    >
                </DataTable>
            </div>
        </Dialog>

        <Dialog v-model:visible="mostrarDialogGlobal" modal header="Conciliación global · Revisión y guardado" :style="{ width: '95vw', maxWidth: '1250px' }" :breakpoints="{ '960px': '98vw' }" :draggable="false" :closable="!conciliandoGlobal">
            <div class="mdp-dialog-body">
                <div class="mdp-global-head">
                    <div>
                        <strong>{{ globalProgreso.procesados }} / {{ globalProgreso.total || '—' }} préstamos procesados</strong><small>{{ globalProgreso.lotes }} lotes · 20 préstamos por lote</small>
                    </div>
                    <Button v-if="conciliandoGlobal" label="Detener al terminar el lote" icon="pi pi-stop" severity="secondary" outlined :disabled="cancelarGlobal" @click="handleCancelarGlobal" />
                </div>
                <ProgressBar :value="porcentajeGlobal" :showValue="true" />
                <div v-if="cancelarGlobal" class="mdp-notice">Se detendrá después de finalizar la solicitud actual.</div>
                <div v-if="errorGlobal" class="mdp-error">{{ errorGlobal }}</div>
                <div class="mdp-notice"><i class="pi pi-info-circle"></i> Esta operación genera propuestas cronológicas con CFDI de MongoDB. No guarda UUID ni emite CFDI.</div>
                <div class="mdp-save-bar">
                    <div>
                        <strong>{{ seleccionVigente.length }} asignaciones seleccionadas ({{ totalElegibles }} propuestas automáticas elegibles)</strong
                        ><small>{{ uuidConflictos.size }} UUID con propuestas repetidas, bloqueados para guardar. Revisa los préstamos antes de confirmar.</small>
                    </div>
                    <div class="mdp-selection-actions">
                        <Button
                            :label="todasSeleccionadas ? 'Desmarcar todas' : 'Seleccionar todas las propuestas válidas'"
                            icon="pi pi-check-square"
                            severity="secondary"
                            outlined
                            :disabled="!totalElegibles || conciliandoGlobal || guardandoCFDI"
                            @click="seleccionarTodas"
                        />
                        <Button label="Guardar conciliación seleccionada" icon="pi pi-save" severity="success" :disabled="!seleccionVigente.length || conciliandoGlobal || guardandoCFDI" @click="abrirConfirmacionGuardado" />
                    </div>
                </div>
                <DataTable :value="resultadoGlobal" dataKey="idPrestamo" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" scrollable scrollHeight="48vh" size="small" stripedRows class="mdp-table">
                    <Column header="Cliente" style="min-width: 220px"
                        ><template #body="{ data }"
                            ><strong>{{ data.cliente?.nombreCompleto || 'Sin nombre' }}</strong>
                            <div class="mdp-muted">{{ data.cliente?.rfc || 'Sin RFC' }}</div></template
                        ></Column
                    >
                    <Column field="idPrestamo" header="Préstamo" style="min-width: 150px" />
                    <Column header="Total periodos" style="min-width: 115px"
                        ><template #body="{ data }">{{ data.periodos?.length || 0 }}</template></Column
                    >
                    <Column header="Periodos pagados" style="min-width: 145px"
                        ><template #body="{ data }">
                            <span class="mdp-global-paid">{{ periodosPagadosGlobal(data) }} / {{ data.periodos?.length || 0 }}</span>
                            <div class="mdp-progress"><span :style="{ width: porcentaje(periodosPagadosGlobal(data), data.periodos?.length) + '%' }"></span></div> </template
                    ></Column>
                    <Column header="Sin coincidencia" style="min-width: 130px"
                        ><template #body="{ data }">{{ totalEstado(data.periodos, 'sin_coincidencia') }}</template></Column
                    >
                    <Column header="CFDI propuestos" style="min-width: 130px"
                        ><template #body="{ data }">{{ totalEstado(data.periodos, 'propuesta_cronologica') }}</template></Column
                    >
                    <Column header="Seleccionar propuestas" style="min-width: 145px"
                        ><template #body="{ data }"
                            ><div class="mdp-loan-selection">
                                <Button
                                    :label="elegiblesPrestamo(data).length && seleccionadasPrestamo(data) === elegiblesPrestamo(data).length ? 'Desmarcar' : 'Seleccionar válidas'"
                                    size="small"
                                    text
                                    :disabled="!elegiblesPrestamo(data).length || conciliandoGlobal || guardandoCFDI"
                                    @click="alternarPrestamoCompleto(data)"
                                />
                                <small>{{ seleccionadasPrestamo(data) }} / {{ elegiblesPrestamo(data).length }} seleccionadas</small>
                            </div></template
                        ></Column
                    >
                    <Column header="Detalle" style="min-width: 110px"
                        ><template #body="{ data }"><Button label="Ver" icon="pi pi-eye" size="small" text @click="handleVerResultadoGlobal(data)" /></template
                    ></Column>
                </DataTable>
            </div>
        </Dialog>
        <Dialog v-model:visible="mostrarConfirmacionGuardado" modal header="Confirmar guardado de CFDI en MD Capital" :style="{ width: '92vw', maxWidth: '800px' }" :closable="!guardandoCFDI" :draggable="false">
            <div class="mdp-dialog-body">
                <div class="mdp-notice"><i class="pi pi-exclamation-triangle"></i> Esta operación SÍ modifica SQL Server. Solo guarda UUID y datos fiscales; no modifica pagos ni timbra CFDI. No cierres mientras guarda.</div>
                <p>
                    Se enviarán <strong>{{ seleccionVigente.length }}</strong> asignaciones. Verifica los préstamos, plazos y UUID antes de continuar.
                </p>
                <div v-if="!guardandoCFDI && !progresoGuardado.procesados" class="mdp-save-preview">
                    <div v-for="r in seleccionVigente" :key="r.clave" class="mdp-save-preview-row">
                        <strong>{{ r.idPrestamo }} · Plazo {{ r.plazo }} · {{ r.modo === 'manual' ? 'Selección manual' : 'Propuesta automática' }}</strong>
                        <span class="mdp-uuid">{{ r.facturaUuid }}</span>
                    </div>
                </div>
                <ProgressBar v-if="guardandoCFDI || progresoGuardado.procesados" :value="porcentaje(progresoGuardado.procesados, progresoGuardado.total)" />
                <p v-if="progresoGuardado.procesados">Guardados: {{ progresoGuardado.correctos }} · Rechazados / sin confirmar: {{ progresoGuardado.errores }}</p>
                <div v-if="resultadosGuardado.length" class="mdp-save-results">
                    <div v-for="(r, i) in resultadosGuardado" :key="i">
                        <Tag :severity="Number(r.error) === 0 ? 'success' : Number(r.error) === 2 ? 'warn' : 'danger'" :value="Number(r.error) === 0 ? 'Guardado' : Number(r.error) === 2 ? 'Sin confirmar' : 'Rechazado'" />
                        <strong>{{ r.idPrestamo }} · plazo {{ r.plazo }}</strong> — {{ r.mensaje }}
                    </div>
                </div>
                <div class="mdp-save-buttons">
                    <Button label="Cerrar" severity="secondary" outlined :disabled="guardandoCFDI" @click="mostrarConfirmacionGuardado = false" /><Button
                        label="Guardar CFDI confirmados"
                        icon="pi pi-save"
                        severity="success"
                        :loading="guardandoCFDI"
                        :disabled="guardandoCFDI || !seleccionVigente.length || progresoGuardado.procesados > 0"
                        @click="confirmarGuardado"
                    />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script>
import proceso from './js/proceso.js';
export default {
    name: 'PrestamosActivosMdCapital',
    setup() {
        return { ...proceso() };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
