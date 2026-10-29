<template>
    <Encabezado titulo="Alta de Personal" subtitulo="Captura de datos y documentos para solicitudes de alta" icono="pi pi-user-plus" />
    <div class="ap-contenedor">
        <div class="ap-superior">
            <div class="ap-pasos" aria-label="Progreso de captura">
                <button v-for="n in 3" :key="n" type="button" class="ap-paso" :class="{ activo: paso === n, completo: paso > n }" :disabled="n > paso" @click="paso = n">
                    <span>{{ n }}</span
                    >{{ ['Datos', 'Documentos', 'Revisar'][n - 1] }}
                </button>
            </div>
            <Button :label="mostrarHistorial ? 'Nueva solicitud' : 'Ver solicitudes'" :icon="mostrarHistorial ? 'pi pi-plus' : 'pi pi-list'" severity="secondary" outlined @click="mostrarHistorial = !mostrarHistorial" />
        </div>
        <div v-if="!mostrarHistorial" class="ap-panel">
            <template v-if="paso === 1">
                <div class="ap-grid-principal">
                    <div class="ap-columna">
                        <Panel class="ap-card">
                            <template #header
                                ><div class="ap-card-titulo"><i class="pi pi-user"></i> Datos personales</div></template
                            >
                            <div class="ap-form ap-form-3">
                                <div class="ap-campo">
                                    <label>Apellido paterno <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.apellido_paterno" maxlength="80" placeholder="Ej. García" class="w-full" />
                                </div>
                                <div class="ap-campo">
                                    <label>Apellido materno <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.apellido_materno" maxlength="80" placeholder="Ej. López" class="w-full" />
                                </div>
                                <div class="ap-campo">
                                    <label>Nombre(s) <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.nombres" maxlength="120" placeholder="Ej. Ana María" class="w-full" />
                                </div>
                                <div class="ap-campo">
                                    <label>Fecha de nacimiento <b>*</b></label
                                    ><DatePicker v-model="fechaNacimiento" dateFormat="dd/mm/yy" :maxDate="fechaMaxima" showIcon iconDisplay="input" :manualInput="false" placeholder="dd/mm/aaaa" class="w-full" />
                                </div>
                                <div class="ap-campo"><label>Edad</label><InputText :modelValue="String(edad)" disabled class="w-full" /></div>
                                <div class="ap-campo">
                                    <label>Sexo</label
                                    ><Select
                                        v-model="frmPersonal.sexo"
                                        :options="[
                                            { label: 'Femenino', value: 'F' },
                                            { label: 'Masculino', value: 'M' },
                                            { label: 'No especificado', value: 'N' }
                                        ]"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Seleccionar"
                                        class="w-full"
                                    />
                                </div>
                                <div class="ap-campo">
                                    <label>RFC <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.rfc" maxlength="13" placeholder="Ej. XAXX010101000" class="w-full" @update:modelValue="frmPersonal.rfc = String($event).toUpperCase()" />
                                </div>
                                <div class="ap-campo">
                                    <label>CURP <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.curp" maxlength="18" placeholder="18 caracteres" class="w-full" @update:modelValue="frmPersonal.curp = String($event).toUpperCase()" />
                                </div>
                                <div class="ap-campo">
                                    <label>NSS <b>*</b></label
                                    ><InputText v-model.trim="frmPersonal.nss" maxlength="11" placeholder="11 dígitos" class="w-full" />
                                </div>
                            </div>
                            <div class="ap-form ap-form-rh">
                                <div class="ap-campo">
                                    <label>Área <b>*</b></label>
                                    <Select
                                        :modelValue="frmPersonal.area_id"
                                        @update:modelValue="cambiarArea"
                                        :options="areasActivas"
                                        optionLabel="nombre"
                                        optionValue="_id"
                                        placeholder="Seleccionar área"
                                        filter
                                        :loading="cargandoCatalogosRH"
                                        :disabled="cargandoCatalogosRH"
                                        class="w-full"
                                    />
                                </div>
                                <div class="ap-campo">
                                    <label>Puesto <b>*</b></label>
                                    <Select
                                        v-model="frmPersonal.puesto_id"
                                        :options="puestosFiltrados"
                                        optionLabel="nombre"
                                        optionValue="_id"
                                        placeholder="Seleccionar puesto"
                                        filter
                                        :disabled="!frmPersonal.area_id || cargandoCatalogosRH"
                                        class="w-full"
                                    />
                                    <small class="ap-rh-ayuda">{{ frmPersonal.area_id ? 'Puestos activos del área seleccionada.' : 'Primero selecciona un área.' }}</small>
                                </div>
                            </div>
                        </Panel>
                        <Panel class="ap-card">
                            <template #header
                                ><div class="ap-card-titulo"><i class="pi pi-building-columns"></i> Información bancaria</div></template
                            >
                            <div class="ap-form ap-form-banco">
                                <div class="ap-campo">
                                    <label>CLABE interbancaria <b>*</b></label>
                                    <InputText :modelValue="frmPersonal.clabe" @update:modelValue="handleCambioClabePersonal" maxlength="18" inputmode="numeric" placeholder="18 dígitos" class="w-full" />
                                </div>
                                <div class="ap-campo">
                                    <label>Banco detectado automáticamente</label>
                                    <Select :modelValue="bancoDetectado" :options="catalogoBancos" optionLabel="descripcion" placeholder="Banco según CLABE" disabled class="w-full" />
                                    <small v-if="frmPersonal.clabe.length >= 3 && !bancoDetectado && !cargandoBancos" class="ap-banco-aviso"> La clave de banco no se encontró en el catálogo SAT. </small>
                                    <small v-else-if="cargandoBancos" class="ap-banco-ayuda">Consultando catálogo de bancos...</small>
                                    <small v-else class="ap-banco-ayuda">Se identifica con los primeros 3 dígitos de la CLABE.</small>
                                </div>
                            </div>
                        </Panel>
                    </div>
                    <Panel class="ap-card ap-foto-card">
                        <template #header
                            ><div class="ap-card-titulo"><i class="pi pi-camera"></i> Fotografía del empleado</div></template
                        >
                        <div class="ap-foto-area">
                            <img v-if="vistaPreviaFoto" :src="vistaPreviaFoto" alt="Fotografía seleccionada" class="ap-foto" />
                            <i v-else class="pi pi-user ap-foto-icono"></i>
                            <FileUpload
                                mode="basic"
                                name="fotografia"
                                accept="image/jpeg,image/png"
                                :maxFileSize="2097152"
                                chooseLabel="Seleccionar fotografía"
                                chooseIcon="pi pi-camera"
                                customUpload
                                @select="handleArchivoPrime('fotografia', $event)"
                            />
                            <small>JPG o PNG · Máximo 2 MB</small>
                        </div>
                    </Panel>
                </div>
            </template>
            <template v-if="paso === 2">
                <Panel class="ap-card">
                    <template #header
                        ><div class="ap-card-titulo"><i class="pi pi-file"></i> Documentos del empleado</div></template
                    >
                    <p class="ap-descripcion">Adjunta los documentos disponibles. Formatos PDF, JPG y PNG, máximo 5 MB cada uno.</p>
                    <div class="ap-documentos">
                        <div v-for="doc in documentos" :key="doc.campo" class="ap-documento">
                            <div class="ap-documento-titulo">
                                <i class="pi pi-file-pdf"></i><strong>{{ doc.nombre }}</strong>
                            </div>
                            <div class="ap-documento-subida">
                                <FileUpload
                                    mode="basic"
                                    :name="doc.campo"
                                    accept="application/pdf,image/jpeg,image/png"
                                    :maxFileSize="5242880"
                                    chooseLabel="Elegir archivo"
                                    chooseIcon="pi pi-upload"
                                    customUpload
                                    @select="handleArchivoPrime(doc.campo, $event)"
                                /><span class="ap-archivo-nombre" :title="archivos[doc.campo]?.name">{{ archivos[doc.campo]?.name || 'Sin archivo seleccionado' }}</span>
                            </div>
                            <small>Máximo {{ doc.limite }} MB</small>
                        </div>
                    </div>
                </Panel>
            </template>
            <template v-if="paso === 3">
                <Panel class="ap-card">
                    <template #header
                        ><div class="ap-card-titulo"><i class="pi pi-clipboard"></i> Revisar solicitud</div></template
                    >
                    <div class="ap-resumen">
                        <div>
                            <span>Nombre completo</span><strong>{{ nombreCompleto }}</strong>
                        </div>
                        <div>
                            <span>RFC</span><strong>{{ frmPersonal.rfc }}</strong>
                        </div>
                        <div>
                            <span>CURP</span><strong>{{ frmPersonal.curp }}</strong>
                        </div>
                        <div>
                            <span>NSS</span><strong>{{ frmPersonal.nss }}</strong>
                        </div>
                        <div>
                            <span>Fecha de nacimiento</span><strong>{{ frmPersonal.fecha_nacimiento }}</strong>
                        </div>
                        <div>
                            <span>Edad</span><strong>{{ edad }} años</strong>
                        </div>
                        <div>
                            <span>Sexo</span><strong>{{ frmPersonal.sexo || 'No especificado' }}</strong>
                        </div>
                        <div>
                            <span>Área</span><strong>{{ nombreAreaSeleccionada }}</strong>
                        </div>
                        <div>
                            <span>Puesto</span><strong>{{ nombrePuestoSeleccionado }}</strong>
                        </div>
                        <div>
                            <span>CLABE</span><strong>{{ frmPersonal.clabe }}</strong>
                        </div>
                    </div>
                    <div class="ap-card-titulo ap-subtitulo"><i class="pi pi-paperclip"></i> Archivos seleccionados</div>
                    <div class="ap-archivos-resumen">
                        <div v-for="doc in [{ campo: 'fotografia', nombre: 'Fotografía' }, ...documentos]" :key="doc.campo">
                            <i :class="archivos[doc.campo] ? 'pi pi-check-circle ap-verde' : 'pi pi-minus-circle'" /> {{ doc.nombre }} <small>{{ archivos[doc.campo]?.name || 'Sin adjuntar' }}</small>
                        </div>
                    </div>
                    <Message severity="info" :closable="false">Al guardar se creará una solicitud con estatus PENDIENTE. No se dará de alta automáticamente a un empleado activo.</Message>
                </Panel>
            </template>
            <div class="ap-pie">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="handleCancelar" />
                <div class="ap-pie-derecha">
                    <Button v-if="paso > 1" label="Anterior" icon="pi pi-arrow-left" severity="secondary" outlined @click="handleAnterior" />
                    <Button v-if="paso < 3" label="Siguiente" icon="pi pi-arrow-right" iconPos="right" @click="handleSiguiente" />
                    <Button v-else label="Guardar solicitud" icon="pi pi-save" :loading="guardando" :disabled="guardando" @click="handleGuardar" />
                </div>
            </div>
        </div>
        <section v-else class="ap-card">
            <div class="ap-lista-header">
                <h3>Solicitudes de alta</h3>
                <div class="ap-lista-acciones"><InputText v-model="busqueda" placeholder="Buscar nombre, RFC o CURP" /><Button icon="pi pi-refresh" severity="secondary" outlined @click="handleListar" /></div>
            </div>
            <DataTable :value="solicitudesFiltradas" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" size="small" scrollable>
                <template #empty><div class="ap-vacio">No hay solicitudes registradas.</div></template>
                <Column header="Nombre" style="min-width: 240px"
                    ><template #body="{ data }">{{ [data.nombres, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ') }}</template></Column
                >
                <Column field="rfc" header="RFC" /><Column field="curp" header="CURP" />
                <Column field="estatus" header="Estatus"
                    ><template #body="{ data }"><Tag :value="data.estatus" :severity="data.estatus === 'APROBADA' ? 'success' : 'warn'" /></template
                ></Column>
                <Column header="Fecha"
                    ><template #body="{ data }">{{ formatoFecha(data.fecha_creacion) }}</template></Column
                >
                <Column header="Acciones" style="min-width: 160px">
                    <template #body="{ data }">
                        <div class="ap-acciones-fila">
                            <Button icon="pi pi-eye" text rounded aria-label="Ver detalle" title="Ver detalle" @click="handleVerDetalle(data)" />
                            <template v-if="data.estatus === 'RECHAZADA'">
                                <Button icon="pi pi-comment" text rounded severity="secondary" aria-label="Ver observación" title="Ver observación" @click="handleVerObservacion(data)" />
                                <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Quitar registro" title="Quitar registro" @click="handleRetirar(data)" />
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </section>
        <Dialog v-model:visible="visibleObservacion" modal header="Observación de rechazo" :style="{ width: '95vw', maxWidth: '580px' }">
            <div class="ap-observacion-contenido">
                <div class="ap-observacion-nombre">{{ observacionActual?.nombre }}</div>
                <p class="ap-observacion-texto">{{ observacionActual?.texto }}</p>
            </div>
            <template #footer>
                <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined @click="visibleObservacion = false" />
            </template>
        </Dialog>
        <Dialog v-model:visible="visibleDetalle" modal header="Detalle de solicitud de alta" class="ap-dialog-detalle" :style="{ width: '96vw', maxWidth: '1600px' }" :breakpoints="{ '960px': '99vw' }" @hide="limpiarVisor">
            <div v-if="solicitudActual" class="ap-detalle-layout">
                <aside class="ap-detalle-izquierda">
                    <div class="ap-detalle-titulo"><i class="pi pi-user"></i><strong>Información del empleado</strong></div>
                    <div class="ap-detalle-campos">
                        <div v-for="campo in camposDetalle" :key="campo.key" class="ap-detalle-campo">
                            <span>{{ campo.label }}</span
                            ><strong>{{ valorCampoDetalle(campo.key) }}</strong>
                        </div>
                    </div>
                </aside>
                <div class="ap-detalle-derecha">
                    <Tabs :value="pestanaActiva" scrollable @update:value="cambiarPestana">
                        <TabList>
                            <Tab v-for="doc in documentosVisor" :key="doc.campo" :value="doc.campo">
                                <i :class="doc.campo === 'fotografia' ? 'pi pi-image' : 'pi pi-file'"></i>
                                {{ doc.nombre }}
                                <i v-if="!solicitudActual.documentos?.[doc.campo]" class="pi pi-minus-circle ap-falta-icono"></i>
                            </Tab>
                        </TabList>
                    </Tabs>
                    <div class="ap-visor-barra">
                        <div class="ap-visor-nombre" :title="nombreArchivoActual">{{ nombreArchivoActual }}</div>
                        <Button label="Descargar" icon="pi pi-download" size="small" outlined :disabled="!archivoDisponible || !!cargandoArchivo" @click="descargarDocumento" />
                    </div>
                    <div class="ap-visor-contenido">
                        <div v-if="cargandoArchivo" class="ap-visor-mensaje"><ProgressSpinner style="width: 42px; height: 42px" /><span>Cargando vista previa...</span></div>
                        <template v-else-if="urlArchivo">
                            <iframe v-if="tipoArchivo === 'pdf'" :src="urlArchivo" title="Vista previa de documento PDF" class="ap-visor-pdf"></iframe>
                            <img v-else-if="tipoArchivo === 'imagen'" :src="urlArchivo" alt="Vista previa del documento" class="ap-visor-imagen" />
                            <div v-else class="ap-visor-mensaje"><i class="pi pi-file"></i><span>Este archivo no admite vista previa.</span></div>
                        </template>
                        <div v-else class="ap-visor-mensaje">
                            <i class="pi pi-file"></i><span>{{ mensajeVisor }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {
    name: 'AltaPersonal',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
