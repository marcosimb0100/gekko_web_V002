<template>
    <Encabezado titulo="Solicitudes a Jurídico" subtitulo="Recepción, asignación y respuesta a solicitudes" icono="fa-solid fa-inbox"
        ><template #icono><font-icon icon="fa-solid fa-inbox" style="font-size: 1.2rem" /></template><Button icon="pi pi-question-circle" text rounded aria-label="Manual de Solicitudes a Jurídico" title="Ayuda de esta pantalla" @click="handleAyuda" /><Button v-if="!mostrarDetalle" label="Nueva solicitud" icon="pi pi-plus" outlined :disabled="cargando || !!error" @click="handleNuevo"
    />
        <template v-if="mostrarDetalle"><Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="guardando || subiendo || retirando" @click="handleVolver" /><Button v-if="!detalleCerrado" label="Guardar" icon="pi pi-save" class="btn-guardar" :loading="guardando" :disabled="!formularioValido || guardando || cargandoOpciones || cargandoDetalle || subiendo || retirando" @click="handleGuardar" /></template>
    </Encabezado>
    <div v-if="!mostrarDetalle" class="card juridico-contenido juridico-listado">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="juridico-herramientas">
            <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Folio, asunto, empresa o responsable" maxlength="100" /></IconField
            ><Select v-model="estado" :options="estados" showClear placeholder="Todos los estados" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button
                label="Actualizar"
                icon="pi pi-refresh"
                outlined
                :loading="cargando"
                @click="handleCargar"
            /><Tag :value="total + ' solicitudes'" severity="secondary" />
        </div>
        <DataTable scrollable :value="registros" :loading="cargando" lazy paginator :rows="limite" :first="primero" :totalRecords="total" :rowsPerPageOptions="[10, 25, 50]" size="small" class="juridico-tabla tabla-encabezados" @page="handlePagina"
            ><template #empty>No se encontraron solicitudes.</template
            ><Column headerClass="encabezado-columna" header="Solicitud"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <strong>{{ data.folio }}</strong
                        ><span>{{ data.titulo }}</span
                        ><small>{{ handleFecha(data.fecha_creacion) }}</small>
                    </div></template
                ></Column
            ><Column headerClass="encabezado-columna" header="Empresa / tipo"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <span>{{ data.empresa_nombre }}</span
                        ><small>{{ data.tipo_nombre }}</small>
                    </div></template
                ></Column
            ><Column headerClass="encabezado-columna" header="Asignación"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <span>{{ data.responsable_nombre }}</span
                        ><small>Solicitante: {{ data.solicitante_nombre }}</small>
                    </div></template
                ></Column
            ><Column headerClass="encabezado-columna" header="Compromiso"
                ><template #body="{ data }">{{ handleFecha(data.fecha_compromiso) }}</template></Column
            ><Column headerClass="encabezado-columna" header="Prioridad / estado"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <Tag :value="data.prioridad" :severity="['Urgente', 'Alta'].includes(data.prioridad) ? 'warn' : 'secondary'" /><Tag :value="data.estado" :severity="handleColor(data.estado)" /></div></template></Column
            ><Column headerClass="encabezado-columna" header="Opciones"
                ><template #body="{ data }"
                    ><Button class="btn-nuevo"
                        icon="pi pi-pencil"
                        aria-label="Editar o atender solicitud"
                        @click="handleDetalle(data)" /></template></Column
        ></DataTable>
    </div>
    <div v-if="mostrarDetalle" class="card juridico-contenido juridico-pagina-detalle"
        ><Message v-if="errorDetalle" severity="error" :closable="false">{{ errorDetalle }}</Message
        ><ProgressBar v-if="cargandoDetalle" mode="indeterminate" style="height: 0.25rem" /><Tabs v-if="seleccionado || mostrar" v-model:value="detalleTab"
            ><TabList><Tab value="datos">Datos</Tab><Tab v-if="seleccionado" value="documentos">Documentos</Tab><Tab value="historial">Historial</Tab></TabList
            ><TabPanels
                ><TabPanel value="datos"><Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message><ProgressBar v-if="cargandoOpciones" mode="indeterminate" style="height:.25rem" /><template v-if="!detalleCerrado">        <form id="solicitudJuridico" class="juridico-formulario" :inert="guardando || cargandoOpciones" @submit.prevent="handleGuardar">
            <div class="juridico-rejilla">
                <div>
                    <label for="jur-empresa">Empresa <span class="requerido">*</span></label
                    ><Select inputId="jur-empresa" v-model="formulario.empresa_id" :options="empresaOpciones" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una empresa" />
                </div>
                <div>
                    <label for="jur-tipo">Tipo de asunto <span class="requerido">*</span></label
                    ><Select inputId="jur-tipo" v-model="formulario.tipo_id" :options="tipoOpciones" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un tipo de asunto" /><small v-if="!opciones.tipos.length"
                        >Primero registra un tipo de asunto en Configuración de Jurídico.</small
                    >
                </div>
                <div>
                    <label for="jur-area">Área solicitante <span class="requerido">*</span></label
                    ><InputText id="jur-area" v-model="formulario.area" maxlength="120" />
                </div>
                <div>
                    <label for="jur-prioridad">Prioridad <span class="requerido">*</span></label
                    ><Select inputId="jur-prioridad" v-model="formulario.prioridad" :options="prioridades" />
                </div>
                <div class="juridico-ancho">
                    <label for="jur-titulo">Título de la solicitud <span class="requerido">*</span></label
                    ><InputText id="jur-titulo" v-model="formulario.titulo" maxlength="180" />
                </div>
                <div class="juridico-ancho">
                    <label for="jur-descripcion">Descripción <span class="requerido">*</span></label
                    ><Textarea id="jur-descripcion" v-model="formulario.descripcion" rows="3" maxlength="5000" />
                </div>
                <div>
                    <label for="jur-responsable">Responsable</label
                    ><Select inputId="jur-responsable" v-model="formulario.responsable_id" :options="opciones.responsables" optionLabel="nombre" optionValue="id" filter showClear placeholder="Por asignar" @change="handleResponsable" /><small
                        >Usuarios activos con acceso a Solicitudes de Jurídico.</small
                    >
                </div>
                <div>
                    <label for="jur-compromiso">Fecha compromiso <span v-if="formulario.estado === 'En atencion'" class="requerido">*</span></label
                    ><DatePicker inputId="jur-compromiso" v-model="formulario.fecha_compromiso" dateFormat="yy-mm-dd" showIcon :manualInput="false" showClear /><small>Fecha interna de trabajo; no se calculan plazos legales automáticamente.</small>
                </div>
                <div v-if="formulario.id">
                    <label for="jur-estado">Estado <span class="requerido">*</span></label
                    ><Select inputId="jur-estado" v-model="formulario.estado" :options="estados" />
                </div>
                <div v-if="cerrado" class="juridico-ancho">
                    <label for="jur-respuesta">{{ formulario.estado === 'Cancelada' ? 'Motivo de cancelación' : 'Respuesta de cierre' }} <span class="requerido">*</span></label
                    ><Textarea id="jur-respuesta" v-model="formulario.resolucion" rows="3" maxlength="4000" /><small>El cierre conserva la solicitud, sus documentos y su historial.</small>
                </div>
            </div>
            <small>Guarda la solicitud para adjuntar documentos. Puedes abrir su expediente desde Expedientes y asuntos.</small>
        </form>
</template><template v-else><div class="juridico-detalle">
                        <div>
                            <small>Asunto</small><strong>{{ seleccionado.titulo }}</strong>
                        </div>
                        <div><small>Estado</small><Tag :value="seleccionado.estado" :severity="handleColor(seleccionado.estado)" /></div>
                        <div>
                            <small>Empresa</small><span>{{ seleccionado.empresa_nombre }}</span>
                        </div>
                        <div>
                            <small>Tipo de asunto</small><span>{{ seleccionado.tipo_nombre }}</span>
                        </div>
                        <div>
                            <small>Solicitante / área</small><span>{{ seleccionado.solicitante_nombre }} / {{ seleccionado.area }}</span>
                        </div>
                        <div>
                            <small>Responsable</small><span>{{ seleccionado.responsable_nombre }}</span>
                        </div>
                        <div>
                            <small>Fecha compromiso</small><span>{{ handleFecha(seleccionado.fecha_compromiso) }}</span>
                        </div>
                        <div>
                            <small>Prioridad</small><span>{{ seleccionado.prioridad }}</span>
                        </div>
                        <div class="juridico-ancho">
                            <small>Descripción</small><span class="juridico-texto">{{ seleccionado.descripcion }}</span>
                        </div>
                        <div v-if="seleccionado.resolucion" class="juridico-ancho">
                            <small>Respuesta o motivo de cierre</small><span class="juridico-texto">{{ seleccionado.resolucion }}</span>
                        </div>
                    </div></template></TabPanel>
                <TabPanel v-if="seleccionado" value="documentos"
                    ><div class="juridico-formulario">
                        <div class="juridico-herramientas">
                            <FileUpload
                                v-if="!detalleCerrado"
                                :key="intentoArchivo"
                                mode="basic"
                                name="archivo"
                                accept=".pdf,.docx,.jpg,.jpeg,.png"
                                :maxFileSize="10485760"
                                chooseLabel="Adjuntar documento"
                                customUpload
                                auto
                                :disabled="subiendo || retirando"
                                @uploader="handleSubir"
                            />
                            <div class="juridico-check"><Checkbox inputId="jur-retirados" v-model="verRetirados" binary /><label for="jur-retirados">Ver retirados</label></div>
                        </div>
                        <small>PDF, DOCX, JPG o PNG. Máximo 10 MB por archivo y 10 documentos vigentes. Los archivos retirados se conservan para auditoría.</small
                        ><DataTable scrollable :value="archivos" size="small" class="juridico-tabla tabla-encabezados" paginator :rows="5"
                            ><template #empty>No hay documentos adjuntos.</template><Column headerClass="encabezado-columna" field="nombre" header="Documento" /><Column headerClass="encabezado-columna" field="usuario" header="Adjuntado por" /><Column headerClass="encabezado-columna" header="Fecha"
                                ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
                            ><Column headerClass="encabezado-columna" header="Estado"
                                ><template #body="{ data }"
                                    ><div class="juridico-identidad">
                                        <Tag :value="data.retirado ? 'Retirado' : 'Vigente'" :severity="data.retirado ? 'secondary' : 'success'" /><small v-if="data.retirado">{{ data.retiro_motivo }}</small>
                                    </div></template
                                ></Column
                            ><Column headerClass="encabezado-columna" header="Opciones"
                                ><template #body="{ data }"
                                    ><Button icon="pi pi-download" text rounded aria-label="Descargar documento" @click="handleDescargar(data)" /><Button
                                        v-if="!data.retirado && !detalleCerrado"
                                        icon="pi pi-times"
                                        text
                                        rounded
                                        severity="danger"
                                        aria-label="Retirar documento"
                                        :disabled="subiendo || retirando"
                                        @click="handleRetirar(data)" /></template></Column
                        ></DataTable></div
                ></TabPanel>
                <TabPanel value="historial"
                    ><DataTable scrollable :value="seleccionado?.historial || []" paginator :rows="5" size="small" class="juridico-tabla tabla-encabezados"
                        ><template #empty>{{ formulario.id ? 'Sin movimientos registrados.' : 'El historial se genera al guardar el registro.' }}</template
                        ><Column headerClass="encabezado-columna" header="Fecha"
                            ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
                        ><Column headerClass="encabezado-columna" field="usuario" header="Responsable" /><Column headerClass="encabezado-columna" field="accion" header="Movimiento" /><Column headerClass="encabezado-columna" header="Cambios"
                            ><template #body="{ data }"
                                ><div v-for="(c, i) in data.cambios" :key="i" class="juridico-cambio">
                                    <strong>{{ c.campo }}</strong
                                    ><span>{{ c.anterior }} → {{ c.nuevo }}</span>
                                </div></template
                            ></Column
                        ></DataTable
                    ></TabPanel
                ></TabPanels
            ></Tabs
        >
    </div>
    <Dialog v-model:visible="mostrarRetiro" modal header="Retirar documento" :style="{ width: '36rem', maxWidth: '95vw' }" :closable="!retirando" :closeOnEscape="!retirando"
        ><Message v-if="errorRetiro" severity="error" :closable="false">{{ errorRetiro }}</Message>
        <form id="retiroJuridico" class="juridico-formulario" @submit.prevent="handleConfirmarRetiro">
            <strong>{{ archivoRetiro?.nombre }}</strong>
            <div>
                <label for="jur-motivo-retiro">Motivo <span class="requerido">*</span></label
                ><Textarea id="jur-motivo-retiro" v-model="motivoRetiro" rows="3" maxlength="500" :disabled="retirando" />
            </div>
            <small>Se retira de la lista vigente, sin borrar el archivo ni su historial.</small>
        </form>
        <template #footer
            ><Button label="Cancelar" outlined :disabled="retirando" @click="mostrarRetiro = false" /><Button
                label="Retirar"
                icon="pi pi-check"
                type="submit"
                form="retiroJuridico"
                :loading="retirando"
                :disabled="retirando || motivoRetiro.trim().length < 3" /></template
    ></Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de Solicitudes a Jurídico" :style="{ width: '62rem', maxWidth: '96vw' }" class="juridico-ayuda-dialog">
        <div class="juridico-manual">
            <div class="juridico-manual-intro"><i class="pi pi-inbox" /><div><h2>Solicita apoyo al equipo jurídico</h2><p>Registra lo que necesitas, asigna un responsable y conserva la respuesta y sus documentos en un solo lugar.</p></div></div>
            <div class="juridico-manual-flujo"><Tag value="Crear" severity="info" /><i class="pi pi-angle-right" /><Tag value="Asignar" severity="info" /><i class="pi pi-angle-right" /><Tag value="Atender" severity="info" /><i class="pi pi-angle-right" /><Tag value="Cerrar" severity="success" /></div>
            <section v-for="seccion in guia" :key="seccion.titulo" class="juridico-manual-seccion"><h3><i :class="seccion.icono" />{{ seccion.titulo }}</h3><ul><li v-for="paso in seccion.pasos" :key="paso">{{ paso }}</li></ul></section>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default {
    name: 'JuridicoSolicitudes',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
