<template>
    <Encabezado titulo="Empleados" subtitulo="Consulta de empleados dados de alta por Mesa de Control" icono="pi pi-users" />
    <div class="emp-contenedor">
        <section class="emp-card">
            <div class="emp-barra">
                <strong>Listado de empleados</strong>
                <div class="emp-herramientas">
                    <InputText v-model="busqueda" placeholder="Buscar nombre, RFC, CURP, área o puesto" />
                    <Select v-model="filtroArea" :options="opcionesAreas" optionLabel="label" optionValue="value" placeholder="Todas las áreas" showClear class="emp-filtro" />
                    <Button icon="pi pi-refresh" severity="secondary" outlined aria-label="Actualizar" :loading="cargando" @click="cargarEmpleados" />
                </div>
            </div>
            <DataTable :value="filtrados" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" size="small" scrollable :loading="cargando" stripedRows>
                <template #empty><div class="emp-vacio">No hay empleados registrados con los filtros seleccionados.</div></template>
                <Column header="Nombre" style="min-width: 230px"
                    ><template #body="{ data }">{{ nombre(data) }}</template></Column
                >
                <Column field="rfc" header="RFC" style="min-width: 145px" />
                <Column field="curp" header="CURP" style="min-width: 190px" />
                <Column header="Área / Puesto" style="min-width: 230px"
                    ><template #body="{ data }">{{ data.area_nombre || '—' }} / {{ data.puesto_nombre || '—' }}</template></Column
                >
                <Column header="Fecha de alta" style="min-width: 120px"
                    ><template #body="{ data }">{{ fecha(data.fecha_alta) }}</template></Column
                >
                <Column header="Estatus"
                    ><template #body="{ data }"><Tag :value="data.estatus" severity="success" /></template
                ></Column>
                <Column header="Acciones" style="min-width: 95px"
                    ><template #body="{ data }">
                        <Button icon="pi pi-eye" text rounded aria-label="Ver expediente" v-tooltip.top="'Ver expediente'" @click="verDetalle(data)" /> </template
                ></Column>
            </DataTable>
        </section>

        <Dialog v-model:visible="visibleDetalle" modal header="Expediente del empleado" class="emp-dialog" :style="{ width: '96vw', maxWidth: '1600px' }" :breakpoints="{ '960px': '99vw' }" @hide="limpiarVisor">
            <div v-if="detalle" class="emp-detalle">
                <aside class="emp-datos">
                    <h3><i class="pi pi-user"></i> Información del empleado</h3>
                    <div v-for="campo in camposDetalle" :key="campo.key" class="emp-dato">
                        <span>{{ campo.label }}</span>
                        <strong>{{ valorDetalle(campo.key) }}</strong>
                    </div>
                </aside>
                <div class="emp-archivos">
                    <Tabs :value="pestanaDocumento" scrollable @update:value="cambiarDocumento">
                        <TabList>
                            <Tab v-for="doc in documentosVisor" :key="doc.campo" :value="doc.campo">
                                <i :class="doc.campo === 'fotografia' ? 'pi pi-image' : 'pi pi-file'"></i>
                                {{ doc.nombre }}
                                <i v-if="!detalle.documentos?.[doc.campo]" class="pi pi-minus-circle emp-falta"></i>
                            </Tab>
                        </TabList>
                    </Tabs>
                    <div class="emp-visor-barra">
                        <span :title="nombreArchivo">{{ nombreArchivo }}</span>
                        <Button label="Descargar" icon="pi pi-download" outlined size="small" :disabled="!archivoDisponible || cargandoArchivo" @click="descargarDocumento" />
                    </div>
                    <div class="emp-visor">
                        <div v-if="cargandoArchivo" class="emp-mensaje"><ProgressSpinner style="width: 40px; height: 40px" /> Cargando documento...</div>
                        <iframe v-else-if="urlArchivo && tipoArchivo === 'pdf'" :src="urlArchivo" title="Vista previa PDF" class="emp-pdf"></iframe>
                        <img v-else-if="urlArchivo && tipoArchivo === 'imagen'" :src="urlArchivo" alt="Vista previa del documento" class="emp-imagen" />
                        <div v-else class="emp-mensaje">{{ mensajeArchivo || 'Selecciona un documento para visualizarlo.' }}</div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>
<script>
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import Tabs from 'primevue/tabs';
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {
    name: 'Empleados',
    components: { Encabezado, Tabs, TabList, Tab },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
