<template>
    <Encabezado titulo="Panel de Control" subtitulo="Administración de solicitudes" icono="pi pi-gauge" />

    <div class="card p-0 m-0" style="height: 72vh">
        <!-- FILTROS -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 15px 15px 10px 15px">
            <div style="display: flex; gap: 10px">
                <Dropdown v-model="tipoSolicitudFiltro" :options="tiposSolicitud" optionLabel="label" optionValue="value" placeholder="Tipo de solicitud" style="width: 220px" @change="handleRecargarSolicitudes" />

                <Dropdown v-model="estatusFiltro" :options="estatusSolicitud" optionLabel="label" optionValue="value" placeholder="Seleccione estatus" style="width: 200px" @change="handleRecargarSolicitudes" />

                <Dropdown v-model="empresaFiltro" :options="empresasFiltro" optionLabel="nombre" optionValue="_id" placeholder="Empresa emisora" showClear filter style="width: 280px" />
            </div>

            <div style="display: flex; gap: 8px; align-items: center">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="filtros.global.value" placeholder="Buscar..." style="width: 260px" />
                </IconField>
            </div>
        </div>

        <ScrollPanel style="height: 60vh">
            <DataTable
                v-model:filters="filtros"
                :value="solicitudesFiltradas"
                :globalFilterFields="['created_at', 'cliente', 'compania', 'uso_cfdi', 'banco', 'cuenta_banco', 'estatus']"
                paginator
                :rows="100"
                :rowsPerPageOptions="[100, 125, 150, 200]"
                scrollable
                scrollHeight="50vh"
                size="small"
                tableStyle="min-width: 95rem; font-size: 11px;"
                class="tabla-encabezados tabla-mesa-control"
            >
                <template #empty> No se encontraron solicitudes. </template>

                <Column field="created_at" header="Fecha" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 145px" />

                <Column field="compania" header="Empresa emisora" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 220px" />

                <Column field="cliente" header="Cliente" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 220px" />

                <Column field="uso_cfdi" header="Uso CFDI" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 95px" />

                <!-- <Column field="banco" header="Banco" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 90px" /> -->

                <!-- <Column field="cuenta_banco" header="Cuenta" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 135px" /> -->

                <Column field="cantidad_conceptos" header="Conceptos" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 95px" />

                <Column field="factura_serie" header="Factura Serie" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 95px" />
                <Column field="factura_folio" header="Factura Folio" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 95px" />

                <!-- <Column header="Subtotal" headerClass="encabezado-columna" bodyClass="col-no-wrap col-numero" style="min-width: 125px">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.subtotal) }}
                    </template>
                </Column> -->

                <!-- <Column header="Traslados" headerClass="encabezado-columna" bodyClass="col-no-wrap col-numero" style="min-width: 125px">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.traslados) }}
                    </template>
                </Column> -->

                <!-- <Column header="Retenciones" headerClass="encabezado-columna" bodyClass="col-no-wrap col-numero" style="min-width: 125px">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.retenciones) }}
                    </template>
                </Column> -->

                <Column header="Total" headerClass="encabezado-columna" bodyClass="col-no-wrap col-numero">
                    <template #body="slotProps">
                        {{ handleMoney(slotProps.data.total) }}
                    </template>
                </Column>

                <Column field="estatus" header="Estatus" headerClass="encabezado-columna" bodyClass="col-no-wrap" style="min-width: 100px" />

                <Column header="Opciones" frozen alignFrozen="right" headerClass="encabezado-columna" bodyClass="col-opciones" style="min-width: 260px">
                    <template #body="slotProps">
                        <div class="acciones-tabla">
                            <Button size="small" severity="info" v-tooltip.top="'Ver detalle'" @click="handleAbrirDetalle(slotProps.data)">
                                <font-icon :icon="['fas', 'eye']" />
                            </Button>

                            <Button v-if="slotProps.data.tiene_archivo" size="small" severity="secondary" v-tooltip.top="'Descargar archivo'" @click="handleDescargarArchivo(slotProps.data)">
                                <font-icon :icon="['fas', 'download']" />
                            </Button>

                            <Button size="small" severity="help" v-tooltip.top="'Descargar XML'" @click="handleDescargarXml(slotProps.data)">
                                <font-icon :icon="['fas', 'file-code']" />
                            </Button>

                            <Button size="small" severity="warn" v-tooltip.top="'Descargar PDF'" @click="handleDescargarPdf(slotProps.data)">
                                <font-icon :icon="['fas', 'file-pdf']" />
                            </Button>

                            <template v-if="estatusFiltro === 'pendiente'">
                                <Button size="small" severity="success" v-tooltip.top="'Aceptar'" @click="handleAceptarSolicitud(slotProps.data)">
                                    <font-icon :icon="['fas', 'check']" />
                                </Button>

                                <Button size="small" severity="danger" v-tooltip.top="'Rechazar'" @click="handleAbrirRechazo(slotProps.data)">
                                    <font-icon :icon="['fas', 'xmark']" />
                                </Button>

                                <Button v-if="tipoSolicitudFiltro === 'facturas'" size="small" severity="contrast" v-tooltip.top="'Editar conceptos'" @click="handleEditarConceptos(slotProps.data)">
                                    <font-icon :icon="['fas', 'pen-to-square']" />
                                </Button>
                            </template>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </ScrollPanel>
    </div>

    <Dialog v-model:visible="dialogDetalle" modal header="Detalle de solicitud" :style="{ width: '86vw' }" :breakpoints="{ '1200px': '92vw', '768px': '96vw' }" class="dialog-detalle">
        <div v-if="solicitudDetalle" class="detalle-solicitud">
            <!-- DATOS GENERALES -->
            <div class="detalle-datos">
                <div class="detalle-item">
                    <span class="detalle-label">Cliente</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.cliente || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label">Empresa emisora</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.compania || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label">Uso CFDI</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.uso_cfdi || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label">Banco</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.banco || '-' }}
                        <span v-if="solicitudDetalle.cuenta_banco"> - {{ solicitudDetalle.cuenta_banco }} </span>
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label">CLABE</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.clabe_banco || '-' }}
                    </span>
                </div>

                <div class="detalle-item">
                    <span class="detalle-label">Fecha</span>
                    <span class="detalle-valor">
                        {{ solicitudDetalle.created_at || '-' }}
                    </span>
                </div>
            </div>

            <!-- CONCEPTOS -->
            <div class="detalle-seccion">
                <div class="detalle-seccion-titulo">
                    <font-icon icon="fa-solid fa-list" />
                    Conceptos
                </div>

                <DataTable :value="solicitudDetalle.conceptos ?? []" size="small" stripedRows scrollable scrollHeight="300px" class="tabla-detalle" tableStyle="min-width: 80rem">
                    <template #empty> Sin conceptos. </template>

                    <Column field="prod_serv" header="Clave SAT" bodyClass="nowrap" />

                    <Column field="descripcion" header="Descripción" style="min-width: 360px" />

                    <Column field="clave_unidad" header="Clave Unidad" bodyClass="nowrap" />

                    <Column field="unidad" header="Unidad" bodyClass="nowrap" />

                    <Column field="cantidad" header="Cantidad" bodyClass="nowrap text-right" />

                    <Column header="Valor Unitario" bodyClass="nowrap text-right">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.valor_unitario) }}
                        </template>
                    </Column>

                    <Column header="Importe" bodyClass="nowrap text-right">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.importe) }}
                        </template>
                    </Column>

                    <Column header="Traslados" bodyClass="nowrap text-right">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.total_traslados) }}
                        </template>
                    </Column>

                    <Column header="Retenciones" bodyClass="nowrap text-right">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.total_retenciones) }}
                        </template>
                    </Column>

                    <Column header="Total" bodyClass="nowrap text-right">
                        <template #body="slotProps">
                            {{ handleMoney(slotProps.data.total) }}
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- PIE -->
            <div class="detalle-pie">
                <!-- DESCARGAS -->
                <div class="detalle-acciones">
                    <Button v-if="solicitudDetalle.tiene_archivo" type="button" label="Archivo adjunto" severity="secondary" outlined @click="handleDescargarArchivo(solicitudDetalle)">
                        <template #icon>
                            <font-icon icon="fa-solid fa-download" class="mr-2" />
                        </template>
                    </Button>

                    <Button type="button" label="XML CFDI" severity="help" outlined @click="handleDescargarXml(solicitudDetalle)">
                        <template #icon>
                            <font-icon icon="fa-solid fa-file-code" class="mr-2" />
                        </template>
                    </Button>

                    <Button type="button" label="PDF" severity="warn" outlined @click="handleDescargarPdf(solicitudDetalle)">
                        <template #icon>
                            <font-icon icon="fa-solid fa-file-pdf" class="mr-2" />
                        </template>
                    </Button>
                </div>

                <!-- TOTALES -->
                <div class="detalle-totales">
                    <div class="total-renglon">
                        <span>Subtotal</span>
                        <strong>{{ handleMoney(solicitudDetalle.subtotal) }}</strong>
                    </div>

                    <div class="total-renglon">
                        <span>Traslados</span>
                        <strong>{{ handleMoney(solicitudDetalle.traslados) }}</strong>
                    </div>

                    <div class="total-renglon">
                        <span>Retenciones</span>
                        <strong>{{ handleMoney(solicitudDetalle.retenciones) }}</strong>
                    </div>

                    <div class="total-separador"></div>

                    <div class="total-renglon total-final">
                        <span>Total</span>
                        <strong>{{ handleMoney(solicitudDetalle.total) }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </Dialog>

    <!-- RECHAZO -->
    <Dialog v-model:visible="dialogRechazo" modal header="Rechazar solicitud" :style="{ width: '420px' }">
        <div style="display: flex; flex-direction: column; gap: 8px">
            <label>Motivo de rechazo</label>

            <Textarea v-model="motivoRechazo" rows="4" autoResize placeholder="Escribe el motivo de rechazo" />
        </div>

        <template #footer>
            <Button type="button" label="Cancelar" severity="secondary" outlined @click="handleCerrarRechazo" />

            <Button type="button" label="Rechazar" severity="danger" @click="handleRechazarSolicitud">
                <template #icon><font-icon :icon="['fas', 'xmark']" class="mr-2" /></template>
            </Button>
        </template>
    </Dialog>

    <!-- EDITAR CONCEPTOS -->
    <Dialog v-model:visible="dialogEditarConceptos" modal header="Editar conceptos" :style="{ width: '90vw' }">
        <div style="display: grid; gap: 14px">
            <div style="padding: 12px; border: 1px solid #ddd; border-radius: 10px">
                <div style="font-weight: 700; margin-bottom: 10px">Agregar concepto</div>

                <div style="display: grid; grid-template-columns: 1fr 120px 160px 44px; gap: 10px; align-items: end">
                    <div style="display: flex; flex-direction: column; gap: 8px">
                        <label>Concepto</label>

                        <Dropdown v-model="conceptoNuevoId" :options="conceptosDisponibles" optionValue="_id" optionLabel="descripcion" placeholder="Selecciona concepto" filter class="w-full" />
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px">
                        <label>Cantidad</label>

                        <InputText v-model="cantidadNuevo" keyfilter="num" placeholder="0" />
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px">
                        <label>Valor unitario</label>

                        <InputText v-model="valorUnitarioNuevo" keyfilter="money" placeholder="$0.00" />
                    </div>

                    <Button type="button" icon="pi pi-plus" severity="success" style="width: 44px; height: 44px" @click="handleAgregarConceptoEditable" />
                </div>
            </div>

            <DataTable :value="conceptosEditables" size="small" stripedRows scrollable scrollHeight="330px">
                <Column field="prod_serv" header="Clave SAT" />
                <Column field="descripcion" header="Descripción" />
                <Column field="clave_unidad" header="Clave Unidad" />
                <Column field="unidad" header="Unidad" />

                <Column header="Cantidad">
                    <template #body="slotProps">
                        <InputText :modelValue="slotProps.data.cantidad" keyfilter="num" style="width: 100%" @update:modelValue="handleCambiarConceptoEditable(slotProps.index, 'cantidad', $event)" />
                    </template>
                </Column>

                <Column header="Valor unitario">
                    <template #body="slotProps">
                        <InputText :modelValue="slotProps.data.valor_unitario" keyfilter="money" style="width: 100%" @update:modelValue="handleCambiarConceptoEditable(slotProps.index, 'valor_unitario', $event)" />
                    </template>
                </Column>

                <Column header="Importe">
                    <template #body="slotProps"> ${{ Number(slotProps.data.importe || 0).toFixed(4) }} </template>
                </Column>

                <Column header="Traslados">
                    <template #body="slotProps"> ${{ Number(slotProps.data.total_traslados || 0).toFixed(4) }} </template>
                </Column>

                <Column header="Retenciones">
                    <template #body="slotProps"> ${{ Number(slotProps.data.total_retenciones || 0).toFixed(4) }} </template>
                </Column>

                <Column header="Total">
                    <template #body="slotProps"> ${{ Number(slotProps.data.total || 0).toFixed(4) }} </template>
                </Column>

                <Column header="Acciones">
                    <template #body="slotProps">
                        <Button type="button" icon="pi pi-trash" severity="danger" rounded text @click="handleEliminarConceptoEditable(slotProps.index)" />
                    </template>
                </Column>
            </DataTable>

            <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #ddd; padding-top: 12px">
                <Button type="button" label="Cancelar" severity="secondary" outlined @click="dialogEditarConceptos = false" />

                <Button type="button" label="Guardar cambios" icon="pi pi-save" @click="handleGuardarConceptosEditados" />
            </div>
        </div>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'PanelControl',
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
