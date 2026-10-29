<template>
    <Encabezado titulo="Catálogo Recursos Humanos" subtitulo="Administración de áreas, puestos y configuración de nómina" icono="pi pi-sitemap" />
    <div class="card ce-contenedor">
        <Tabs v-model:value="pestana">
            <TabList>
                <Tab value="areas"><i class="pi pi-sitemap mr-2"></i>Áreas</Tab>
                <Tab value="puestos"><i class="pi pi-briefcase mr-2"></i>Puestos</Tab>
                <Tab value="tipo_nomina"><i class="pi pi-wallet mr-2"></i>Tipo de nómina</Tab>
                <Tab value="periodicidad_pago"><i class="pi pi-calendar mr-2"></i>Periodicidad del pago</Tab>
            </TabList>
            <TabPanels>
                <TabPanel v-for="tipo in ['areas', 'puestos']" :key="tipo" :value="tipo">
                    <div class="ce-acciones">
                        <InputText v-model="busqueda[tipo]" :placeholder="`Buscar ${tipo}...`" class="ce-buscar" />
                        <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined @click="cargarTodo" />
                        <Button :label="tipo === 'areas' ? 'Nueva área' : 'Nuevo puesto'" icon="pi pi-plus" @click="abrirNuevo(tipo)" />
                    </div>
                    <DataTable :value="filtrados(tipo)" dataKey="_id" size="small" paginator :rows="15" :rowsPerPageOptions="[15, 30, 50]" stripedRows class="tabla-encabezados">
                        <template #empty>No hay registros.</template>
                        <Column field="nombre" :header="tipo === 'areas' ? 'Área' : 'Puesto'" />
                        <Column v-if="tipo === 'puestos'" header="Área"
                            ><template #body="{ data }">{{ nombreArea(data.area_id) }}</template></Column
                        >
                        <Column header="Estatus" style="width: 130px"
                            ><template #body="{ data }"><Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'secondary'" /></template
                        ></Column>
                        <Column header="Acciones" style="width: 185px"
                            ><template #body="{ data }">
                                <div class="ce-botones">
                                    <Button icon="pi pi-pencil" severity="info" text rounded v-tooltip.top="'Editar'" @click="abrirEditar(tipo, data)" />
                                    <Button :icon="data.activo ? 'pi pi-ban' : 'pi pi-check-circle'" :severity="data.activo ? 'danger' : 'success'" text rounded :title="data.activo ? 'Desactivar' : 'Activar'" @click="cambiarEstado(tipo, data)" />
                                </div> </template
                        ></Column>
                    </DataTable>
                </TabPanel>
                <TabPanel v-for="tipo in ['tipo_nomina', 'periodicidad_pago']" :key="tipo" :value="tipo">
                    <div class="ce-acciones">
                        <span class="ce-sat-nota">Catálogo SAT de solo lectura. Selecciona el valor predeterminado.</span>
                        <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined @click="cargarNomina" />
                    </div>
                    <DataTable :value="tipo === 'tipo_nomina' ? tiposNomina : periodicidadesPago" :dataKey="tipo" size="small" paginator :rows="15" stripedRows class="tabla-encabezados">
                        <template #empty>No hay registros en el catálogo SAT.</template>
                        <Column :field="tipo" header="Clave" style="width: 150px" />
                        <Column field="descripcion" header="Descripción" />
                        <Column header="Predeterminado" style="width: 200px">
                            <template #body="{ data }">
                                <Button
                                    :icon="configuracionNomina[tipo] === data[tipo] ? 'pi pi-check-circle' : 'pi pi-circle'"
                                    :label="configuracionNomina[tipo] === data[tipo] ? 'Predeterminado' : 'Seleccionar'"
                                    :severity="configuracionNomina[tipo] === data[tipo] ? 'success' : 'secondary'"
                                    :outlined="configuracionNomina[tipo] !== data[tipo]"
                                    size="small"
                                    :loading="guardandoNomina"
                                    @click="seleccionarPredeterminado(tipo, data[tipo])"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="visible" modal :header="(form._id ? 'Editar ' : 'Nuevo ') + (tipoEdicion === 'areas' ? 'área' : 'puesto')" :style="{ width: 'min(480px,95vw)' }">
        <div class="ce-formulario">
            <label for="ce-nombre">Nombre *</label>
            <InputText id="ce-nombre" v-model.trim="form.nombre" maxlength="120" class="w-full" autofocus />
            <template v-if="tipoEdicion === 'puestos'">
                <label for="ce-area">Área *</label>
                <Select id="ce-area" v-model="form.area_id" :options="areasActivas" optionLabel="nombre" optionValue="_id" placeholder="Selecciona un área" filter class="w-full" />
            </template>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="visible = false" />
            <Button label="Guardar" icon="pi pi-save" :loading="guardando" @click="guardar" />
        </template>
    </Dialog>
    <ConfirmDialog group="catalogoRecursosHumanos" />
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default {
    name: 'CatalogoEmpresa',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
