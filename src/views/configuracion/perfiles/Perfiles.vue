<template>
    <Encabezado titulo="Perfiles" subtitulo="Administración de perfiles del sistema" icono="pi pi-id-card">
        <Button type="button" label="Nuevo" class="w-full btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-plus" class="mr-2" /></template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" v-if="mostrarTablaFormulario">
            <template #icon><font-icon icon="fa-solid fa-xmark" class="mr-2" /></template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formPerfil" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon><font-icon icon="fa-solid fa-floppy-disk" class="mr-2" /></template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0 perfiles-contenedor" :class="{ 'perfiles-edicion': mostrarTablaFormulario }">
        <!-- TABLA -->
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
                            <InputIcon><i class="pi pi-search" /></InputIcon>
                            <InputText v-model="filtros.global.value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <template #empty>No se encontraron registros.</template>

                <Column field="nombre_perfil" header="Nombre del Perfil" headerClass="encabezado-columna" />

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

                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <Button class="btn-nuevo" style="margin: 5px" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <!-- FORMULARIO -->
        <Tabs value="0" v-if="mostrarTablaFormulario" class="perfiles-tabs">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1">Historial</Tab>
            </TabList>

            <TabPanels>
                <!-- DATOS -->
                <TabPanel value="0">
                    <form id="formPerfil" class="perfil-formulario" @submit.prevent="handleGuardar">
                        <div class="perfil-lateral">
                            <Fieldset legend="Datos generales" class="perfil-seccion">
                                <div class="perfil-campo">
                                    <label for="nombre_perfil">Nombre del perfil</label>
                                    <InputText id="nombre_perfil" name="nombre_perfil" v-model="frmPerfil.nombre_perfil" :invalid="!nombrePerfilValido" class="perfil-nombre" @update:modelValue="frmPerfil.nombre_perfil = $event.toUpperCase()" />
                                </div>
                                <div class="perfil-estado">
                                    <div class="perfil-check">
                                        <Checkbox inputId="activo" v-model="frmPerfil.activo" binary />
                                        <label for="activo">Perfil activo</label>
                                    </div>
                                    <Tag :value="frmPerfil.activo ? 'Activo' : 'Inactivo'" :severity="frmPerfil.activo ? 'success' : 'secondary'" />
                                </div>
                            </Fieldset>
                            <Fieldset legend="Permisos administrativos" class="perfil-seccion perfil-permisos">
                                <div class="perfil-permiso">
                                    <Checkbox inputId="saldos_iniciales" v-model="frmPerfil.saldos_iniciales" binary />
                                    <div>
                                        <label for="saldos_iniciales">Saldos iniciales</label>
                                        <small>Permite modificar el importe y la fecha de saldos iniciales ya registrados. Requiere acceso a Cajas. El alta de una caja con su saldo inicial no requiere este permiso adicional.</small>
                                    </div>
                                </div>
                                <div class="perfil-permiso">
                                    <Checkbox inputId="ver_pantallas_usuarios" v-model="frmPerfil.ver_pantallas_usuarios" binary />
                                    <div>
                                        <label for="ver_pantallas_usuarios">Seguimiento de usuarios</label>
                                        <small>Permite consultar las páginas abiertas por las sesiones conectadas. Requiere acceso al menú Seguimiento de usuarios.</small>
                                    </div>
                                </div>
                                <div class="perfil-permiso"><Checkbox inputId="revisar_diferencias_caja" v-model="frmPerfil.revisar_diferencias_caja" binary /><div><label for="revisar_diferencias_caja">Revisar diferencias de caja</label><small>Permite tomar faltantes o sobrantes en revision y autorizar su resolucion. Requiere acceso a Cortes de caja.</small></div></div>
                                <div class="perfil-permiso">
                                    <Checkbox inputId="anular_movimientos_caja" v-model="frmPerfil.anular_movimientos_caja" binary />
                                    <div>
                                        <label for="anular_movimientos_caja">Anular movimientos de caja</label>
                                        <small>Autoriza correcciones mediante un movimiento inverso con motivo obligatorio. Requiere acceso a Movimientos de caja y una jornada abierta.</small>
                                    </div>
                                </div>
                                <div class="perfil-permiso">
                                    <Checkbox inputId="revertir_cargas" v-model="frmPerfil.revertir_cargas_bancarias" binary />
                                    <div>
                                        <label for="revertir_cargas">Revertir cargas conciliadas</label>
                                        <small>Autoriza la reversión de cargas bancarias. Requiere acceso al Historial de cargas.</small>
                                    </div>
                                </div>
                                <div class="perfil-permiso">
                                    <Checkbox inputId="cerrar_sesiones" v-model="frmPerfil.cerrar_sesiones_usuarios" binary />
                                    <div>
                                        <label for="cerrar_sesiones">Cerrar sesiones de usuarios</label>
                                        <small>Revoca las sesiones actuales de un usuario. Requiere acceso a Usuarios.</small>
                                    </div>
                                </div>
                            </Fieldset>
                        </div>
                        <Fieldset legend="Acceso a menús" class="perfil-seccion perfil-menus">
                            <p class="perfil-ayuda">Selecciona las opciones que podrán consultar los usuarios de este perfil.</p>
                            <div class="perfil-arbol">
                                <Tree v-model:selectionKeys="menusSeleccionados" :value="arbolMenus" selectionMode="checkbox" filter filterPlaceholder="Buscar menú..." class="w-full" />
                            </div>
                        </Fieldset>
                    </form>
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
    components: { Encabezado },
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
