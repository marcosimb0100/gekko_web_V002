<template>
    <Encabezado titulo="Conciliación CFDI Bancaria" subtitulo="Relaciona facturas emitidas o recibidas con movimientos de todas las cuentas bancarias de la empresa" icono="pi pi-link" />

    <div class="card card-conciliacion">
        <div class="panel-filtros">
            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-file-invoice-dollar" />
                </div>

                <div>
                    <div class="titulo-filtros">Consulta de CFDI</div>

                    <div class="subtitulo-filtros">Selecciona empresa, tipo de factura y periodo. La búsqueda de bancos se realiza en todas las cuentas de la empresa.</div>
                </div>
            </div>

            <div class="separador"></div>

            <div class="grid-filtros">
                <div class="campo-filtro campo-empresa">
                    <label>Empresa</label>

                    <Dropdown v-model="empresaSeleccionada" :options="empresas" optionLabel="razon_social" placeholder="Seleccione una empresa" filter showClear class="w-full">
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>{{ slotProps.option.razon_social }}</strong>

                                <small>{{ slotProps.option.rfc }}</small>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div class="campo-filtro">
                    <label>Tipo</label>

                    <Dropdown v-model="tipo" :options="opcionesTipo" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="campo-filtro">
                    <label>Estado bancario</label>

                    <Dropdown v-model="estadoConciliacion" :options="opcionesEstado" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="campo-filtro campo-fecha">
                    <label>Fecha inicial</label>

                    <DatePicker v-model="fechaInicial" dateFormat="dd/mm/yy" showIcon :maxDate="fechaFinal" class="w-full" />
                </div>

                <div class="campo-filtro campo-fecha">
                    <label>Fecha final</label>

                    <DatePicker v-model="fechaFinal" dateFormat="dd/mm/yy" showIcon :minDate="fechaInicial" class="w-full" />
                </div>
            </div>

            <div class="acciones-filtros">
                <Button label="Limpiar" class="btn-cancelar" @click="handleLimpiar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-filter-circle-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button label="Consultar" class="btn-guardar" :loading="consultando" @click="handleConsultar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <div v-if="facturas.length" class="grid-resumen">
            <div class="tarjeta-resumen">
                <span>Facturas</span>

                <strong>{{ resumen.facturas }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Pendientes</span>

                <strong class="resumen-pendiente">{{ resumen.pendientes }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Parciales</span>

                <strong class="resumen-parcial">{{ resumen.parciales }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Conciliadas</span>

                <strong class="resumen-ok">{{ resumen.conciliadas }}</strong>
            </div>
        </div>

        <div class="contenedor-tabla">
            <div class="barra-tabla">
                <div class="barra-busqueda">
                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="filtros.global.value = null" />

                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                    </IconField>
                </div>

                <div class="acciones-tabla-superior">
                    <Button label="Conciliar global" icon="pi pi-bolt" class="btn-global" :disabled="!facturas.length" @click="handleAbrirGlobal" />

                    <span class="contador-registros">{{ facturas.length }} factura(s)</span>
                </div>
            </div>

            <DataTable
                v-model:filters="filtros"
                :value="facturas"
                :globalFilterFields="camposBusqueda"
                dataKey="uuid"
                paginator
                :rows="100"
                :rowsPerPageOptions="[50, 100, 250, 500]"
                scrollable
                scrollHeight="55vh"
                size="small"
                class="tabla-encabezados tabla-conciliacion-homologada"
                tableStyle="width: max-content; min-width: 100%; table-layout: auto;"
            >
                <template #empty>No se encontraron facturas para los filtros seleccionados.</template>

                <Column field="fecha" header="Fecha" style="min-width: 135px">
                    <template #body="slotProps">{{ fechaTexto(slotProps.data.fecha) }}</template>
                </Column>

                <Column header="Serie / Folio" style="min-width: 120px">
                    <template #body="slotProps">
                        <strong>{{ slotProps.data.serie || '-' }} {{ slotProps.data.folio || '' }}</strong>
                    </template>
                </Column>

                <Column header="Cliente / Proveedor" class="col-cliente-auto">
                    <template #body="slotProps">
                        <div class="contraparte">
                            <strong>{{ slotProps.data.nombre_contraparte || '-' }}</strong>

                            <small>{{ slotProps.data.rfc_contraparte || '-' }}</small>
                        </div>
                    </template>
                </Column>

                <Column field="metodo_pago" header="Método" style="width: 90px" />

                <Column header="Total" style="min-width: 125px">
                    <template #body="slotProps">
                        <span class="moneda">{{ moneda(slotProps.data.total) }}</span>
                    </template>
                </Column>

                <Column header="Pago CFDI" style="min-width: 125px">
                    <template #body="slotProps">
                        <span class="moneda">{{ moneda(slotProps.data.pagado_cfdi) }}</span>
                    </template>
                </Column>

                <Column header="Aplicado banco" style="min-width: 130px">
                    <template #body="slotProps">
                        <span class="moneda moneda-aplicada">{{ moneda(slotProps.data.aplicado_banco) }}</span>
                    </template>
                </Column>

                <Column header="Pendiente banco" style="min-width: 135px">
                    <template #body="slotProps">
                        <span class="moneda moneda-pendiente">{{ moneda(slotProps.data.pendiente_banco) }}</span>
                    </template>
                </Column>

                <Column header="Estado" style="min-width: 110px">
                    <template #body="slotProps">
                        <span :class="claseEstado(slotProps.data.estado_conciliacion_banco)">
                            {{ slotProps.data.estado_conciliacion_banco }}
                        </span>
                    </template>
                </Column>

                <Column header="Acciones" frozen alignFrozen="right" style="min-width: 190px">
                    <template #body="slotProps">
                        <div class="acciones-fila">
                            <Button size="small" label="Buscar banco" icon="pi pi-search" class="btn-buscar" :disabled="Number(slotProps.data.pendiente_banco) <= 0" @click="handleBuscarMovimientos(slotProps.data)" />

                            <Button v-if="slotProps.data.numero_conciliaciones > 0" size="small" icon="pi pi-eye" severity="secondary" text rounded v-tooltip.top="'Ver conciliaciones'" @click="handleVerDetalle(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <!-- BUSCAR / CONCILIAR MOVIMIENTOS -->

    <Dialog v-model:visible="mostrarDialogo" modal header="Buscar movimientos bancarios" :style="{ width: '92vw', maxWidth: '1500px' }" :draggable="false">
        <div v-if="facturaSeleccionada" class="factura-dialogo">
            <div>
                <span>Factura</span>

                <strong>{{ facturaSeleccionada.serie || '-' }} {{ facturaSeleccionada.folio }}</strong>
            </div>

            <div>
                <span>Contraparte</span>

                <strong>{{ facturaSeleccionada.nombre_contraparte }}</strong>
            </div>

            <div>
                <span>RFC</span>

                <strong>{{ facturaSeleccionada.rfc_contraparte }}</strong>
            </div>

            <div>
                <span>Total</span>

                <strong>{{ moneda(facturaSeleccionada.total) }}</strong>
            </div>

            <div>
                <span>Pendiente banco</span>

                <strong class="texto-rojo">{{ moneda(facturaSeleccionada.pendiente_banco) }}</strong>
            </div>
        </div>

        <Message severity="info" :closable="false" class="mb-3"> Gekko busca en todas las cuentas bancarias de la empresa. Para facturas emitidas busca ingresos; para recibidas busca egresos. </Message>

        <DataTable
            v-model:selection="movimientosSeleccionados"
            :value="movimientos"
            dataKey="_id"
            paginator
            :rows="25"
            :rowsPerPageOptions="[25, 50, 100]"
            scrollable
            scrollHeight="45vh"
            size="small"
            :loading="buscandoMovimientos"
            @row-select="handleToggleMovimiento($event.data)"
        >
            <template #empty>No se encontraron coincidencias bancarias con el nivel mínimo de coincidencia.</template>

            <Column selectionMode="multiple" headerStyle="width: 44px" />

            <Column field="fecha" header="Fecha" style="min-width: 105px" />

            <Column header="Banco / Cuenta" style="min-width: 190px">
                <template #body="slotProps">
                    <div class="contraparte">
                        <strong>{{ slotProps.data.banco || slotProps.data.clabe_cuenta?.substring(0, 3) }}</strong>

                        <small>{{ slotProps.data.cuenta_banco || slotProps.data.clabe_cuenta }}</small>
                    </div>
                </template>
            </Column>

            <Column field="descripcion" header="Descripción" style="min-width: 250px" />

            <Column field="referencia" header="Referencia" style="min-width: 120px" />

            <Column field="clave_rastreo" header="Clave rastreo" style="min-width: 175px" />

            <Column header="Movimiento" style="min-width: 125px">
                <template #body="slotProps">
                    <span class="moneda">{{ moneda(slotProps.data.monto_movimiento) }}</span>
                </template>
            </Column>

            <Column header="Disponible" style="min-width: 125px">
                <template #body="slotProps">
                    <span class="moneda moneda-aplicada">{{ moneda(slotProps.data.monto_disponible) }}</span>
                </template>
            </Column>

            <Column header="Coincidencia" style="min-width: 150px">
                <template #body="slotProps">
                    <div class="score-contenedor">
                        <span :class="claseScore(slotProps.data.score)">{{ slotProps.data.score }}%</span>

                        <small>{{ (slotProps.data.razones || []).join(' · ') }}</small>
                    </div>
                </template>
            </Column>

            <Column header="Monto a aplicar" style="min-width: 155px">
                <template #body="slotProps">
                    <InputNumber v-model="slotProps.data.monto_aplicar" mode="currency" currency="MXN" locale="es-MX" :min="0" :max="Number(slotProps.data.monto_disponible || 0)" :minFractionDigits="2" :maxFractionDigits="2" class="input-monto" />
                </template>
            </Column>
        </DataTable>

        <div class="resumen-dialogo">
            <div>
                <span>Pendiente factura</span>

                <strong>{{ moneda(pendienteFacturaDialogo) }}</strong>
            </div>

            <div>
                <span>Seleccionado</span>

                <strong>{{ moneda(totalSeleccionado) }}</strong>
            </div>

            <div :class="{ 'diferencia-ok': Math.abs(diferenciaSeleccion) <= 0.01 }">
                <span>Diferencia</span>

                <strong>{{ moneda(diferenciaSeleccion) }}</strong>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" outlined @click="mostrarDialogo = false" />

            <Button label="Conciliar" icon="pi pi-check" class="btn-conciliar" :loading="conciliando" :disabled="movimientosSeleccionados.length === 0" @click="handleConciliar" />
        </template>
    </Dialog>

    <!-- DETALLE DE CONCILIACIONES -->

    <Dialog v-model:visible="mostrarDetalle" modal header="Detalle de conciliación" :style="{ width: '86vw', maxWidth: '1250px' }" :draggable="false">
        <div v-if="facturaSeleccionada" class="factura-dialogo factura-dialogo-detalle">
            <div>
                <span>Factura</span>

                <strong>{{ facturaSeleccionada.serie || '-' }} {{ facturaSeleccionada.folio }}</strong>
            </div>

            <div>
                <span>Contraparte</span>

                <strong>{{ facturaSeleccionada.nombre_contraparte || '-' }}</strong>
            </div>

            <div>
                <span>RFC</span>

                <strong>{{ facturaSeleccionada.rfc_contraparte || '-' }}</strong>
            </div>

            <div>
                <span>Total</span>

                <strong>{{ moneda(facturaSeleccionada.total) }}</strong>
            </div>

            <div>
                <span>Aplicado banco</span>

                <strong class="texto-verde">{{ moneda(facturaSeleccionada.aplicado_banco) }}</strong>
            </div>

            <div>
                <span>Pendiente banco</span>

                <strong class="texto-rojo">{{ moneda(facturaSeleccionada.pendiente_banco) }}</strong>
            </div>
        </div>

        <Message severity="warn" :closable="false" class="mb-3"> Si una relación fue aplicada a la factura incorrecta, puedes desconciliarla. El movimiento bancario y el CFDI no se eliminan; solamente se desactiva la relación. </Message>

        <DataTable :value="detalleConciliaciones" dataKey="_id" size="small" paginator :rows="20" :rowsPerPageOptions="[20, 50, 100]" scrollable scrollHeight="42vh" :loading="consultandoDetalle">
            <template #empty>No existen conciliaciones activas para este CFDI.</template>

            <Column field="fecha" header="Fecha" style="min-width: 105px" />

            <Column field="descripcion" header="Descripción" style="min-width: 230px" />

            <Column field="referencia" header="Referencia" style="min-width: 130px" />

            <Column field="clave_rastreo" header="Clave rastreo" style="min-width: 180px" />

            <Column field="clabe_cuenta" header="Cuenta" style="min-width: 160px" />

            <Column header="Monto aplicado" style="min-width: 140px">
                <template #body="slotProps">
                    <strong class="texto-verde">{{ moneda(slotProps.data.monto_aplicado) }}</strong>
                </template>
            </Column>

            <Column header="Coincidencia" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <span :class="claseScore(slotProps.data.score)">{{ slotProps.data.score || 0 }}%</span>
                </template>
            </Column>

            <Column header="Acciones" style="min-width: 145px">
                <template #body="slotProps">
                    <Button label="Desconciliar" icon="pi pi-times-circle" severity="danger" size="small" outlined @click="handleSolicitarDesconciliar(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <Button label="Cerrar" severity="secondary" outlined @click="mostrarDetalle = false" />
        </template>
    </Dialog>

    <!-- CONFIRMAR DESCONCILIACIÓN -->

    <Dialog v-model:visible="mostrarConfirmarDesconciliar" modal header="Confirmar desconciliación" :style="{ width: '520px', maxWidth: '94vw' }" :draggable="false" :closable="!desconciliando">
        <div v-if="conciliacionSeleccionada" class="confirmacion-desconciliar">
            <div class="confirmacion-icono">
                <i class="pi pi-exclamation-triangle"></i>
            </div>

            <div class="confirmacion-texto">
                <strong>¿Deseas desconciliar este movimiento?</strong>

                <p>Se quitará únicamente la relación con la factura. El CFDI y el movimiento bancario permanecerán intactos.</p>
            </div>

            <div class="confirmacion-datos">
                <div>
                    <span>Factura</span>

                    <strong>{{ facturaSeleccionada?.serie || '-' }} {{ facturaSeleccionada?.folio || '' }}</strong>
                </div>

                <div>
                    <span>Movimiento</span>

                    <strong>{{ conciliacionSeleccionada.descripcion || '-' }}</strong>
                </div>

                <div>
                    <span>Fecha</span>

                    <strong>{{ conciliacionSeleccionada.fecha || '-' }}</strong>
                </div>

                <div>
                    <span>Monto aplicado</span>

                    <strong class="texto-rojo">{{ moneda(conciliacionSeleccionada.monto_aplicado) }}</strong>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" outlined :disabled="desconciliando" @click="mostrarConfirmarDesconciliar = false" />

            <Button label="Sí, desconciliar" icon="pi pi-times-circle" severity="danger" :loading="desconciliando" @click="handleDesconciliar" />
        </template>
    </Dialog>

    <!-- CONCILIACION GLOBAL -->

    <Dialog
        v-model:visible="mostrarGlobal"
        modal
        header="Conciliación global"
        :style="{ width: '94vw', maxWidth: '1450px' }"
        :draggable="false"
        :closable="!analizandoGlobal && !conciliandoGlobal"
        class="dialog-conciliacion-global"
        @hide="handleCerrarGlobal"
    >
        <div class="global-config">
            <div class="global-campo global-porcentaje">
                <label>Porcentaje mínimo de coincidencia</label>

                <InputNumber v-model="porcentajeGlobal" suffix="%" :min="72" :max="100" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="0" inputClass="w-full" />

                <small>El mínimo permitido es 72%.</small>
            </div>

            <div class="global-opciones">
                <div class="global-opcion">
                    <Checkbox v-model="soloMontoExactoGlobal" binary inputId="soloMontoExactoGlobal" />

                    <label for="soloMontoExactoGlobal">Sólo monto exacto</label>
                </div>

                <div class="global-opcion">
                    <Checkbox v-model="soloUnicosGlobal" binary inputId="soloUnicosGlobal" />

                    <label for="soloUnicosGlobal">Sólo coincidencias únicas</label>
                </div>
            </div>

            <div class="global-accion">
                <Button label="Analizar" icon="pi pi-search" class="btn-buscar" :loading="analizandoGlobal" @click="handleAnalizarGlobal" />
            </div>
        </div>

        <Message severity="info" :closable="false" class="mb-3"> El análisis no guarda cambios. Gekko preselecciona únicamente coincidencias consideradas conciliables; puedes revisar la lista antes de confirmar. </Message>

        <div v-if="resultadosGlobal.length || resumenGlobal.facturas_analizadas" class="global-resumen">
            <div class="tarjeta-resumen">
                <span>Analizadas</span>

                <strong>{{ resumenGlobal.facturas_analizadas }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Conciliables</span>

                <strong class="resumen-ok">{{ resumenGlobal.conciliables }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Ambiguas</span>

                <strong class="resumen-parcial">{{ resumenGlobal.ambiguas }}</strong>
            </div>

            <div class="tarjeta-resumen">
                <span>Sin coincidencia</span>

                <strong class="resumen-pendiente">{{ resumenGlobal.sin_coincidencia }}</strong>
            </div>
        </div>

        <DataTable
            v-if="resultadosGlobal.length"
            :value="resultadosGlobal"
            dataKey="uuid"
            paginator
            :rows="25"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            scrollable
            scrollHeight="300px"
            size="small"
            class="tabla-encabezados tabla-conciliacion-homologada tabla-global tabla-global-compacta"
            tableStyle="width: max-content; min-width: 100%; table-layout: auto;"
        >
            <Column headerStyle="width: 42px">
                <template #header>
                    <Checkbox :modelValue="todosGlobalSeleccionados" binary :disabled="!resultadosGlobal.some(puedeSeleccionarGlobal)" @update:modelValue="handleSeleccionarTodosGlobal" />
                </template>

                <template #body="slotProps">
                    <Checkbox :modelValue="estaSeleccionadoGlobal(slotProps.data)" binary :disabled="!puedeSeleccionarGlobal(slotProps.data)" @update:modelValue="(value) => handleSeleccionGlobal(slotProps.data, value)" />
                </template>
            </Column>

            <Column header="Factura" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <strong>{{ slotProps.data.serie || '-' }} {{ slotProps.data.folio || '' }}</strong>
                </template>
            </Column>

            <Column header="Cliente / Proveedor" class="col-cliente-auto">
                <template #body="slotProps">
                    <div class="contraparte">
                        <strong>{{ slotProps.data.nombre_contraparte || '-' }}</strong>

                        <small>{{ slotProps.data.rfc_contraparte || '-' }}</small>
                    </div>
                </template>
            </Column>

            <Column header="Pendiente" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <span class="moneda moneda-pendiente">{{ moneda(slotProps.data.pendiente_banco) }}</span>
                </template>
            </Column>

            <Column field="fecha_movimiento" header="Fecha banco" style="width: 1%; white-space: nowrap" />

            <Column header="Banco / Cuenta" style="width: 1%; min-width: 115px">
                <template #body="slotProps">
                    <div class="contraparte">
                        <strong>{{ slotProps.data.banco || '-' }}</strong>

                        <small>{{ slotProps.data.cuenta_banco || '-' }}</small>
                    </div>
                </template>
            </Column>

            <Column field="descripcion" header="Movimiento" style="width: 1%; min-width: 145px; white-space: normal" />

            <Column header="Monto banco" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <span class="moneda">{{ moneda(slotProps.data.monto_movimiento) }}</span>
                </template>
            </Column>

            <Column header="Coincidencia" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <span :class="claseScore(slotProps.data.score)">{{ slotProps.data.score || 0 }}%</span>
                </template>
            </Column>

            <Column header="Estado" style="width: 1%; white-space: nowrap">
                <template #body="slotProps">
                    <span :class="claseEstadoGlobal(slotProps.data.estado_global)">
                        {{ slotProps.data.estado_global }}
                    </span>
                </template>
            </Column>

            <Column field="motivo" header="Resultado" style="min-width: 220px; white-space: normal" />
        </DataTable>

        <template #footer>
            <div class="footer-global">
                <div class="global-seleccion">
                    <span>Seleccionadas</span>

                    <strong>{{ cantidadSeleccionadaGlobal }}</strong>
                </div>

                <Button label="Cancelar" severity="secondary" outlined :disabled="analizandoGlobal || conciliandoGlobal" @click="handleCerrarGlobal" />

                <Button label="Conciliar seleccionadas" icon="pi pi-check" class="btn-conciliar" :loading="conciliandoGlobal" :disabled="cantidadSeleccionadaGlobal === 0" @click="handleConciliarGlobal" />
            </div>
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'ConciliacionCfdiBancaria',

    components: { Encabezado },

    setup() {
        return { ...proceso() };
    }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
