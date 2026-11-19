<template>
    <Encabezado v-if="!portal" titulo="Kiosco" subtitulo="Archivos, versiones y papelera" icono="pi pi-cloud">
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
                    <template v-if="!portal">
                        <label for="sync-espacio">Repositorio</label>
                        <Select v-model="espacioId" inputId="sync-espacio" :options="espacios" optionLabel="nombre" optionValue="_id" placeholder="Selecciona un repositorio" :disabled="cargando || !espacios.length" @change="handleCambiarEspacio" />
                        <Button v-if="hayMasEspacios" type="button" label="Más repositorios" text :disabled="cargando" @click="handleMasEspacios" />
                    </template>
                    <Button type="button" label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando" @click="handleActualizar" />
                    <Button v-if="espacioId && !papelera" type="button" label="Enlace de carpeta" icon="pi pi-link" outlined :disabled="cargando" @click="handleEnlaceCarpeta()" />
                </div>
            </template>
            <template #end>
                <div class="sync-controles">
                    <Button v-if="espacioId && !carpetaLimitada" type="button" :label="papelera ? 'Volver a archivos' : 'Papelera'" :icon="papelera ? 'pi pi-folder' : 'pi pi-trash'" outlined :disabled="cargando" @click="handleCambiarPapelera" />
                    <Button v-if="espacioId && !papelera && handleTienePermiso('crear_carpeta')" type="button" label="Nueva carpeta" icon="pi pi-folder-plus" class="btn-nuevo" :disabled="cargando" @click="handleMostrarFormulario('carpeta')" />
                    <Button v-if="espacioId && !papelera && handleTienePermiso('cargar')" type="button" label="Subir archivo" icon="pi pi-upload" class="btn-guardar" :disabled="cargando" @click="handleMostrarCarga()" />
                </div>
            </template>
        </Toolbar>

        <div class="sync-vistas-barra">
            <div class="sync-controles">
                <Button type="button" label="Detalle" icon="pi pi-list" size="small" :outlined="vistaArchivos !== 'detalle'" :aria-pressed="vistaArchivos === 'detalle'" @click="vistaArchivos = 'detalle'" />
                <Button type="button" label="Iconos" icon="pi pi-th-large" size="small" :outlined="vistaArchivos !== 'iconos'" :aria-pressed="vistaArchivos === 'iconos'" @click="vistaArchivos = 'iconos'" />
                <div class="sync-vista-interruptor"><ToggleSwitch v-model="vistaPreviaActiva" inputId="sync-vista-previa" /><label for="sync-vista-previa">Vista previa</label></div>
            </div>
            <div class="sync-busqueda"><i class="pi pi-search" aria-hidden="true" /><InputText v-model="busqueda" placeholder="Buscar en esta página..." aria-label="Buscar archivos en esta página" /><Button v-if="busqueda" type="button" icon="pi pi-times" text rounded aria-label="Limpiar búsqueda" @click="busqueda = ''" /></div>
        </div>

        <ProgressBar v-if="cargando" mode="indeterminate" class="sync-progreso" aria-label="Procesando operación" />
        <Breadcrumb v-if="espacioId && !papelera" :home="rutaInicio" :model="rutaItems" class="sync-ruta">
            <template #item="{ item }"><Button type="button" :label="item.label" text :disabled="cargando" @click="handleNavegar(item.indice)" /></template>
        </Breadcrumb>
        <Message v-if="papelera" severity="info" :closable="false">Las carpetas se restauran con su contenido. Los elementos que ya estaban en papelera permanecen allí. Todo se conserva indefinidamente.</Message>

        <Splitter :key="`${vistaPreviaActiva}-${visorVertical}`" :layout="visorVertical ? 'vertical' : 'horizontal'" class="sync-explorador" :gutterSize="6">
        <SplitterPanel :size="vistaPreviaActiva ? 60 : 100" :minSize="30" class="sync-panel-archivos">
            <DataTable v-if="vistaArchivos === 'detalle'" :value="registrosVisibles" :selection="archivoActivo" selectionMode="single" @row-select="handleSeleccionarArchivo($event.data)" dataKey="_id" :loading="cargando" scrollable scrollHeight="flex" size="small" tableStyle="min-width: 42rem" class="tabla-encabezados sync-tabla">
            <template #empty>{{ busqueda ? 'No hay coincidencias en esta página.' : !espacioId ? 'No hay espacios disponibles para tu usuario.' : papelera ? 'No hay archivos en la papelera.' : 'Esta carpeta está vacía.' }}</template>
                <Column field="nombre" header="Nombre" headerClass="encabezado-columna">
                    <template #body="{ data }">
                        <Button v-if="data.tipo === 'carpeta' && !papelera" type="button" :label="data.nombre" icon="pi pi-folder" text :disabled="cargando" @click.stop="handleAbrirCarpeta(data)" />
                        <button v-else type="button" class="sync-nombre sync-seleccionar" :disabled="cargando" @click.stop="handleSeleccionarArchivo(data)"><font-icon :icon="handleIconoArchivo(data.nombre)" aria-hidden="true" />{{ data.nombre }}</button>
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
                        <div class="sync-acciones-archivo">
                            <Button v-for="accion in handleAccionesRegistro(data)" :key="accion.label" type="button" :icon="accion.icon" :title="accion.label" :aria-label="`${accion.label}: ${data.nombre}`" :severity="accion.severity" outlined size="small" :disabled="cargando" @click.stop="accion.ejecutar()" />
                        </div>
                    </template>
                </Column>
            </DataTable>
            <div v-else class="sync-iconos-contenedor" :aria-busy="cargando">
                <p v-if="!registrosVisibles.length" class="sync-lista-vacia">{{ busqueda ? 'No hay coincidencias en esta página.' : 'No hay archivos disponibles.' }}</p>
                <div class="sync-iconos">
                    <article v-for="data in registrosVisibles" :key="data._id" class="sync-tarjeta-archivo" :class="{ 'sync-tarjeta-activa': archivoActivo?._id === data._id }">
                        <button type="button" class="sync-tarjeta-seleccion" :disabled="cargando" :aria-pressed="archivoActivo?._id === data._id" @click="handleSeleccionarArchivo(data)" @dblclick="data.tipo === 'carpeta' && !papelera && handleAbrirCarpeta(data)">
                            <i v-if="data.tipo === 'carpeta'" class="pi pi-folder sync-icono-carpeta" aria-hidden="true" />
                            <font-icon v-else :icon="handleIconoArchivo(data.nombre)" aria-hidden="true" />
                            <strong>{{ data.nombre }}</strong>
                            <small>{{ data.tipo === 'carpeta' ? 'Carpeta' : `Revisión ${data.revision}` }}</small>
                        </button>
                        <Button v-if="data.tipo === 'carpeta' && !papelera" type="button" label="Abrir carpeta" icon="pi pi-folder-open" text size="small" :disabled="cargando" @click="handleAbrirCarpeta(data)" />
                        <div class="sync-acciones-archivo">
                            <Button v-for="accion in handleAccionesRegistro(data)" :key="accion.label" type="button" :icon="accion.icon" :title="accion.label" :aria-label="`${accion.label}: ${data.nombre}`" :severity="accion.severity" outlined size="small" :disabled="cargando" @click.stop="accion.ejecutar()" />
                        </div>
                    </article>
                </div>
            </div>
        </SplitterPanel>
        <SplitterPanel v-if="vistaPreviaActiva" :size="40" :minSize="25" class="sync-panel-visor">
            <div class="sync-panel-visor-cabecera">
                <div><strong>Vista previa</strong><span :title="visorNombre || archivoActivo?.nombre">{{ visorNombre || archivoActivo?.nombre || 'Selecciona un archivo' }}</span></div>
                <Button v-if="visorVisible" type="button" icon="pi pi-window-maximize" title="Ampliar vista previa" aria-label="Ampliar vista previa" text rounded @click="visorAmpliado = true" />
                <Button type="button" icon="pi pi-times" title="Ocultar vista previa" aria-label="Ocultar vista previa" text rounded @click="vistaPreviaActiva = false" />
            </div>
            <VistaPreviaSync v-if="!visorAmpliado" :cargando="visorCargando" :office="visorOffice" :libro="visorLibro" :documento="visorDocumento" :error="visorError" :url="visorUrl" :texto="visorTexto" :tipo="visorTipo" :nombre="visorNombre" :vacio="papelera ? 'La vista previa no está disponible en la papelera.' : archivoActivo?.tipo === 'carpeta' ? 'Abre la carpeta para seleccionar un archivo.' : archivoActivo && !handleTienePermiso('visualizar', archivoActivo) ? 'No tienes permiso para visualizar este archivo.' : 'Selecciona un archivo para visualizar su contenido.'" @error="handleErrorVisor" />
        </SplitterPanel>
        </Splitter>
        <div v-if="espacioId" class="sync-paginacion">
            <Button type="button" label="Anterior" icon="pi pi-angle-left" outlined :disabled="cargando || offset === 0" @click="handlePaginar(-1)" />
            <span>Página {{ offset / limite + 1 }} · {{ registrosVisibles.length }} de {{ registros.length }} elementos</span>
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
    <Dialog v-model:visible="enlaceCarpetaVisible" modal header="Enlace de carpeta" class="sync-dialogo">
        <div class="sync-formulario"><p>Este enlace abre la carpeta después de iniciar sesión. Cada persona conserva los permisos de su cuenta; el enlace no concede acceso.</p><div v-if="enlaceDestino.carpeta" class="sync-controles"><Checkbox v-model="enlaceSoloCarpeta" inputId="sync-enlace-limitado" binary @change="handleActualizarEnlaceCarpeta" /><label for="sync-enlace-limitado">Abrir solo esta carpeta y sus subcarpetas</label></div><small v-if="enlaceDestino.carpeta">Oculta la navegacion al repositorio superior en este enlace. Los permisos de la cuenta se conservan.</small><InputText :modelValue="enlaceCarpeta" readonly aria-label="Enlace de acceso a la carpeta" @focus="$event.target.select()" /><Button type="button" label="Copiar enlace" icon="pi pi-copy" @click="handleCopiarEnlaceCarpeta" /></div>
    </Dialog>
    <Dialog v-model:visible="permisosDescargaVisible" modal header="Permisos de descarga" :closable="!cargando" class="sync-dialogo">
        <div class="sync-formulario">
            <strong>{{ archivoPermisosDescarga?.nombre }}</strong>
            <p>El propietario original y los administradores pueden descargar. Autoriza aquí a otros usuarios. La autorización permite descargar, pero no concede acceso al repositorio.</p>
            <Message v-if="mensajeError" severity="error" :closable="false">{{ mensajeError }}</Message>
            <div class="sync-controles"><InputText v-model="buscarUsuarioDescarga" placeholder="Buscar usuario" aria-label="Buscar usuario para autorizar descarga" :disabled="cargando" @keydown.enter.prevent="handleBuscarUsuariosDescarga" /><Button type="button" label="Buscar" icon="pi pi-search" :disabled="cargando" @click="handleBuscarUsuariosDescarga" /></div>
            <Select v-model="usuarioDescarga" :options="usuariosDescarga" optionLabel="nombre" optionValue="_id" placeholder="Selecciona un usuario" aria-label="Usuario para autorizar descarga" :disabled="cargando" />
            <div class="sync-controles"><Button v-if="hayMasUsuariosDescarga" type="button" label="Más usuarios" text :disabled="cargando" @click="handleMasUsuariosDescarga" /><Button type="button" label="Autorizar descarga" icon="pi pi-unlock" :disabled="cargando || !usuarioDescarga" @click="handleAutorizarDescarga(usuarioDescarga, true)" /></div>
            <DataTable :value="autorizadosDescarga" size="small" :loading="cargando" scrollable scrollHeight="30vh">
                <template #empty>No hay autorizaciones adicionales.</template>
                <Column field="nombre" header="Usuario" />
                <Column header="Acción"><template #body="{ data }"><Button type="button" label="Revocar" severity="danger" outlined size="small" :disabled="cargando" @click="handleAutorizarDescarga(data._id, false)" /></template></Column>
            </DataTable>
        </div>
        <template #footer><Button type="button" label="Cerrar" :disabled="cargando" @click="permisosDescargaVisible = false" /></template>
    </Dialog>
    <Dialog v-model:visible="visorAmpliado" modal maximizable :header="`Vista previa: ${visorNombre}`" class="sync-dialogo-visor">
        <div class="sync-visor-ampliado"><VistaPreviaSync :cargando="visorCargando" :office="visorOffice" :libro="visorLibro" :documento="visorDocumento" :error="visorError" :url="visorUrl" :texto="visorTexto" :tipo="visorTipo" :nombre="visorNombre" @error="handleErrorVisor" /></div>
        <template #footer><Button type="button" label="Volver al panel" @click="visorAmpliado = false" /></template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
import VistaPreviaSync from './VistaPreviaSync.vue';
import { useRoute, useRouter } from 'vue-router';

export default {
    name: 'Kiosco',
    components: { Encabezado, VistaPreviaSync },
    props: { portal: Boolean },
    setup(props) {
        const route = useRoute(), router = useRouter();
        return { ...proceso({ portal: props.portal, ubicacionInicial: route.query, resolverEnlace: query => new URL(router.resolve({ name: 'archivos_portal', query }).href, window.location.origin).href }) };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
