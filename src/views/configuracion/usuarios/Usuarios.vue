<template>
    <Encabezado titulo="Usuarios" subtitulo="Administración de usuarios del sistema" icono="pi pi-users">
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

        <Button type="submit" label="Guardar" class="w-full btn-guardar" id="btnFormUsuario" form="formUsuario" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablasUsuarios"
                :globalFilterFields="['nombre_completo', 'correo_electronico']"
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

                <Column header="Foto" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <div class="flex align-items-center justify-content-center">
                            <img :src="fotosUsuarios[slotProps.data._id] || '../../../assets/images/Perfil.jpg'" alt="usuario" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover" />
                        </div>
                    </template>
                </Column>
                <Column field="nombre_completo" header="Nombre Completo" headerClass="encabezado-columna" />
                <Column field="correo_electronico" header="Correo Electronico" headerClass="encabezado-columna" />
                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red"><font-icon :icon="['fas', 'person-circle-minus']" /></span>
                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green"><font-icon :icon="['fas', 'person-circle-check']" /></span>
                    </template>
                </Column>
                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <Button class="btn-nuevo" style="margin: 5px" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <Tabs value="0" v-if="mostrarTablaFormulario">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1">Historial</Tab>
            </TabList>

            <TabPanels>
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formUsuario" @submit.prevent="handleGuardar">
                            <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; padding: 20px">
                                <!-- FOTO -->
                                <div style="padding: 10px">
                                    <div class="flex flex-column gap-2">
                                        <div style="width: 310px; height: 310px; border: 1px solid gray; border-radius: 5px; margin: 0 auto; overflow: hidden; cursor: pointer" @click="handleAbrirFoto">
                                            <img :src="fotoPreview || fotosUsuarios[frmUsuario._id] || perfil" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover" />
                                        </div>

                                        <input ref="fotoInput" type="file" accept=".jpg,.jpeg,.png" style="display: none" @change="handleSeleccionarFoto" />
                                    </div>
                                </div>

                                <!-- DATOS -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 10px">
                                    <div>
                                        <!-- NOMBRE / CORREO -->
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px">
                                            <!-- NOMBRE -->
                                            <div style="display: flex; flex-direction: column; gap: 8px">
                                                <label for="nombre_completo"> Nombre Completo: </label>

                                                <InputText
                                                    id="nombre_completo"
                                                    name="nombre_completo"
                                                    style="width: 100%; text-transform: uppercase"
                                                    v-model="frmUsuario.nombre_completo"
                                                    :invalid="!nombreCompletoValido"
                                                    @update:modelValue="frmUsuario.nombre_completo = $event.toUpperCase()"
                                                />
                                            </div>

                                            <!-- CORREO -->
                                            <div style="display: flex; flex-direction: column; gap: 8px">
                                                <label for="correo_electronico"> Correo Electrónico: </label>

                                                <InputText
                                                    id="correo_electronico"
                                                    name="correo_electronico"
                                                    style="width: 100%; text-transform: lowercase"
                                                    v-model="frmUsuario.correo_electronico"
                                                    type="email"
                                                    :invalid="!correoElectronicoValido"
                                                    :disabled="movimiento === 'E'"
                                                    @update:modelValue="frmUsuario.correo_electronico = $event.toLowerCase()"
                                                />
                                            </div>
                                        </div>

                                        <!-- CHECKBOX -->
                                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; padding: 20px">
                                            <div class="flex align-items-center">
                                                <Checkbox inputId="correo_acceso" binary v-model="frmUsuario.correo_acceso" />
                                                <label for="correo_acceso" class="ml-2"> Correo Acceso </label>
                                            </div>

                                            <div class="flex align-items-center">
                                                <Checkbox inputId="activo" binary v-model="frmUsuario.activo" />
                                                <label for="activo" class="ml-2"> Activo </label>
                                            </div>

                                            <div class="flex align-items-center">
                                                <Checkbox inputId="cambiar_clave" v-model="frmUsuario.cambiar_clave" binary :disabled="movimiento === 'N'" @change="handleCambiarClave" />
                                                <label for="cambiar_clave" class="ml-2"> Cambiar Clave </label>
                                            </div>
                                        </div>

                                        <!-- CLAVES -->
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                                            <!-- CLAVE -->
                                            <div style="display: flex; flex-direction: column; gap: 8px">
                                                <label for="clave"> Clave: </label>

                                                <InputText id="clave" name="clave" type="password" v-model="frmUsuario.clave" :disabled="!frmUsuario.cambiar_clave" :invalid="!claveValida" style="width: 100%" />
                                            </div>

                                            <div style="display: flex; flex-direction: column; gap: 8px">
                                                <label for="repita_clave"> Repita Clave: </label>

                                                <InputText id="repita_clave" name="repita_clave" type="password" v-model="frmUsuario.repita_clave" :disabled="!frmUsuario.cambiar_clave" :invalid="!repitaClaveValida" style="width: 100%" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="1">
                    <p class="m-0">
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim
                        ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                    </p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script>
import perfil from '../../../assets/images/Perfil.jpg';
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';
export default {
    name: 'Usuarios',
    components: { Encabezado },
    setup() {
        return {
            ...proceso(),
            perfil
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
