<template>
    <Encabezado titulo="CFDI" subtitulo="Consulta de comprobantes fiscales" icono="pi pi-file">
        <Button type="button" label="Exportar Excel" class="btn-excel" :disabled="!catCfdisFiltrados.length" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- =========================================================
             FILTROS
        ========================================================== -->

        <form @submit.prevent="handleConsultar" class="filtros-cfdi">
            <!-- EMPRESA -->

            <div class="campo-filtro">
                <label> Empresa </label>

                <Dropdown v-model="frmFiltros.empresa" :options="catCompaniasSat" optionLabel="razon_social_nombre_completo" optionValue="rfc" placeholder="Empresa" filter class="w-full" />
            </div>

            <!-- TIPO -->

            <div class="campo-filtro">
                <label> Tipo </label>

                <Dropdown v-model="frmFiltros.tipo" :options="catTipo" optionLabel="description" optionValue="id" placeholder="Tipo" class="w-full" />
            </div>

            <!-- TIPO COMPROBANTE -->

            <div class="campo-filtro">
                <label> Comprobante </label>

                <MultiSelect v-model="frmFiltros.tipoComprobante" :options="catTiposComprobantes" optionLabel="description" optionValue="id" placeholder="CFDI" display="chip" class="w-full" :invalid="!tipoComprobanteValido" />
            </div>

            <!-- METODO PAGO -->

            <div class="campo-filtro">
                <label> Método </label>

                <MultiSelect v-model="frmFiltros.metodoPago" :options="catMetodoPago" optionLabel="paymentMethod" optionValue="id" placeholder="Método" display="chip" class="w-full" />
            </div>

            <!-- FECHA INICIAL -->

            <div class="campo-filtro">
                <label> Inicial </label>

                <DatePicker v-model="frmFiltros.fechaInicial" dateFormat="yy-mm-dd" showIcon class="w-full" :maxDate="fechaActual" :invalid="!fechaInicialValida" />
            </div>

            <!-- FECHA FINAL -->

            <div class="campo-filtro">
                <label> Final </label>

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

        <!-- =========================================================
             DESCARGA ZIP / BUSQUEDA
        ========================================================== -->

        <div class="barra-busqueda">
            <!-- IZQUIERDA -->

            <div class="acciones-cfdi">
                <Button type="button" label="Descargar XML" class="btn-descargar-zip" :disabled="!catCfdisFiltrados.length" @click="handleDescargarZip" v-tooltip.top="'Descargar CFDI filtrados en un archivo ZIP'">
                    <template #icon>
                        <font-icon icon="fa-solid fa-file-zipper" class="mr-2" />
                    </template>
                </Button>

                <span v-if="catCfdisFiltrados.length" class="contador-descarga">
                    {{ catCfdisFiltrados.length }}
                    CFDI
                </span>
            </div>

            <!-- DERECHA -->

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="ctrlBuscar" placeholder="UUID / Receptor / Emisor / Serie / Folio" class="buscador-cfdi" />
            </IconField>
        </div>

        <!-- =========================================================
             TABLA
        ========================================================== -->

        <DataTable
            :value="catCfdisFiltrados"
            paginator
            :rows="500"
            :rowsPerPageOptions="[500, 1000, 1500]"
            scrollable
            scrollHeight="46vh"
            size="small"
            tableStyle="width: 100%; table-layout: fixed"
            class="tabla-encabezados tabla-cfdi tabla-cfdi-compacta"
        >
            <template #empty>No se encontraron CFDI.</template>
            <Column header="Opciones" headerClass="encabezado-columna" style="width: 10%"
                ><template #body="slotProps">
                    <div class="acciones-tabla-cfdi">
                        <Button icon="pi pi-eye" outlined size="small" aria-label="Ver detalle del CFDI" v-tooltip.top="'Ver detalle'" @click="handleMostrarDetalle(slotProps.data)" />
                        <Button type="button" size="small" severity="help" v-tooltip.top="'Descargar XML'" @click="handleDescargaXml(slotProps.data)">
                            <template #icon>
                                <font-icon icon="fa-solid fa-cloud-arrow-down" />
                            </template>
                        </Button>

                        <span class="contenedor-boton-cancelacion" v-tooltip.top="mensajeBotonCancelacion(slotProps.data)">
                            <Button
                                type="button"
                                size="small"
                                severity="danger"
                                :disabled="cancelacionDeshabilitada(slotProps.data)"
                                :class="{
                                    'boton-cancelacion-bloqueado': cancelacionDeshabilitada(slotProps.data)
                                }"
                                @click="handleAbrirCancelacion(slotProps.data)"
                            >
                                <template #icon>
                                    <font-icon icon="fa-solid fa-ban" />
                                </template>
                            </Button>
                        </span></div></template
            ></Column>
            <Column header="Comprobante" headerClass="encabezado-columna" style="width: 24%">
                <template #body="{ data }"
                    ><div class="celda-cfdi">
                        <span class="etiqueta-celda">Comprobante</span><strong>{{ data.serie || 'Sin serie' }} / {{ data.folio || 'Sin folio' }}</strong
                        ><span class="uuid-cfdi">{{ data.uuid }}</span
                        ><small>{{ handleFormatFecha(data.fecha) }}</small>
                    </div></template
                >
            </Column>
            <Column header="Emisor" headerClass="encabezado-columna" style="width: 19%">
                <template #body="{ data }"
                    ><div class="celda-cfdi">
                        <span class="etiqueta-celda">Emisor</span><strong>{{ data.emisorNombre }}</strong
                        ><small>{{ data.emisorRfc }}</small>
                    </div></template
                >
            </Column>
            <Column header="Receptor" headerClass="encabezado-columna" style="width: 19%">
                <template #body="{ data }"
                    ><div class="celda-cfdi">
                        <span class="etiqueta-celda">Receptor</span><strong>{{ data.receptorNombre }}</strong
                        ><small>{{ data.receptorRfc }}</small>
                    </div></template
                >
            </Column>
            <Column header="Tipo / pago" headerClass="encabezado-columna" style="width: 8%">
                <template #body="{ data }"
                    ><div class="celda-cfdi">
                        <span class="etiqueta-celda">Tipo / pago</span><strong>{{ data.tipoDeComprobante }}</strong
                        ><small>{{ data.metodoPago || 'No aplica' }}</small>
                    </div></template
                >
            </Column>
            <Column header="Total" headerClass="encabezado-columna" bodyClass="total-cfdi" style="width: 12%"
                ><template #body="{ data }"><span class="etiqueta-celda">Total</span>$ {{ handleFormatMX(data.total) }}</template></Column
            >
            <Column header="Estatus" headerClass="encabezado-columna" style="width: 8%"
                ><template #body="{ data }"
                    ><span class="estatus-cfdi" :class="Number(data.estatusCFDI) === 1 ? 'estatus-vigente' : 'estatus-cancelado'">{{ Number(data.estatusCFDI) === 1 ? 'Vigente' : 'Cancelado' }}</span></template
                ></Column
            >
        </DataTable>
    </div>

    <Dialog v-model:visible="detalleVisible" header="Detalle del CFDI" modal :style="{ width: 'min(94vw, 860px)' }">
        <div class="detalle-cfdi-grid">
            <div v-for="campo in datosDetalle" :key="campo.label" class="detalle-cfdi-campo">
                <small>{{ campo.label }}</small
                ><strong>{{ campo.valor }}</strong>
            </div>
        </div>
        <template #footer><Button label="Cerrar" @click="handleCerrarDetalle" /></template>
    </Dialog>
    <!-- SOLICITUD DE CANCELACIÓN: solo registro, no ejecuta el SDK -->
    <Dialog v-model:visible="modalCancelacion" modal header="Solicitar cancelación de CFDI" :style="{ width: 'min(96vw, 580px)' }" :closable="!guardandoCancelacion" :closeOnEscape="!guardandoCancelacion" class="modal-cancelacion-cfdi">
        <div class="cancelacion-contenido" v-if="cfdiSeleccionado">
            <div class="cancelacion-aviso">Esta operación registra una solicitud pendiente en Gekko. No cancela todavía el CFDI ante el SAT.</div>
            <div class="cancelacion-resumen">
                <div>
                    <strong>UUID:</strong> <span class="cancelacion-uuid">{{ cfdiSeleccionado.uuid }}</span>
                </div>
                <div><strong>Emisor:</strong> {{ cfdiSeleccionado.emisorNombre || cfdiSeleccionado.emisorRfc }}</div>
                <div><strong>Receptor:</strong> {{ cfdiSeleccionado.receptorNombre || cfdiSeleccionado.receptorRfc }}</div>
                <div><strong>Serie / Folio:</strong> {{ cfdiSeleccionado.serie || '-' }} / {{ cfdiSeleccionado.folio || '-' }}</div>
            </div>
            <div class="campo-cancelacion">
                <label for="motivo-sat">Motivo SAT <span class="campo-obligatorio">*</span></label>
                <Dropdown inputId="motivo-sat" v-model="frmCancelacion.motivo_sat" :options="catMotivosCancelacion" optionLabel="label" optionValue="value" placeholder="Selecciona un motivo" class="w-full" :disabled="guardandoCancelacion" />
            </div>
            <div v-if="frmCancelacion.motivo_sat === '01'" class="campo-cancelacion">
                <label for="uuid-sustituto">UUID sustituto <span class="campo-obligatorio">*</span></label>
                <InputText id="uuid-sustituto" v-model="frmCancelacion.uuid_sustituto" class="w-full" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" :disabled="guardandoCancelacion" />
            </div>
            <div class="campo-cancelacion">
                <label for="observaciones-cancelacion">Observaciones</label>
                <Textarea id="observaciones-cancelacion" v-model="frmCancelacion.observaciones" rows="3" class="w-full" :maxlength="1000" :disabled="guardandoCancelacion" />
            </div>
        </div>
        <template #footer>
            <Button type="button" label="Cerrar" severity="secondary" outlined :disabled="guardandoCancelacion" @click="handleCerrarCancelacion" />
            <Button type="button" label="Registrar solicitud" severity="danger" :loading="guardandoCancelacion" :disabled="!puedeGuardarCancelacion" @click="handleGuardarCancelacion" />
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'Cfdis',

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
