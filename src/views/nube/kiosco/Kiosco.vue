<template>
    <Encabezado titulo="Kiosco" subtitulo="Archivos, versiones y papelera" icono="pi pi-cloud">
        <Button v-if="instalador" type="button" label="Descargar Gekko Sync" icon="pi pi-download" outlined :loading="descargandoInstalador" @click="handleDescargarInstalador" />
        <Button v-if="administrador" type="button" label="Nuevo repositorio" icon="pi pi-plus" class="btn-nuevo" :disabled="cargando" @click="handleMostrarFormulario('espacio')" />
        <Button v-if="administrador" type="button" label="Archivados" icon="pi pi-inbox" outlined :disabled="cargando" @click="handleMostrarArchivados" />
        <Button v-if="administrador && espacioActual" type="button" label="Archivar repositorio" icon="pi pi-folder-minus" severity="danger" outlined :disabled="cargando" @click="handleMostrarConfirmacion('archivar', espacioActual)" />
    </Encabezado>

    <div class="card kiosco-sync">
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <Toolbar>
            <template #start>
                <div class="sync-controles">
                    <label for="sync-espacio">Repositorio</label>
                    <Select v-model="espacioId" inputId="sync-espacio" :options="espacios" optionLabel="nombre" optionValue="_id" placeholder="Selecciona un repositorio" :disabled="cargando || !espacios.length" @change="handleCambiarEspacio" />
                    <Button v-if="hayMasEspacios" type="button" label="Más repositorios" text :disabled="cargando" @click="handleMasEspacios" />
                    <Button type="button" label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando" @click="handleActualizar" />
                </div>
            </template>
            <template #end>
                <div class="sync-controles">
                    <Button v-if="espacioId" type="button" :label="papelera ? 'Volver a archivos' : 'Papelera'" :icon="papelera ? 'pi pi-folder' : 'pi pi-trash'" outlined :disabled="cargando" @click="handleCambiarPapelera" />
                    <Button v-if="espacioId && !papelera && handleTienePermiso('crear_carpeta')" type="button" label="Nueva carpeta" icon="pi pi-folder-plus" class="btn-nuevo" :disabled="cargando" @click="handleMostrarFormulario('carpeta')" />
                    <Button v-if="espacioId && !papelera && handleTienePermiso('cargar')" type="button" label="Subir archivo" icon="pi pi-upload" class="btn-guardar" :disabled="cargando" @click="handleMostrarCarga()" />
                </div>
            </template>
        </Toolbar>

        <ProgressBar v-if="cargando" mode="indeterminate" class="sync-progreso" aria-label="Procesando operación" />
        <Breadcrumb v-if="espacioId && !papelera" :home="rutaInicio" :model="rutaItems" class="sync-ruta">
            <template #item="{ item }"><Button type="button" :label="item.label" text :disabled="cargando" @click="handleNavegar(item.indice)" /></template>
        </Breadcrumb>
        <Message v-if="papelera" severity="info" :closable="false">Las carpetas se restauran con su contenido. Los elementos que ya estaban en papelera permanecen allí. Todo se conserva indefinidamente.</Message>

        <ScrollPanel class="sync-listado">
            <DataTable :value="registros" dataKey="_id" :loading="cargando" scrollable scrollHeight="48vh" size="small" tableStyle="min-width: 55rem" class="tabla-encabezados">
            <template #empty>{{ !espacioId ? 'No hay espacios disponibles para tu usuario.' : papelera ? 'No hay archivos en la papelera.' : 'Esta carpeta está vacía.' }}</template>
                <Column field="nombre" header="Nombre" headerClass="encabezado-columna">
                    <template #body="{ data }">
                        <Button v-if="data.tipo === 'carpeta' && !papelera" type="button" :label="data.nombre" icon="pi pi-folder" text :disabled="cargando" @click="handleAbrirCarpeta(data)" />
                        <span v-else class="sync-nombre"><i class="pi pi-file" aria-hidden="true" />{{ data.nombre }}</span>
                    </template>
                </Column>
                <Column field="tipo" header="Tipo" headerClass="encabezado-columna"
                    ><template #body="{ data }"><Tag :value="data.tipo === 'carpeta' ? 'Carpeta' : 'Archivo'" :severity="data.tipo === 'carpeta' ? 'warn' : 'info'" /></template
                ></Column>
                <Column field="revision" header="Revisión" headerClass="encabezado-columna" />
                <Column :header="papelera ? 'Eliminado' : 'Creado'" headerClass="encabezado-columna"
                    ><template #body="{ data }">{{ handleFecha(papelera ? data.fecha_eliminacion : data.fecha) }}</template></Column
                >
                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="{ data }">
                        <div class="sync-controles">
                            <Button v-if="papelera && handleTienePermiso('restaurar', data)" type="button" label="Restaurar" icon="pi pi-replay" :disabled="cargando" @click="handleMostrarConfirmacion('restaurar', data)" />
                            <Button v-if="!papelera && handleTienePermiso('escribir', data)" type="button" label="Renombrar" icon="pi pi-pencil" outlined :disabled="cargando" @click="handleRenombrar(data)" />
                            <Button v-if="!papelera && data.tipo === 'carpeta' && handleTienePermiso('eliminar', data)" type="button" label="A papelera" icon="pi pi-trash" severity="danger" outlined :disabled="cargando" @click="handleMostrarConfirmacion('eliminar', data)" />
                            <template v-if="!papelera && data.tipo === 'archivo'">
                                <Button v-if="handleTienePermiso('compartir', data) && handleTienePermiso('leer', data)" type="button" label="Compartir" icon="pi pi-share-alt" outlined :disabled="cargando" @click="handleCompartir(data)" />
                                <Button v-if="handleTienePermiso('leer', data)" type="button" label="Descargar" icon="pi pi-download" outlined :disabled="cargando" @click="handleDescargar(data)" />
                                <Button v-if="handleTienePermiso('historial', data)" type="button" label="Versiones" icon="pi pi-history" outlined :disabled="cargando" @click="handleHistorial(data)" />
                                <Button v-if="handleTienePermiso('cargar', data)" type="button" label="Nueva versión" icon="pi pi-upload" outlined :disabled="cargando" @click="handleMostrarCarga(data)" />
                                <Button v-if="handleTienePermiso('eliminar', data)" type="button" label="A papelera" icon="pi pi-trash" severity="danger" outlined :disabled="cargando" @click="handleMostrarConfirmacion('eliminar', data)" />
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>
        <div v-if="espacioId" class="sync-paginacion">
            <Button type="button" label="Anterior" icon="pi pi-angle-left" outlined :disabled="cargando || offset === 0" @click="handlePaginar(-1)" />
            <span>Página {{ offset / limite + 1 }}</span>
            <Button type="button" label="Siguiente" icon="pi pi-angle-right" iconPos="right" outlined :disabled="cargando || registros.length < limite" @click="handlePaginar(1)" />
        </div>
    </div>
    <Dialog v-model:visible="formularioVisible" modal :header="movimiento === 'renombrar' ? 'Renombrar' : movimiento === 'espacio' ? 'Nuevo repositorio' : 'Nueva carpeta'" :closable="!cargando" class="sync-dialogo">
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <form id="formSync" class="sync-formulario" @submit.prevent="handleGuardar">
            <label for="sync-nombre">Nombre</label>
            <InputText id="sync-nombre" v-model="nombre" required maxlength="200" :disabled="cargando" autofocus />
            <Message v-if="movimiento === 'espacio'" severity="info" :closable="false">El nuevo repositorio será privado para administradores Sync.</Message>
        </form>
        <template #footer
            ><Button type="button" label="Cancelar" class="btn-cancelar" :disabled="cargando" @click="formularioVisible = false" /><Button
                type="submit"
                form="formSync"
                label="Guardar"
                icon="pi pi-save"
                class="btn-guardar"
                :disabled="cargando || !nombre.trim()"
        /></template>
    </Dialog>

    <Dialog v-model:visible="cargaVisible" modal :header="destinoCarga ? `Nueva versión de ${destinoCarga.nombre}` : 'Subir archivo'" :closable="!cargando" class="sync-dialogo sync-dialogo-carga">
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <FileUpload
            ref="controlCarga"
            name="archivo"
            mode="advanced"
            customUpload
            :multiple="!destinoCarga"
            :disabled="cargando"
            class="sync-carga"
            chooseLabel="Seleccionar archivo"
            uploadLabel="Subir"
            cancelLabel="Limpiar"
            @uploader="handleSubirArchivo"
        >
            <template #content="{ files, removeFileCallback, messages }">
                <Message v-for="(mensaje, indiceMensaje) in messages" :key="indiceMensaje" severity="error" :closable="false">{{ mensaje }}</Message>
                <div v-if="files.length" class="sync-cola">
                    <div class="sync-cola-resumen"><span>{{ files.length }} archivo(s) en la lista</span><span>{{ handleTamano(files.reduce((total, archivo) => total + archivo.size, 0)) }}</span></div>
                    <div class="sync-cola-lista" role="list" aria-label="Archivos seleccionados">
                        <div v-for="(archivo, indice) in files" :key="`${archivo.name}-${archivo.size}-${archivo.lastModified}`" class="sync-cola-archivo" role="listitem">
                            <div class="sync-cola-icono"><font-icon :icon="handleIconoArchivo(archivo.name)" aria-hidden="true" /></div>
                            <div class="sync-cola-datos"><span class="sync-cola-nombre" :title="archivo.name">{{ archivo.name }}</span><small>{{ handleTamano(archivo.size) }}</small></div>
                            <Tag :value="cargando && indice === 0 ? 'Subiendo' : 'Pendiente'" :severity="cargando && indice === 0 ? 'info' : 'secondary'" />
                            <Button type="button" icon="pi pi-times" severity="danger" text rounded :aria-label="`Quitar ${archivo.name}`" :disabled="cargando" @click="removeFileCallback(indice)" />
                        </div>
                    </div>
                    <small class="sync-cola-pista">Puedes arrastrar más archivos al área de la lista.</small>
                </div>
            </template>
            <template #empty>
                <div class="sync-carga-zona">
                    <i class="pi pi-cloud-upload" aria-hidden="true" /><strong>{{ destinoCarga ? 'Arrastra un archivo para la nueva versión' : 'Arrastra y suelta tus archivos aquí' }}</strong
                    ><span>O usa Seleccionar archivo. Después pulsa Subir.</span>
                </div>
            </template>
        </FileUpload>
        <ProgressBar v-if="cargando" mode="indeterminate" class="sync-progreso" />
    </Dialog>

    <Dialog v-model:visible="historialVisible" modal :header="`Versiones de ${seleccionado?.nombre || ''}`" :closable="!cargando" class="sync-dialogo sync-dialogo-historial">
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <DataTable :value="versiones" dataKey="id" :loading="cargando" size="small" scrollable scrollHeight="45vh" class="tabla-encabezados">
            <template #empty>No hay versiones disponibles.</template>
            <Column header="Fecha"
                ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
            >
            <Column header="Tamaño"
                ><template #body="{ data }">{{ handleTamano(data.bytes) }}</template></Column
            >
            <Column header="Origen"
                ><template #body="{ data }"><Tag :value="data.restaurada_desde ? 'Restauración' : 'Carga'" /></template
            ></Column>
            <Column header="Opciones"
                ><template #body="{ data }"
                    ><Button
                        v-if="handleTienePermiso('restaurar', seleccionado)"
                        type="button"
                        label="Restaurar como nueva revisión"
                        icon="pi pi-replay"
                        outlined
                        :disabled="cargando"
                        @click="handleMostrarConfirmacion('version', seleccionado, data)" /></template
            ></Column>
        </DataTable>
        <template #footer
            ><Button type="button" label="Anterior" outlined :disabled="cargando || !offsetVersiones" @click="handlePaginarHistorial(-1)" /><span>Página {{ offsetVersiones / limite + 1 }}</span
            ><Button type="button" label="Siguiente" outlined :disabled="cargando || versiones.length < limite" @click="handlePaginarHistorial(1)"
        /></template>
    </Dialog>

    <Dialog v-model:visible="archivadosVisible" modal header="Repositorios archivados" class="sync-dialogo">
        <p>Se conserva todo el contenido y sus permisos. Restaurar vuelve a habilitar el repositorio para los usuarios autorizados.</p>
        <DataTable :value="archivados" :loading="cargando" size="small">
            <template #empty>No hay repositorios archivados.</template>
            <Column field="nombre" header="Repositorio" />
            <Column header="Opciones"><template #body="{ data }"><Button type="button" label="Restaurar" icon="pi pi-replay" :disabled="cargando" @click="handleMostrarConfirmacion('restaurar_espacio', data)" /></template></Column>
        </DataTable>
        <template #footer><Button type="button" label="Anterior" outlined :disabled="cargando || !offsetArchivados" @click="handlePaginarArchivados(-1)" /><Button type="button" label="Siguiente" outlined :disabled="cargando || archivados.length < limite" @click="handlePaginarArchivados(1)" /><Button type="button" label="Cerrar" @click="archivadosVisible = false" /></template>
    </Dialog>
    <Dialog v-model:visible="compartirVisible" modal header="Compartir archivo" :closable="!cargando" class="sync-dialogo-compartir">
        <div class="sync-compartir-contenido">
        <p><strong>{{ archivoCompartido?.nombre }}</strong></p>
        <Message severity="info" :closable="false">Cualquier persona con el enlace podrá descargar esta versión sin iniciar sesión. Se aplica la primera condición que se cumpla: vencimiento o límite de descargas.</Message>
        <div class="sync-compartir-opciones">
        <div class="sync-compartir-fila">
            <div class="sync-compartir-etiqueta"><Checkbox v-model="usarVigencia" inputId="enlace-vigencia" binary :disabled="cargando" /><label for="enlace-vigencia">Vigencia</label></div>
            <DatePicker v-model="fechaEnlace" showTime hourFormat="24" dateFormat="dd/mm/yy" :disabled="cargando || !usarVigencia" placeholder="Fecha y hora local" aria-label="Fecha y hora de vencimiento" />
        </div>
        <div class="sync-compartir-fila">
            <div class="sync-compartir-etiqueta"><Checkbox v-model="usarLimite" inputId="enlace-limite" binary :disabled="cargando" /><label for="enlace-limite">Máximo de descargas</label></div>
            <InputNumber v-model="limiteEnlace" :min="1" :max="100000" :disabled="cargando || !usarLimite" aria-label="Número máximo de descargas" />
        </div>
        </div>
        <div><Button type="button" label="Generar enlace" icon="pi pi-link" :disabled="cargando" @click="handleGenerarEnlace" /></div>
        <div v-if="enlaceGenerado" class="sync-compartir-enlace"><InputText :modelValue="enlaceGenerado" readonly aria-label="Enlace generado" /><Button type="button" label="Copiar" icon="pi pi-copy" @click="handleCopiarEnlace" /></div>
        <p><small>Copia el enlace antes de cerrar: no se puede recuperar después. Cada inicio de descarga cuenta, aunque se interrumpa. Abrir la página del enlace no consume descargas.</small></p>
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <section class="sync-compartir-historial" aria-label="Enlaces generados">
        <h3>Enlaces generados</h3>
        <DataTable :value="enlaces" size="small" :loading="cargando">
            <template #empty>No hay enlaces generados.</template>
            <Column header="Estado"><template #body="{ data }"><Tag :value="handleEstadoEnlace(data)" /></template></Column>
            <Column header="Vence"><template #body="{ data }">{{ data.vence ? handleFecha(data.vence) : 'Por descargas' }}</template></Column>
            <Column header="Descargas"><template #body="{ data }">{{ data.descargas }} / {{ data.limite_descargas ?? 'Sin límite' }}</template></Column>
            <Column header="Opciones"><template #body="{ data }"><Button v-if="!data.revocado" type="button" label="Revocar" severity="danger" outlined :disabled="cargando" @click="handleRevocarEnlace(data)" /></template></Column>
        </DataTable>
        </section>
        </div>
        <template #footer><div class="sync-compartir-pie"><div class="sync-controles"><Button type="button" label="Anterior" outlined :disabled="cargando || !offsetEnlaces" @click="handlePaginarEnlaces(-1)" /><Button type="button" label="Siguiente" outlined :disabled="cargando || enlaces.length < limite" @click="handlePaginarEnlaces(1)" /></div><Button type="button" label="Cerrar" :disabled="cargando" @click="compartirVisible = false" /></div></template>
    </Dialog>
    <Dialog v-model:visible="confirmacionVisible" modal header="Confirmar operación" :closable="!cargando" class="sync-dialogo">
        <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
        <p>{{ pendiente?.tipo === 'archivar' ? 'El repositorio dejará de estar disponible en el kiosco y la sincronización. Se conservan sus archivos, versiones, permisos y copias locales. Puedes recuperarlo desde Archivados.' : pendiente?.tipo === 'restaurar_espacio' ? 'El repositorio volverá a estar disponible con su contenido y permisos anteriores.' : pendiente?.tipo === 'eliminar' ? 'Se enviará a papelera. Si es una carpeta, también quedará oculto todo su contenido. No se borrará físicamente ningún archivo.' : pendiente?.tipo === 'version' ? 'Se creará una nueva revisión conservando el historial.' : 'Se restaurará en su carpeta original. Si es una carpeta, se recuperará también su contenido.' }}</p>
        <p>
            <strong>{{ pendiente?.registro.nombre }}</strong>
        </p>
        <template #footer
            ><Button type="button" label="Cancelar" class="btn-cancelar" :disabled="cargando" @click="confirmacionVisible = false" /><Button
                type="button"
                label="Confirmar"
                icon="pi pi-check"
                class="btn-guardar"
                :disabled="cargando"
                @click="handleConfirmar"
        /></template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Kiosco',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
