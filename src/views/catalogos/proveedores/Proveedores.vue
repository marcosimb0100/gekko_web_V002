<template>
    <Encabezado titulo="Proveedores" subtitulo="Administración de proveedores del sistema" icono="fa-solid fa-truck">
        <template #icono><font-icon icon="fa-solid fa-truck" style="font-size: 1.2rem" /></template>
        <Button type="button" label="Exportar Excel" class="btn-excel" @click="handleExportarExcel" v-if="!mostrarTablaFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Nuevo" class="btn-nuevo" @click="handleMostrarFormulario('N')" v-if="!mostrarTablaFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button>

        <Button type="button" label="Cancelar" class="w-full btn-cancelar" @click="handleMostrarFormulario('C')" :disabled="guardando" v-if="mostrarTablaFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-xmark" class="mr-2" />
            </template>
        </Button>

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formProveedor" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado || guardando" :loading="guardando">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- ===================================================== -->
        <!-- TABLA -->
        <!-- ===================================================== -->

        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablaProveedores"
                :globalFilterFields="['razon_social_nombre_completo', 'rfc', 'correo_electronico', 'numero_contacto_principal', 'codigo_postal']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 125, 150, 200]"
                scrollable
                scrollHeight="54vh"
                size="small"
                tableStyle="min-width: 80rem"
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

                <!-- LOGO -->
                <Column header="Logo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <div class="flex align-items-center justify-content-center">
                            <img :ref="(elemento) => handleObservarLogo(elemento, slotProps.data)" decoding="async" :src="logosProveedores[slotProps.data._id] || proveedorDefault" alt="Proveedor" class="logo-tabla" />
                        </div>
                    </template>
                </Column>

                <Column field="razon_social_nombre_completo" header="Razón Social / Nombre" headerClass="encabezado-columna" />

                <Column field="rfc" header="R.F.C." headerClass="encabezado-columna" />

                <Column field="correo_electronico" header="Correo Electrónico" headerClass="encabezado-columna" />

                <Column field="numero_contacto_principal" header="Contacto Principal" headerClass="encabezado-columna" />

                <Column field="codigo_postal" header="Código Postal" headerClass="encabezado-columna" />

                <!-- ACTIVO -->
                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red">
                            <font-icon :icon="['fas', 'circle-minus']" />
                        </span>

                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green">
                            <font-icon :icon="['fas', 'circle-check']" />
                        </span>
                    </template>
                </Column>

                <!-- OPCIONES -->
                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <Button type="button" class="btn-nuevo" title="Editar proveedor" @click="handleMostrarFormulario('E', slotProps.data)">
                            <font-icon :icon="['fas', 'pen-to-square']" />
                        </Button>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <!-- ===================================================== -->
        <!-- FORMULARIO -->
        <!-- ===================================================== -->

        <Tabs value="0" v-if="mostrarTablaFormulario">
            <TabList><Tab value="0">Datos</Tab><Tab value="1" v-if="movimiento === 'E'">Historial</Tab></TabList>
            <TabPanels>
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formProveedor" @submit.prevent="handleGuardar">
                            <div class="form-datos-proveedor">
                                <!-- LOGO -->
                                <div class="contenedor-logo">
                                    <div class="logo-editor" @click="handleAbrirLogo">
                                        <img :src="logoPreview || logosOriginales[frmProveedor._id] || logosProveedores[frmProveedor._id] || proveedorDefault" alt="Logo proveedor" />
                                    </div>

                                    <input ref="logoInput" type="file" accept=".jpg,.jpeg,.png" style="display: none" @change="handleSeleccionarLogo" />

                                    <small> Clic en la imagen para cambiar </small>
                                </div>

                                <!-- DATOS -->
                                <div>
                                    <!-- FILA 1 -->
                                    <div class="grid-datos grid-3">
                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Tipo Persona:
                                            </label>

                                            <Select
                                                v-model="frmProveedor.tipo_persona"
                                                :options="catalogoSat?.tipo_persona || []"
                                                optionValue="tipo_persona"
                                                optionLabel="descripcion"
                                                placeholder="Seleccione"
                                                :disabled="movimiento === 'E'"
                                                class="w-full"
                                            />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                R.F.C.:
                                            </label>

                                            <InputText v-model="frmProveedor.rfc" :disabled="movimiento === 'E'" style="text-transform: uppercase" @update:modelValue="frmProveedor.rfc = ($event || '').toUpperCase()" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                {{ etiquetaRazonSocial }}:
                                            </label>

                                            <InputText v-model="frmProveedor.razon_social_nombre_completo" style="text-transform: uppercase" @update:modelValue="frmProveedor.razon_social_nombre_completo = ($event || '').toUpperCase()" />
                                        </div>
                                    </div>

                                    <!-- FILA 2 -->
                                    <div class="grid-datos grid-direccion">
                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Calle:
                                            </label>

                                            <InputText v-model="frmProveedor.calle" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Número Ext:
                                            </label>

                                            <InputText v-model="frmProveedor.numero_ext" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label> Número Int: </label>

                                            <InputText v-model="frmProveedor.numero_int" style="text-transform: uppercase" />
                                        </div>
                                    </div>

                                    <!-- FILA 3 -->
                                    <div class="grid-datos grid-4">
                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Colonia:
                                            </label>

                                            <InputText v-model="frmProveedor.colonia" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Población:
                                            </label>

                                            <InputText v-model="frmProveedor.poblacion" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Municipio:
                                            </label>

                                            <InputText v-model="frmProveedor.municipio" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Código Postal:
                                            </label>

                                            <InputMask v-model="frmProveedor.codigo_postal" mask="99999" placeholder="#####" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ================================================= -->
                            <!-- DATOS CONTACTO -->
                            <!-- ================================================= -->

                            <div class="grid-datos grid-5 seccion-formulario">
                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        País:
                                    </label>

                                    <Select v-model="frmProveedor.pais" :options="catalogoSat?.pais || []" optionValue="pais" optionLabel="descripcion" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Estado:
                                    </label>

                                    <Select v-model="frmProveedor.estado" :options="estadosFiltrados" optionValue="estado" optionLabel="texto" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label> Correo Electrónico: </label>

                                    <InputText v-model="frmProveedor.correo_electronico" type="email" style="text-transform: lowercase" />
                                </div>

                                <div class="campo-formulario">
                                    <label> Contacto Principal: </label>

                                    <InputMask v-model="frmProveedor.numero_contacto_principal" mask="(999)-999-9999" placeholder="(###)-###-####" />
                                </div>

                                <div class="campo-formulario">
                                    <label> Contacto Alterno: </label>

                                    <InputMask v-model="frmProveedor.numero_contacto_alterno" mask="(999)-999-9999" placeholder="(###)-###-####" />
                                </div>
                            </div>

                            <!-- ================================================= -->
                            <div class="seccion-formulario"><Checkbox inputId="activoProveedor" v-model="frmProveedor.activo" binary /><label for="activoProveedor" class="ml-2">Activo</label></div>
                        </form>
                    </ScrollPanel>
                </TabPanel>
                <TabPanel value="1">
                    <DataTable :value="frmProveedor.historial" paginator :rows="10" size="small" scrollable scrollHeight="50vh" class="tabla-encabezados">
                        <template #empty>No hay movimientos registrados.</template>
                        <Column header="Fecha"><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column>
                        <Column field="usuario" header="Usuario" /><Column field="accion" header="Movimiento" />
                        <Column header="Campos actualizados"><template #body="{ data }">{{ data.campos?.join(', ') }}</template></Column>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
<script>
import proveedorDefault from '../../../assets/images/Empresa.jpg';
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
export default { name: 'Proveedores', components: { Encabezado }, setup() { return { ...proceso(), proveedorDefault }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
