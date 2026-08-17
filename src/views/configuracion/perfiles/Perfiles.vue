<template>
    <Encabezado titulo="Perfiles" subtitulo="Administración de perfiles del sistema" icono="pi pi-id-card">
        <Button type="button" label="Nuevo" class="w-full btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" v-if="mostrarTablaFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-xmark" class="mr-2" />
            </template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formPerfil" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- ================================================= -->
        <!-- TABLA -->
        <!-- ================================================= -->

        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablaPerfiles"
                :globalFilterFields="['nombre_perfil']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 200, 300, 400]"
                scrollable
                scrollHeight="54vh"
                size="small"
                tableStyle="min-width: 50rem"
                class="tabla-encabezados"
            >
                <template #header>
                    <div class="flex justify-content-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined style="margin-right: 5px" @click="handleLimpiarFiltro" />

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>

                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <template #empty> No se encontraron registros. </template>

                <!-- NOMBRE -->
                <Column field="nombre_perfil" header="Nombre del Perfil" headerClass="encabezado-columna" />

                <!-- ACTIVO -->
                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red">
                            <font-icon :icon="['fas', 'square-xmark']" />
                        </span>

                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green">
                            <font-icon :icon="['fas', 'square-check']" />
                        </span>
                    </template>
                </Column>

                <!-- OPCIONES -->
                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <Button class="btn-nuevo" style="margin: 5px" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <!-- ================================================= -->
        <!-- FORMULARIO -->
        <!-- ================================================= -->

        <Tabs value="0" v-if="mostrarTablaFormulario">
            <TabList>
                <Tab value="0"> Datos </Tab>

                <Tab value="1"> Historial </Tab>
            </TabList>

            <TabPanels>
                <!-- DATOS -->
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formPerfil" @submit.prevent="handleGuardar">
                            <div style="max-width: 900px; margin: 0 auto; padding: 40px 20px">
                                <!-- NOMBRE -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px">
                                    <div style="display: flex; flex-direction: column; gap: 8px">
                                        <label for="nombre_perfil"> Nombre del Perfil: </label>

                                        <InputText
                                            id="nombre_perfil"
                                            name="nombre_perfil"
                                            v-model="frmPerfil.nombre_perfil"
                                            :invalid="!nombrePerfilValido"
                                            style="width: 100%; text-transform: uppercase"
                                            @update:modelValue="frmPerfil.nombre_perfil = $event.toUpperCase()"
                                        />
                                    </div>
                                </div>

                                <!-- ACTIVO -->
                                <div style="display: flex; align-items: center; gap: 8px">
                                    <Checkbox inputId="activo" v-model="frmPerfil.activo" binary />

                                    <label for="activo"> Activo </label>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <!-- HISTORIAL -->
                <TabPanel value="1">
                    <p class="m-0">Aquí se mostrará el historial del perfil.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Perfiles',

    components: {
        Encabezado
    },

    setup() {
        return {
            ...proceso()
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
