<template>
    <Encabezado titulo="Portal SAT" subtitulo="Acceso y consulta directa de CFDI mediante e.firma" icono="pi pi-cloud-download" />

    <div class="card p-0 m-0 sat-portal-contenedor">
        <ScrollPanel style="height: 78vh">
            <div class="form-sat-portal">
                <!-- =====================================================

                    CONEXION SAT

                ====================================================== -->

                <div class="sat-card sat-card-conexion">
                    <div class="sat-titulo">
                        <div class="sat-icono">
                            <font-icon icon="fa-solid fa-cloud-arrow-down" />
                        </div>

                        <div class="sat-titulo-texto">
                            <span> Conexión con Portal SAT </span>

                            <small> Selecciona una empresa y Gekko utilizará la e.firma registrada para conectarse al portal CFDI. </small>
                        </div>
                    </div>

                    <!-- EMPRESA -->

                    <div class="campo-formulario campo-empresa">
                        <div class="campo-empresa-label">
                            <label> Empresa </label>

                            <span v-if="efirmaValidada" class="empresa-bloqueada">
                                <i class="pi pi-lock"></i>

                                Empresa validada
                            </span>
                        </div>

                        <Dropdown
                            v-model="companyId"
                            :options="empresas"
                            optionLabel="razon_social_nombre_completo"
                            optionValue="_id"
                            placeholder="Selecciona una empresa"
                            filter
                            showClear
                            class="w-full"
                            :loading="cargandoEmpresas"
                            :disabled="procesando || efirmaValidada || !!sesionSat?.sesion_id"
                            @change="handleCambiarEmpresa"
                        >
                            <template #option="slotProps">
                                <div class="empresa-opcion">
                                    <strong>
                                        {{ slotProps.option.razon_social_nombre_completo || slotProps.option.rfc }}
                                    </strong>

                                    <span>
                                        {{ slotProps.option.rfc }}
                                    </span>
                                </div>
                            </template>
                        </Dropdown>
                    </div>

                    <!-- EMPRESA SIN VALIDAR -->

                    <div v-if="empresaSeleccionada && !efirmaValidada" class="empresa-resumen">
                        <div class="empresa-resumen-principal">
                            <div class="empresa-resumen-icono">
                                <font-icon icon="fa-solid fa-building" />
                            </div>

                            <div class="empresa-resumen-nombre">
                                <strong>
                                    {{ empresaSeleccionada.razon_social_nombre_completo || 'Empresa' }}
                                </strong>

                                <span> Configuración SAT disponible </span>
                            </div>
                        </div>

                        <div class="empresa-resumen-datos">
                            <div>
                                <span> RFC </span>

                                <strong>
                                    {{ empresaSeleccionada.rfc || '-' }}
                                </strong>
                            </div>

                            <div>
                                <span> Vigencia FIEL </span>

                                <strong>
                                    {{ handleFecha(empresaSeleccionada.fecha_vencimiento) }}
                                </strong>
                            </div>

                            <div>
                                <span> Estatus </span>

                                <strong class="estatus-ok"> Disponible </strong>
                            </div>
                        </div>
                    </div>

                    <!-- E.FIRMA VALIDADA -->

                    <div v-if="efirmaValidada" class="validacion-compacta">
                        <div class="validacion-compacta-estado">
                            <div class="validacion-compacta-icono">
                                <i class="pi pi-check"></i>
                            </div>

                            <div>
                                <strong> e.firma validada </strong>

                                <span> Certificado y llave privada correctos. </span>
                            </div>
                        </div>

                        <div class="validacion-compacta-datos">
                            <div class="dato-compacto">
                                <span> Empresa </span>

                                <strong>
                                    {{ datosEfirma.empresa || empresaSeleccionada?.razon_social_nombre_completo || '-' }}
                                </strong>
                            </div>

                            <div class="dato-compacto">
                                <span> RFC </span>

                                <strong>
                                    {{ datosEfirma.rfc || empresaSeleccionada?.rfc || '-' }}
                                </strong>
                            </div>

                            <div class="dato-compacto">
                                <span> Vigencia inicio </span>

                                <strong>
                                    {{ handleFecha(datosEfirma.vigencia_inicio) }}
                                </strong>
                            </div>

                            <div class="dato-compacto">
                                <span> Vigencia fin </span>

                                <strong>
                                    {{ handleFecha(datosEfirma.vigencia_fin || datosEfirma.fecha_vencimiento_configurada) }}
                                </strong>
                            </div>

                            <div class="dato-compacto">
                                <span> Certificado </span>

                                <strong class="estatus-ok"> Válido </strong>
                            </div>
                        </div>
                    </div>

                    <!-- SESION SAT -->

                    <div v-if="sesionSat?.sesion_id" class="sesion-compacta">
                        <div class="sesion-compacta-info">
                            <div class="sesion-compacta-icono">
                                <i class="pi pi-wifi"></i>
                            </div>

                            <div>
                                <strong> Sesión SAT activa </strong>

                                <span>
                                    RFC:

                                    {{ sesionSat.rfc || datosEfirma.rfc || empresaSeleccionada?.rfc }}
                                </span>
                            </div>
                        </div>

                        <span class="sesion-compacta-badge">
                            <i class="pi pi-circle-fill"></i>

                            Conectado
                        </span>
                    </div>

                    <!-- BOTONES -->

                    <div class="acciones-formulario">
                        <Button type="button" label="Limpiar" class="btn-cancelar" :disabled="procesando || !!sesionSat?.sesion_id" @click="handleLimpiar">
                            <template #icon>
                                <font-icon icon="fa-solid fa-eraser" class="mr-2" />
                            </template>
                        </Button>

                        <Button v-if="!efirmaValidada" type="button" label="Validar e.firma" class="btn-guardar" :loading="validando" :disabled="botonValidarDeshabilitado" @click="handleValidarEfirma">
                            <template #icon>
                                <font-icon icon="fa-solid fa-certificate" class="mr-2" />
                            </template>
                        </Button>

                        <Button v-if="efirmaValidada && !sesionSat?.sesion_id" type="button" label="Conectar SAT" class="btn-nuevo" :loading="conectando" :disabled="conectando || !companyId" @click="handleIniciarSesion">
                            <template #icon>
                                <font-icon icon="fa-solid fa-cloud-arrow-down" class="mr-2" />
                            </template>
                        </Button>

                        <Button v-if="sesionSat?.sesion_id" type="button" label="Cerrar sesión" class="btn-cerrar-sesion" :loading="cerrandoSesion" :disabled="cerrandoSesion || consultandoCfdi || actualizandoCfdiBase" @click="handleCerrarSesion">
                            <template #icon>
                                <font-icon icon="fa-solid fa-power-off" class="mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>

                <!-- =====================================================

                    CONSULTA CFDI

                ====================================================== -->

                <div v-if="sesionSat?.sesion_id" class="sat-card consulta-card">
                    <div class="consulta-titulo">
                        <div class="consulta-titulo-izquierda">
                            <div class="consulta-icono">
                                <font-icon icon="fa-solid fa-magnifying-glass" />
                            </div>

                            <div>
                                <strong> Consulta CFDI </strong>

                                <span> Consulta directamente los comprobantes disponibles en el Portal SAT. </span>
                            </div>
                        </div>

                        <div class="sesion-indicador">
                            <span class="sesion-indicador-punto"></span>

                            SAT conectado
                        </div>
                    </div>

                    <!-- FILTROS -->

                    <div class="consulta-filtros">
                        <div class="campo-consulta">
                            <label> Tipo </label>

                            <Dropdown v-model="tipoConsulta" :options="tiposConsulta" optionLabel="label" optionValue="value" class="w-full" :disabled="consultandoCfdi || actualizandoCfdiBase" />
                        </div>

                        <div class="campo-consulta">
                            <label> Fecha inicial </label>

                            <Calendar v-model="fechaInicial" dateFormat="dd/mm/yy" showIcon :maxDate="fechaHoy" class="w-full" :disabled="consultandoCfdi || actualizandoCfdiBase" />
                        </div>

                        <div class="campo-consulta">
                            <label> Fecha final </label>

                            <Calendar v-model="fechaFinal" dateFormat="dd/mm/yy" showIcon :maxDate="fechaHoy" class="w-full" :disabled="consultandoCfdi || actualizandoCfdiBase" />
                        </div>

                        <div class="campo-consulta">
                            <label> Estado </label>

                            <Dropdown v-model="estadoCfdi" :options="estadosCfdi" optionLabel="label" optionValue="value" class="w-full" :disabled="consultandoCfdi || actualizandoCfdiBase" />
                        </div>
                    </div>

                    <!-- BOTONES FILTROS -->

                    <div class="consulta-botones">
                        <Button type="button" label="Limpiar filtros" icon="pi pi-filter-slash" class="p-button-outlined" :disabled="consultandoCfdi || actualizandoCfdiBase" @click="handleLimpiarConsulta" />

                        <Button type="button" label="Buscar CFDI" icon="pi pi-search" class="btn-nuevo" :loading="consultandoCfdi" :disabled="!puedeConsultarCfdi || actualizandoCfdiBase" @click="handleConsultarCfdi" />
                    </div>

                    <!-- =================================================

                        RESULTADOS

                    ================================================== -->

                    <div class="resultados-cfdi">
                        <div class="resultados-header">
                            <div class="resultados-header-info">
                                <strong> CFDI encontrados </strong>

                                <span>
                                    {{ cfdisFiltrados.length }}

                                    registro(s)
                                </span>
                            </div>

                            <div class="acciones-resultados">
                                <!-- BUSCADOR -->

                                <span class="p-input-icon-left buscador-tabla">
                                    <i class="pi pi-search"></i>

                                    <InputText v-model="busquedaCfdi" placeholder="Buscar CFDI..." />
                                </span>

                                <!-- ACTUALIZAR CFDI BASE -->

                                <Button type="button" label="Actualizar CFDI base" class="btn-actualizar-cfdi" :loading="actualizandoCfdiBase" :disabled="!cfdis.length || actualizandoCfdiBase || consultandoCfdi" @click="handleActualizarCfdiBase">
                                    <template #icon>
                                        <font-icon icon="fa-solid fa-database" class="mr-2" />
                                    </template>
                                </Button>

                                <!-- EXCEL -->

                                <Button type="button" label="Excel" severity="success" class="btn-excel" :disabled="!cfdisFiltrados.length" @click="handleExportarExcel">
                                    <template #icon>
                                        <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
                                    </template>
                                </Button>
                            </div>
                        </div>

                        <!-- ACTUALIZACION CFDI NO BLOQUEANTE -->

                        <div v-if="actualizandoCfdiBase" class="actualizacion-cfdi-aviso">
                            <div class="actualizacion-cfdi-icono">
                                <i class="pi pi-spin pi-spinner"></i>
                            </div>

                            <div class="actualizacion-cfdi-texto">
                                <strong>Actualizando CFDI en la base</strong>
                                <span> Se están procesando {{ totalCfdiActualizando }} CFDI. Puedes buscar y desplazarte por la tabla mientras termina. </span>
                            </div>

                            <span class="actualizacion-cfdi-badge">Procesando</span>
                        </div>

                        <!-- =================================================

                            TABLA

                        ================================================== -->

                        <DataTable :value="cfdisFiltrados" paginator :rows="100" :rowsPerPageOptions="[100, 200, 500]" stripedRows scrollable scrollHeight="500px" class="tabla-cfdi" dataKey="uuid">
                            <!-- XML -->

                            <Column header="XML" :exportable="false" style="width: 60px; min-width: 60px">
                                <template #body="{ data }">
                                    <div class="acciones-cfdi">
                                        <Button type="button" icon="pi pi-download" class="boton-accion boton-xml" v-tooltip.top="'Descargar XML'" :disabled="actualizandoCfdiBase" @click="handleDescargarXml(data)" />
                                    </div>
                                </template>
                            </Column>

                            <!-- FOLIO FISCAL -->

                            <Column field="uuid" header="Folio Fiscal" sortable style="min-width: 240px">
                                <template #body="{ data }">
                                    <span class="uuid-cfdi">
                                        {{ data.uuid || '-' }}
                                    </span>
                                </template>
                            </Column>

                            <!-- RFC EMISOR -->

                            <Column header="RFC Emisor" sortable style="min-width: 125px">
                                <template #body="{ data }">
                                    {{ handleObtenerRfcEmisor(data) }}
                                </template>
                            </Column>

                            <!-- RAZON SOCIAL EMISOR -->

                            <Column header="Razón Social Emisor" style="min-width: 210px">
                                <template #body="{ data }">
                                    <span class="texto-ajustable">
                                        {{ handleObtenerNombreEmisor(data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- RFC RECEPTOR -->

                            <Column header="RFC Receptor" style="min-width: 125px">
                                <template #body="{ data }">
                                    {{ handleObtenerRfcReceptor(data) }}
                                </template>
                            </Column>

                            <!-- RAZON SOCIAL RECEPTOR -->

                            <Column header="Razón Social Receptor" style="min-width: 210px">
                                <template #body="{ data }">
                                    <span class="texto-ajustable">
                                        {{ handleObtenerNombreReceptor(data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- FECHA EMISION -->

                            <Column header="Fecha emisión" sortable style="min-width: 165px">
                                <template #body="{ data }">
                                    <span class="fecha-cfdi">
                                        {{ handleObtenerFechaCfdi(data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- FECHA CANCELACION -->

                            <Column header="Fecha cancelación" sortable style="min-width: 165px">
                                <template #body="{ data }">
                                    <span class="fecha-cfdi">
                                        {{ handleObtenerFechaCancelacion(data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- TOTAL -->

                            <Column header="Total" sortable style="min-width: 110px">
                                <template #body="{ data }">
                                    <span class="total-cfdi">
                                        {{ handleFormatoMoneda(handleObtenerTotal(data)) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- TIPO -->

                            <Column header="Tipo" style="min-width: 85px">
                                <template #body="{ data }">
                                    {{ handleObtenerTipoComprobante(data) }}
                                </template>
                            </Column>

                            <!-- ESTADO -->

                            <Column header="Estado" style="min-width: 100px">
                                <template #body="{ data }">
                                    <span :class="handleClaseEstado(handleObtenerEstado(data))">
                                        {{ handleObtenerEstado(data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- VACIO -->

                            <template #empty>
                                <div class="tabla-vacia">
                                    <i class="pi pi-inbox"></i>

                                    <span> No se encontraron CFDI. </span>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'SatPortal',

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
