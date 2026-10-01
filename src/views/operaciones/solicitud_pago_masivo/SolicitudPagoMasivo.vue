<template>
    <Encabezado titulo="Generar Complementos Masivos" subtitulo="Generación de complementos de pago para múltiples clientes" icono="pi pi-file" />

    <div class="card p-0 m-0 contenedor-principal">
        <!-- =====================================================
             FILTROS
        ====================================================== -->

        <form @submit.prevent="handleConsultar" class="filtros-pagos">
            <!-- EMPRESA -->

            <div class="campo-filtro">
                <label>Empresa</label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" @change="handleCambioEmpresa" />
            </div>

            <!-- TIPO -->

            <div class="campo-filtro">
                <label>Tipo</label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- COMPROBANTE -->

            <div class="campo-filtro">
                <label>Comprobante</label>

                <MultiSelect v-model="frmFiltros.tipoComprobante" :options="catTiposComprobantes" optionLabel="description" optionValue="id" placeholder="CFDI" display="chip" class="w-full" :invalid="!tipoComprobanteValido" />
            </div>

            <!-- FECHA INICIAL -->

            <div class="campo-filtro">
                <label>Inicial</label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :invalid="!fechaInicialValida" />
            </div>

            <!-- FECHA FINAL -->

            <div class="campo-filtro">
                <label>Final</label>

                <DatePicker v-model="frmFiltros.fechaFinal" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :minDate="frmFiltros.fechaInicial" :invalid="!fechaFinalValida" />
            </div>

            <!-- CONSULTAR -->

            <Button type="submit" class="btn-nuevo boton-filtro" :disabled="botonConsultarDeshabilitado" v-tooltip.top="'Consultar CFDI'">
                <template #icon>
                    <font-icon icon="fa-solid fa-magnifying-glass" />
                </template>
            </Button>

            <!-- LIMPIAR -->

            <Button type="button" class="btn-cancelar boton-filtro" @click="handleCancelar" v-tooltip.top="'Limpiar filtros'">
                <template #icon>
                    <font-icon icon="fa-solid fa-eraser" />
                </template>
            </Button>
        </form>

        <!-- =====================================================
             FILTRO EXCEL
        ====================================================== -->

        <div class="filtro-excel">
            <div class="filtro-excel-info">
                <div class="filtro-excel-icono">
                    <font-icon icon="fa-solid fa-file-excel" />
                </div>

                <div class="filtro-excel-texto">
                    <strong> Filtro por Excel </strong>

                    <span v-if="!frmFiltros.empresa"> Selecciona primero una empresa. </span>

                    <span v-else-if="!catCfdisOriginal.length"> Consulta los CFDI y después carga el archivo con serie y folio. </span>

                    <span v-else> Carga un archivo Excel con las columnas serie y folio. </span>
                </div>
            </div>

            <div v-if="filtroExcelActivo" class="filtro-excel-resumen">
                <div>
                    <span>Archivo</span>

                    <strong>
                        {{ archivoExcelNombre }}
                    </strong>
                </div>

                <div>
                    <span>Registros</span>

                    <strong>
                        {{ cantidadExcelRegistros }}
                    </strong>
                </div>

                <div class="excel-encontradas">
                    <span>Encontradas</span>

                    <strong>
                        {{ cantidadExcelEncontradas }}
                    </strong>
                </div>

                <div class="excel-no-encontradas">
                    <span>No encontradas</span>

                    <strong>
                        {{ cantidadExcelNoEncontradas }}
                    </strong>
                </div>

                <div class="excel-sin-saldo">
                    <span>Sin saldo</span>

                    <strong>
                        {{ cantidadExcelSinSaldo }}
                    </strong>
                </div>
            </div>

            <div class="filtro-excel-acciones">
                <input ref="inputExcel" type="file" accept=".xlsx,.xls" class="input-excel-oculto" @change="handleCargarExcel" />

                <!-- DESCARGAR LAYOUT -->

                <Button type="button" label="Descargar layout" class="btn-layout-excel" v-tooltip.top="'Descargar formato de Excel'" @click="handleDescargarLayoutExcel">
                    <template #icon>
                        <font-icon icon="fa-solid fa-download" class="mr-2" />
                    </template>
                </Button>

                <!-- CARGAR EXCEL -->

                <Button type="button" label="Cargar Excel" class="btn-excel" :disabled="!frmFiltros.empresa || !catCfdisOriginal.length" @click="handleAbrirExcel">
                    <template #icon>
                        <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
                    </template>
                </Button>

                <!-- QUITAR FILTRO -->

                <Button v-if="filtroExcelActivo" type="button" label="Quitar filtro" class="btn-quitar-excel" @click="handleQuitarFiltroExcel">
                    <template #icon>
                        <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <!-- =====================================================
             RESUMEN
        ====================================================== -->

        <div class="resumen-grid">
            <!-- MONTO -->

            <div class="resumen-card">
                <div class="resumen-icono monto">
                    <font-icon icon="fa-solid fa-dollar-sign" />
                </div>

                <div class="resumen-info">
                    <span> Monto Total </span>

                    <strong> $ {{ handleFormatMX(montoTotal) }} </strong>
                </div>
            </div>

            <!-- FACTURAS -->

            <div class="resumen-card">
                <div class="resumen-icono facturas">
                    <font-icon icon="fa-solid fa-file-invoice" />
                </div>

                <div class="resumen-info">
                    <span> Facturas seleccionadas </span>

                    <strong>
                        {{ cantidadFacturasSeleccionadas }}
                    </strong>
                </div>
            </div>

            <!-- CLIENTES -->

            <div class="resumen-card">
                <div class="resumen-icono clientes">
                    <font-icon icon="fa-solid fa-users" />
                </div>

                <div class="resumen-info">
                    <span> Clientes seleccionados </span>

                    <strong>
                        {{ cantidadClientesSeleccionados }}
                    </strong>
                </div>
            </div>

            <!-- COMPLEMENTOS -->

            <div class="resumen-card">
                <div class="resumen-icono complementos">
                    <font-icon icon="fa-solid fa-file-circle-check" />
                </div>

                <div class="resumen-info">
                    <span> Complementos a generar </span>

                    <strong>
                        {{ cantidadComplementosGenerar }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- =====================================================
             MODO DE GENERACION
        ====================================================== -->

        <div class="modo-generacion">
            <div class="modo-generacion-header">
                <div>
                    <span class="modo-generacion-titulo"> Modo de generación </span>

                    <span class="modo-generacion-subtitulo"> Define cómo se agruparán los CFDI seleccionados. </span>
                </div>
            </div>

            <div class="modo-generacion-opciones">
                <div
                    class="modo-opcion"
                    :class="{
                        activo: modoGeneracion === 'cliente_fecha'
                    }"
                    @click="modoGeneracion = 'cliente_fecha'"
                >
                    <RadioButton v-model="modoGeneracion" inputId="modo-cliente" name="modoGeneracion" value="cliente_fecha" />

                    <label for="modo-cliente">
                        <strong> Por cliente </strong>

                        <span> Agrupa todas las facturas seleccionadas del mismo cliente en un complemento. </span>
                    </label>
                </div>

                <div
                    class="modo-opcion"
                    :class="{
                        activo: modoGeneracion === 'factura'
                    }"
                    @click="modoGeneracion = 'factura'"
                >
                    <RadioButton v-model="modoGeneracion" inputId="modo-factura" name="modoGeneracion" value="factura" />

                    <label for="modo-factura">
                        <strong> Por factura </strong>

                        <span> Genera un complemento independiente por cada factura seleccionada. </span>
                    </label>
                </div>
            </div>
        </div>

        <!-- =====================================================
             DATOS DEL PAGO
        ====================================================== -->

        <div class="datos-pago">
            <!-- FECHA CFDI -->

            <div class="campo-filtro">
                <label> Fecha Factura </label>

                <DatePicker v-model="fechaHoraCfdi" showTime hourFormat="24" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :disabled="!cfdisSeleccionados.length" />
            </div>

            <!-- FECHA PAGO -->

            <div class="campo-filtro">
                <label> Fecha/Hora Pago </label>

                <DatePicker v-model="fechaHoraPago" showTime hourFormat="24" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :disabled="!cfdisSeleccionados.length" />
            </div>

            <!-- FORMA DE PAGO -->

            <div class="campo-filtro">
                <label> Forma de Pago </label>

                <Dropdown v-model="formaPago" :options="catFormaPago" optionLabel="description" optionValue="id" placeholder="Forma de pago" class="w-full" :disabled="!cfdisSeleccionados.length" />
            </div>

            <!-- BUSCADOR -->

            <div class="campo-filtro campo-busqueda">
                <label> Buscar </label>

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="filtros.global.value" placeholder="RFC, cliente, UUID, serie o folio..." class="w-full" />
                </IconField>
            </div>

            <!-- GENERAR -->

            <Button type="button" :label="labelBotonGenerar" class="btn-guardar btn-generar" :disabled="!pagoValido" :loading="generando" @click="handleGenerarPago">
                <template #icon>
                    <font-icon icon="fa-solid fa-file-invoice-dollar" class="mr-2" />
                </template>
            </Button>
        </div>

        <!-- =====================================================
             INFO RESULTADOS
        ====================================================== -->

        <div class="barra-resultados">
            <div>
                <i class="pi pi-info-circle"></i>

                <span>
                    {{ catCfdis.length }}
                    CFDI encontrados
                </span>

                <span v-if="filtroExcelActivo" class="resultado-excel-activo"> • Filtro Excel activo </span>
            </div>

            <div>
                <span> Orden: </span>

                <strong> Folio ascendente </strong>
            </div>
        </div>

        <!-- =====================================================
             TABLA
        ====================================================== -->

        <DataTable
            v-model:filters="filtros"
            :selection="cfdisSeleccionados"
            :value="catCfdis"
            dataKey="uuid"
            :globalFilterFields="['uuid', 'serie', 'folio', 'receptorRfc', 'receptorNombre']"
            paginator
            :rows="500"
            :rowsPerPageOptions="[500, 1000, 1500]"
            scrollable
            scrollHeight="39vh"
            size="small"
            tableStyle="min-width: 105rem"
            class="tabla-encabezados tabla-pagos"
            style="font-size: 10px"
            @update:selection="handleSeleccionCfdis"
        >
            <template #empty>
                <div class="sin-registros">
                    <i class="pi pi-inbox"></i>

                    <strong> No se encontraron CFDI </strong>

                    <span v-if="filtroExcelActivo"> Ninguno de los folios del Excel tiene saldo pendiente dentro de la consulta. </span>

                    <span v-else> Realiza una consulta para mostrar resultados. </span>
                </div>
            </template>

            <!-- SELECCION -->

            <Column selectionMode="multiple" headerStyle="width:3rem" />

            <!-- FOLIO -->

            <Column field="folio" header="Folio" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 80px" />

            <!-- SERIE -->

            <Column field="serie" header="Serie" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 65px" />

            <!-- FECHA -->

            <Column field="fecha" header="Fecha Factura" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 105px">
                <template #body="slotProps">
                    {{ handleFormatFecha(slotProps.data.fecha) }}
                </template>
            </Column>

            <!-- RFC CLIENTE -->

            <Column field="receptorRfc" header="RFC Cliente" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 135px" />

            <!-- CLIENTE -->

            <Column field="receptorNombre" header="Cliente" headerClass="encabezado-columna" style="min-width: 260px" />

            <!-- TOTAL -->

            <Column header="Total" headerClass="encabezado-columna" bodyClass="nowrap total-numero" style="min-width: 115px">
                <template #body="slotProps">
                    $
                    {{ handleFormatMX(slotProps.data.total) }}
                </template>
            </Column>

            <!-- PAGOS -->

            <Column header="# Pagos" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 75px">
                <template #body="slotProps">
                    <div class="celda-resaltada">
                        {{ slotProps.data.numeroPagos || 0 }}
                    </div>
                </template>
            </Column>

            <!-- RESTANTE -->

            <Column header="Restante" headerClass="encabezado-columna" bodyClass="nowrap total-numero" style="min-width: 120px">
                <template #body="slotProps">
                    <div class="celda-resaltada">
                        $
                        {{ handleFormatMX(slotProps.data.saldoInsolutoPagos) }}
                    </div>
                </template>
            </Column>

            <!-- PAGADO -->

            <Column header="Pagado" headerClass="encabezado-columna" bodyClass="nowrap total-numero" style="min-width: 115px">
                <template #body="slotProps">
                    <div class="celda-resaltada">
                        $
                        {{ handleFormatMX(slotProps.data.montoPagos) }}
                    </div>
                </template>
            </Column>

            <!-- ABONAR -->

            <Column header="Cantidad a abonar" headerClass="encabezado-columna" style="min-width: 150px">
                <template #body="slotProps">
                    <InputText
                        :modelValue="handleMontoAbonar(slotProps.data)"
                        :disabled="!handleEstaSeleccionado(slotProps.data)"
                        keyfilter="money"
                        placeholder="0.00"
                        class="input-abonar"
                        @update:modelValue="handleCambiarAbonar(slotProps.data, $event)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'SolicitudPagoMasivo',

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
