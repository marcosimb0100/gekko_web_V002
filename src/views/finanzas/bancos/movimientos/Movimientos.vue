<template>
    <Encabezado titulo="Movimientos Bancarios" subtitulo="Consulta y exportación de movimientos de estados de cuenta" icono="pi pi-money-bill">
        <Button type="button" label="Exportar Excel" class="btn-exportar" :disabled="bloqueado || movimientos.length === 0" @click="handleExportarExcel">
            <template #icon>
                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card card-movimientos">
        <!-- =====================================================
             FILTROS
             ===================================================== -->

        <div class="panel-filtros">
            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-building-columns" />
                </div>

                <div>
                    <div class="titulo-filtros">Consulta de Movimientos Bancarios</div>

                    <div class="subtitulo-filtros">Selecciona empresa, cuenta bancaria y periodo a consultar.</div>
                </div>
            </div>

            <div class="separador"></div>

            <div class="grid-filtros">
                <!-- EMPRESA -->

                <div class="campo-filtro campo-empresa">
                    <label> Empresa </label>

                    <Dropdown
                        v-model="empresaSeleccionada"
                        :options="empresas"
                        optionLabel="razon_social"
                        placeholder="Seleccione una empresa"
                        filter
                        showClear
                        :loading="cargandoEmpresas"
                        :disabled="filtrosBloqueados"
                        class="w-full"
                        @change="handleCambiarEmpresa"
                    >
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>
                                    {{ slotProps.option.razon_social }}
                                </strong>

                                <small>
                                    RFC:
                                    {{ slotProps.option.rfc || 'Sin RFC' }}
                                </small>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <!-- CUENTA -->

                <div class="campo-filtro campo-cuenta">
                    <label> Banco / Cuenta Bancaria </label>

                    <Dropdown
                        v-model="cuentaSeleccionada"
                        :options="cuentasBancarias"
                        placeholder="Seleccione una cuenta bancaria"
                        filter
                        showClear
                        :loading="cargandoCuentas"
                        :disabled="!empresaSeleccionada || filtrosBloqueados"
                        class="w-full"
                        @change="handleCambiarCuenta"
                    >
                        <template #option="slotProps">
                            <div class="opcion-cuenta">
                                <div class="opcion-cuenta-superior">
                                    <span class="clave-banco">
                                        {{ slotProps.option.clave_banco }}
                                    </span>

                                    <div class="datos-opcion-cuenta">
                                        <strong>
                                            {{ slotProps.option.banco }}
                                        </strong>

                                        <small>
                                            Cuenta:
                                            {{ slotProps.option.cuenta_banco || 'Sin número' }}
                                        </small>
                                    </div>
                                </div>

                                <small class="clabe-opcion">
                                    CLABE:
                                    {{ slotProps.option.clabe_bancaria }}
                                </small>
                            </div>
                        </template>

                        <template #value="slotProps">
                            <span v-if="!slotProps.value">
                                {{ slotProps.placeholder }}
                            </span>

                            <div v-else class="valor-cuenta">
                                <strong>
                                    {{ slotProps.value.clave_banco }}
                                </strong>

                                <span>
                                    {{ slotProps.value.banco }}
                                </span>

                                <span class="cuenta-separador"> - </span>

                                <span>
                                    {{ slotProps.value.cuenta_banco || 'Sin cuenta' }}
                                </span>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <!-- FECHA INICIAL -->

                <div class="campo-filtro">
                    <label> Fecha Inicial </label>

                    <Calendar v-model="fechaInicial" dateFormat="dd/mm/yy" showIcon :showOnFocus="false" :maxDate="fechaFinal" :disabled="filtrosBloqueados" class="w-full" />
                </div>

                <!-- FECHA FINAL -->

                <div class="campo-filtro">
                    <label> Fecha Final </label>

                    <Calendar v-model="fechaFinal" dateFormat="dd/mm/yy" showIcon :showOnFocus="false" :minDate="fechaInicial" :disabled="filtrosBloqueados" class="w-full" />
                </div>
            </div>

            <div class="acciones-filtros">
                <Button type="button" label="Limpiar" class="btn-cancelar" :disabled="bloqueado" @click="handleRestablecer">
                    <template #icon>
                        <font-icon icon="fa-solid fa-filter-circle-xmark" class="mr-2" />
                    </template>
                </Button>

                <Button type="button" label="Consultar" class="btn-guardar" :loading="consultando" :disabled="!empresaSeleccionada || !cuentaSeleccionada || !fechaInicial || !fechaFinal || filtrosBloqueados" @click="handleConsultar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <!-- =====================================================
             RESULTADO
             ===================================================== -->

        <template v-if="consultado">
            <!-- RESUMEN -->

            <div class="grid-resumen">
                <div class="tarjeta-resumen">
                    <span> Movimientos </span>

                    <strong>
                        {{ resumen.movimientos }}
                    </strong>
                </div>

                <div class="tarjeta-resumen">
                    <span> Ingresos </span>

                    <strong class="importe-ingreso">
                        {{ handleFormatoMoneda(resumen.total_ingresos) }}
                    </strong>
                </div>

                <div class="tarjeta-resumen">
                    <span> Egresos </span>

                    <strong class="importe-egreso">
                        {{ handleFormatoMoneda(resumen.total_egresos) }}
                    </strong>
                </div>

                <div class="tarjeta-resumen">
                    <span> Banco / Cuenta </span>

                    <strong>
                        {{ cuentaSeleccionada?.clave_banco }}
                        -
                        {{ cuentaSeleccionada?.banco }}
                    </strong>

                    <small>
                        {{ cuentaSeleccionada?.cuenta_banco || handleCuentaEnmascarada(cuentaSeleccionada?.clabe_bancaria) }}
                    </small>
                </div>
            </div>

            <!-- =================================================
                 TABLA
                 ================================================= -->

            <div class="contenedor-tabla">
                <!-- BARRA SUPERIOR -->

                <div class="barra-tabla">
                    <!-- BUSCADOR -->

                    <div class="barra-busqueda">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined :disabled="bloqueado" @click="handleLimpiarFiltrosTabla" />

                        <IconField iconPosition="left">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>

                            <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" :disabled="bloqueado" />
                        </IconField>
                    </div>

                    <!-- =================================================
                         CONCEPTO CONCILIACIÓN
                         ================================================= -->

                    <div class="barra-conciliacion">
                        <div class="campo-concepto">
                            <span class="titulo-concepto"> Concepto Conciliación </span>

                            <TreeSelect
                                v-model="conceptoSeleccionado"
                                :options="conceptosDisponibles"
                                placeholder="Seleccione un concepto"
                                class="selector-concepto"
                                filter
                                :loading="cargandoConceptos"
                                :disabled="bloqueado || movimientosSeleccionados.length === 0"
                            />
                        </div>

                        <Button
                            type="button"
                            label="Aplicar"
                            icon="pi pi-check"
                            class="btn-aplicar-concepto"
                            :loading="aplicandoConcepto"
                            :disabled="bloqueado || !conceptoSeleccionado || movimientosSeleccionados.length === 0"
                            @click="handleAplicarConcepto"
                        />

                        <Button label="Nota" icon="pi pi-comment" outlined :disabled="bloqueado || !movimientosSeleccionados.length" @click="handleAbrirNota()" />

                        <span v-if="movimientosSeleccionados.length > 0" class="contador-seleccionados">
                            {{ movimientosSeleccionados.length }}
                            seleccionado(s)
                        </span>
                    </div>

                    <!-- EXPORTAR -->

                    <div class="acciones-tabla-superior">
                        <span class="contador-registros">
                            {{ movimientos.length }}
                            movimiento(s)
                        </span>

                        <Button type="button" label="Exportar Excel" class="btn-exportar-tabla" :disabled="bloqueado || movimientos.length === 0" @click="handleExportarExcel">
                            <template #icon>
                                <font-icon icon="fa-solid fa-file-excel" class="mr-2" />
                            </template>
                        </Button>
                    </div>
                </div>

                <!-- =================================================
                     DATATABLE
                     ================================================= -->

                <DataTable
                    :loading="consultando || aplicandoConcepto"
                    :inert="bloqueado ? true : undefined"
                    :aria-busy="bloqueado"
                    v-model:filters="filtros"
                    v-model:selection="movimientosSeleccionados"
                    :value="movimientos"
                    :globalFilterFields="camposBusqueda"
                    dataKey="_id"
                    paginator
                    :rows="100"
                    :rowsPerPageOptions="[50, 100, 250, 500, 700]"
                    scrollable
                    scrollHeight="55vh"
                    size="small"
                    class="tabla-encabezados tabla-movimientos-homologada"
                    tableStyle="
                        width: 100%;
                        table-layout: fixed;
                    "
                >
                    <template #empty> No se encontraron movimientos para el periodo seleccionado. </template>

                    <!-- SELECCIÓN -->

                    <Column
                        selectionMode="multiple"
                        headerStyle="
                            width: 36px;
                            max-width: 36px;
                        "
                        bodyStyle="
                            width: 36px;
                            max-width: 36px;
                        "
                    />

                    <!-- COLUMNAS -->

                    <Column v-for="columna in columnasMovimientos" :key="columna.field" :field="columna.field" :header="columna.header" :headerClass="['nota', 'facturas'].includes(columna.tipo) ? 'encabezado-columna encabezado-nota' : 'encabezado-columna'" :bodyClass="['nota', 'facturas'].includes(columna.tipo) ? 'celda-nota' : undefined" :style="columna.style">
                        <template #body="slotProps">
                            <!-- MONEDA -->
                            <span v-if="columna.tipo === 'moneda'" :class="handleClaseImporte(columna.field, slotProps.data[columna.field])">
                                {{ handleFormatoMoneda(slotProps.data[columna.field]) }}
                            </span>

                            <!-- CONCEPTO CONCILIACIÓN -->
                            <Button v-else-if="columna.tipo === 'facturas'" unstyled class="boton-nota boton-facturas" :class="{ 'nota-presente': slotProps.data.facturas_relacionadas > 0 }" :title="`${slotProps.data.facturas_relacionadas || 0} facturas relacionadas`" :aria-label="`${slotProps.data.facturas_relacionadas || 0} facturas relacionadas`" :disabled="bloqueado || cargandoFacturas" @click="handleAbrirFacturas(slotProps.data)"><i class="pi pi-copy"></i><small v-if="slotProps.data.facturas_relacionadas">{{ slotProps.data.facturas_relacionadas }}</small></Button>
                            <Button v-else-if="columna.tipo === 'nota'" icon="pi pi-file-edit" unstyled class="boton-nota" :class="{ 'nota-presente': !!slotProps.data.nota_movimiento }" :severity="slotProps.data.nota_movimiento ? 'info' : 'secondary'" :title="slotProps.data.nota_movimiento ? 'Ver o editar nota' : 'Agregar nota'" :aria-label="slotProps.data.nota_movimiento ? 'Ver o editar nota' : 'Agregar nota'" :disabled="bloqueado" @click="handleAbrirNota(slotProps.data)" />

                            <div v-else-if="columna.tipo === 'conciliacion'" class="celda-conciliacion">
                                <span v-if="slotProps.data.conciliacion" class="concepto-conciliado" v-tooltip.top="handleNombreConciliacion(slotProps.data.conciliacion)">
                                    <i class="pi pi-check-circle"></i>

                                    {{ handleNombreConciliacion(slotProps.data.conciliacion) }}
                                </span>

                                <span v-else class="sin-conciliar"> Sin conciliar </span>
                            </div>

                            <!-- TEXTO -->
                            <span v-else class="texto-celda" v-tooltip.top="String(slotProps.data[columna.field] ?? '-')">
                                {{ slotProps.data[columna.field] ?? '-' }}
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </template>
    </div>
    <Dialog v-model:visible="mostrarFacturas" modal header="Facturas relacionadas" :style="{ width: '62rem', maxWidth: '95vw' }">
        <p class="nota-resumen">{{ movimientoFacturas?.fecha_hora }} &middot; {{ movimientoFacturas?.descripcion }}</p>
        <Message v-if="errorFacturas" severity="error" :closable="false">{{ errorFacturas }}</Message>
        <DataTable :value="facturasRelacionadas" :loading="cargandoFacturas" paginator :rows="10" dataKey="uuid" class="tabla-encabezados" :tableStyle="{ tableLayout: 'fixed', width: '100%' }">
            <template #empty>No hay facturas relacionadas con este movimiento.</template>
            <Column header="Comprobante"><template #body="{ data }"><strong>{{ data.serie }} / {{ data.folio }}</strong><div class="factura-uuid">{{ data.uuid }}</div></template></Column>
            <Column field="emisor" header="Emisor" />
            <Column field="receptor" header="Receptor" />
            <Column header="Total factura"><template #body="{ data }">{{ data.total === null ? 'Sin dato' : handleFormatoMoneda(data.total) }}</template></Column>
            <Column header="Aplicado al movimiento"><template #body="{ data }">{{ handleFormatoMoneda(data.aplicado) }}</template></Column>
        </DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarFacturas = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarNota" modal header="Nota del movimiento" :style="{ width: '36rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!guardandoNota">
        <p v-if="movimientosNota.length === 1" class="nota-resumen">{{ movimientosNota[0].fecha_hora }} &middot; {{ movimientosNota[0].descripcion }}</p>
        <p v-else>La misma nota se guardar&aacute; en {{ movimientosNota.length }} movimientos seleccionados.</p>
        <Message v-if="errorNota" severity="error" :closable="false">{{ errorNota }}</Message>
        <label for="nota-movimiento">Nota</label>
        <Textarea inputId="nota-movimiento" id="nota-movimiento" v-model="textoNota" rows="5" maxlength="1000" class="w-full nota-texto" :disabled="guardandoNota" />
        <small>{{ textoNota.length }}/1000 caracteres. Deja el campo vac&iacute;o para retirar la nota.</small>
        <div v-if="requiereReemplazo" class="nota-confirmacion"><Checkbox inputId="reemplazar-notas" v-model="reemplazarNotas" binary :disabled="guardandoNota" /><label for="reemplazar-notas">Confirmo reemplazar las notas existentes en los movimientos seleccionados.</label></div>
        <p v-if="movimientosNota.length === 1 && movimientosNota[0].nota_usuario" class="nota-resumen">&Uacute;ltima modificaci&oacute;n por {{ movimientosNota[0].nota_usuario }}.</p>
        <template #footer><Button label="Cancelar" outlined :disabled="guardandoNota" @click="mostrarNota = false" /><Button label="Guardar" icon="pi pi-save" :loading="guardandoNota" :disabled="bloqueado || (requiereReemplazo && !reemplazarNotas)" @click="handleGuardarNota" /></template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'MovimientosBancarios',

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
