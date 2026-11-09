<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Historial de Cargas" subtitulo="Consulta y administración de estados de cuenta cargados" icono="pi pi-history">
        <Button type="button" label="Actualizar" class="btn-nuevo" :loading="cargando" @click="handleCargarHistorial">
            <template #icon>
                <font-icon icon="fa-solid fa-rotate" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <!-- ========================================================= -->
    <!-- CONTENIDO -->
    <!-- ========================================================= -->

    <div class="card card-historial">
        <!-- ===================================================== -->
        <!-- FILTROS -->
        <!-- ===================================================== -->

        <div class="contenedor-filtros">
            <div class="encabezado-filtros">
                <div class="icono-filtros">
                    <font-icon icon="fa-solid fa-clock-rotate-left" />
                </div>

                <div>
                    <div class="titulo-filtros">Historial de Estados de Cuenta</div>

                    <div class="subtitulo-filtros">Consulta los archivos guardados y revierte cargas incorrectas.</div>
                </div>
            </div>

            <div class="separador"></div>

            <!-- ================================================= -->
            <!-- CAMPOS -->
            <!-- ================================================= -->

            <div class="grid-filtros">
                <!-- EMPRESA -->

                <div class="campo-filtro">
                    <label> Empresa </label>

                    <Dropdown v-model="empresaFiltro" :options="empresas" optionLabel="nombre" placeholder="Todas las empresas" filter showClear class="w-full">
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>
                                    {{ slotProps.option.nombre }}
                                </strong>

                                <small>
                                    {{ slotProps.option.rfc || 'Sin RFC' }}
                                </small>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <!-- BANCO -->

                <div class="campo-filtro">
                    <label> Banco </label>

                    <Dropdown v-model="bancoFiltro" :options="bancos" optionLabel="label" placeholder="Todos los bancos" filter showClear class="w-full" />
                </div>

                <!-- AÑO -->

                <div class="campo-filtro">
                    <label> Año </label>

                    <Dropdown v-model="anioFiltro" :options="anios" optionLabel="label" optionValue="value" placeholder="Todos" showClear class="w-full" />
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- RESUMEN -->
        <!-- ===================================================== -->

        <div class="grid-resumen">
            <!-- CARGAS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-file-arrow-up" />
                </div>

                <div>
                    <span> Cargas </span>

                    <strong>
                        {{ totalCargas }}
                    </strong>
                </div>
            </div>

            <!-- MOVIMIENTOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-list" />
                </div>

                <div>
                    <span> Movimientos procesados </span>

                    <strong>
                        {{ totalMovimientos }}
                    </strong>
                </div>
            </div>

            <!-- NUEVOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-circle-check" />
                </div>

                <div>
                    <span> Movimientos nuevos </span>

                    <strong class="texto-correcto">
                        {{ totalInsertados }}
                    </strong>
                </div>
            </div>

            <!-- DUPLICADOS -->

            <div class="tarjeta-resumen">
                <div class="tarjeta-icono">
                    <font-icon icon="fa-solid fa-clone" />
                </div>

                <div>
                    <span> Duplicados detectados </span>

                    <strong class="texto-observacion">
                        {{ totalDuplicados }}
                    </strong>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- TABLA -->
        <!-- ===================================================== -->

        <div class="contenedor-tabla">
            <!-- ================================================= -->
            <!-- BARRA -->
            <!-- ================================================= -->

            <div class="barra-tabla">
                <div v-if="puedeRevertir" class="filtro-archivadas">
                    <Checkbox inputId="ver-archivadas" v-model="verArchivadas" binary :disabled="cargando" @change="handleCargarHistorial" />
                    <label for="ver-archivadas">Ver cargas archivadas</label>
                </div>

                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltros" />

                <IconField iconPosition="left">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>

                    <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                </IconField>

                <div class="contador-registros">
                    {{ cargasFiltradas.length }}

                    carga(s)
                </div>
            </div>

            <!-- ================================================= -->
            <!-- DATATABLE -->
            <!-- ================================================= -->

            <DataTable
                v-model:filters="filtros"
                :value="cargasFiltradas"
                :loading="cargando"
                :globalFilterFields="['empresa.razon_social', 'empresa.rfc', 'banco.descripcion', 'banco.clabe_banco', 'cuenta_banco', 'clabe_cuenta', 'layout.nombre', 'archivo.nombre_original', 'archivo.anio', 'fecha_carga']"
                paginator
                :rows="50"
                :rowsPerPageOptions="[20, 50, 100, 250]"
                scrollable
                scrollHeight="55vh"
                size="small"
                class="tabla-encabezados"
            >
                <!-- ============================================= -->
                <!-- VACIO -->
                <!-- ============================================= -->

                <template #empty> No existen cargas de estados de cuenta. </template>

                <!-- ============================================= -->
                <!-- EMPRESA -->
                <!-- ============================================= -->

                <Column field="empresa.razon_social" header="Empresa" headerClass="encabezado-columna" style="min-width: 220px">
                    <template #body="slotProps">
                        <div class="celda-empresa">
                            <strong>
                                {{ slotProps.data?.empresa?.razon_social || '-' }}
                            </strong>

                            <small>
                                {{ slotProps.data?.empresa?.rfc || '' }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- BANCO -->
                <!-- ============================================= -->

                <Column field="banco.descripcion" header="Banco" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        <div class="celda-banco">
                            <span class="badge-banco">
                                {{ slotProps.data?.banco?.clabe_banco || slotProps.data?.clabe_banco || '-' }}
                            </span>

                            <span>
                                {{ slotProps.data?.banco?.descripcion || '-' }}
                            </span>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- CUENTA -->
                <!-- ============================================= -->

                <Column header="Cuenta" headerClass="encabezado-columna" style="min-width: 140px">
                    <template #body="slotProps">
                        <div class="celda-cuenta">
                            <strong>
                                {{ slotProps.data?.cuenta_banco || '-' }}
                            </strong>

                            <small>
                                {{ handleCuentaEnmascarada(slotProps.data?.clabe_cuenta) }}
                            </small>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- ARCHIVO -->
                <!-- ============================================= -->

                <Column field="archivo.nombre_original" header="Archivo" headerClass="encabezado-columna" style="min-width: 250px">
                    <template #body="slotProps">
                        <div class="celda-archivo">
                            <div class="archivo-icono">
                                <font-icon icon="fa-solid fa-file-excel" />
                            </div>

                            <div>
                                <strong>
                                    {{ slotProps.data?.archivo?.nombre_original || '-' }}
                                </strong>

                                <small>
                                    {{ slotProps.data?.archivo?.tipo_real || '' }}
                                </small>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- LAYOUT -->
                <!-- ============================================= -->

                <Column field="layout.nombre" header="Layout" headerClass="encabezado-columna" style="min-width: 180px" />

                <!-- ============================================= -->
                <!-- AÑO -->
                <!-- ============================================= -->

                <Column field="archivo.anio" header="Año" headerClass="encabezado-columna" style="min-width: 70px" />

                <!-- ============================================= -->
                <!-- MOVIMIENTOS -->
                <!-- ============================================= -->

                <Column field="total_movimientos_archivo" header="Movimientos" headerClass="encabezado-columna" style="min-width: 95px">
                    <template #body="slotProps">
                        <span class="numero-movimientos">
                            {{ slotProps.data?.total_movimientos_archivo ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- NUEVOS -->
                <!-- ============================================= -->

                <Column field="movimientos_insertados" header="Nuevos" headerClass="encabezado-columna" style="min-width: 80px">
                    <template #body="slotProps">
                        <span class="badge-nuevos">
                            {{ slotProps.data?.movimientos_insertados ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- DUPLICADOS -->
                <!-- ============================================= -->

                <Column field="movimientos_duplicados" header="Duplicados" headerClass="encabezado-columna" style="min-width: 90px">
                    <template #body="slotProps">
                        <span
                            :class="[
                                'badge-duplicados',
                                {
                                    'badge-duplicados-activo': Number(slotProps.data?.movimientos_duplicados ?? 0) > 0
                                }
                            ]"
                        >
                            {{ slotProps.data?.movimientos_duplicados ?? 0 }}
                        </span>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- SALDO FINAL -->
                <!-- ============================================= -->

                <Column header="Saldo Final" headerClass="encabezado-columna" style="min-width: 120px">
                    <template #body="slotProps">
                        <strong>
                            {{ handleFormatoMoneda(slotProps.data?.resumen?.saldo_final) }}
                        </strong>
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- FECHA CARGA -->
                <!-- ============================================= -->

                <Column field="fecha_carga" header="Fecha Carga" headerClass="encabezado-columna" style="min-width: 150px">
                    <template #body="slotProps">
                        {{ handleFormatoFechaHora(slotProps.data?.fecha_carga) }}
                    </template>
                </Column>

                <!-- ============================================= -->
                <!-- OPCIONES -->
                <!-- ============================================= -->

                <Column header="Opciones" headerClass="encabezado-columna" style="width: 85px" frozen alignFrozen="right">
                    <template #body="slotProps">
                        <div class="acciones-tabla">
                            <Button
                                type="button"
                                icon="pi pi-trash"
                                v-if="!slotProps.data.archivada"
                                class="btn-eliminar-carga"
                                :loading="eliminando && cargaEliminandoId === slotProps.data._id"
                                :disabled="eliminando && cargaEliminandoId !== slotProps.data._id"
                                v-tooltip.top="'Eliminar carga'"
                                @click="handleEliminarCarga(slotProps.data)"
                            />
                            <Button
                                v-if="puedeRevertir"
                                type="button"
                                :icon="slotProps.data.archivada ? 'pi pi-history' : 'pi pi-undo'"
                                severity="warn"
                                outlined
                                :disabled="eliminando || cargandoReversion"
                                v-tooltip.top="slotProps.data.archivada ? 'Ver reversión' : 'Revertir conciliaciones y archivar carga'"
                                @click="handleAbrirReversion(slotProps.data)"
                            />
                            <Tag v-if="slotProps.data.archivada" value="Archivada" severity="secondary" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <Dialog v-model:visible="mostrarEliminarCarga" modal header="Eliminar carga bancaria" class="dialog-eliminar-carga" :closable="!eliminando" :closeOnEscape="!eliminando">
        <div class="contenido-reversion">
            <div class="detalle-eliminar-carga">
                <div>
                    <small>Empresa</small><strong>{{ cargaPorEliminar?.empresa?.razon_social || '-' }}</strong>
                </div>
                <div>
                    <small>Archivo</small><strong>{{ cargaPorEliminar?.archivo?.nombre_original || '-' }}</strong>
                </div>
                <div>
                    <small>Cuenta</small><strong>{{ handleCuentaEnmascarada(cargaPorEliminar?.clabe_cuenta || cargaPorEliminar?.cuenta_banco) }}</strong>
                </div>
            </div>
            <Message severity="warn" :closable="false">Se eliminará el archivo original y se retirarán los movimientos que no pertenezcan a otra carga. La cabecera de la carga se conserva en el historial interno.</Message>
            <Message severity="info" :closable="false">Si hay conciliaciones activas, la API impedirá la eliminación. Los movimientos compartidos con otras cargas y los CFDI timbrados se conservan.</Message>
            <Message v-if="puedeRevertir" severity="secondary" :closable="false">Para conservar el archivo original y deshacer las conciliaciones con motivo e historial, elige «Revertir y archivar».</Message>
            <Message v-if="errorEliminarCarga" severity="error" :closable="false">{{ errorEliminarCarga }}</Message>
            <Message v-if="eliminacionSinConfirmar" severity="warn" :closable="false">Cierra esta ventana y actualiza el historial para verificar el resultado antes de intentar otra operación.</Message>
        </div>
        <template #footer>
            <Button label="Cancelar" outlined :disabled="eliminando" @click="mostrarEliminarCarga = false" />
            <Button v-if="puedeRevertir" label="Revertir y archivar" icon="pi pi-undo" severity="secondary" outlined :disabled="eliminando || eliminacionSinConfirmar" @click="handleArchivarDesdeEliminacion" />
            <Button label="Eliminar carga" icon="pi pi-trash" severity="danger" :loading="eliminando" :disabled="!cargaPorEliminar || eliminacionSinConfirmar" @click="handleConfirmarEliminarCarga" />
        </template>
    </Dialog>
    <Dialog
        v-model:visible="mostrarReversion"
        modal
        :header="reversionSoloConsulta ? 'Historial de reversión' : 'Revertir conciliaciones y archivar carga'"
        class="dialog-reversion"
        :closable="!guardandoReversion"
        :closeOnEscape="!guardandoReversion"
    >
        <ProgressBar v-if="cargandoReversion" mode="indeterminate" />
        <div v-else-if="impactoReversion" class="contenido-reversion">
            <Message severity="warn" :closable="false"
                >Se revierten las conciliaciones y se retiran los movimientos exclusivos de esta carga. Se conservan el archivo original, la evidencia y los movimientos compartidos con otras cargas. Los CFDI y complementos timbrados permanecen
                intactos.</Message
            >
            <div class="resumen-reversion">
                <div>
                    <small>Archivo</small><strong>{{ impactoReversion.archivo }}</strong>
                </div>
                <div>
                    <small>Conciliaciones afectadas</small><strong>{{ impactoReversion.conciliaciones }}</strong>
                </div>
                <div>
                    <small>Importe a desconciliar</small><strong>{{ handleFormatoMoneda(impactoReversion.importe_a_desconciliar) }}</strong>
                </div>
            </div>
            <Message v-if="impactoReversion.historial" severity="info" :closable="false">
                Estado: {{ impactoReversion.historial.estado }}. Fecha: {{ handleFormatoFechaHora(impactoReversion.historial.fecha) }}. Usuario: {{ impactoReversion.historial.autor_nombre || impactoReversion.historial.autor }}.
            </Message>
            <h4>Facturas afectadas</h4>
            <DataTable :value="impactoReversion.facturas || []" paginator :rows="5" size="small" scrollable scrollHeight="12rem">
                <template #empty>No hay conciliaciones activas que revertir.</template>
                <Column field="uuid" header="UUID" />
                <Column header="Importe que vuelve a quedar pendiente de conciliación"
                    ><template #body="{ data }">{{ handleFormatoMoneda(data.importe_a_desconciliar) }}</template></Column
                >
            </DataTable>
            <h4>Movimientos de la carga</h4>
            <DataTable :value="impactoReversion.movimientos || []" paginator :rows="5" size="small" scrollable scrollHeight="12rem">
                <Column field="fecha" header="Fecha" /><Column field="descripcion" header="Descripción" />
                <Column header="Ingreso"
                    ><template #body="{ data }">{{ handleFormatoMoneda(data.ingreso) }}</template></Column
                >
                <Column header="Egreso"
                    ><template #body="{ data }">{{ handleFormatoMoneda(data.egreso) }}</template></Column
                >
            </DataTable>
            <label for="motivo-reversion">Motivo {{ reversionSoloConsulta ? '' : '(obligatorio, mínimo 10 caracteres)' }}</label>
            <Textarea id="motivo-reversion" v-model="motivoReversion" rows="3" maxlength="1000" autoResize :disabled="reversionSoloConsulta || guardandoReversion" />
            <div v-if="!reversionSoloConsulta" class="confirmacion-reversion">
                <Checkbox inputId="confirmar-reversion" v-model="confirmarReversion" binary :disabled="guardandoReversion" />
                <label for="confirmar-reversion">Revisé el impacto y autorizo la reversión y el archivo de esta carga.</label>
            </div>
            <Message v-if="reversionRequiereRevision" severity="error" :closable="false">Resultado sin confirmar. Solicita revisar el historial de la operación antes de intentar otra reversión.</Message>
        </div>
        <template #footer>
            <Button :label="reversionSoloConsulta ? 'Cerrar' : 'Cancelar'" outlined :disabled="guardandoReversion" @click="mostrarReversion = false" />
            <Button
                v-if="!reversionSoloConsulta"
                label="Revertir y archivar"
                icon="pi pi-undo"
                severity="danger"
                :loading="guardandoReversion"
                :disabled="cargandoReversion || !impactoReversion || !confirmarReversion || motivoReversion.trim().length < 10 || reversionRequiereRevision"
                @click="handleConfirmarReversion"
            />
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'HistorialCargasEstadoCuenta',

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
