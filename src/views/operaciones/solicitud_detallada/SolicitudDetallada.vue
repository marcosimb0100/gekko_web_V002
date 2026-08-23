<template>
    <Encabezado titulo="Solicitud Detallada" subtitulo="Captura de solicitudes CFDI" icono="pi pi-search" />

    <div class="card p-0 m-0" style="height: 72vh">
        <ScrollPanel style="height: 66vh">
            <form id="formSolicitudDetallada" @submit.prevent="handleGuardarSolicitud">
                <div class="solicitud-contenedor">
                    <!-- DATOS PRINCIPALES -->
                    <div class="bloque-formulario">
                        <div class="bloque-titulo">Datos principales</div>

                        <div class="grid-datos-principales">
                            <!-- CLIENTE -->
                            <div class="campo-formulario">
                                <label for="client_id">
                                    <span class="requerido">*</span>
                                    Cliente
                                </label>

                                <Dropdown
                                    id="client_id"
                                    v-model="frmSolicitud.client_id"
                                    :options="clientes"
                                    optionValue="_id"
                                    optionLabel="razon_social_nombre_completo"
                                    placeholder="Selecciona cliente"
                                    filter
                                    class="w-full"
                                    :invalid="!clienteValido"
                                    @change="handleCambioCliente"
                                />
                            </div>

                            <!-- EMPRESA -->
                            <div class="campo-formulario">
                                <label for="company_id">
                                    <span class="requerido">*</span>
                                    Empresa facturadora
                                </label>

                                <Dropdown
                                    id="company_id"
                                    v-model="frmSolicitud.company_id"
                                    :options="companias"
                                    optionValue="_id"
                                    optionLabel="razon_social_nombre_completo"
                                    placeholder="Selecciona empresa"
                                    filter
                                    class="w-full"
                                    :disabled="!frmSolicitud.client_id"
                                    :invalid="!companiaValida"
                                    @change="handleCambioCompania"
                                />
                            </div>

                            <!-- BANCO -->
                            <div class="campo-formulario">
                                <label for="bank_id">
                                    <span class="requerido">*</span>
                                    Cuenta bancaria
                                </label>

                                <Dropdown
                                    id="bank_id"
                                    v-model="frmSolicitud.bank_id"
                                    :options="bancos"
                                    optionValue="_id"
                                    optionLabel="cuenta_banco"
                                    placeholder="Selecciona cuenta"
                                    filter
                                    class="w-full"
                                    :disabled="!frmSolicitud.company_id"
                                    :invalid="!bancoValido"
                                >
                                    <template #option="slotProps">
                                        <div>
                                            <div>
                                                <strong>{{ slotProps.option.banco }}</strong>
                                            </div>

                                            <div style="font-size: 12px">
                                                {{ slotProps.option.cuenta_banco }}
                                            </div>

                                            <div style="font-size: 11px">CLABE: {{ slotProps.option.clabe_banco }}</div>
                                        </div>
                                    </template>

                                    <template #value="slotProps">
                                        <span v-if="slotProps.value">
                                            {{ handleBancoSeleccionado(slotProps.value) }}
                                        </span>

                                        <span v-else> Selecciona cuenta </span>
                                    </template>
                                </Dropdown>
                            </div>

                            <!-- USO CFDI -->
                            <div class="campo-formulario">
                                <label for="uso_cfdi">
                                    <span class="requerido">*</span>
                                    Uso CFDI
                                </label>

                                <Dropdown id="uso_cfdi" v-model="frmSolicitud.uso_cfdi" :options="usoCfdi" optionValue="uso_cfdi" optionLabel="descripcion_mostrar" placeholder="Selecciona uso CFDI" filter class="w-full" />
                            </div>

                            <!-- METODO PAGO -->
                            <div class="campo-formulario">
                                <label for="metodo_pago">
                                    <span class="requerido">*</span>
                                    Método de pago
                                </label>

                                <Dropdown id="metodo_pago" v-model="frmSolicitud.metodo_pago" :options="metodoPago" optionValue="metodo_pago" optionLabel="descripcion" placeholder="Selecciona método de pago" filter class="w-full" />
                            </div>

                            <!-- FORMA PAGO -->
                            <div class="campo-formulario">
                                <label for="forma_pago">
                                    <span class="requerido">*</span>
                                    Forma de pago
                                </label>

                                <Dropdown id="forma_pago" v-model="frmSolicitud.forma_pago" :options="formaPago" optionValue="forma_pago" optionLabel="descripcion" placeholder="Selecciona forma de pago" filter class="w-full" />
                            </div>

                            <!-- FECHA -->
                            <div class="campo-formulario">
                                <label for="fecha_factura"> Fecha Factura </label>

                                <DatePicker
                                    id="fecha_factura"
                                    v-model="frmSolicitud.fecha_factura"
                                    showTime
                                    hourFormat="24"
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    class="w-full"
                                    :minDate="fechaFacturaMinima"
                                    :maxDate="fechaFacturaMaxima"
                                    @date-select="handleValidarFecha"
                                />
                            </div>

                            <!-- ARCHIVO -->
                            <div class="campo-formulario">
                                <label> Comprobante Bancario </label>

                                <div class="archivo-contenedor">
                                    <FileUpload
                                        ref="archivoAdjuntoRef"
                                        mode="basic"
                                        name="archivo_adjunto"
                                        accept="image/*,.pdf"
                                        :chooseLabel="frmSolicitud.archivo_adjunto_nombre || 'Seleccionar imagen o PDF'"
                                        :auto="false"
                                        customUpload
                                        class="w-full"
                                        @select="handleArchivoAdjunto"
                                    />

                                    <Button v-if="frmSolicitud.archivo_adjunto" type="button" severity="danger" rounded text @click="handleQuitarArchivoAdjunto">
                                        <template #icon>
                                            <font-icon icon="fa-solid fa-xmark" />
                                        </template>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CONCEPTO -->
                    <div class="bloque-formulario">
                        <div class="bloque-titulo">Concepto CFDI</div>

                        <div class="grid-concepto">
                            <div class="campo-formulario">
                                <label for="concepto_id">
                                    <span class="requerido">*</span>
                                    Concepto
                                </label>

                                <Dropdown
                                    id="concepto_id"
                                    v-model="frmSolicitud.concepto_id"
                                    :options="conceptos"
                                    optionValue="_id"
                                    optionLabel="descripcion"
                                    placeholder="Selecciona concepto"
                                    filter
                                    class="w-full"
                                    :disabled="!frmSolicitud.company_id"
                                    :invalid="!conceptoValido"
                                    @change="handleCambioConcepto"
                                >
                                    <template #option="slotProps">
                                        <div class="concepto-opcion">
                                            <strong>
                                                {{ slotProps.option.prod_serv }}
                                            </strong>
                                            -
                                            {{ slotProps.option.descripcion }}
                                        </div>
                                    </template>
                                </Dropdown>
                            </div>

                            <div class="campo-formulario">
                                <label for="cantidad"> Cantidad </label>

                                <InputText id="cantidad" v-model="frmSolicitud.cantidad" keyfilter="num" placeholder="0" :disabled="!frmSolicitud.concepto_id" :invalid="!cantidadValida" @update:modelValue="handleCalcularImporte" />
                            </div>

                            <div class="campo-formulario">
                                <label for="valor_unitario"> Valor unitario </label>

                                <InputText
                                    id="valor_unitario"
                                    v-model="frmSolicitud.valor_unitario"
                                    keyfilter="money"
                                    placeholder="$0.00"
                                    :disabled="!frmSolicitud.concepto_id"
                                    :invalid="!valorUnitarioValido"
                                    @update:modelValue="handleCalcularImporte"
                                />
                            </div>

                            <Button type="button" severity="success" class="btn-agregar-concepto" :disabled="!puedeAgregarConcepto" @click="handleAgregarConcepto">
                                <template #icon>
                                    <font-icon icon="fa-solid fa-plus" />
                                </template>
                            </Button>
                        </div>
                    </div>

                    <!-- TABLA Y TOTALES -->
                    <div class="grid-tabla-totales">
                        <div class="tabla-conceptos">
                            <DataTable :value="frmSolicitud.conceptos" size="small" stripedRows scrollable scrollHeight="220px" class="tabla-encabezados">
                                <template #empty> Sin conceptos agregados. </template>

                                <Column field="prod_serv" header="Clave SAT" headerClass="encabezado-columna" />
                                <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" />
                                <Column field="clave_unidad" header="Clave Unidad" headerClass="encabezado-columna" />
                                <Column field="unidad" header="Unidad" headerClass="encabezado-columna" />
                                <Column field="cantidad" header="Cantidad" headerClass="encabezado-columna" />

                                <Column header="Valor Unitario" headerClass="encabezado-columna">
                                    <template #body="slotProps">
                                        {{ handleMoney4(slotProps.data.valor_unitario) }}
                                    </template>
                                </Column>

                                <Column header="Importe" headerClass="encabezado-columna">
                                    <template #body="slotProps">
                                        {{ handleMoney4(slotProps.data.importe) }}
                                    </template>
                                </Column>

                                <Column header="Traslados" headerClass="encabezado-columna">
                                    <template #body="slotProps">
                                        {{ handleMoney4(slotProps.data.total_traslados) }}
                                    </template>
                                </Column>

                                <Column header="Retenciones" headerClass="encabezado-columna">
                                    <template #body="slotProps">
                                        {{ handleMoney4(slotProps.data.total_retenciones) }}
                                    </template>
                                </Column>

                                <Column header="Total" headerClass="encabezado-columna">
                                    <template #body="slotProps">
                                        {{ handleMoney4(slotProps.data.total) }}
                                    </template>
                                </Column>

                                <Column header="Acciones" headerClass="encabezado-columna" style="width: 80px">
                                    <template #body="slotProps">
                                        <Button type="button" severity="danger" rounded text @click="handleEliminarConcepto(slotProps.data._id)">
                                            <template #icon>
                                                <font-icon icon="fa-solid fa-trash" />
                                            </template>
                                        </Button>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>

                        <div class="resumen-cfdi">
                            <div class="resumen-titulo">Resumen CFDI</div>

                            <div class="resumen-renglon">
                                <span>Subtotal:</span>
                                <strong>{{ handleMoney4(totalesSolicitud.subtotal) }}</strong>
                            </div>

                            <div class="resumen-renglon">
                                <span>Traslados:</span>
                                <strong>{{ handleMoney4(totalesSolicitud.traslados) }}</strong>
                            </div>

                            <div class="resumen-renglon">
                                <span>Retenciones:</span>
                                <strong>{{ handleMoney4(totalesSolicitud.retenciones) }}</strong>
                            </div>

                            <div class="resumen-separador"></div>

                            <div class="resumen-renglon resumen-total">
                                <span>Total:</span>
                                <strong>{{ handleMoney4(totalesSolicitud.total) }}</strong>
                            </div>

                            <Button type="submit" label="Guardar solicitud" class="w-full btn-guardar" :disabled="botonGuardarDeshabilitado">
                                <template #icon>
                                    <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'SolicitudDetallada',
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
