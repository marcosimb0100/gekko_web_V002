<template>
    <Encabezado titulo="Empresas" subtitulo="Administración de empresas del sistema" icono="pi pi-building">
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

        <Button type="submit" label="Guardar" class="w-full btn-guardar" form="formEmpresa" v-if="mostrarTablaFormulario" :disabled="botonGuardarDeshabilitado">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 65vh" v-if="!mostrarTablaFormulario">
            <DataTable
                v-model:filters="filtros"
                :value="tablaEmpresas"
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

                <template #empty>No se encontraron registros.</template>

                <Column header="Logo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <div class="flex align-items-center justify-content-center">
                            <img :src="logosEmpresas[slotProps.data._id] || empresaDefault" alt="Empresa" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover" />
                        </div>
                    </template>
                </Column>

                <Column field="razon_social_nombre_completo" header="Razón Social" headerClass="encabezado-columna" />
                <Column field="rfc" header="R.F.C." headerClass="encabezado-columna" />
                <Column field="correo_electronico" header="Correo Electrónico" headerClass="encabezado-columna" />
                <Column field="numero_contacto_principal" header="Contacto Principal" headerClass="encabezado-columna" />
                <Column field="codigo_postal" header="Código Postal" headerClass="encabezado-columna" />

                <Column header="Activo" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.activo === false" style="font-size: 15px; color: red">
                            <font-icon :icon="['fas', 'building-circle-xmark']" />
                        </span>
                        <span v-if="slotProps.data.activo === true" style="font-size: 15px; color: green">
                            <font-icon :icon="['fas', 'building-circle-check']" />
                        </span>
                    </template>
                </Column>

                <Column header="Opciones" headerClass="encabezado-columna">
                    <template #body="slotProps">
                        <div class="flex align-items-center gap-2">
                            <!-- EDITAR -->
                            <Button type="button" class="btn-nuevo" title="Editar empresa" @click="handleMostrarFormulario('E', slotProps.data)">
                                <font-icon :icon="['fas', 'pen-to-square']" />
                            </Button>

                            <!-- CUENTAS BANCARIAS -->
                            <Button type="button" severity="success" title="Cuentas bancarias" @click="handleVerBancos(slotProps.data)">
                                <font-icon :icon="['fas', 'building-columns']" />
                            </Button>

                            <!-- CONCEPTOS -->
                            <Button type="button" severity="help" title="Conceptos de facturación" @click="handleVerConceptos(slotProps.data)">
                                <font-icon :icon="['fas', 'list']" />
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>

        <Tabs value="0" v-if="mostrarTablaFormulario">
            <TabList>
                <Tab value="0">Datos</Tab>
                <Tab value="1">Cuentas Bancarias</Tab>
                <Tab value="2">Conceptos Facturación</Tab>
                <Tab value="3">CSD / Sellos Digitales</Tab>
                <Tab value="4">FIEL / e.firma</Tab>
                <Tab value="5">Plantillas</Tab>
                <Tab value="6">Folios / Series</Tab>
                <Tab value="7">Configuración</Tab>
                <Tab value="8">
                    Correos Solicitudes
                </Tab>
                <Tab value="9" v-if="movimiento === 'E'">Historial</Tab>
            </TabList>

            <TabPanels>
                <TabPanel value="0">
                    <ScrollPanel style="height: 60vh">
                        <form id="formEmpresa" @submit.prevent="handleGuardar">
                            <div style="display: grid; grid-template-columns: 230px 1fr; gap: 30px; padding: 20px">
                                <div style="padding: 10px">
                                    <div class="flex flex-column gap-2">
                                        <div style="width: 200px; height: 200px; border: 1px solid gray; border-radius: 5px; margin: 0 auto; overflow: hidden; cursor: pointer" @click="handleAbrirLogo">
                                            <img :src="logoPreview || logosEmpresas[frmEmpresa._id] || empresaDefault" alt="Logo empresa" style="width: 100%; height: 100%; object-fit: cover" />
                                        </div>
                                        <input ref="logoInput" type="file" accept=".jpg,.jpeg,.png" style="display: none" @change="handleSeleccionarLogo" />
                                    </div>
                                </div>

                                <div>
                                    <div style="display: grid; grid-template-columns: 0.5fr 0.5fr 1fr; gap: 15px; margin-bottom: 20px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Tipo Persona:</label>
                                            <Select
                                                v-model="frmEmpresa.tipo_persona"
                                                :options="catalogoSat?.tipo_persona || []"
                                                optionValue="tipo_persona"
                                                optionLabel="descripcion"
                                                placeholder="Seleccione"
                                                :disabled="movimiento === 'E'"
                                                class="w-full"
                                            />
                                        </div>

                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="rfc"><span style="color: red">*</span>R.F.C.:</label>
                                            <InputText id="rfc" v-model="frmEmpresa.rfc" :disabled="movimiento === 'E'" style="width: 100%; text-transform: uppercase" @update:modelValue="frmEmpresa.rfc = ($event || '').toUpperCase()" />
                                        </div>

                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>{{ etiquetaRazonSocial }}:</label>
                                            <InputText v-model="frmEmpresa.razon_social_nombre_completo" style="width: 100%; text-transform: uppercase" @update:modelValue="frmEmpresa.razon_social_nombre_completo = ($event || '').toUpperCase()" />
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px; margin-bottom: 20px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Calle:</label>
                                            <InputText v-model="frmEmpresa.calle" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Número Ext:</label>
                                            <InputText v-model="frmEmpresa.numero_ext" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label>Número Int:</label>
                                            <InputText v-model="frmEmpresa.numero_int" />
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Colonia:</label>
                                            <InputText v-model="frmEmpresa.colonia" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Población:</label>
                                            <InputText v-model="frmEmpresa.poblacion" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Municipio:</label>
                                            <InputText v-model="frmEmpresa.municipio" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label><span style="color: red">*</span>Código Postal:</label>
                                            <InputMask v-model="frmEmpresa.codigo_postal" mask="99999" placeholder="#####" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; padding: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label><span style="color: red">*</span>País:</label>
                                    <Select v-model="frmEmpresa.pais" :options="catalogoSat?.pais || []" optionValue="pais" optionLabel="descripcion" filter class="w-full" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label><span style="color: red">*</span>Estado:</label>
                                    <Select v-model="frmEmpresa.estado" :options="estadosFiltrados" optionValue="estado" optionLabel="texto" filter class="w-full" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label><span style="color: red">*</span>Correo Electrónico:</label>
                                    <InputText v-model="frmEmpresa.correo_electronico" type="email" style="text-transform: lowercase" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label><span style="color: red">*</span>Contacto Principal:</label>
                                    <InputMask v-model="frmEmpresa.numero_contacto_principal" mask="(999)-999-9999" placeholder="(###)-###-####" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label>Contacto Alterno:</label>
                                    <InputMask v-model="frmEmpresa.numero_contacto_alterno" mask="(999)-999-9999" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 15px; padding: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label><span style="color: red">*</span>Régimen Fiscal:</label>
                                    <Select v-model="frmEmpresa.regimen_fiscal" :options="regimenFiscalFiltrado" optionValue="regimen_fiscal" optionLabel="texto" filter class="w-full" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label>Correo Agente:</label>
                                    <InputText v-model="frmEmpresa.correo_electronico_agente" type="email" />
                                </div>
                                <div class="flex align-items-center mt-4">
                                    <Checkbox inputId="activo" v-model="frmEmpresa.activo" binary />
                                    <label for="activo" class="ml-2">Activo</label>
                                </div>
                            </div>
                        </form>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="1">
                    <div class="flex justify-content-end mb-3">
                        <Button label="Nuevo Banco" class="btn-nuevo" type="button" @click="handleNuevoBanco">
                            <template #icon><font-icon icon="fa-solid fa-plus" class="mr-2" /></template>
                        </Button>
                    </div>

                    <DataTable :value="frmEmpresa.bancos" size="small" paginator :rows="10" scrollable scrollHeight="40vh" class="tabla-encabezados">
                        <Column field="banco" header="Banco" headerClass="encabezado-columna" />
                        <Column field="clabe_banco" header="CLABE Bancaria" headerClass="encabezado-columna" />
                        <Column field="cuenta_banco" header="Cuenta Bancaria" headerClass="encabezado-columna" />
                        <Column header="Activo" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <font-icon v-if="slotProps.data.activo" icon="fa-solid fa-circle-check" style="color: green" />
                                <font-icon v-else icon="fa-solid fa-circle-minus" style="color: red" />
                            </template>
                        </Column>
                        <Column header="Opciones" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <Button class="btn-nuevo" type="button" @click="handleEditarBanco(slotProps.data, slotProps.index)">
                                    <font-icon :icon="['fas', 'pen-to-square']" />
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>

                <TabPanel value="2">
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 10px">
                        <Button type="button" label="Nuevo" class="btn-nuevo" @click="handleNuevoConcepto">
                            <template #icon>
                                <font-icon icon="fa-solid fa-plus" class="mr-2" />
                            </template>
                        </Button>
                    </div>

                    <DataTable :value="frmEmpresa.prod_serv" paginator :rows="100" :rowsPerPageOptions="[100, 200, 300, 400]" scrollable scrollHeight="42vh" size="small" tableStyle="min-width: 70rem" class="tabla-encabezados">
                        <template #empty> No se encontraron conceptos. </template>
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
                        <Column field="num_uso" header="Número Facturado" headerClass="encabezado-columna" />
                        <Column header="Activo" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <span v-if="slotProps.data.activo" style="font-size: 15px; color: green">
                                    <font-icon :icon="['fas', 'circle-check']" />
                                </span>

                                <span v-else style="font-size: 15px; color: red">
                                    <font-icon :icon="['fas', 'circle-minus']" />
                                </span>
                            </template>
                        </Column>
                        <Column header="Opciones" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <Button type="button" class="btn-nuevo" @click="handleEditarConcepto(slotProps.data, slotProps.index)">
                                    <font-icon :icon="['fas', 'pen-to-square']" />
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>

                <TabPanel value="3">
                    <ScrollPanel style="height: 58vh">
                        <div class="flex justify-content-end mb-3">
                            <Button type="button" label="Actualizar" class="btn-nuevo" @click="handleMostrarCSD">
                                <template #icon><font-icon icon="fa-solid fa-file-pen" class="mr-2" /></template>
                            </Button>
                        </div>

                        <div style="padding: 20px">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_nombre">Nombre:</label>
                                    <InputText id="csd_nombre" v-model="frmEmpresa.csd.nombre" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_rfc">R.F.C.:</label>
                                    <InputText id="csd_rfc" v-model="frmEmpresa.csd.rfc" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_fecha_vencimiento">Fecha Vencimiento:</label>
                                    <InputText id="csd_fecha_vencimiento" v-model="frmEmpresa.csd.fecha_vencimiento" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_serie">Serie:</label>
                                    <InputText id="csd_serie" v-model="frmEmpresa.csd.serie" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_no_certificado">No. Certificado:</label>
                                    <InputText id="csd_no_certificado" v-model="frmEmpresa.csd.no_certificado" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_tipo_certificado">Tipo Certificado:</label>
                                    <InputText id="csd_tipo_certificado" v-model="frmEmpresa.csd.tipo_certificado" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="csd_certificado">Certificado:</label>
                                    <Textarea id="csd_certificado" v-model="frmEmpresa.csd.certificado" rows="10" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed; font-size: 10px" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 20px">
                                <div class="flex align-items-center">
                                    <Checkbox inputId="csd_activo" v-model="frmEmpresa.csd.activo" binary disabled />
                                    <label for="csd_activo" class="ml-2">Activo</label>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="ruta_contpaq">Ruta Contpaq:</label>
                                    <InputText id="ruta_contpaq" v-model="frmEmpresa.ruta_contpaq" :disabled="!frmEmpresa.csd.activo" style="width: 100%" />
                                </div>
                            </div>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="4">
                    <ScrollPanel style="height: 58vh">
                        <div class="flex justify-content-end mb-3">
                            <Button type="button" label="Actualizar" class="btn-nuevo" @click="handleMostrarFIEL">
                                <template #icon><font-icon icon="fa-solid fa-file-pen" class="mr-2" /></template>
                            </Button>
                        </div>

                        <div style="padding: 20px">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_nombre">Nombre:</label>
                                    <InputText id="fiel_nombre" v-model="frmEmpresa.fiel.nombre" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_rfc">R.F.C.:</label>
                                    <InputText id="fiel_rfc" v-model="frmEmpresa.fiel.rfc" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_fecha_vencimiento">Fecha Vencimiento:</label>
                                    <InputText id="fiel_fecha_vencimiento" v-model="frmEmpresa.fiel.fecha_vencimiento" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_serie">Serie:</label>
                                    <InputText id="fiel_serie" v-model="frmEmpresa.fiel.serie" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_no_certificado">No. Certificado:</label>
                                    <InputText id="fiel_no_certificado" v-model="frmEmpresa.fiel.no_certificado" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_tipo_certificado">Tipo Certificado:</label>
                                    <InputText id="fiel_tipo_certificado" v-model="frmEmpresa.fiel.tipo_certificado" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px">
                                <div style="display: flex; flex-direction: column; gap: 8px">
                                    <label for="fiel_certificado">Certificado:</label>
                                    <Textarea id="fiel_certificado" v-model="frmEmpresa.fiel.certificado" rows="10" disabled style="width: 100%; background-color: #f5f5f5; cursor: not-allowed; font-size: 10px" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 4fr; gap: 20px">
                                <div class="flex align-items-center">
                                    <Checkbox inputId="fiel_descarga_cfdi_sat" v-model="frmEmpresa.fiel.descarga_cfdi_sat" binary />
                                    <label for="fiel_descarga_cfdi_sat" class="ml-2">Descarga CFDI SAT</label>
                                </div>
                                <div class="flex align-items-center">
                                    <Checkbox inputId="fiel_activo" v-model="frmEmpresa.fiel.activo" binary disabled />
                                    <label for="fiel_activo" class="ml-2">Activo</label>
                                </div>
                            </div>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="5">
                    <ScrollPanel style="height: 58vh">
                        <div class="flex justify-content-between align-items-center" style="margin-bottom: 15px">
                            <Button type="button" label="Actualizar" class="btn-nuevo" @click="handleMostrarPlantillas">
                                <template #icon><font-icon icon="fa-solid fa-file-pen" class="mr-2" /></template>
                            </Button>
                        </div>

                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; height: 45vh">
                            <DataTable :value="frmEmpresa.plantillas" size="small" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50, 70]" scrollable scrollHeight="380px" tableStyle="min-width: 50rem" class="tabla-encabezados">
                                <template #empty>No se encontraron plantillas.</template>
                                <Column field="tipo_plantilla" header="Plantilla" headerClass="encabezado-columna" />
                                <Column header="Fecha Creación" headerClass="encabezado-columna">
                                    <template #body="slotProps">{{ handleFecha(slotProps.data.fecha_creacion) }}</template>
                                </Column>
                                <Column header="Fecha Actualización" headerClass="encabezado-columna">
                                    <template #body="slotProps">{{ handleFecha(slotProps.data.fecha_actualizacion) }}</template>
                                </Column>
                                <Column header="Archivo" headerClass="encabezado-columna">
                                    <template #body="slotProps"
                                        ><span>{{ slotProps.data.archivo_html || 'Sin archivo' }}</span></template
                                    >
                                </Column>
                            </DataTable>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="6">
                    <ScrollPanel style="height: 58vh">
                        <div style="padding: 20px">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px">
                                <Fieldset legend="Factura">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 5px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="factura_serie">Serie:</label>
                                            <InputText id="factura_serie" v-model="frmEmpresa.factura_serie" style="width: 100%; text-transform: uppercase" @update:modelValue="frmEmpresa.factura_serie = ($event || '').toUpperCase()" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="factura_folio">Folio:</label>
                                            <InputNumber inputId="factura_folio" v-model="frmEmpresa.factura_folio" :useGrouping="false" :min="0" showButtons style="width: 100%" />
                                        </div>
                                    </div>
                                </Fieldset>

                                <Fieldset legend="Notas de Crédito">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 5px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="nota_credito_serie">Serie:</label>
                                            <InputText id="nota_credito_serie" v-model="frmEmpresa.nota_credito_serie" style="width: 100%; text-transform: uppercase" @update:modelValue="frmEmpresa.nota_credito_serie = ($event || '').toUpperCase()" />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="nota_credito_folio">Folio:</label>
                                            <InputNumber inputId="nota_credito_folio" v-model="frmEmpresa.nota_credito_folio" :useGrouping="false" :min="0" showButtons style="width: 100%" />
                                        </div>
                                    </div>
                                </Fieldset>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                                <Fieldset legend="Complemento de Pago">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 5px">
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="complemento_pago_serie">Serie:</label>
                                            <InputText
                                                id="complemento_pago_serie"
                                                v-model="frmEmpresa.complemento_pago_serie"
                                                style="width: 100%; text-transform: uppercase"
                                                @update:modelValue="frmEmpresa.complemento_pago_serie = ($event || '').toUpperCase()"
                                            />
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 8px">
                                            <label for="complemento_pago_folio">Folio:</label>
                                            <InputNumber inputId="complemento_pago_folio" v-model="frmEmpresa.complemento_pago_folio" :useGrouping="false" :min="0" showButtons style="width: 100%" />
                                        </div>
                                    </div>
                                </Fieldset>
                            </div>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="7">
                    <ScrollPanel style="height: 58vh">
                        <div style="padding: 20px">
                            <Fieldset legend="Conceptos de Facturación">
                                <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 20px; align-items: center">
                                    <div>
                                        <Button type="button" label="Actualizar Conceptos" severity="warn" @click="handleActualizarConceptos">
                                            <template #icon><font-icon icon="fa-solid fa-arrows-rotate" class="mr-2" /></template>
                                        </Button>
                                    </div>
                                    <div>
                                        <span>Sincroniza los conceptos de facturación relacionados con esta empresa.</span>
                                    </div>
                                </div>
                            </Fieldset>
                        </div>
                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="8">
                    <ScrollPanel style="height: 58vh">

                        <div style="padding: 20px">

                            <!-- AGREGAR CORREO -->
                            <div
                                style="
                                    display: grid;
                                    grid-template-columns: 1fr auto;
                                    gap: 10px;
                                    align-items: end;
                                    margin-bottom: 20px;
                                "
                            >
                                <div
                                    style="
                                        display: flex;
                                        flex-direction: column;
                                        gap: 8px;
                                    "
                                >
                                    <label for="correo_solicitud">
                                        Correo Electrónico:
                                    </label>

                                    <InputText
                                        id="correo_solicitud"
                                        v-model="
                                            frmCorreoSolicitud.correo_electronico
                                        "
                                        type="email"
                                        placeholder="correo@dominio.com"
                                        style="
                                            width: 100%;
                                            text-transform: lowercase;
                                        "
                                        :invalid="
                                            frmCorreoSolicitud.correo_electronico &&
                                            !correoSolicitudValido
                                        "
                                        @keyup.enter="
                                            handleAgregarCorreoSolicitud
                                        "
                                    />
                                </div>

                                <Button
                                    type="button"
                                    label="Agregar"
                                    class="btn-nuevo"
                                    :disabled="!correoSolicitudValido"
                                    @click="handleAgregarCorreoSolicitud"
                                >
                                    <template #icon>
                                        <font-icon
                                            icon="fa-solid fa-plus"
                                            class="mr-2"
                                        />
                                    </template>
                                </Button>
                            </div>


                            <!-- LISTADO -->
                            <DataTable
                                :value="frmEmpresa.correos_solicitudes"
                                size="small"
                                paginator
                                :rows="10"
                                scrollable
                                scrollHeight="38vh"
                                class="tabla-encabezados"
                            >
                                <template #empty>
                                    No se han registrado correos para
                                    recibir solicitudes.
                                </template>

                                <Column
                                    field="correo_electronico"
                                    header="Correo Electrónico"
                                    headerClass="encabezado-columna"
                                />

                                <Column
                                    header="Activo"
                                    headerClass="encabezado-columna"
                                    style="width: 100px"
                                >
                                    <template #body="slotProps">
                                        <font-icon
                                            v-if="slotProps.data.activo"
                                            icon="fa-solid fa-circle-check"
                                            style="color: green"
                                        />

                                        <font-icon
                                            v-else
                                            icon="fa-solid fa-circle-minus"
                                            style="color: red"
                                        />
                                    </template>
                                </Column>

                                <Column
                                    header="Opciones"
                                    headerClass="encabezado-columna"
                                    style="width: 100px"
                                >
                                    <template #body="slotProps">
                                        <Button
                                            type="button"
                                            severity="danger"
                                            outlined
                                            @click="
                                                handleEliminarCorreoSolicitud(
                                                    slotProps.index
                                                )
                                            "
                                        >
                                            <font-icon
                                                icon="fa-solid fa-trash"
                                            />
                                        </Button>
                                    </template>
                                </Column>
                            </DataTable>

                        </div>

                    </ScrollPanel>
                </TabPanel>

                <TabPanel value="9" v-if="movimiento === 'E'">
                    <p class="m-0">Historial de la empresa.</p>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>

    <!-- DIALOG BANCO -->
    <Dialog v-model:visible="visibleBanco" modal header="Cuenta Bancaria" :style="{ width: '45rem' }" :draggable="false">
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px">
            <!-- BANCO -->
            <div style="display: flex; flex-direction: column; gap: 8px">
                <label for="banco"> Banco: </label>

                <Select id="banco" v-model="frmBanco.banco" :options="catalogoBancos" optionValue="clabe_banco" optionLabel="descripcion" placeholder="Banco" class="w-full" disabled />
            </div>

            <!-- CLABE / CUENTA -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="clabe_banco"> CLABE: </label>

                    <InputText id="clabe_banco" v-model="frmBanco.clabe_banco" maxlength="18" inputmode="numeric" :invalid="!clabeValida" @keydown="soloNumeros" @update:modelValue="handleCambioClabe" />
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="cuenta_banco"> Cuenta Bancaria: </label>

                    <InputText id="cuenta_banco" v-model="frmBanco.cuenta_banco" maxlength="11" inputmode="numeric" :invalid="!cuentaBancoValida" @keydown="soloNumeros" @update:modelValue="handleCambioCuentaBanco" />
                </div>
            </div>

            <!-- ACTIVO -->
            <div class="flex align-items-center">
                <Checkbox inputId="banco_activo" v-model="frmBanco.activo" binary />

                <label for="banco_activo" class="ml-2"> Activo </label>
            </div>

            <!-- BOTONES -->
            <div class="flex justify-content-end gap-2" style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 10px">
                <Button type="button" label="Cancelar" class="btn-cancelar" @click="visibleBanco = false">
                    <template #icon>
                        <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button type="button" label="Guardar" class="btn-guardar" @click="handleGuardarBanco">
                    <template #icon>
                        <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>

    <!-- DIALOG CONCEPTO -->
    <Dialog v-model:visible="visibleConcepto" modal header="Producto / Servicio" :style="{ width: '80rem' }" :draggable="false">
        <div style="max-height: 75vh; overflow: auto; padding-right: 5px">
            <!-- PRODUCTO / SERVICIO -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 5px; padding: 5px">
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="prod_serv">
                        <span style="color: red">*</span>
                        Producto / Servicio:
                    </label>

                    <AutoComplete
                        id="prod_serv"
                        v-model="valorBuscado"
                        :suggestions="listaProdServ"
                        optionLabel="descripcion_mostrar"
                        placeholder="Buscar producto o servicio..."
                        class="w-full"
                        inputClass="w-full"
                        forceSelection
                        :disabled="frmConcepto._id !== ''"
                        :invalid="!productoServicioValido"
                        @complete="handleBuscarProdServ"
                        @item-select="handleSeleccionarProdServ"
                        @update:modelValue="handleCambioValorProdServ"
                    />
                </div>
            </div>

            <!-- DESCRIPCIÓN -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 5px; padding: 5px">
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="descripcion">
                        <span style="color: red">*</span>
                        Descripción:
                    </label>

                    <InputText id="descripcion" v-model="frmConcepto.descripcion" class="w-full" style="text-transform: uppercase" :invalid="!descripcionConceptoValida" />
                </div>
            </div>

            <!-- CUENTA PREDIAL -->
            <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 20px; padding: 5px">
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="cuenta_predial"> Cuenta Predial: </label>

                    <InputText id="cuenta_predial" v-model="frmConcepto.cuenta_predial" class="w-full" style="text-transform: uppercase" />
                </div>
            </div>

            <!-- UNIDAD / OBJETO IMPUESTO -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 5px">
                <!-- CLAVE UNIDAD -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="clave_unidad">
                        <span style="color: red">*</span>
                        Clave Unidad:
                    </label>

                    <Select
                        id="clave_unidad"
                        v-model="frmConcepto.clave_unidad"
                        :options="catalogoSat?.clave_unidad || []"
                        optionValue="clave_unidad"
                        optionLabel="descripcion_2"
                        placeholder="Selecciona una opción"
                        class="w-full"
                        filter
                        filterBy="descripcion,clave_unidad"
                        showClear
                        :invalid="!claveUnidadValida"
                    />
                </div>

                <!-- OBJETO IMPUESTO -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="objeto_imp">
                        <span style="color: red">*</span>
                        Objeto Imp.:
                    </label>

                    <Select
                        id="objeto_imp"
                        v-model="frmConcepto.objeto_imp"
                        :options="catalogoSat?.objeto_imp || []"
                        optionValue="objeto_imp"
                        optionLabel="descripcion_2"
                        placeholder="Selecciona una opción"
                        class="w-full"
                        filter
                        filterBy="descripcion,objeto_imp"
                        showClear
                        :invalid="!objetoImpValido"
                    />
                </div>
            </div>

            <!-- IMPUESTOS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 5px; margin-top: 15px">
                <!-- TRASLADOS -->
                <div>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px">
                        <div style="display: flex; flex-direction: column; gap: 8px">
                            <label> Impuesto Trasladado: </label>

                            <Select v-model="frmConcepto.tax_transfer_id" :options="taxTransfers" optionValue="_id" optionLabel="descripcion" placeholder="Selecciona traslado" class="w-full" filter />
                        </div>

                        <Button type="button" class="btn-nuevo" style="align-self: end" :disabled="!frmConcepto.tax_transfer_id" @click="handleAgregarTaxProdServ('traslado')">
                            <font-icon icon="fa-solid fa-plus" />
                        </Button>
                    </div>

                    <DataTable :value="frmConcepto.impuestos?.traslado || []" size="small" class="mt-2" scrollable scrollHeight="220px">
                        <template #empty> Sin traslados agregados. </template>

                        <Column field="etiqueta_codigo_fiscal" header="Impuesto" />

                        <Column field="descripcion" header="Descripción" />

                        <Column field="tipo_factor" header="Factor" />

                        <Column field="tasa" header="Tasa / Cuota" />

                        <Column header="Opciones">
                            <template #body="slotProps">
                                <Button type="button" severity="danger" text rounded @click="handleEliminarTaxProdServ('traslado', slotProps.data._id)">
                                    <font-icon icon="fa-solid fa-trash" />
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- RETENCIONES -->
                <div>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px">
                        <div style="display: flex; flex-direction: column; gap: 8px">
                            <label> Impuesto Retenido: </label>

                            <Select v-model="frmConcepto.tax_withholding_id" :options="taxWithholdings" optionValue="_id" optionLabel="descripcion" placeholder="Selecciona retención" class="w-full" filter />
                        </div>

                        <Button type="button" class="btn-nuevo" style="align-self: end" :disabled="!frmConcepto.tax_withholding_id" @click="handleAgregarTaxProdServ('retencion')">
                            <font-icon icon="fa-solid fa-plus" />
                        </Button>
                    </div>

                    <DataTable :value="frmConcepto.impuestos?.retencion || []" size="small" class="mt-2" scrollable scrollHeight="220px">
                        <template #empty> Sin retenciones agregadas. </template>

                        <Column field="etiqueta_codigo_fiscal" header="Impuesto" />

                        <Column field="descripcion" header="Descripción" />

                        <Column field="tipo_factor" header="Factor" />

                        <Column field="tasa" header="Tasa / Cuota" />

                        <Column header="Opciones">
                            <template #body="slotProps">
                                <Button type="button" severity="danger" text rounded @click="handleEliminarTaxProdServ('retencion', slotProps.data._id)">
                                    <font-icon icon="fa-solid fa-trash" />
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- NUMERO USO -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 5px; padding: 5px; margin-top: 15px">
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label for="num_uso"> # Facturado: </label>

                    <InputText id="num_uso" v-model="frmConcepto.num_uso" class="w-full" disabled />
                </div>
            </div>

            <!-- ACTIVO -->
            <div style="padding: 10px 5px">
                <div class="flex align-items-center">
                    <Checkbox inputId="concepto_activo" v-model="frmConcepto.activo" binary />

                    <label for="concepto_activo" class="ml-2"> Activo </label>
                </div>
            </div>

            <!-- BOTONES -->
            <div class="flex justify-content-end gap-2" style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 10px">
                <Button type="button" label="Cancelar" class="btn-cancelar" @click="handleCancelarConcepto">
                    <template #icon>
                        <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button type="button" label="Guardar" class="btn-guardar" :disabled="botonGuardarConceptoDeshabilitado" @click="handleGuardarConcepto">
                    <template #icon>
                        <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>
    </Dialog>

    <!-- DIALOG CSD -->
    <Dialog v-model:visible="visibleCSD" modal header="CSD / Sellos Digitales" :style="{ width: '45rem' }" :draggable="false">
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px">
            <!-- ARCHIVOS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <!-- CER -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label> Archivo .CER: </label>

                    <FileUpload mode="basic" name="archivo_cer_csd" accept=".cer" :maxFileSize="5000000" chooseLabel="Seleccionar .CER" :auto="false" :customUpload="true" @select="handleArchivoCSDCer" />
                </div>

                <!-- KEY -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label> Archivo .KEY: </label>

                    <FileUpload mode="basic" name="archivo_key_csd" accept=".key" :maxFileSize="5000000" chooseLabel="Seleccionar .KEY" :auto="false" :customUpload="true" @select="handleArchivoCSDKey" />
                </div>
            </div>

            <!-- CLAVE -->
            <div style="display: flex; flex-direction: column; gap: 8px">
                <label for="clave_csd"> Clave: </label>

                <Password id="clave_csd" v-model="frmCSD.clave" :feedback="false" toggleMask inputClass="w-full" style="width: 100%" placeholder="Ingrese la clave del certificado" />
            </div>

            <!-- ACTIVO -->
            <div class="flex align-items-center">
                <Checkbox inputId="csd_activo" v-model="frmCSD.activo" binary />

                <label for="csd_activo" class="ml-2"> Activo </label>
            </div>
        </div>

        <template #footer>
            <Button type="button" label="Cancelar" class="btn-cancelar" @click="visibleCSD = false" />

            <Button type="button" label="Verificar" class="btn-guardar" :disabled="botonVerificarCSDDeshabilitado" @click="handleVerificarCSD" />
        </template>
    </Dialog>

    <!-- DIALOG FIEL -->
    <Dialog v-model:visible="visibleFIEL" modal header="FIEL / e.firma" :style="{ width: '45rem' }" :draggable="false">
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px">
            <!-- ARCHIVOS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <!-- CER -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label>Archivo .CER:</label>

                    <FileUpload mode="basic" name="archivo_cer_fiel" accept=".cer" :maxFileSize="5000000" chooseLabel="Seleccionar .CER" :auto="false" :customUpload="true" @select="handleArchivoFIELCer" />
                </div>

                <!-- KEY -->
                <div style="display: flex; flex-direction: column; gap: 8px">
                    <label>Archivo .KEY:</label>

                    <FileUpload mode="basic" name="archivo_key_fiel" accept=".key" :maxFileSize="5000000" chooseLabel="Seleccionar .KEY" :auto="false" :customUpload="true" @select="handleArchivoFIELKey" />
                </div>
            </div>

            <!-- CLAVE -->
            <div style="display: flex; flex-direction: column; gap: 8px">
                <label for="clave_fiel"> Clave: </label>

                <Password id="clave_fiel" v-model="frmFIEL.clave" :feedback="false" toggleMask inputClass="w-full" style="width: 100%" placeholder="Ingrese la clave de la FIEL" />
            </div>

            <!-- CHECKS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
                <div class="flex align-items-center">
                    <Checkbox inputId="fiel_dialog_descarga" v-model="frmFIEL.descarga_cfdi_sat" binary />

                    <label for="fiel_dialog_descarga" class="ml-2"> Descarga CFDI SAT </label>
                </div>

                <div class="flex align-items-center">
                    <Checkbox inputId="fiel_dialog_activo" v-model="frmFIEL.activo" binary />

                    <label for="fiel_dialog_activo" class="ml-2"> Activo </label>
                </div>
            </div>
        </div>

        <template #footer>
            <Button type="button" label="Cancelar" class="btn-cancelar" @click="visibleFIEL = false">
                <template #icon>
                    <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                </template>
            </Button>

            <Button type="button" label="Verificar" class="btn-guardar" :disabled="botonVerificarFIELDeshabilitado" @click="handleVerificarFIEL">
                <template #icon>
                    <font-icon icon="fa-solid fa-shield-check" class="mr-2" />
                </template>
            </Button>
        </template>
    </Dialog>

    <!-- DIALOG PLANTILLA -->
    <Dialog v-model:visible="visiblePlantilla" modal header="Plantilla HTML / PDF" :style="{ width: '40rem' }" :draggable="false">
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px">
            <!-- TIPO PLANTILLA -->
            <div style="display: flex; flex-direction: column; gap: 8px">
                <label for="tipo_plantilla"> Tipo Plantilla: </label>

                <Select id="tipo_plantilla" v-model="frmPlantilla.tipo_plantilla" :options="catalogoPlantillas" optionLabel="label" optionValue="value" placeholder="Seleccione una plantilla" class="w-full" />
            </div>

            <!-- ARCHIVO -->
            <div style="display: flex; flex-direction: column; gap: 8px">
                <label> Archivo HTML / PDF: </label>

                <FileUpload mode="basic" name="archivo_plantilla" accept=".html,.htm,.pdf" :maxFileSize="10000000" chooseLabel="Seleccionar archivo" :auto="false" :customUpload="true" @select="handleArchivoPlantilla" />
            </div>

            <!-- NOMBRE SELECCIONADO -->
            <div v-if="frmPlantilla.nombre_archivo" style="padding: 10px; border: 1px solid #d1d5db; border-radius: 6px">
                <strong>Archivo seleccionado:</strong>

                {{ frmPlantilla.nombre_archivo }}
            </div>
        </div>

        <template #footer>
            <Button type="button" label="Cancelar" class="btn-cancelar" @click="handleCancelarPlantilla">
                <template #icon>
                    <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                </template>
            </Button>

            <Button type="button" label="Guardar" class="btn-guardar" :disabled="botonGuardarPlantillaDeshabilitado" @click="handleGuardarPlantilla">
                <template #icon>
                    <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                </template>
            </Button>
        </template>
    </Dialog>

    <Dialog v-model:visible="visibleConsultaBancos" modal header="Cuentas Bancarias" :style="{ width: '70rem' }" :draggable="false">
        <DataTable :value="empresaConsulta?.bancos || []" size="small" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50, 70]" scrollable scrollHeight="380px" class="tabla-encabezados">
            <template #empty> No se encontraron cuentas bancarias. </template>

            <Column field="banco" header="Banco" headerClass="encabezado-columna" />

            <Column field="clabe_banco" header="CLABE Bancaria" headerClass="encabezado-columna" />

            <Column field="cuenta_banco" header="Cuenta Bancaria" headerClass="encabezado-columna" />

            <Column header="Activo" headerClass="encabezado-columna">
                <template #body="slotProps">
                    <font-icon v-if="slotProps.data.activo" icon="fa-solid fa-circle-check" style="color: green" />

                    <font-icon v-else icon="fa-solid fa-circle-minus" style="color: red" />
                </template>
            </Column>
        </DataTable>
    </Dialog>

    <Dialog v-model:visible="visibleConsultaConceptos" modal header="Conceptos de Facturación" :style="{ width: '80rem' }" :draggable="false">
        <DataTable :value="empresaConsulta?.prod_serv || []" size="small" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50, 70]" scrollable scrollHeight="380px" class="tabla-encabezados">
            <template #empty> No se encontraron conceptos. </template>

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

            <Column field="num_uso" header="Número Facturado" headerClass="encabezado-columna" />

            <Column header="Activo" headerClass="encabezado-columna">
                <template #body="slotProps">
                    <font-icon v-if="slotProps.data.activo" icon="fa-solid fa-circle-check" style="color: green" />

                    <font-icon v-else icon="fa-solid fa-circle-minus" style="color: red" />
                </template>
            </Column>
        </DataTable>
    </Dialog>
</template>

<script>
import empresaDefault from '../../../assets/images/Empresa.jpg';
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'Empresas',
    components: { Encabezado },
    setup() {
        return {
            ...proceso(),
            empresaDefault
        };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
