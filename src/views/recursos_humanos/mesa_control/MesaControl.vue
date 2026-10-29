<template>
    <Encabezado titulo="Mesa de Control RH" subtitulo="Autorización y rechazo de solicitudes de alta de personal" icono="pi pi-users" />
    <div class="mc-contenedor">
        <section class="mc-card">
            <div class="mc-barra">
                <div class="mc-pestanas">
                    <Button label="Pendientes" icon="pi pi-clock" :outlined="pestana !== 'PENDIENTE'" @click="cambiarPestanaLista('PENDIENTE')" />
                    <Button label="Historial" icon="pi pi-history" :outlined="pestana !== 'HISTORIAL'" @click="cambiarPestanaLista('HISTORIAL')" />
                </div>
                <div class="mc-busqueda">
                    <InputText v-model="busqueda" placeholder="Buscar nombre, RFC o CURP" />
                    <Button icon="pi pi-refresh" outlined severity="secondary" aria-label="Actualizar" :loading="cargando" @click="cargarSolicitudes" />
                </div>
            </div>
            <DataTable :value="solicitudesFiltradas" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" size="small" scrollable :loading="cargando">
                <template #empty><div class="mc-vacio">No hay solicitudes en esta pestaña.</div></template>
                <Column header="Nombre" style="min-width: 220px">
                    <template #body="{ data }">{{ nombre(data) }}</template>
                </Column>
                <Column field="rfc" header="RFC" />
                <Column field="curp" header="CURP" />
                <Column header="Área / Puesto" style="min-width: 200px">
                    <template #body="{ data }">{{ data.area_nombre || '—' }} / {{ data.puesto_nombre || '—' }}</template>
                </Column>
                <Column header="Estatus">
                    <template #body="{ data }">
                        <Tag :value="data.estatus" :severity="data.estatus === 'APROBADA' ? 'success' : data.estatus === 'RECHAZADA' ? 'danger' : 'warn'" />
                    </template>
                </Column>
                <Column header="Fecha"
                    ><template #body="{ data }">{{ fecha(data.fecha_creacion) }}</template></Column
                >
                <Column header="Acciones" style="min-width: 155px">
                    <template #body="{ data }">
                        <div class="mc-acciones">
                            <Button icon="pi pi-eye" text rounded aria-label="Ver detalle" v-tooltip.top="'Ver solicitud'" @click="verDetalle(data)" />
                            <template v-if="pestana === 'PENDIENTE'">
                                <Button icon="pi pi-user-plus" text rounded severity="success" aria-label="Dar de alta" v-tooltip.top="'Alta de empleado'" @click="abrirAlta(data)" />
                                <Button icon="pi pi-times-circle" text rounded severity="danger" aria-label="Rechazar" v-tooltip.top="'Rechazar solicitud'" @click="abrirRechazo(data)" />
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </section>

        <Dialog v-model:visible="visibleAlta" modal header="Alta de empleado" :style="{ width: '560px', maxWidth: '96vw' }" :closable="!procesando">
            <div class="mc-modal">
                <div class="mc-nombre">{{ nombre(seleccionada) }}</div>
                <div class="mc-campo">
                    <label>Tipo de nómina *</label>
                    <Select v-model="formularioAlta.tipo_nomina" :options="tiposNomina" optionLabel="descripcion" optionValue="tipo_nomina" placeholder="Seleccionar tipo de nómina" class="w-full" />
                </div>
                <div class="mc-campo">
                    <label>Periodicidad del pago *</label>
                    <Select v-model="formularioAlta.periodicidad_pago" :options="periodicidades" optionLabel="descripcion" optionValue="periodicidad_pago" placeholder="Seleccionar periodicidad" class="w-full" filter />
                </div>
                <div class="mc-campo">
                    <label>Fecha de alta *</label>
                    <DatePicker v-model="formularioAlta.fecha_alta" :minDate="fechaMinima" dateFormat="dd/mm/yy" showIcon iconDisplay="input" :manualInput="false" class="w-full" />
                    <small>La fecha debe ser por lo menos 10 días naturales después de hoy.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined :disabled="procesando" @click="visibleAlta = false" />
                <Button label="Confirmar alta" icon="pi pi-check" severity="success" :loading="procesando" @click="guardarAlta" />
            </template>
        </Dialog>

        <Dialog v-model:visible="visibleRechazo" modal header="Rechazar solicitud" :style="{ width: '560px', maxWidth: '96vw' }" :closable="!procesando">
            <div class="mc-modal">
                <div class="mc-nombre">{{ nombre(seleccionada) }}</div>
                <div class="mc-campo">
                    <label>Observación del rechazo *</label>
                    <Textarea v-model="observacion" rows="5" autoResize maxlength="2000" class="w-full" placeholder="Escribe el motivo del rechazo..." />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" severity="secondary" outlined :disabled="procesando" @click="visibleRechazo = false" />
                <Button label="Confirmar rechazo" icon="pi pi-times" severity="danger" :disabled="!observacion.trim()" :loading="procesando" @click="guardarRechazo" />
            </template>
        </Dialog>

        <Dialog v-model:visible="visibleDetalle" modal header="Detalle de solicitud" class="mc-dialog-detalle" :style="{ width: '96vw', maxWidth: '1600px' }" :breakpoints="{ '960px': '99vw' }" @hide="limpiarVisor">
            <div v-if="detalle" class="mc-detalle">
                <aside class="mc-datos">
                    <h3><i class="pi pi-user"></i> Información del empleado</h3>
                    <div v-for="campo in camposDetalle" :key="campo[0]" class="mc-dato">
                        <span>{{ campo[1] }}</span>
                        <strong>{{ valorDetalle(campo[0]) }}</strong>
                    </div>
                </aside>
                <div class="mc-archivos">
                    <Tabs :value="pestanaDocumento" scrollable @update:value="cambiarDocumento">
                        <TabList>
                            <Tab v-for="doc in documentosVisor" :key="doc.campo" :value="doc.campo">
                                <i :class="doc.campo === 'fotografia' ? 'pi pi-image' : 'pi pi-file'"></i>
                                {{ doc.nombre }}
                                <i v-if="!detalle.documentos?.[doc.campo]" class="pi pi-minus-circle mc-falta"></i>
                            </Tab>
                        </TabList>
                    </Tabs>
                    <div class="mc-visor-barra">
                        <span :title="nombreArchivo">{{ nombreArchivo }}</span>
                        <Button label="Descargar" icon="pi pi-download" outlined size="small" :disabled="!archivoDisponible || cargandoArchivo" @click="descargarDocumento" />
                    </div>
                    <div class="mc-visor">
                        <div v-if="cargandoArchivo" class="mc-mensaje"><ProgressSpinner style="width: 40px; height: 40px" /> Cargando documento...</div>
                        <iframe v-else-if="urlArchivo && tipoArchivo === 'pdf'" :src="urlArchivo" title="Vista previa PDF" class="mc-pdf"></iframe>
                        <img v-else-if="urlArchivo && tipoArchivo === 'imagen'" :src="urlArchivo" alt="Vista previa" class="mc-imagen" />
                        <div v-else class="mc-mensaje">{{ mensajeArchivo || 'Este archivo no admite vista previa.' }}</div>
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
    name: 'MesaControlRH',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
