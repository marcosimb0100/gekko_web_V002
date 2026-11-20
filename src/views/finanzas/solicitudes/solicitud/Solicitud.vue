<template>
    <Encabezado :titulo="seleccionado?.folio || 'Solicitud de pago'" subtitulo="Registro y seguimiento de tus solicitudes" icono="fa-solid fa-file-invoice-dollar">
        <template #icono><font-icon icon="fa-solid fa-file-invoice-dollar" style="font-size: 1.2rem" /></template>
        <Button icon="pi pi-question-circle" text rounded aria-label="Guía de solicitudes de pago" @click="mostrarAyuda = true" />
        <Button v-if="!mostrar" label="Nueva solicitud" icon="pi pi-plus" class="btn-nuevo" :disabled="ocupado" @click="handleNuevo" />
        <template v-else
            ><Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="ocupado" @click="handleVolver" /><Button
                v-if="editable"
                label="Guardar"
                icon="pi pi-save"
                class="btn-guardar"
                :loading="guardando"
                :disabled="ocupado || !valido"
                @click="handleGuardar"
        /></template>
    </Encabezado>
    <div class="card pago-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <template v-if="!mostrar">
            <div class="pago-herramientas">
                <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Folio, empresa o descripción" maxlength="100" :disabled="cargando" /></IconField
                ><Select v-model="estado" :options="estados" showClear placeholder="Todos los estados" :disabled="cargando" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" /><Button
                    label="Actualizar"
                    icon="pi pi-refresh"
                    outlined
                    :loading="cargando"
                    @click="handleCargar"
                /><Tag :value="total + ' solicitudes'" severity="secondary" />
            </div>
            <DataTable
                :value="registros"
                :loading="cargando"
                lazy
                paginator
                :rows="limite"
                :first="primero"
                :totalRecords="total"
                :rowsPerPageOptions="[10, 25, 50]"
                scrollable
                scrollHeight="flex"
                size="small"
                class="tabla-encabezados pago-tabla"
                @page="handlePagina"
            >
                <template #empty>No tienes solicitudes con estos filtros.</template>
                <Column header="Solicitud" headerClass="encabezado-columna"
                    ><template #body="{ data }"
                        ><div class="pago-identidad">
                            <strong>{{ data.folio }}</strong
                            ><small>{{ handleFecha(data.fecha_solicitud) }}</small>
                        </div></template
                    ></Column
                >
                <Column header="Empresa / descripción" headerClass="encabezado-columna"
                    ><template #body="{ data }"
                        ><div class="pago-identidad">
                            <strong>{{ data.empresa_nombre }}</strong
                            ><span class="pago-descripcion">{{ data.descripcion }}</span>
                        </div></template
                    ></Column
                >
                <Column header="Importe solicitado" headerClass="encabezado-columna"
                    ><template #body="{ data }">{{ handleMoneda(data.importe) }}</template></Column
                >
                <Column header="Fecha propuesta" headerClass="encabezado-columna"
                    ><template #body="{ data }">{{ handleFecha(data.fecha_pago) }}</template></Column
                >
                <Column header="Estado" headerClass="encabezado-columna"
                    ><template #body="{ data }"><Tag :value="data.estado" :severity="data.estado === 'Pendiente' ? 'warn' : 'secondary'" /></template
                ></Column>
                <Column header="Opciones" headerClass="encabezado-columna"
                    ><template #body="{ data }"><Button icon="pi pi-pencil" class="btn-nuevo" aria-label="Abrir solicitud" :disabled="ocupado" @click="handleEditar(data)" /></template
                ></Column>
            </DataTable>
        </template>
        <Tabs v-else v-model:value="tab" class="pago-pestanas">
            <TabList
                ><Tab value="datos">Datos</Tab><Tab value="archivos">Comprobantes <Tag v-if="pendientes.length" :value="pendientes.length" severity="info" /></Tab><Tab value="historial">Historial</Tab></TabList
            >
            <TabPanels>
                <TabPanel value="datos">
                    <form class="pago-formulario" :inert="ocupado || !editable" @submit.prevent="handleGuardar">
                        <div class="pago-resumen">
                            <div>
                                <small>Fecha de solicitud</small><strong>{{ seleccionado?.fecha_solicitud || fechaSolicitud }}</strong>
                            </div>
                            <div>
                                <small>Solicitante</small><strong>{{ seleccionado?.solicitante_nombre || 'Tu usuario de sesión' }}</strong>
                            </div>
                            <Tag :value="seleccionado?.estado || 'Nueva solicitud'" severity="info" />
                        </div>
                        <div class="pago-rejilla">
                            <div class="pago-campo pago-ancho">
                                <label for="pago-empresa">Empresa <span class="requerido">*</span></label
                                ><Select inputId="pago-empresa" v-model="formulario.empresa_id" :options="empresaOpciones" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una empresa" :disabled="!editable || ocupado" />
                            </div>
                            <div class="pago-campo">
                                <label for="pago-importe">Importe solicitado (MXN) <span class="requerido">*</span></label
                                ><InputNumber inputId="pago-importe" v-model="formulario.importe" mode="currency" currency="MXN" locale="es-MX" :min="0.01" :max="9999999999.99" :maxFractionDigits="2" :disabled="!editable || ocupado" />
                            </div>
                            <div class="pago-campo">
                                <label for="pago-fecha">Fecha propuesta de pago <span class="requerido">*</span></label
                                ><DatePicker inputId="pago-fecha" v-model="formulario.fecha_pago" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="!editable || ocupado" />
                            </div>
                            <div class="pago-campo pago-ancho">
                                <label for="pago-descripcion">Descripción <span class="requerido">*</span></label
                                ><Textarea id="pago-descripcion" v-model="formulario.descripcion" rows="5" maxlength="5000" placeholder="Indica el servicio y el motivo del pago" :disabled="!editable || ocupado" />
                            </div>
                        </div>
                    </form>
                    <ResumenPago :pago="seleccionado?.pago_resumen" />
                    <small class="pago-indicacion">Puedes seleccionar imágenes o PDF en Comprobantes antes de pulsar Guardar. La solicitud no genera todavía una salida de dinero.</small>
                </TabPanel>
                <TabPanel value="archivos">
                    <div class="pago-herramientas">
                        <FileUpload
                            v-if="editable"
                            :key="intentoArchivo"
                            mode="basic"
                            accept="application/pdf,image/jpeg,image/png"
                            :maxFileSize="10485760"
                            chooseLabel="Adjuntar comprobante"
                            multiple
                            :disabled="ocupado || (seleccionado?.archivos || []).filter((a) => !a.retirado).length + pendientes.length >= 10"
                            @select="handleAdjuntar"
                        /><Checkbox v-model="verRetirados" inputId="pago-retirados" binary /><label for="pago-retirados">Ver retirados</label>
                    </div>
                    <small class="pago-indicacion">PDF, JPG o PNG. Hasta 10 MB por archivo y 10 comprobantes vigentes. Los seleccionados se cargarán al pulsar Guardar. Retirar un comprobante ya guardado se aplica al confirmar su motivo.</small>
                    <div v-if="pendientes.length" class="pago-pendientes">
                        <div v-for="a in pendientes" :key="a.id" class="pago-pendiente">
                            <i :class="/\.pdf$/i.test(a.archivo.name) ? 'pi pi-file-pdf' : 'pi pi-image'" />
                            <div class="pago-identidad">
                                <strong>{{ a.archivo.name }}</strong
                                ><small>{{ (a.archivo.size / 1024).toFixed(1) }} KB · {{ a.error || 'Se cargará al guardar' }}</small>
                            </div>
                            <Button icon="pi pi-times" text severity="danger" aria-label="Quitar archivo seleccionado" :disabled="ocupado" @click="handleQuitarPendiente(a.id)" />
                        </div>
                    </div>
                    <DataTable :value="archivos" paginator :rows="10" size="small" class="tabla-encabezados">
                        <template #empty>No hay comprobantes adjuntos.</template>
                        <Column field="nombre" header="Archivo" headerClass="encabezado-columna" /><Column field="usuario" header="Adjuntado por" headerClass="encabezado-columna" /><Column header="Fecha" headerClass="encabezado-columna"
                            ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
                        >
                        <Column header="Estado" headerClass="encabezado-columna"
                            ><template #body="{ data }"
                                ><Tag :value="data.retirado ? 'Retirado' : 'Vigente'" :severity="data.retirado ? 'secondary' : 'success'" /><small v-if="data.retiro_motivo" class="pago-indicacion">{{ data.retiro_motivo }}</small></template
                            ></Column
                        >
                        <Column header="Opciones" headerClass="encabezado-columna"
                            ><template #body="{ data }"
                                ><VistaComprobante :archivo="data" :direccion="'/finanzas/solicitudes/' + formulario.id + '/archivos/' + data.id" :disabled="ocupado" /><Button icon="pi pi-download" text aria-label="Descargar comprobante" :disabled="ocupado" @click="handleDescargar(data)" /><Button
                                    v-if="editable && !data.retirado"
                                    icon="pi pi-times"
                                    text
                                    severity="danger"
                                    aria-label="Retirar comprobante"
                                    :disabled="ocupado"
                                    @click="handleRetiro(data)" /></template
                        ></Column>
                    </DataTable>
                </TabPanel>
                <TabPanel value="historial"
                    ><DataTable :value="seleccionado?.historial || []" paginator :rows="10" size="small" class="tabla-encabezados"
                        ><template #empty>El historial estará disponible después de guardar.</template
                        ><Column header="Fecha" headerClass="encabezado-columna"
                            ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
                        ><Column field="usuario" header="Responsable" headerClass="encabezado-columna" /><Column field="accion" header="Movimiento" headerClass="encabezado-columna" /><Column header="Cambios" headerClass="encabezado-columna"
                            ><template #body="{ data }"
                                ><div v-for="(c, i) in data.cambios" :key="i" class="pago-cambio">
                                    <strong>{{ c.campo }}</strong
                                    ><span>{{ c.anterior }} → {{ c.nuevo }}</span>
                                </div></template
                            ></Column
                        ></DataTable
                    ></TabPanel
                >
            </TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="mostrarRetiro" modal header="Retirar comprobante" :closable="!retirando" :style="{ width: '30rem', maxWidth: '95vw' }"
        ><div class="pago-campo">
            <strong>{{ archivoRetiro?.nombre }}</strong
            ><label for="pago-motivo">Motivo <span class="requerido">*</span></label
            ><Textarea id="pago-motivo" v-model="motivoRetiro" rows="3" maxlength="500" :disabled="retirando" /><small>El archivo se conserva en el historial; puedes adjuntar el correcto.</small>
        </div>
        <template #footer
            ><Button label="Cancelar" outlined :disabled="retirando" @click="mostrarRetiro = false" /><Button
                label="Retirar"
                severity="danger"
                :loading="retirando"
                :disabled="ocupado || motivoRetiro.trim().length < 3"
                @click="handleRetirar" /></template
    ></Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de solicitudes de pago" :style="{ width: '38rem', maxWidth: '95vw' }"
        ><div class="pago-guia">
            <p>Solicita el pago de un servicio o gasto con su importe y fecha propuesta.</p>
            <ol>
                <li>Pulsa <strong>Nueva solicitud</strong>, elige la empresa y captura los datos obligatorios.</li>
                <li>La fecha de solicitud y el solicitante se registran automáticamente al guardar.</li>
                <li>Antes de guardar, abre <strong>Comprobantes</strong> y selecciona imágenes o PDF. Puedes elegir varios y quitar los incorrectos de la selección.</li>
                <li>
                    Pulsa <strong>Guardar</strong> para registrar la solicitud y cargar sus comprobantes. Si alguno falla, se conservará en la selección para reintentarlo con Guardar; la solicitud no se duplica. Cancelar descarta los archivos que aún
                    no se han cargado.
                </li>
                <li>Consulta tus solicitudes con los filtros y el botón del lápiz. Puedes corregir los datos mientras estén pendientes.</li>
                <li>En <strong>Historial</strong> puedes consultar los cambios y el retiro de comprobantes.</li>
            </ol>
            <Message severity="info" :closable="false">La Mesa de solicitudes revisa tu petición. Recibirás un aviso cuando se autorice, rechace o pague; el rechazo incluye su motivo. Registrar la solicitud todavía no mueve dinero.</Message>
        </div>
        <template #footer><Button label="Entendido" @click="mostrarAyuda = false" /></template
    ></Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import VistaComprobante from '../../../../components/comprobantes/VistaComprobante.vue';
import ResumenPago from '../../../../components/comprobantes/ResumenPago.vue';
import proceso from './js/proceso';
export default {
    name: 'FinanzasSolicitudPago',
    components: { Encabezado, VistaComprobante, ResumenPago },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
