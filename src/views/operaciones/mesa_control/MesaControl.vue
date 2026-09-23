<template>
    <Encabezado titulo="Mesa de Control" subtitulo="Administración de solicitudes" icono="pi pi-gauge" />

    <div class="card panel-control">
        <!-- =====================================================
             DASHBOARD
        ====================================================== -->

        <div class="resumen-grid">
            <!-- PENDIENTES -->

            <div class="resumen-card resumen-pendientes">
                <div class="resumen-icono">
                    <font-icon :icon="['fas', 'clock']" />
                </div>

                <div class="resumen-info">
                    <span class="resumen-label"> Pendientes </span>

                    <strong class="resumen-numero">
                        {{ resumenDashboard.pendientes }}
                    </strong>

                    <span class="resumen-descripcion"> Por atender </span>
                </div>
            </div>

            <!-- FACTURAS -->

            <button
                type="button"
                class="resumen-card resumen-card-click resumen-facturas"
                :class="{
                    activo: tipoSolicitudFiltro === 'facturas'
                }"
                @click="handleSeleccionarTipoResumen('facturas')"
            >
                <div class="resumen-icono">
                    <font-icon :icon="['fas', 'file-invoice']" />
                </div>

                <div class="resumen-info">
                    <span class="resumen-label"> Facturas </span>

                    <strong class="resumen-numero">
                        {{ resumenDashboard.facturas }}
                    </strong>

                    <span class="resumen-descripcion"> CFDI de ingreso </span>
                </div>
            </button>

            <!-- COMPLEMENTOS -->

            <button
                type="button"
                class="resumen-card resumen-card-click resumen-complementos"
                :class="{
                    activo: tipoSolicitudFiltro === 'complementos_pago'
                }"
                @click="handleSeleccionarTipoResumen('complementos_pago')"
            >
                <div class="resumen-icono">
                    <font-icon :icon="['fas', 'money-check-dollar']" />
                </div>

                <div class="resumen-info">
                    <span class="resumen-label"> Complementos </span>

                    <strong class="resumen-numero">
                        {{ resumenDashboard.complementos }}
                    </strong>

                    <span class="resumen-descripcion"> Complementos de pago </span>
                </div>
            </button>

            <!-- TOTAL -->

            <div class="resumen-card resumen-total">
                <div class="resumen-icono">
                    <font-icon :icon="['fas', 'file-circle-check']" />
                </div>

                <div class="resumen-info">
                    <span class="resumen-label"> Total solicitudes </span>

                    <strong class="resumen-numero">
                        {{ resumenDashboard.total }}
                    </strong>

                    <span class="resumen-descripcion"> Facturas + complementos </span>
                </div>
            </div>

            <!-- IMPORTE -->

            <div class="resumen-card resumen-importe">
                <div class="resumen-icono">
                    <font-icon :icon="['fas', 'dollar-sign']" />
                </div>

                <div class="resumen-info">
                    <span class="resumen-label"> Importe total </span>

                    <strong class="resumen-numero resumen-numero-moneda">
                        {{ handleMoney(resumenDashboard.importe) }}
                    </strong>

                    <span class="resumen-descripcion"> Periodo consultado </span>
                </div>
            </div>
        </div>

        <!-- =====================================================
             PERIODO
        ====================================================== -->

        <div class="periodo-consulta">
            <div class="periodo-icono">
                <i class="pi pi-calendar"></i>
            </div>

            <div class="periodo-texto">
                <span> Periodo consultado </span>

                <strong>
                    {{ handleFechaApi(fechaInicial) }}
                    al
                    {{ handleFechaApi(fechaFinal) }}
                </strong>
            </div>
        </div>

        <!-- =====================================================
             FILTROS
        ====================================================== -->

        <div class="panel-filtros">
            <div class="filtros-grid">
                <!-- TIPO -->

                <div class="campo-filtro">
                    <label> Tipo de solicitud </label>

                    <Dropdown v-model="tipoSolicitudFiltro" :options="tiposSolicitud" optionLabel="label" optionValue="value" class="w-full" @change="handleCambiarTipoSolicitud" />
                </div>

                <!-- ESTATUS -->

                <div class="campo-filtro">
                    <label> Estatus </label>

                    <Dropdown v-model="estatusFiltro" :options="estatusSolicitud" optionLabel="label" optionValue="value" class="w-full" @change="handleCambiarEstatus" />
                </div>

                <!-- FECHA INICIAL -->

                <div class="campo-filtro">
                    <label> Fecha inicial </label>

                    <DatePicker v-model="fechaInicial" dateFormat="dd/mm/yy" showIcon iconDisplay="input" :maxDate="fechaFinal" class="w-full" />
                </div>

                <!-- FECHA FINAL -->

                <div class="campo-filtro">
                    <label> Fecha final </label>

                    <DatePicker v-model="fechaFinal" dateFormat="dd/mm/yy" showIcon iconDisplay="input" :minDate="fechaInicial" :maxDate="fechaActual" class="w-full" />
                </div>

                <!-- EMPRESA -->

                <div class="campo-filtro">
                    <label> Empresa emisora </label>

                    <Dropdown v-model="empresaFiltro" :options="empresasFiltro" optionLabel="nombre" optionValue="_id" placeholder="Todas las empresas" showClear filter class="w-full" />
                </div>

                <!-- CONSULTAR -->

                <div class="campo-boton">
                    <Button icon="pi pi-search" label="Consultar" :loading="cargandoSolicitudes" @click="handleConsultar" />
                </div>

                <!-- LIMPIAR -->

                <div class="campo-boton">
                    <Button icon="pi pi-filter-slash" label="Limpiar" severity="secondary" outlined @click="handleLimpiarFiltroCompleto" />
                </div>
            </div>

            <!-- =================================================
                 SEGUNDA FILA
            ================================================== -->

            <div class="filtros-secundarios">
                <div class="resultado-periodo">
                    <i class="pi pi-info-circle"></i>

                    <span>
                        {{ solicitudesExportables.length }}
                        registro(s)
                    </span>
                </div>

                <div class="acciones-secundarias">
                    <IconField iconPosition="left" class="buscador-tabla">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="filtros.global.value" placeholder="Buscar solicitud..." class="w-full" />
                    </IconField>

                    <Button severity="success" label="Excel" :disabled="!solicitudesExportables.length" @click="handleExportarExcel">
                        <template #icon>
                            <font-icon :icon="['fas', 'file-excel']" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </div>

        <!-- =====================================================
             TITULO TABLA
        ====================================================== -->

        <div class="barra-tabla">
            <div class="barra-tabla-izquierda">
                <div class="indicador-estatus">
                    <span class="indicador-punto" :class="estatusFiltro"></span>

                    <span>
                        {{ tituloTabla }}
                    </span>
                </div>

                <span class="contador-tabla">
                    {{ solicitudesExportables.length }}
                    registros
                </span>
            </div>

            <div class="tipo-actual">
                <font-icon :icon="tipoSolicitudFiltro === 'facturas' ? ['fas', 'file-invoice'] : ['fas', 'money-check-dollar']" />

                {{ tipoSolicitudFiltro === 'facturas' ? 'Facturas' : 'Complementos de pago' }}
            </div>
        </div>

        <!-- =====================================================
             TABLA
        ====================================================== -->

        <div class="contenedor-tabla">
            <DataTable
                v-model:filters="filtros"
                :value="solicitudesFiltradas"
                :globalFilterFields="['created_at', 'cliente', 'compania', 'uso_cfdi', 'banco', 'cuenta_banco', 'estatus', 'factura_serie', 'factura_folio', 'uuid']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[50, 100, 125, 150, 200]"
                scrollable
                scrollHeight="45vh"
                size="small"
                stripedRows
                rowHover
                :loading="cargandoSolicitudes"
                tableClass="tabla-control"
                class="tabla-encabezados tabla-mesa-control"
            >
                <template #empty>
                    <div class="tabla-vacia">
                        <font-icon :icon="['fas', 'inbox']" class="tabla-vacia-icono" />

                        <strong> No se encontraron solicitudes </strong>

                        <span> No existen registros para el periodo seleccionado. </span>
                    </div>
                </template>

                <!-- FECHA -->

                <Column
                    field="created_at"
                    header="Fecha"
                    headerClass="
                        encabezado-columna
                        col-mobile-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-mobile-hide
                    "
                    style="min-width: 145px"
                />

                <!-- EMPRESA -->

                <Column field="compania" header="Empresa emisora" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 210px" />

                <!-- CLIENTE -->

                <Column field="cliente" header="Cliente" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 210px" />

                <!-- USO CFDI -->

                <Column
                    field="uso_cfdi"
                    header="Uso CFDI"
                    headerClass="
                        encabezado-columna
                        col-mobile-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-mobile-hide
                    "
                    style="min-width: 110px"
                />

                <!-- CONCEPTOS -->

                <Column
                    v-if="tipoSolicitudFiltro === 'facturas'"
                    field="cantidad_conceptos"
                    header="Conceptos"
                    headerClass="
                        encabezado-columna
                        col-mobile-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-centro
                        col-mobile-hide
                    "
                    style="min-width: 90px"
                />

                <!-- DOCUMENTOS COMPLEMENTO -->

                <Column
                    v-if="tipoSolicitudFiltro === 'complementos_pago'"
                    field="cantidad_documentos"
                    header="Documentos"
                    headerClass="
                        encabezado-columna
                        col-mobile-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-centro
                        col-mobile-hide
                    "
                    style="min-width: 100px"
                />

                <!-- SERIE -->

                <Column
                    field="factura_serie"
                    header="Serie"
                    headerClass="
                        encabezado-columna
                        col-mobile-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-centro
                        col-mobile-hide
                    "
                    style="min-width: 80px"
                />

                <!-- FOLIO -->

                <Column
                    field="factura_folio"
                    header="Folio"
                    headerClass="encabezado-columna"
                    bodyClass="
                        col-no-wrap
                        col-centro
                    "
                    style="min-width: 85px"
                />

                <!-- UUID -->

                <Column
                    v-if="estatusFiltro === 'timbrada'"
                    field="uuid"
                    header="UUID"
                    headerClass="
                        encabezado-columna
                        col-tablet-hide
                    "
                    bodyClass="
                        col-no-wrap
                        col-tablet-hide
                    "
                    style="min-width: 285px"
                />

                <!-- TOTAL -->

                <Column
                    header="Total"
                    headerClass="encabezado-columna"
                    bodyClass="
                        col-no-wrap
                        col-numero
                    "
                    style="min-width: 120px"
                >
                    <template #body="slotProps">
                        {{ handleMoney(handleObtenerTotal(slotProps.data)) }}
                    </template>
                </Column>

                <!-- ESTATUS -->

                <Column header="Estatus" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 115px">
                    <template #body="slotProps">
                        <span class="estatus-chip" :class="handleClaseEstatus(slotProps.data.estatus)">
                            <font-icon :icon="slotProps.data.estatus === 'timbrada' ? ['fas', 'circle-check'] : ['fas', 'clock']" />

                            {{ handleNombreEstatus(slotProps.data.estatus) }}
                        </span>
                    </template>
                </Column>

                <!-- OPCIONES -->

                <Column header="Opciones" headerClass="encabezado-columna" bodyClass="col-opciones" style="min-width: 230px">
                    <template #body="slotProps">
                        <div class="acciones-tabla">
                            <!-- VER -->

                            <Button size="small" severity="info" v-tooltip.top="'Ver detalle'" @click="handleAbrirDetalle(slotProps.data)">
                                <font-icon :icon="['fas', 'eye']" />
                            </Button>

                            <!-- ARCHIVO -->

                            <Button v-if="slotProps.data.tiene_archivo" size="small" severity="secondary" v-tooltip.top="'Descargar archivo'" @click="handleDescargarArchivo(slotProps.data)">
                                <font-icon :icon="['fas', 'download']" />
                            </Button>

                            <!-- XML -->

                            <Button size="small" severity="help" v-tooltip.top="'Descargar XML'" @click="handleDescargarXml(slotProps.data)">
                                <font-icon :icon="['fas', 'file-code']" />
                            </Button>

                            <!-- PDF -->

                            <Button size="small" severity="warn" v-tooltip.top="'Descargar PDF'" @click="handleDescargarPdf(slotProps.data)">
                                <font-icon :icon="['fas', 'file-pdf']" />
                            </Button>

                            <!-- PENDIENTES -->

                            <template v-if="estatusFiltro === 'pendiente'">
                                <!-- ACEPTAR -->

                                <Button size="small" severity="success" v-tooltip.top="'Aceptar'" @click="handleAceptarSolicitud(slotProps.data)">
                                    <font-icon :icon="['fas', 'check']" />
                                </Button>

                                <!-- RECHAZAR -->

                                <Button size="small" severity="danger" v-tooltip.top="'Rechazar'" @click="handleAbrirRechazo(slotProps.data)">
                                    <font-icon :icon="['fas', 'xmark']" />
                                </Button>

                                <!-- EDITAR -->

                                <Button v-if="tipoSolicitudFiltro === 'facturas'" size="small" severity="contrast" v-tooltip.top="'Editar conceptos'" @click="handleEditarConceptos(slotProps.data)">
                                    <font-icon :icon="['fas', 'pen-to-square']" />
                                </Button>
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <!-- ==========================================================
         DIALOG DETALLE
    =========================================================== -->

    <Dialog
        v-model:visible="dialogDetalle"
        modal
        header="Detalle de solicitud"
        :style="{
            width: '86vw'
        }"
        :breakpoints="{
            '1200px': '92vw',

            '768px': '96vw'
        }"
        class="dialog-detalle"
    >
        <div v-if="solicitudDetalle" class="detalle-solicitud">
            <div class="detalle-datos">
                <div class="detalle-item">
                    <span class="detalle-label"> Cliente </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.cliente || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> Empresa emisora </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.compania || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> Uso CFDI </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.uso_cfdi || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> Serie / Folio </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.factura_serie || '-' }}

                        -

                        {{ solicitudDetalle.factura_folio || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> Banco </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.banco || '-' }}

                        <span v-if="solicitudDetalle.cuenta_banco">
                            -
                            {{ solicitudDetalle.cuenta_banco }}
                        </span>
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> CLABE </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.clabe_banco || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label"> Fecha </span>

                    <span class="detalle-valor">
                        {{ solicitudDetalle.created_at || '-' }}
                    </span>
                </div>

                <div v-if="solicitudDetalle.uuid" class="detalle-item detalle-item-amplio">
                    <span class="detalle-label"> UUID </span>

                    <span class="detalle-valor detalle-uuid">
                        {{ solicitudDetalle.uuid }}
                    </span>
                </div>
            </div>

            <!-- =====================================================
                 CONCEPTOS FACTURA
            ====================================================== -->

            <div v-if="tipoSolicitudFiltro === 'facturas'" class="detalle-seccion">
                <div class="detalle-seccion-titulo">
                    <font-icon :icon="['fas', 'list']" />

                    Conceptos
                </div>

                <DataTable
                    :value="solicitudDetalle.conceptos ?? []"
                    size="small"
                    stripedRows
                    scrollable
                    scrollHeight="300px"
                    class="tabla-detalle"
                    tableStyle="
                        min-width:
                        80rem
                    "
                >
                    <template #empty> Sin conceptos. </template>

                    <Column field="prod_serv" header="Clave SAT" />

                    <Column field="descripcion" header="Descripción" style="min-width: 320px" />

                    <Column field="clave_unidad" header="Clave Unidad" />

                    <Column field="unidad" header="Unidad" />

                    <Column field="cantidad" header="Cantidad" />

                    <Column header="Valor Unitario">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.valor_unitario) }}
                        </template>
                    </Column>

                    <Column header="Importe">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.importe) }}
                        </template>
                    </Column>

                    <Column header="Total">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.total) }}
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- =====================================================
                 DOCUMENTOS COMPLEMENTO
            ====================================================== -->

            <div v-if="tipoSolicitudFiltro === 'complementos_pago'" class="detalle-seccion">
                <div class="detalle-seccion-titulo">
                    <font-icon :icon="['fas', 'file-invoice-dollar']" />

                    Documentos relacionados
                </div>

                <DataTable :value="solicitudDetalle.facturas ?? []" size="small" stripedRows scrollable scrollHeight="300px" class="tabla-detalle">
                    <template #empty> Sin documentos relacionados. </template>

                    <Column field="uuid" header="UUID" />

                    <Column field="num_parcialidad" header="Parcialidad" />

                    <Column header="Saldo anterior">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.imp_saldo_ant) }}
                        </template>
                    </Column>

                    <Column header="Importe pagado">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.imp_pagado) }}
                        </template>
                    </Column>

                    <Column header="Saldo insoluto">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.imp_saldo_insoluto) }}
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- =====================================================
                 PIE
            ====================================================== -->

            <div class="detalle-pie">
                <div class="detalle-acciones">
                    <Button v-if="solicitudDetalle.tiene_archivo" label="Archivo adjunto" severity="secondary" outlined @click="handleDescargarArchivo(solicitudDetalle)" />

                    <Button label="XML CFDI" severity="help" outlined @click="handleDescargarXml(solicitudDetalle)" />

                    <Button label="PDF" severity="warn" outlined @click="handleDescargarPdf(solicitudDetalle)" />
                </div>

                <div class="detalle-totales">
                    <template v-if="tipoSolicitudFiltro === 'facturas'">
                        <div class="total-renglon">
                            <span> Subtotal </span>

                            <strong>
                                {{ handleMoney(solicitudDetalle.subtotal) }}
                            </strong>
                        </div>

                        <div class="total-renglon">
                            <span> Traslados </span>

                            <strong>
                                {{ handleMoney(solicitudDetalle.traslados) }}
                            </strong>
                        </div>

                        <div class="total-renglon">
                            <span> Retenciones </span>

                            <strong>
                                {{ handleMoney(solicitudDetalle.retenciones) }}
                            </strong>
                        </div>
                    </template>

                    <div class="total-separador"></div>

                    <div class="total-renglon total-final">
                        <span> Total </span>

                        <strong>
                            {{ handleMoney(handleObtenerTotal(solicitudDetalle)) }}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    </Dialog>

    <!-- ==========================================================
         RECHAZO
    =========================================================== -->

    <Dialog
        v-model:visible="dialogRechazo"
        modal
        header="Rechazar solicitud"
        :style="{
            width: '420px'
        }"
        :breakpoints="{
            '600px': '95vw'
        }"
    >
        <div class="rechazo-contenido">
            <label> Motivo de rechazo </label>

            <Textarea
                v-model="motivoRechazo"
                rows="4"
                autoResize
                placeholder="
                    Escribe el motivo de rechazo
                "
            />
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" outlined @click="handleCerrarRechazo" />

            <Button label="Rechazar" severity="danger" @click="handleRechazarSolicitud" />
        </template>
    </Dialog>

    <!-- ==========================================================
         EDITAR CONCEPTOS
    =========================================================== -->

    <Dialog
        v-model:visible="dialogEditarConceptos"
        modal
        header="Editar conceptos"
        :style="{
            width: '90vw'
        }"
        :breakpoints="{
            '1000px': '95vw',

            '600px': '98vw'
        }"
    >
        <div class="editar-conceptos">
            <div class="nuevo-concepto-card">
                <div class="nuevo-concepto-titulo">
                    <font-icon :icon="['fas', 'plus']" />

                    Agregar concepto
                </div>

                <div class="nuevo-concepto-grid">
                    <div class="campo-edicion campo-concepto">
                        <label> Concepto </label>

                        <Dropdown v-model="conceptoNuevoId" :options="conceptosDisponibles" optionValue="_id" optionLabel="descripcion" placeholder="Selecciona concepto" filter class="w-full" />
                    </div>

                    <div class="campo-edicion">
                        <label> Cantidad </label>

                        <InputText v-model="cantidadNuevo" keyfilter="num" class="w-full" />
                    </div>

                    <div class="campo-edicion">
                        <label> Valor unitario </label>

                        <InputText v-model="valorUnitarioNuevo" keyfilter="money" class="w-full" />
                    </div>

                    <Button icon="pi pi-plus" severity="success" @click="handleAgregarConceptoEditable" />
                </div>
            </div>

            <DataTable
                :value="conceptosEditables"
                size="small"
                stripedRows
                scrollable
                scrollHeight="330px"
                class="tabla-detalle"
                tableStyle="
                    min-width:
                    85rem
                "
            >
                <Column field="prod_serv" header="Clave SAT" />

                <Column field="descripcion" header="Descripción" style="min-width: 280px" />

                <Column field="clave_unidad" header="Clave Unidad" />

                <Column field="unidad" header="Unidad" />

                <Column header="Cantidad" style="min-width: 120px">
                    <template #body="slotProps">
                        <InputText :modelValue="slotProps.data.cantidad" keyfilter="num" class="w-full" @update:modelValue="handleCambiarConceptoEditable(slotProps.index, 'cantidad', $event)" />
                    </template>
                </Column>

                <Column header="Valor unitario" style="min-width: 150px">
                    <template #body="slotProps">
                        <InputText :modelValue="slotProps.data.valor_unitario" keyfilter="money" class="w-full" @update:modelValue="handleCambiarConceptoEditable(slotProps.index, 'valor_unitario', $event)" />
                    </template>
                </Column>

                <Column header="Importe">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.importe) }}
                    </template>
                </Column>

                <Column header="Total">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.total) }}
                    </template>
                </Column>

                <Column header="Acciones" style="width: 90px">
                    <template #body="slotProps">
                        <Button icon="pi pi-trash" severity="danger" rounded text @click="handleEliminarConceptoEditable(slotProps.index)" />
                    </template>
                </Column>
            </DataTable>

            <div class="editar-conceptos-footer">
                <Button label="Cancelar" severity="secondary" outlined @click="dialogEditarConceptos = false" />

                <Button label="Guardar cambios" icon="pi pi-save" @click="handleGuardarConceptosEditados" />
            </div>
        </div>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'PanelControl',

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
