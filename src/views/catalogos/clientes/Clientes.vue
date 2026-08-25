<template>
    <Encabezado titulo="Clientes" subtitulo="Administración de clientes del sistema" icono="pi pi-users">
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

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formCliente" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
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
                :value="tablaClientes"
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
                            <img :src="logosClientes[slotProps.data._id] || clienteDefault" alt="Cliente" class="logo-tabla" />
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
                        <Button type="button" class="btn-nuevo" title="Editar cliente" @click="handleMostrarFormulario('E', slotProps.data)">
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
            <TabList>
                <Tab value="0"> Datos </Tab>

                <Tab value="1"> Conceptos Facturación </Tab>

                <Tab value="2"> Código de Identificación Fiscal </Tab>

                <Tab value="3" v-if="movimiento === 'E'"> Acceso Cliente </Tab>

                <Tab value="4" v-if="movimiento === 'E'"> Historial </Tab>
            </TabList>

            <TabPanels>
                <!-- ================================================= -->
                <!-- DATOS -->
                <!-- ================================================= -->

                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formCliente" @submit.prevent="handleGuardar">
                            <div class="form-datos-cliente">
                                <!-- LOGO -->
                                <div class="contenedor-logo">
                                    <div class="logo-editor" @click="handleAbrirLogo">
                                        <img :src="logoPreview || logosClientes[frmCliente._id] || clienteDefault" alt="Logo cliente" />
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
                                                v-model="frmCliente.tipo_persona"
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

                                            <InputText v-model="frmCliente.rfc" :disabled="movimiento === 'E'" style="text-transform: uppercase" @update:modelValue="frmCliente.rfc = ($event || '').toUpperCase()" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                {{ etiquetaRazonSocial }}:
                                            </label>

                                            <InputText v-model="frmCliente.razon_social_nombre_completo" style="text-transform: uppercase" @update:modelValue="frmCliente.razon_social_nombre_completo = ($event || '').toUpperCase()" />
                                        </div>
                                    </div>

                                    <!-- FILA 2 -->
                                    <div class="grid-datos grid-direccion">
                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Calle:
                                            </label>

                                            <InputText v-model="frmCliente.calle" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Número Ext:
                                            </label>

                                            <InputText v-model="frmCliente.numero_ext" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label> Número Int: </label>

                                            <InputText v-model="frmCliente.numero_int" style="text-transform: uppercase" />
                                        </div>
                                    </div>

                                    <!-- FILA 3 -->
                                    <div class="grid-datos grid-4">
                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Colonia:
                                            </label>

                                            <InputText v-model="frmCliente.colonia" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Población:
                                            </label>

                                            <InputText v-model="frmCliente.poblacion" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Municipio:
                                            </label>

                                            <InputText v-model="frmCliente.municipio" style="text-transform: uppercase" />
                                        </div>

                                        <div class="campo-formulario">
                                            <label>
                                                <span class="requerido">*</span>
                                                Código Postal:
                                            </label>

                                            <InputMask v-model="frmCliente.codigo_postal" mask="99999" placeholder="#####" />
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

                                    <Select v-model="frmCliente.pais" :options="catalogoSat?.pais || []" optionValue="pais" optionLabel="descripcion" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Estado:
                                    </label>

                                    <Select v-model="frmCliente.estado" :options="estadosFiltrados" optionValue="estado" optionLabel="texto" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Correo Electrónico:
                                    </label>

                                    <InputText v-model="frmCliente.correo_electronico" type="email" style="text-transform: lowercase" />
                                </div>

                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Contacto Principal:
                                    </label>

                                    <InputMask v-model="frmCliente.numero_contacto_principal" mask="(999)-999-9999" placeholder="(###)-###-####" />
                                </div>

                                <div class="campo-formulario">
                                    <label> Contacto Alterno: </label>

                                    <InputMask v-model="frmCliente.numero_contacto_alterno" mask="(999)-999-9999" placeholder="(###)-###-####" />
                                </div>
                            </div>

                            <!-- ================================================= -->
                            <!-- DATOS FISCALES -->
                            <!-- ================================================= -->

                            <div class="grid-datos grid-4 seccion-formulario">
                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Régimen Fiscal:
                                    </label>

                                    <Select v-model="frmCliente.regimen_fiscal" :options="regimenFiscalFiltrado" optionValue="regimen_fiscal" optionLabel="texto" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label> Promotor: </label>

                                    <Select v-model="frmCliente.promotor" :options="promotores" optionValue="_id" optionLabel="nombre_completo" placeholder="Seleccione" filter showClear class="w-full" />
                                </div>

                                <div class="campo-formulario">
                                    <label>
                                        <span class="requerido">*</span>
                                        Empresa Facturadora:
                                    </label>

                                    <Select v-model="frmCliente.empresa_facturadora" :options="companias" optionValue="_id" optionLabel="razon_social_nombre_completo" placeholder="Seleccione" filter class="w-full" />
                                </div>

                                <div class="flex align-items-center mt-4">
                                    <Checkbox inputId="activo" v-model="frmCliente.activo" binary />

                                    <label for="activo" class="ml-2"> Activo </label>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <!-- ================================================= -->
                <!-- CONCEPTOS -->
                <!-- ================================================= -->

                <TabPanel value="1">
                    <ScrollPanel style="height: 58vh">
                        <div class="conceptos-agregar">
                            <div class="campo-formulario">
                                <label>
                                    <span class="requerido">*</span>
                                    Empresa:
                                </label>

                                <Select v-model="empresaProdServ" :options="companias" optionValue="_id" optionLabel="razon_social_nombre_completo" placeholder="Seleccione empresa" filter class="w-full" @change="handleCambioEmpresaProdServ" />
                            </div>

                            <div class="campo-formulario">
                                <label>
                                    <span class="requerido">*</span>
                                    Producto / Servicio:
                                </label>

                                <div class="flex gap-2">
                                    <Select v-model="prodServ" :options="catProdServ" optionValue="_id" optionLabel="descripcion" placeholder="Seleccione concepto" filter class="w-full" />

                                    <Button type="button" label="Agregar" class="btn-nuevo" :disabled="!empresaProdServ || !prodServ" @click="handleAgregarProdServ">
                                        <template #icon>
                                            <font-icon icon="fa-solid fa-plus" class="mr-2" />
                                        </template>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DataTable :value="prodServSeleccionados" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50, 70]" scrollable scrollHeight="42vh" size="small" tableStyle="min-width: 70rem" class="tabla-encabezados">
                            <template #empty> No se encontraron conceptos. </template>

                            <Column field="empresa_nombre" header="Empresa" headerClass="encabezado-columna" />

                            <Column field="prod_serv" header="ProdServ" headerClass="encabezado-columna" />

                            <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />

                            <Column field="clave_unidad" header="Clave Unidad" headerClass="encabezado-columna" />

                            <Column field="unidad" header="Unidad" headerClass="encabezado-columna" />

                            <Column field="objeto_imp" header="Objeto Imp." headerClass="encabezado-columna" />

                            <Column header="Objeto Imp. Descripción" headerClass="encabezado-columna">
                                <template #body="slotProps">
                                    {{ handleObjetoImpDesc(slotProps.data) }}
                                </template>
                            </Column>

                            <Column header="Activo" headerClass="encabezado-columna">
                                <template #body="slotProps">
                                    <font-icon v-if="slotProps.data.activo" icon="fa-solid fa-circle-check" style="color: green" />

                                    <font-icon v-else icon="fa-solid fa-circle-minus" style="color: red" />
                                </template>
                            </Column>

                            <Column header="Opciones" headerClass="encabezado-columna">
                                <template #body="slotProps">
                                    <Button type="button" severity="danger" @click="handleEliminarProdServ(slotProps.data)">
                                        <font-icon icon="fa-solid fa-trash" />
                                    </Button>
                                </template>
                            </Column>
                        </DataTable>
                    </ScrollPanel>
                </TabPanel>

                <!-- ================================================= -->
                <!-- CIF -->
                <!-- ================================================= -->

                <TabPanel value="2">
                    <ScrollPanel style="height: 58vh">
                        <div class="flex justify-content-end mb-3">
                            <Button type="button" label="Actualizar" class="btn-nuevo" @click="handleMostrarCIF">
                                <template #icon>
                                    <font-icon icon="fa-solid fa-file-pdf" class="mr-2" />
                                </template>
                            </Button>
                        </div>

                        <div v-if="cifPreview" class="contenedor-cif">
                            <iframe :src="cifPreview" title="Archivo CIF" />
                        </div>

                        <div v-else class="sin-cif">
                            <font-icon icon="fa-solid fa-file-pdf" />

                            <span> No existe un archivo CIF cargado. </span>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <!-- ================================================= -->
                <!-- ACCESO CLIENTE -->
                <!-- ================================================= -->

                <TabPanel value="3" v-if="movimiento === 'E'">
                    <ScrollPanel style="height: 58vh">
                        <div class="acceso-cliente-container">
                            <!-- USUARIO -->
                            <div class="acceso-fila">
                                <label for="usuario_acceso"> Usuario: </label>

                                <InputText id="usuario_acceso" v-model="frmAccesoCliente.usuario" class="w-full" autocomplete="off" />
                            </div>

                            <!-- CONTRASEÑA -->
                            <div class="acceso-fila">
                                <label for="password_acceso"> Contraseña: </label>

                                <div class="w-full">
                                    <Password id="password_acceso" v-model="frmAccesoCliente.password" :feedback="false" toggleMask class="w-full" inputClass="w-full" autocomplete="new-password" />

                                    <small v-if="accesoClienteExiste" class="texto-ayuda"> Déjala vacía si no quieres cambiarla. </small>
                                </div>
                            </div>

                            <!-- ACTIVO -->
                            <div class="acceso-fila acceso-fila-check">
                                <label> Acceso: </label>

                                <div class="acceso-check">
                                    <Checkbox inputId="activoAcceso" v-model="frmAccesoCliente.activo" binary />

                                    <label for="activoAcceso"> Acceso activo para este cliente </label>
                                </div>
                            </div>

                            <!-- RUTA DE ACCESO -->
                            <div v-if="accesoClienteExiste" class="acceso-fila">
                                <label> Ruta de acceso: </label>

                                <div class="ruta-acceso-container">
                                    <InputText :modelValue="urlAccesoCliente" readonly class="w-full" />

                                    <Button type="button" severity="secondary" outlined v-tooltip.top="'Copiar ruta'" @click="handleCopiarRutaAcceso">
                                        <template #icon>
                                            <font-icon icon="fa-solid fa-copy" />
                                        </template>
                                    </Button>
                                </div>
                            </div>

                            <!-- BOTÓN -->
                            <div class="acciones-acceso">
                                <Button type="button" label="Guardar acceso" class="btn-guardar" :disabled="botonGuardarAccesoDeshabilitado" @click="handleGuardarAccesoCliente">
                                    <template #icon>
                                        <font-icon icon="fa-solid fa-key" class="mr-2" />
                                    </template>
                                </Button>
                            </div>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <!-- ================================================= -->
                <!-- HISTORIAL -->
                <!-- ================================================= -->

                <TabPanel value="4" v-if="movimiento === 'E'">
                    <p class="m-0">Aquí se mostrará el historial del cliente.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>

    <!-- ========================================================= -->
    <!-- DIALOG CIF -->
    <!-- ========================================================= -->

    <Dialog v-model:visible="visibleCIF" modal header="Código de Identificación Fiscal (C.I.F.)" :style="{ width: '520px' }" :closable="false">
        <form @submit.prevent="handleGuardarCIF">
            <div class="campo-formulario">
                <label>
                    <span class="requerido">*</span>
                    Archivo CIF:
                </label>

                <FileUpload mode="basic" name="archivo_cif" accept=".pdf" chooseLabel="Seleccionar archivo (.pdf)" customUpload :auto="false" class="w-full" @select="handleSeleccionarCIF" />

                <small v-if="cifArchivo" class="archivo-seleccionado">
                    {{ cifArchivo.name }}
                </small>
            </div>

            <div class="acciones-dialog">
                <Button type="button" label="Cancelar" class="btn-cancelar" @click="handleCancelarCIF">
                    <template #icon>
                        <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button type="submit" label="Guardar" class="btn-guardar" :disabled="!cifArchivo">
                    <template #icon>
                        <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                    </template>
                </Button>
            </div>
        </form>
    </Dialog>
</template>

<script>
import clienteDefault from '../../../assets/images/Empresa.jpg';
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Clientes',

    components: {
        Encabezado
    },

    setup() {
        return {
            ...proceso(),

            clienteDefault
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
