<template>
    <Encabezado titulo="Tablero jurídico" subtitulo="Solicitudes, expedientes y compromisos del equipo">
        <template #icono><font-icon icon="fa-solid fa-scale-balanced" style="font-size: 1.2rem" /></template>
        <Button icon="pi pi-question-circle" text rounded aria-label="Manual del Tablero jurídico" title="Ayuda de esta pantalla" @click="handleAyuda" />
        <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargar" />
    </Encabezado>
    <div class="card juridico-contenido juridico-vista-resumen" :aria-busy="cargando">
        <div class="juridico-herramientas">
            <Select v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" placeholder="Todas las empresas" showClear filter />
            <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Folio, título, empresa, actividad o responsable" maxlength="100" aria-label="Buscar compromisos" /></IconField>
            <Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" />
            <span class="juridico-nota">Resumen actual de seguimiento. Las fechas corresponden a compromisos internos.</span>
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="juridico-indicadores">
            <div v-for="item in indicadores" :key="item.nombre"><i :class="item.icono" /><div><small>{{ item.nombre }}</small><strong>{{ cargando ? '...' : (item.valor ?? '—') }}</strong></div></div>
        </div>
        <div class="juridico-seccion"><h2>Compromisos por atender</h2><p>Los primeros 10 resultados, ordenados por fecha; incluye los vencidos. La búsqueda filtra los compromisos, no los indicadores.</p></div>
        <DataTable size="small" scrollable :value="tareas" :loading="cargando" class="juridico-tabla tabla-encabezados">
            <template #empty><div class="juridico-vacio"><i class="pi pi-calendar" /><strong>{{ error ? 'No fue posible cargar los compromisos.' : 'No hay compromisos pendientes para esta empresa.' }}</strong></div></template>
            <Column headerClass="encabezado-columna" header="Fecha" style="width: 10%"><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column>
            <Column headerClass="encabezado-columna" header="Expediente / título" style="width: 20%"><template #body="{ data }"><div class="tablero-expediente"><strong>{{ data.expediente_folio }}</strong><span>{{ data.expediente_titulo || 'Sin título' }}</span></div></template></Column>
            <Column headerClass="encabezado-columna" field="empresa_nombre" header="Empresa" style="width: 17%" />
            <Column headerClass="encabezado-columna" field="actividad" header="Próxima acción" style="width: 20%" />
            <Column headerClass="encabezado-columna" field="responsable_nombre" header="Responsable" style="width: 13%" />
            <Column headerClass="encabezado-columna" header="Estado" style="width: 10%"><template #body="{ data }"><Tag :value="data.estado" :severity="data.estado === 'Vencida' ? 'danger' : 'info'" /></template></Column>
            <Column headerClass="encabezado-columna" header="Opciones" style="width:10%"><template #body="{data}"><Button label="Ver seguimiento" icon="pi pi-history" outlined size="small" @click="handleSeguimiento(data)" /></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrarSeguimiento" :contentStyle="{ overflow: 'hidden' }" modal :header="expedienteSeguimiento?.folio || 'Seguimiento del expediente'" :style="{width:'76rem',maxWidth:'96vw'}">
        <div class="tablero-seguimiento">
            <div class="seguimiento-resumen"><strong>{{ expedienteSeguimiento?.titulo }}</strong><span>{{ expedienteSeguimiento?.empresa_nombre }}</span><Tag v-if="expedienteSeguimiento?.estado" :value="expedienteSeguimiento.estado" severity="info" /></div>
            <Message v-if="errorSeguimiento" severity="error" :closable="false">{{ errorSeguimiento }}</Message>
            <Tabs v-model:value="seguimientoTab"><TabList><Tab value="historial">Línea de tiempo</Tab><Tab value="documentos">Documentos</Tab><Tab value="correos">Correspondencia</Tab></TabList><TabPanels>
                <ProgressBar v-if="cargandoSeguimiento" mode="indeterminate" style="height:.25rem" />
                <TabPanel value="historial">
                    <p class="seguimiento-nota">Movimientos del expediente, del más reciente al más antiguo.</p>
                    <Timeline :value="detalleSeguimiento.historial" class="seguimiento-linea">
                        <template #marker="{item}"><span class="seguimiento-marca"><i :class="handleIconoEvento(item)" /></span></template>
                        <template #content="{item}"><article class="seguimiento-evento"><h3>{{ item.accion }}</h3><small>{{ handleFechaSeguimiento(item.fecha) }} &middot; {{ item.usuario }}</small><Tag v-if="item.tipo_actuacion" :value="item.tipo_actuacion" severity="secondary" /><p v-if="item.descripcion" class="seguimiento-texto">{{ item.descripcion }}</p><div v-for="(cambio,i) in item.cambios" :key="i" class="seguimiento-cambio"><strong class="seguimiento-campo">{{ cambio.campo }}</strong><span class="seguimiento-valor">{{ cambio.nuevo ?? 'Sin dato' }}</span></div><div v-if="item.evidencias?.length" class="seguimiento-evidencias"><Button v-for="archivo in item.evidencias" :key="archivo.id" :label="archivo.nombre" icon="pi pi-download" text @click="handleDescargarSeguimiento(archivo)" /></div></article></template>
                    </Timeline>
                    <p v-if="!cargandoSeguimiento && !detalleSeguimiento.historial.length">No hay movimientos registrados.</p>
                </TabPanel>
                <TabPanel value="documentos">
                    <div class="juridico-check seguimiento-filtro"><Checkbox inputId="seguimiento-documentos-retirados" v-model="mostrarRetirados" binary /><label for="seguimiento-documentos-retirados">Ver retirados</label></div>
                    <DataTable :value="detalleSeguimiento.documentos" size="small" scrollable class="juridico-tabla tabla-encabezados"><template #empty>No hay documentos para mostrar.</template><Column field="nombre" header="Documento" headerClass="encabezado-columna" /><Column field="usuario" header="Adjuntado por" headerClass="encabezado-columna" /><Column header="Fecha" headerClass="encabezado-columna"><template #body="{data}">{{ handleFechaSeguimiento(data.fecha) }}</template></Column><Column header="Estado" headerClass="encabezado-columna"><template #body="{data}"><Tag :value="data.retirado ? 'Retirado' : 'Vigente'" :severity="data.retirado ? 'secondary' : 'success'" /><small v-if="data.retiro_motivo">{{ data.retiro_motivo }}</small></template></Column><Column header="Opciones" headerClass="encabezado-columna"><template #body="{data}"><Button label="Descargar" icon="pi pi-download" text @click="handleDescargarSeguimiento(data)" /></template></Column></DataTable>
                </TabPanel>
                <TabPanel value="correos">
                    <div class="juridico-check seguimiento-filtro"><Checkbox inputId="seguimiento-correos-retirados" v-model="mostrarRetirados" binary /><label for="seguimiento-correos-retirados">Ver retirados</label></div>
                    <DataTable :value="detalleSeguimiento.correos" size="small" scrollable class="juridico-tabla tabla-encabezados"><template #empty>No hay correos para mostrar.</template><Column header="Asunto / remitente" headerClass="encabezado-columna"><template #body="{data}"><div class="tablero-expediente"><strong>{{ data.asunto }}</strong><span>{{ data.remitente || 'No disponible' }}</span></div></template></Column><Column header="Fecha del correo" headerClass="encabezado-columna"><template #body="{data}">{{ handleFechaSeguimiento(data.fecha_correo) }}</template></Column><Column field="usuario" header="Incorporado por" headerClass="encabezado-columna" /><Column header="Estado" headerClass="encabezado-columna"><template #body="{data}"><Tag :value="data.retirado ? 'Retirado' : 'Vigente'" :severity="data.retirado ? 'secondary' : 'success'" /></template></Column><Column header="Opciones" headerClass="encabezado-columna"><template #body="{data}"><Button label="Ver correo" icon="pi pi-envelope" text @click="handleLeerCorreoSeguimiento(data)" /><Button icon="pi pi-download" text aria-label="Descargar correo original" @click="handleDescargarSeguimiento(null,data)" /></template></Column></DataTable>
                </TabPanel>
            </TabPanels></Tabs>
            <Paginator :first="paginasSeguimiento[seguimientoTab]" :rows="10" :totalRecords="totalesSeguimiento[seguimientoTab]" @page="handlePaginaSeguimiento" />
        </div>
        <template #footer><Button v-if="verExpediente" label="Abrir expediente" icon="pi pi-folder-open" outlined @click="handleAbrirExpediente" /><Button label="Cerrar" @click="mostrarSeguimiento = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarCorreoSeguimiento" modal header="Correo del expediente" :style="{width:'65rem',maxWidth:'96vw'}">
        <ProgressBar v-if="leyendoCorreo" mode="indeterminate" style="height:.25rem" />
        <div v-if="correoSeguimiento" class="seguimiento-correo"><h2>{{ correoSeguimiento.asunto }}</h2><dl><div><dt>De</dt><dd>{{ correoSeguimiento.remitente || 'No disponible' }}</dd></div><div><dt>Para</dt><dd>{{ correoSeguimiento.destinatarios || 'No disponible' }}</dd></div><div v-if="correoSeguimiento.copias"><dt>CC</dt><dd>{{ correoSeguimiento.copias }}</dd></div><div><dt>Fecha</dt><dd>{{ handleFechaSeguimiento(correoSeguimiento.fecha_correo || correoSeguimiento.fecha_original) }}</dd></div></dl><p class="seguimiento-texto">{{ correoSeguimiento.cuerpo || 'Sin texto legible; puedes descargar el original.' }}</p><h3>Adjuntos</h3><div v-for="archivo in correoSeguimiento.adjuntos" :key="archivo.id"><Button :label="archivo.nombre" icon="pi pi-download" outlined @click="handleDescargarSeguimiento(null,correoSeguimiento,archivo)" /></div><p v-if="!correoSeguimiento.adjuntos.length">Sin adjuntos.</p></div>
        <template #footer><Button v-if="correoSeguimiento" label="Descargar original" icon="pi pi-download" outlined @click="handleDescargarSeguimiento(null,correoSeguimiento)" /><Button label="Cerrar" @click="mostrarCorreoSeguimiento = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía del Tablero jurídico" :style="{ width: '62rem', maxWidth: '96vw' }" class="juridico-ayuda-dialog">
        <div class="juridico-manual">
            <div class="juridico-manual-intro"><i class="pi pi-chart-bar" /><div><h2>Consulta el seguimiento del equipo</h2><p>Identifica solicitudes por atender, expedientes vigentes y compromisos que requieren seguimiento.</p></div></div>
            <section v-for="seccion in guia" :key="seccion.titulo" class="juridico-manual-seccion"><h3><i :class="seccion.icono" />{{ seccion.titulo }}</h3><ul><li v-for="paso in seccion.pasos" :key="paso">{{ paso }}</li></ul></section>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'JuridicoTablero', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
