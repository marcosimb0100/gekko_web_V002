<template>
    <Encabezado :titulo="mostrarDetalle ? (seleccionado?.folio || 'Nuevo expediente') : 'Expedientes y asuntos'" subtitulo="Seguimiento jurídico por empresa" icono="fa-solid fa-folder-open"
        ><template #icono><font-icon icon="fa-solid fa-folder-open" style="font-size: 1.2rem" /></template><Button icon="pi pi-question-circle" text rounded aria-label="Manual de Expedientes y asuntos" title="Ayuda de esta pantalla" @click="handleAyuda" /><Button v-if="!mostrarDetalle" label="Nuevo expediente" icon="pi pi-plus" outlined :disabled="cargando || !!error" @click="handleNuevo"
    />
        <template v-if="mostrarDetalle">
            <Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="guardando || subiendo || retirando || guardandoActuacion || subiendoCorreo || retirandoCorreo || incorporandoAdjunto" @click="handleVolver" />
            <Button v-if="!detalleCerrado" label="Guardar" icon="pi pi-save" class="btn-guardar" :loading="guardando" :disabled="!formularioValido || guardando || cargandoDetalle || cargandoOpciones || subiendo || retirando || subiendoCorreo || retirandoCorreo || incorporandoAdjunto" @click="handleGuardar" />
        </template>
    </Encabezado>
    <div v-if="!mostrarDetalle" class="card juridico-contenido juridico-listado">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="juridico-herramientas">
            <Select v-model="empresa" :options="opciones.empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Todas las empresas" /><IconField
                ><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Folio, asunto, empresa o responsable" maxlength="100" /></IconField
            ><Select v-model="estado" :options="estados" showClear placeholder="Todos los estados" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button
                label="Actualizar"
                icon="pi pi-refresh"
                outlined
                :loading="cargando"
                @click="handleCargar"
            /><Tag :value="total + ' expedientes'" severity="secondary" />
        </div>
        <DataTable scrollable :value="registros" :loading="cargando" lazy paginator :rows="limite" :first="primero" :totalRecords="total" :rowsPerPageOptions="[10, 25, 50]" size="small" class="juridico-tabla tabla-encabezados" @page="handlePagina"
            ><template #empty>No se encontraron expedientes.</template
            ><Column headerClass="encabezado-columna" header="Expediente"
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
            ><Column headerClass="encabezado-columna" header="Responsable / etapa"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <span>{{ data.responsable_nombre }}</span
                        ><small>{{ data.etapa_nombre }}</small>
                    </div></template
                ></Column
            ><Column headerClass="encabezado-columna" header="Compromiso"
                ><template #body="{ data }">{{ handleFecha(data.fecha_compromiso) }}</template></Column
            ><Column headerClass="encabezado-columna" header="Estado"
                ><template #body="{ data }"
                    ><div class="juridico-identidad">
                        <Tag :value="data.estado" :severity="handleColor(data.estado)" /></div></template></Column
            ><Column headerClass="encabezado-columna" header="Opciones"
                ><template #body="{ data }"
                    ><Button class="btn-nuevo"
                        icon="pi pi-pencil"
                        aria-label="Actualizar expediente"
                        @click="handleDetalle(data)" /></template></Column
        ></DataTable>
    </div>
    <div v-if="mostrarDetalle" class="card juridico-contenido juridico-pagina-detalle"
        ><Message v-if="errorDetalle" severity="error" :closable="false">{{ errorDetalle }}</Message
        ><ProgressBar v-if="cargandoDetalle" mode="indeterminate" style="height: 0.25rem" /><Tabs v-if="seleccionado || mostrar" v-model:value="detalleTab"
            ><TabList><Tab value="datos">Datos</Tab><Tab v-if="seleccionado" value="actuaciones">Actuaciones</Tab><Tab v-if="seleccionado" value="documentos">Documentos</Tab><Tab v-if="seleccionado" value="correspondencia">Correspondencia</Tab><Tab value="historial">Historial</Tab></TabList
            ><TabPanels
                ><TabPanel value="datos">
                    <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
                    <ProgressBar v-if="cargandoOpciones" mode="indeterminate" style="height:.25rem" />
                    <template v-if="!detalleCerrado">
        <form id="expedienteJuridico" class="juridico-formulario" :inert="guardando || cargandoOpciones" @submit.prevent="handleGuardar">
            <div class="juridico-rejilla">
                <div>
                    <label for="exp-empresa">Empresa <span class="requerido">*</span></label
                    ><Select
                        inputId="exp-empresa"
                        v-model="formulario.empresa_id"
                        :options="empresaOpciones"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        :disabled="!!formulario.id || !!formulario.solicitud_id"
                        placeholder="Selecciona una empresa"
                        @change="handleEmpresa"
                    /><small>El expediente y sus documentos permanecen vinculados a esta empresa.</small>
                </div>
                <div v-if="!formulario.id">
                    <label for="exp-origen">Solicitud de origen (opcional)</label
                    ><Select
                        v-if="!formulario.solicitud_id"
                        inputId="exp-origen"
                        v-model="formulario.solicitud_id"
                        :options="solicitudes"
                        optionLabel="etiqueta"
                        optionValue="id"
                        :loading="cargandoSolicitudes"
                        :disabled="!formulario.empresa_id"
                        placeholder="Alta directa o elegir una solicitud"
                        emptyMessage="Sin solicitudes abiertas disponibles"
                        @change="handleOrigen"
                    />
                    <div v-else class="juridico-herramientas"><Tag :value="formulario.solicitud_folio" /><Button label="Quitar origen" text size="small" @click="handleQuitarOrigen" /></div>
                    <div v-if="formulario.empresa_id && !formulario.solicitud_id" class="juridico-herramientas">
                        <InputText v-model="busquedaSolicitud" placeholder="Buscar por folio o titulo" maxlength="100" @keydown.enter.prevent="handleBuscarSolicitudes" /><Button
                            icon="pi pi-search"
                            outlined
                            aria-label="Buscar solicitudes"
                            :loading="cargandoSolicitudes"
                            @click="handleBuscarSolicitudes"
                        />
                    </div>
                    <small>Hasta 50 solicitudes abiertas de esta empresa sin expediente.</small>
                </div>
                <div v-else><label>Solicitud de origen</label><InputText :modelValue="formulario.solicitud_folio || 'Alta directa'" disabled /></div>
                <div>
                    <label for="exp-tipo">Tipo de asunto <span class="requerido">*</span></label
                    ><Select
                        inputId="exp-tipo"
                        v-model="formulario.tipo_id"
                        :options="tipoOpciones"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        :disabled="!!formulario.solicitud_id && !formulario.id"
                        placeholder="Selecciona un tipo"
                        emptyMessage="Registra un tipo de asunto activo"
                    />
                </div>
                <div>
                    <label for="exp-etapa">Etapa <span class="requerido">*</span></label
                    ><Select inputId="exp-etapa" v-model="formulario.etapa_id" :options="etapaOpciones" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona una etapa" emptyMessage="Registra una etapa activa" /><small
                        v-if="!opciones.etapas?.length"
                        >Primero registra las etapas en Jurídico / Configuración / Etapas.</small
                    >
                </div>
                <div class="juridico-ancho">
                    <label for="exp-titulo">Título del asunto <span class="requerido">*</span></label
                    ><InputText id="exp-titulo" v-model="formulario.titulo" maxlength="180" />
                </div>
                <div class="juridico-ancho">
                    <label for="exp-descripcion">Descripción <span class="requerido">*</span></label
                    ><Textarea id="exp-descripcion" v-model="formulario.descripcion" rows="3" maxlength="5000" />
                </div>
                <div><label for="exp-contraparte">Contraparte</label><InputText id="exp-contraparte" v-model="formulario.contraparte" maxlength="200" /></div>
                <div>
                    <label for="exp-naturaleza">Naturaleza <span class="requerido">*</span></label
                    ><Select inputId="exp-naturaleza" v-model="formulario.naturaleza" :options="naturalezas" />
                </div>
                <div><label for="exp-referencia">Referencia externa / expediente judicial</label><InputText id="exp-referencia" v-model="formulario.referencia_externa" maxlength="180" /></div>
                <div>
                    <label for="exp-responsable">Responsable <span class="requerido">*</span></label
                    ><Select
                        inputId="exp-responsable"
                        v-model="formulario.responsable_id"
                        :options="opciones.responsables"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        placeholder="Selecciona un responsable"
                        emptyMessage="Sin usuarios activos con acceso a Expedientes"
                    />
                </div>
                <div>
                    <label for="exp-accion">Próxima acción <span v-if="!cerrado && !sinSeguimientoPrevio" class="requerido">*</span></label
                    ><Textarea id="exp-accion" v-model="formulario.proxima_accion" rows="2" maxlength="1000" />
                </div>
                <div>
                    <label for="exp-fecha">Fecha compromiso <span v-if="!cerrado && !sinSeguimientoPrevio" class="requerido">*</span></label
                    ><DatePicker inputId="exp-fecha" v-model="formulario.fecha_compromiso" dateFormat="yy-mm-dd" showIcon :manualInput="false" /><small>Fecha interna de seguimiento, capturada por el responsable.</small>
                </div>
                <div v-if="formulario.id">
                    <label for="exp-estado">Estado <span class="requerido">*</span></label
                    ><Select inputId="exp-estado" v-model="formulario.estado" :options="estados" />
                </div>
                <div v-if="cerrado" class="juridico-ancho">
                    <label for="exp-cierre">Resultado del expediente <span class="requerido">*</span></label
                    ><Textarea id="exp-cierre" v-model="formulario.resolucion" rows="3" maxlength="4000" /><small>Se conservan los datos, documentos e historial para consulta.</small>
                </div>
            </div>
            <small>Los documentos se adjuntan desde el detalle después de guardar. La solicitud de origen conserva sus documentos e historial propios.</small>
        </form>
                    </template>
                    <template v-else><div class="juridico-detalle">
                        <div>
                            <small>Empresa</small><strong>{{ seleccionado.empresa_nombre }}</strong>
                        </div>
                        <div><small>Estado</small><Tag :value="seleccionado.estado" :severity="handleColor(seleccionado.estado)" /></div>
                        <div>
                            <small>Asunto</small><span>{{ seleccionado.titulo }}</span>
                        </div>
                        <div>
                            <small>Solicitud de origen</small><span>{{ seleccionado.solicitud_folio || 'Alta directa' }}</span>
                        </div>
                        <div>
                            <small>Tipo / naturaleza</small><span>{{ seleccionado.tipo_nombre }} / {{ seleccionado.naturaleza }}</span>
                        </div>
                        <div>
                            <small>Etapa</small><span>{{ seleccionado.etapa_nombre }}</span>
                        </div>
                        <div>
                            <small>Contraparte</small><span>{{ seleccionado.contraparte || 'Sin dato' }}</span>
                        </div>
                        <div>
                            <small>Referencia externa</small><span>{{ seleccionado.referencia_externa || 'Sin dato' }}</span>
                        </div>
                        <div>
                            <small>Responsable</small><span>{{ seleccionado.responsable_nombre }}</span>
                        </div>
                        <div>
                            <small>Fecha compromiso</small><span>{{ handleFecha(seleccionado.fecha_compromiso) }}</span>
                        </div>
                        <div class="juridico-ancho">
                            <small>Próxima acción</small><span class="juridico-texto">{{ seleccionado.proxima_accion || 'Sin accion pendiente' }}</span>
                        </div>
                        <div class="juridico-ancho">
                            <small>Descripción</small><span class="juridico-texto">{{ seleccionado.descripcion }}</span>
                        </div>
                        <div v-if="seleccionado.resolucion" class="juridico-ancho">
                            <small>Resultado de cierre</small><span class="juridico-texto">{{ seleccionado.resolucion }}</span>
                        </div>
                    </div></template>
                </TabPanel>
                <TabPanel v-if="seleccionado" value="actuaciones">
                    <div class="juridico-formulario">
                        <Message v-if="errorActuaciones" severity="error" :closable="false">{{ errorActuaciones }}</Message>
                        <div class="juridico-herramientas">
                            <Tag :value="totalActuaciones + ' actuaciones'" severity="secondary" /><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargandoActuaciones" @click="handleCargarActuaciones" /><Button
                                v-if="!detalleCerrado"
                                label="Nueva actuación"
                                icon="pi pi-plus"
                                class="btn-nuevo"
                                :disabled="cargandoActuaciones || subiendo || retirando"
                                @click="handleNuevaActuacion"
                            />
                        </div>
                        <DataTable scrollable
                            :value="actuaciones"
                            :loading="cargandoActuaciones"
                            lazy
                            paginator
                            :rows="limiteActuaciones"
                            :first="primeroActuaciones"
                            :totalRecords="totalActuaciones"
                            :rowsPerPageOptions="[10, 25, 50]"
                            size="small"
                            class="juridico-tabla tabla-encabezados"
                            @page="handlePaginaActuaciones"
                        >
                            <template #empty>No hay actuaciones registradas.</template>
                            <Column headerClass="encabezado-columna" header="Fecha / tipo"
                                ><template #body="{ data }"
                                    ><div class="juridico-identidad">
                                        <strong>{{ handleFecha(data.fecha) }}</strong
                                        ><span>{{ data.tipo_nombre }}</span>
                                    </div></template
                                ></Column
                            >
                            <Column headerClass="encabezado-columna" header="Responsable / actividad"
                                ><template #body="{ data }"
                                    ><div class="juridico-identidad">
                                        <strong>{{ data.responsable_nombre }}</strong
                                        ><span class="juridico-resumen-actuacion">{{ data.descripcion }}</span>
                                    </div></template
                                ></Column
                            >
                            <Column headerClass="encabezado-columna" header="Evidencias"
                                ><template #body="{ data }"
                                    ><div class="juridico-evidencias">
                                        <Button v-for="f in data.evidencias" :key="f.id" :label="f.nombre" icon="pi pi-download" text size="small" @click="handleDescargar(f)" /><small v-if="!data.evidencias?.length">Sin documentos vinculados</small>
                                    </div></template
                                ></Column
                            >
                            <Column headerClass="encabezado-columna" header="Seguimiento"
                                ><template #body="{ data }"
                                    ><div class="juridico-identidad">
                                        <span class="juridico-resumen-actuacion">{{ data.actualizar_seguimiento ? data.proxima_accion : 'Sin cambio de próxima acción' }}</span
                                        ><small v-if="data.actualizar_seguimiento">{{ handleFecha(data.fecha_compromiso) }}</small>
                                    </div></template
                                ></Column
                            >
                            <Column headerClass="encabezado-columna" header="Opciones"
                                ><template #body="{ data }"><Button label="Detalle" icon="pi pi-eye" text size="small" @click="handleVerActuacion(data)" /></template
                            ></Column>
                        </DataTable>
                    </div>
                </TabPanel>
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
                <TabPanel v-if="seleccionado" value="correspondencia">
                    <div class="juridico-correspondencia">
                        <Message v-if="errorCorreos" severity="error" :closable="false">{{ errorCorreos }}</Message>
                        <div class="juridico-herramientas correo-herramientas">
                            <FileUpload v-if="!detalleCerrado" :key="intentoCorreo" mode="basic" accept=".eml,.msg" :maxFileSize="10485760" chooseLabel="Agregar correo" customUpload auto :disabled="subiendoCorreo || retirandoCorreo" @uploader="handleSubirCorreo" />
                            <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargandoCorreos" @click="handleCargarCorreos" />
                            <div class="juridico-check"><Checkbox inputId="correos-retirados" v-model="verCorreosRetirados" binary /><label for="correos-retirados">Ver retirados</label></div>
                        </div>
                        <small>EML o MSG. Hasta 10 MB por correo y 100 correos por expediente. Se conserva el original; no se conecta al buzón.</small>
                        <ProgressBar v-if="subiendoCorreo" mode="indeterminate" style="height:.25rem" />
                        <DataTable size="small" scrollable :value="correos" :loading="cargandoCorreos" lazy paginator :rows="limiteCorreos" :first="primeroCorreos" :totalRecords="totalCorreos" :rowsPerPageOptions="[10,25,50]" class="juridico-tabla tabla-encabezados" @page="handlePaginaCorreos">
                            <template #empty>No hay correos incorporados.</template>
                            <Column headerClass="encabezado-columna" header="Asunto / remitente"><template #body="{data}"><div class="juridico-identidad"><strong>{{ data.asunto }}</strong><small>{{ data.remitente }}</small></div></template></Column>
                            <Column headerClass="encabezado-columna" header="Fecha del correo"><template #body="{data}">{{ data.fecha_correo ? handleFecha(data.fecha_correo) : 'No disponible' }}</template></Column>
                            <Column headerClass="encabezado-columna" header="Incorporado por"><template #body="{data}"><div class="juridico-identidad"><span>{{ data.usuario }}</span><small>{{ handleFecha(data.fecha) }}</small></div></template></Column>
                            <Column headerClass="encabezado-columna" header="Estado"><template #body="{data}"><Tag :value="data.retirado ? 'Retirado' : 'Vigente'" :severity="data.retirado ? 'secondary' : 'success'" /><small v-if="data.retirado">{{ data.retiro_motivo }}</small></template></Column>
                            <Column headerClass="encabezado-columna" header="Opciones"><template #body="{data}"><Button label="Ver correo" icon="pi pi-envelope" text @click="handleVerCorreo(data)" /><Button icon="pi pi-download" text aria-label="Descargar correo original" @click="handleDescargarCorreo(data)" /><Button v-if="!data.retirado && !detalleCerrado" icon="pi pi-times" text severity="danger" aria-label="Retirar correo" @click="handleRetirarCorreo(data)" /></template></Column>
                        </DataTable>
                    </div>
                </TabPanel>
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
    <Dialog v-model:visible="mostrarActuacion" modal header="Nueva actuación" :style="{ width: '66rem', maxWidth: '96vw' }" :closable="!guardandoActuacion" :closeOnEscape="!guardandoActuacion">
        <Message v-if="errorActuacion" severity="error" :closable="false">{{ errorActuacion }}</Message>
        <ProgressBar v-if="cargandoOpcionesActuacion" mode="indeterminate" style="height: 0.25rem" />
        <form id="actuacionJuridico" class="juridico-formulario" :inert="guardandoActuacion || cargandoOpcionesActuacion" @submit.prevent="handleGuardarActuacion">
            <div class="juridico-origen-actuacion">
                <strong>{{ seleccionado?.folio }} - {{ seleccionado?.titulo }}</strong
                ><span>{{ seleccionado?.empresa_nombre }}</span>
            </div>
            <div class="juridico-rejilla">
                <div>
                    <label for="act-tipo">Tipo de actuación <span class="requerido">*</span></label
                    ><Select
                        inputId="act-tipo"
                        v-model="actuacionFormulario.tipo_id"
                        :options="opcionesActuacion.tipos"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        placeholder="Selecciona un tipo"
                        emptyMessage="No hay tipos de actuación activos"
                    /><small v-if="!cargandoOpcionesActuacion && !opcionesActuacion.tipos.length">Registra los tipos en Jurídico / Configuración / Tipos de actuación.</small>
                </div>
                <div>
                    <label for="act-fecha">Fecha de lo realizado <span class="requerido">*</span></label
                    ><DatePicker inputId="act-fecha" v-model="actuacionFormulario.fecha" showIcon dateFormat="yy-mm-dd" :manualInput="false" :maxDate="hoy" />
                </div>
                <div class="juridico-ancho">
                    <label for="act-responsable">Responsable de la actuación <span class="requerido">*</span></label
                    ><Select
                        inputId="act-responsable"
                        v-model="actuacionFormulario.responsable_id"
                        :options="opcionesActuacion.responsables"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        placeholder="Selecciona un responsable"
                        emptyMessage="Sin responsables con acceso a Expedientes"
                    />
                </div>
                <div class="juridico-ancho">
                    <label for="act-descripcion">Qué se realizó <span class="requerido">*</span></label
                    ><Textarea id="act-descripcion" v-model="actuacionFormulario.descripcion" rows="4" maxlength="4000" />
                </div>
                <div class="juridico-ancho">
                    <label for="act-evidencias">Documentos de evidencia</label
                    ><MultiSelect
                        inputId="act-evidencias"
                        v-model="actuacionFormulario.archivo_ids"
                        :options="evidenciasDisponibles"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        display="chip"
                        :maxSelectedLabels="3"
                        placeholder="Selecciona los documentos del expediente"
                        emptyMessage="Sin documentos vigentes"
                    /><small>Adjunta los archivos en la pestaña Documentos antes de registrar la actuación. Solo se vinculan documentos de este expediente.</small>
                </div>
                <div class="juridico-ancho juridico-check"><ToggleSwitch inputId="act-seguimiento" v-model="actuacionFormulario.actualizar_seguimiento" /><label for="act-seguimiento">Actualizar la próxima acción del expediente</label></div>
                <template v-if="actuacionFormulario.actualizar_seguimiento"
                    ><div>
                        <label for="act-proxima">Próxima acción <span class="requerido">*</span></label
                        ><Textarea id="act-proxima" v-model="actuacionFormulario.proxima_accion" rows="2" maxlength="1000" />
                    </div>
                    <div>
                        <label for="act-compromiso">Fecha compromiso <span class="requerido">*</span></label
                        ><DatePicker inputId="act-compromiso" v-model="actuacionFormulario.fecha_compromiso" showIcon dateFormat="yy-mm-dd" :manualInput="false" :minDate="actuacionFormulario.fecha" /></div
                ></template>
            </div>
            <small>La actuación queda en la bitácora del expediente y de su empresa. El registro indica también quién lo capturó.</small>
        </form>
        <template #footer
            ><Button label="Cancelar" outlined :disabled="guardandoActuacion" @click="mostrarActuacion = false" /><Button
                label="Registrar actuación"
                icon="pi pi-save"
                class="btn-guardar"
                type="submit"
                form="actuacionJuridico"
                :loading="guardandoActuacion"
                :disabled="!actuacionValida || guardandoActuacion || cargandoOpcionesActuacion"
        /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarDetalleActuacion" modal header="Detalle de actuación" :style="{ width: '64rem', maxWidth: '96vw' }">
        <div v-if="actuacionSeleccionada" class="juridico-detalle">
            <div>
                <small>Expediente / empresa</small><strong>{{ seleccionado?.folio }}</strong
                ><span>{{ seleccionado?.empresa_nombre }}</span>
            </div>
            <div>
                <small>Fecha / tipo</small><strong>{{ handleFecha(actuacionSeleccionada.fecha) }}</strong
                ><span>{{ actuacionSeleccionada.tipo_nombre }}</span>
            </div>
            <div>
                <small>Responsable de la actuación</small><span>{{ actuacionSeleccionada.responsable_nombre }}</span>
            </div>
            <div>
                <small>Registrado por</small><span>{{ actuacionSeleccionada.usuario }}</span
                ><small>{{ handleFecha(actuacionSeleccionada.fecha_registro) }}</small>
            </div>
            <div class="juridico-ancho">
                <small>Qué se realizó</small><span class="juridico-texto">{{ actuacionSeleccionada.descripcion }}</span>
            </div>
            <div class="juridico-ancho">
                <small>Evidencias</small>
                <div class="juridico-evidencias">
                    <Button v-for="f in actuacionSeleccionada.evidencias" :key="f.id" :label="f.nombre" icon="pi pi-download" text @click="handleDescargar(f)" /><span v-if="!actuacionSeleccionada.evidencias?.length">Sin documentos vinculados.</span>
                </div>
            </div>
            <template v-if="actuacionSeleccionada.actualizar_seguimiento"
                ><div>
                    <small>Próxima acción registrada</small><span class="juridico-texto">{{ actuacionSeleccionada.proxima_accion }}</span>
                </div>
                <div>
                    <small>Fecha compromiso registrada</small><span>{{ handleFecha(actuacionSeleccionada.fecha_compromiso) }}</span>
                </div></template
            >
        </div>
        <template #footer><Button label="Cerrar" outlined @click="mostrarDetalleActuacion = false" /></template>
    </Dialog>
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
    <Dialog v-model:visible="mostrarCorreo" modal header="Correspondencia del expediente" :style="{width:'68rem',maxWidth:'96vw'}" :closable="!incorporandoAdjunto">
        <ProgressBar v-if="leyendoCorreo" mode="indeterminate" style="height:.25rem" />
        <div v-if="correoSeleccionado" class="correo-lector">
            <h2>{{ correoSeleccionado.asunto }}</h2>
            <dl class="correo-cabecera"><div><dt>De</dt><dd>{{ correoSeleccionado.remitente }}</dd></div><div><dt>Para</dt><dd>{{ correoSeleccionado.destinatarios || 'No disponible' }}</dd></div><div v-if="correoSeleccionado.copias"><dt>CC</dt><dd>{{ correoSeleccionado.copias }}</dd></div><div><dt>Fecha</dt><dd>{{ handleFecha(correoSeleccionado.fecha_correo || correoSeleccionado.fecha_original) }}</dd></div></dl>
            <Tag v-if="correoSeleccionado.retirado" value="Correo retirado" severity="secondary" />
            <div class="correo-cuerpo">{{ correoSeleccionado.cuerpo || 'Este mensaje no contiene texto legible. Puedes descargar el original.' }}</div>
            <h3>Adjuntos ({{ correoSeleccionado.adjuntos.length }})</h3>
            <DataTable size="small" scrollable :value="correoSeleccionado.adjuntos" class="juridico-tabla tabla-encabezados"><template #empty>Sin adjuntos.</template><Column headerClass="encabezado-columna" field="nombre" header="Archivo" /><Column headerClass="encabezado-columna" header="Opciones"><template #body="{data}"><Button label="Descargar" icon="pi pi-download" text @click="handleDescargarCorreo(correoSeleccionado,data)" /><Button v-if="!detalleCerrado && !correoSeleccionado.retirado && handleDocumentoCompatible(data)" label="Incorporar a Documentos" icon="pi pi-folder-plus" outlined :disabled="incorporandoAdjunto" @click="handleIncorporarAdjunto(data)" /></template></Column></DataTable>
        </div>
        <template #footer><Button v-if="correoSeleccionado" label="Descargar original" icon="pi pi-download" outlined @click="handleDescargarCorreo(correoSeleccionado)" /><Button label="Cerrar" :disabled="incorporandoAdjunto" @click="mostrarCorreo = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarRetiroCorreo" modal header="Retirar correo" :style="{width:'36rem',maxWidth:'96vw'}" :closable="!retirandoCorreo">
        <Message v-if="errorRetiroCorreo" severity="error" :closable="false">{{ errorRetiroCorreo }}</Message>
        <p>El original se conserva para auditoría. Indica por qué se retira.</p><label for="correo-motivo">Motivo <span class="requerido">*</span></label><Textarea id="correo-motivo" v-model="motivoRetiroCorreo" rows="3" maxlength="500" fluid :disabled="retirandoCorreo" />
        <template #footer><Button label="Cancelar" outlined :disabled="retirandoCorreo" @click="mostrarRetiroCorreo = false" /><Button label="Retirar" :loading="retirandoCorreo" :disabled="motivoRetiroCorreo.trim().length < 3 || retirandoCorreo" @click="handleConfirmarRetiroCorreo" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de Expedientes y asuntos" :style="{ width: '62rem', maxWidth: '96vw' }" class="juridico-ayuda-dialog">
        <div class="juridico-manual">
            <p class="correo-fuentes">Ayuda oficial: <a href="https://support.microsoft.com/es-es/outlook/mail/save-an-outlook-message-as-a-eml-file-a-pdf-file-or-as-a-draft" target="_blank" rel="noopener noreferrer">Outlook y Hotmail</a> ? <a href="https://support.google.com/mail/answer/9261412?hl=es" target="_blank" rel="noopener noreferrer">Gmail</a></p>
            <div class="juridico-manual-intro"><i class="pi pi-folder-open" /><div><h2>Organiza y da seguimiento a cada asunto</h2><p>Reúne los datos del asunto, sus actuaciones, documentos y próximos compromisos por empresa.</p></div></div>
            <div class="juridico-manual-flujo"><Tag value="Abrir" severity="info" /><i class="pi pi-angle-right" /><Tag value="Dar seguimiento" severity="info" /><i class="pi pi-angle-right" /><Tag value="Registrar actuaciones" severity="info" /><i class="pi pi-angle-right" /><Tag value="Cerrar" severity="success" /></div>
            <section v-for="seccion in guia" :key="seccion.titulo" class="juridico-manual-seccion"><h3><i :class="seccion.icono" />{{ seccion.titulo }}</h3><ul><li v-for="paso in seccion.pasos" :key="paso">{{ paso }}</li></ul></section>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default {
    name: 'JuridicoExpedientes',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
