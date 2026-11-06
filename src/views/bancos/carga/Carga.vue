<template>
    <Encabezado titulo="Carga de Estados de Cuenta" subtitulo="Carga, análisis y resguardo de movimientos bancarios" icono="pi pi-upload">
        <Button v-if="resultado" label="Nueva carga" icon="pi pi-plus" class="btn-nuevo" :disabled="analizando || guardando" @click="handleNuevaCarga" />
    </Encabezado>
    <div class="card p-0 m-0 card-carga" :class="{ 'con-resultado': resultado }">
        <div v-if="!resultado" class="contenedor-formulario-carga">
            <div class="card-formulario-carga">
                <div class="encabezado-formulario">
                    <div class="icono-formulario"><i class="pi pi-file-import" /></div>
                    <div>
                        <div class="titulo-formulario">Selecciona tu estado de cuenta</div>
                        <div class="subtitulo-formulario">El sistema identifica el layout y analiza el archivo antes de guardarlo.</div>
                    </div>
                </div>
                <div class="campos-carga-compactos">
                    <div class="campo-carga">
                        <label>Empresa</label>

                        <Dropdown
                            v-model="empresaSeleccionada"
                            :options="empresas"
                            optionLabel="razon_social"
                            placeholder="Seleccione una empresa"
                            filter
                            showClear
                            :loading="cargandoEmpresas"
                            :disabled="analizando || guardando"
                            class="w-full"
                            @change="handleCambiarEmpresa"
                        >
                            <template #option="slotProps">
                                <div class="opcion-empresa">
                                    <strong>{{ slotProps.option.razon_social }}</strong>
                                    <small> {{ slotProps.option.rfc || 'Sin RFC' }} · {{ slotProps.option.cuentas_disponibles ?? 0 }} cuenta(s) disponible(s) </small>
                                </div>
                            </template>
                        </Dropdown>

                        <small class="texto-campo">Solo se muestran empresas con cuentas cuyo banco tiene un layout activo.</small>
                    </div>
                    <div class="campo-carga">
                        <label>Banco / Cuenta Bancaria</label>

                        <Dropdown
                            v-model="cuentaSeleccionada"
                            :options="cuentasBancarias"
                            placeholder="Seleccione una cuenta bancaria"
                            filter
                            showClear
                            :loading="cargandoCuentas"
                            :disabled="!empresaSeleccionada || analizando || guardando"
                            class="w-full"
                            @change="handleCambiarCuenta"
                        >
                            <template #option="slotProps">
                                <div class="opcion-cuenta">
                                    <div class="opcion-cuenta-superior">
                                        <span class="clave-banco">{{ slotProps.option.clave_banco }}</span>

                                        <div class="datos-opcion-cuenta">
                                            <strong>{{ slotProps.option.banco }}</strong>
                                            <small>Cuenta: {{ slotProps.option.cuenta_banco || 'Sin número' }}</small>
                                        </div>
                                    </div>

                                    <div class="opcion-cuenta-detalle">
                                        <span>CLABE: {{ slotProps.option.clabe_bancaria }}</span>
                                        <span>{{ slotProps.option.layout_count ?? 0 }} layout(s)</span>
                                    </div>
                                </div>
                            </template>

                            <template #value="slotProps">
                                <span v-if="!slotProps.value">{{ slotProps.placeholder }}</span>
                                <div v-else class="valor-cuenta">
                                    <strong>{{ slotProps.value.clave_banco }}</strong>
                                    <span>{{ slotProps.value.banco }}</span>
                                    <span class="valor-cuenta-numero">- {{ slotProps.value.cuenta_banco }}</span>
                                </div>
                            </template>
                        </Dropdown>

                        <small class="texto-campo">Solo aparecen cuentas registradas en la empresa cuyo banco tiene al menos un layout activo.</small>
                    </div>
                    <div class="campo-carga">
                        <label>Año</label>
                        <Dropdown v-model="frmCarga.anio" @change="handleLimpiarResultado" :options="anios" optionLabel="label" optionValue="value" placeholder="Seleccione el año" :disabled="analizando || guardando" class="w-full" />
                        <small class="texto-campo">Solo se usa para completar fechas del archivo que no traen año.</small>
                    </div>
                    <div class="campo-carga">
                        <label>Archivo</label>
                        <FileUpload
                            ref="fileUpload"
                            mode="basic"
                            name="archivo"
                            accept=".xls,.xlsx,.csv,.txt,.xml"
                            chooseLabel="Seleccionar archivo"
                            chooseIcon="pi pi-file"
                            :auto="false"
                            :customUpload="true"
                            :multiple="false"
                            :disabled="!cuentaSeleccionada || analizando || guardando"
                            class="archivo-upload"
                            @select="handleSeleccionarArchivo"
                        />
                        <small class="texto-campo">Formatos permitidos: XLS, XLSX, CSV, TXT y XML.</small>
                    </div>
                </div>
                <div v-if="archivoSeleccionado" class="archivo-seleccionado-form">
                    <div class="archivo-form-info">
                        <div class="archivo-form-icono-contenedor">
                            <font-icon icon="fa-solid fa-file-excel" class="archivo-form-icon" />
                        </div>

                        <div class="archivo-form-datos">
                            <div class="archivo-form-nombre">{{ archivoSeleccionado.name }}</div>
                            <small>{{ handleFormatoTamano(archivoSeleccionado.size) }}</small>
                        </div>
                    </div>

                    <Button v-if="!analizando && !guardando" type="button" icon="pi pi-times" severity="danger" text rounded @click="handleQuitarArchivo" />
                </div>
                <div class="pie-formulario-carga">
                    <Button label="Detalles de cuenta" icon="pi pi-info-circle" outlined :disabled="!cuentaSeleccionada || analizando || guardando" @click="handleMostrarDetalles" />
                    <div class="acciones-formulario">
                        <Button v-if="archivoSeleccionado" type="button" label="Cancelar" class="btn-cancelar" :disabled="analizando || guardando" @click="handleQuitarArchivo" />

                        <Button
                            type="button"
                            label="Analizar"
                            class="btn-guardar"
                            icon="pi pi-search"
                            :loading="analizando"
                            :disabled="!empresaSeleccionada || !cuentaSeleccionada || !frmCarga.anio || !archivoSeleccionado || analizando || guardando"
                            @click="handleAnalizar"
                        />
                    </div>
                </div>
            </div>
        </div>
        <template v-else>
            <div class="cabecera-analisis">
                <div class="identificacion-analisis">
                    <strong>{{ resultado.archivo?.nombre || archivoSeleccionado?.name }}</strong
                    ><small>{{ empresaSeleccionada?.razon_social }} · {{ resultado.layout?.nombre }}</small>
                </div>
                <div class="opciones-analisis">
                    <Button label="Detalles" icon="pi pi-info-circle" outlined :disabled="analizando || guardando" @click="handleMostrarDetalles" />
                    <Button
                        :label="diferenciasValidacion ? 'Comprobaciones: ' + diferenciasValidacion + ' por revisar' : 'Comprobaciones (' + validaciones.length + ')'"
                        icon="pi pi-check-circle"
                        :severity="diferenciasValidacion ? 'warn' : 'success'"
                        outlined
                        :disabled="analizando || guardando"
                        @click="handleMostrarValidaciones"
                    />
                    <Button v-if="errores.length" :label="'Errores (' + errores.length + ')'" icon="pi pi-exclamation-triangle" severity="danger" outlined :disabled="analizando || guardando" @click="handleMostrarErrores" />
                </div>
            </div>
            <Message :severity="estadoCarga.severity" :closable="false">{{ estadoCarga.mensaje }}</Message>
            <div class="grid-resumen">
                <div class="tarjeta-resumen">
                    <span>Movimientos</span><strong>{{ resultado.resumen?.registros ?? movimientos.length }}</strong>
                </div>
                <div class="tarjeta-resumen">
                    <span>Ingresos</span><strong class="importe-ingreso">{{ handleFormatoMoneda(resultado.resumen?.total_ingresos) }}</strong>
                </div>
                <div class="tarjeta-resumen">
                    <span>Egresos</span><strong class="importe-egreso">{{ handleFormatoMoneda(resultado.resumen?.total_egresos) }}</strong>
                </div>
                <div class="tarjeta-resumen">
                    <span>Saldo inicial</span><strong>{{ handleFormatoMoneda(resultado.resumen?.saldo_inicial) }}</strong>
                </div>
                <div class="tarjeta-resumen">
                    <span>Saldo final</span><strong>{{ handleFormatoMoneda(resultado.resumen?.saldo_final) }}</strong>
                </div>
                <div class="tarjeta-resumen">
                    <span>Año</span><strong>{{ resultado.archivo?.anio || frmCarga.anio }}</strong>
                </div>
            </div>
            <div class="control-saldo">
                <span
                    >Saldo inicial:
                    {{
                        resultado.control_saldos?.origen === 'captura_confirmada'
                            ? 'Confirmado por el usuario'
                            : resultado.control_saldos?.origen === 'archivo'
                              ? 'Reportado por el banco'
                              : resultado.control_saldos?.origen?.startsWith('historial')
                                ? 'Historial de la cuenta'
                                : 'Calculado desde el archivo'
                    }}.</span
                >
                <Button :label="resultado.control_saldos?.confirmado ? 'Revisar saldo inicial' : 'Confirmar saldo inicial'" icon="pi pi-calculator" outlined :disabled="analizando || guardando || cargaGuardada" @click="handleEditarSaldo" />
            </div>
            <div class="acciones-resultado">
                <div class="acciones-resultado-info">
                    <font-icon icon="fa-solid fa-circle-check" />
                    <div>
                        <strong>{{ estadoCarga.titulo }}</strong>
                        <small>Al guardar se conserva el archivo y se deduplican los movimientos.</small>
                    </div>
                </div>

                <Button type="button" label="Guardar Estado de Cuenta" class="btn-guardar" :loading="guardando" :disabled="guardando || analizando || !puedeGuardar" @click="handleGuardar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                    </template>
                </Button>
            </div>
            <div class="seccion-movimientos">
                <div class="barra-tabla">
                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />
                    <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                    </IconField>
                    <div class="contador-registros">{{ movimientos.length }} movimiento(s)</div>
                </div>

                <DataTable
                    v-model:filters="filtros"
                    :value="movimientos"
                    :globalFilterFields="camposBusqueda"
                    paginator
                    :rows="100"
                    :rowsPerPageOptions="[100, 250, 500, 700]"
                    scrollable
                    scrollHeight="flex"
                    size="small"
                    class="tabla-encabezados"
                    style="font-size: 12px"
                >
                    <template #empty>No se encontraron movimientos.</template>
                    <Column field="fila_archivo" header="Fila" headerClass="encabezado-columna" style="width: 70px" />

                    <Column v-for="columna in columnasMovimientos" :key="columna.field" :field="columna.field" :header="columna.header" headerClass="encabezado-columna" :style="columna.style">
                        <template #body="slotProps">
                            <span v-if="columna.tipo === 'moneda'" :class="handleClaseImporte(columna.field, slotProps.data[columna.field])">
                                {{ handleFormatoMoneda(slotProps.data[columna.field]) }}
                            </span>
                            <span v-else>{{ slotProps.data[columna.field] ?? '' }}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </template>
    </div>
    <Dialog v-model:visible="dialogDetalles" header="Datos de la carga" modal class="dialog-detalles-carga" :style="{ width: 'min(94vw, 960px)' }">
        <div class="contenido-detalles-carga">
            <div v-if="cuentaSeleccionada" class="info-cuenta-seleccionada">
                <div class="info-cuenta-icono">
                    <font-icon icon="fa-solid fa-building-columns" />
                </div>

                <div class="info-cuenta-item">
                    <span>Banco</span>
                    <strong>{{ cuentaSeleccionada.clave_banco }} - {{ cuentaSeleccionada.banco }}</strong>
                </div>

                <div class="info-cuenta-item">
                    <span>Cuenta</span>
                    <strong>{{ cuentaSeleccionada.cuenta_banco || '-' }}</strong>
                </div>

                <div class="info-cuenta-item">
                    <span>CLABE</span>
                    <strong>{{ handleCuentaEnmascarada(cuentaSeleccionada.clabe_bancaria) }}</strong>
                </div>

                <div class="info-cuenta-item">
                    <span>Layouts</span>
                    <strong>{{ cuentaSeleccionada.layout_count ?? 0 }}</strong>
                </div>
            </div>
            <template v-if="resultado"
                ><div class="grid-datos-resultado">
                    <div class="dato-resultado">
                        <span>Empresa</span>
                        <strong>{{ resultado.empresa?.razon_social || empresaSeleccionada?.razon_social || '-' }}</strong>
                    </div>
                    <div class="dato-resultado">
                        <span>Banco</span>
                        <strong>{{ resultado.banco?.descripcion || cuentaSeleccionada?.banco || '-' }}</strong>
                    </div>
                    <div class="dato-resultado">
                        <span>Cuenta</span>
                        <strong>{{ resultado.cuenta_bancaria?.cuenta_banco || cuentaSeleccionada?.cuenta_banco || '-' }}</strong>
                    </div>
                    <div class="dato-resultado">
                        <span>Layout</span>
                        <strong>{{ resultado.layout?.nombre || '-' }}</strong>
                    </div>
                    <div class="dato-resultado">
                        <span>Archivo</span>
                        <strong>{{ resultado.archivo?.nombre || '-' }}</strong>
                    </div>
                </div>
                <div v-if="metadataArray.length > 0" class="seccion-metadata">
                    <div class="titulo-seccion-principal">Información Adicional</div>
                    <div class="grid-metadata">
                        <div v-for="item in metadataArray" :key="item.campo" class="metadata-item">
                            <span>{{ item.etiqueta }}</span>
                            <strong>{{ item.valor }}</strong>
                        </div>
                    </div>
                </div></template
            >
            <Message v-if="!resultado" severity="info" :closable="false"
                >El año seleccionado solo completa las fechas que no incluyen año. El archivo se analiza antes de guardar; la confirmación del saldo inicial se solicita cuando corresponde.</Message
            >
        </div>
        <template #footer><Button label="Cerrar" @click="handleCerrarDetalles" /></template>
    </Dialog>
    <Dialog v-model:visible="dialogValidaciones" header="Comprobaciones del estado de cuenta" modal :style="{ width: 'min(96vw, 1100px)' }">
        <div class="resumen-comprobaciones">
            <Tag :value="comprobacionesCorrectas + ' correctas'" severity="success" />
            <Tag :value="diferenciasValidacion + ' con diferencias'" :severity="diferenciasValidacion ? 'warn' : 'secondary'" />
            <ToggleButton v-model="soloDiferencias" onLabel="Solo diferencias" offLabel="Todas las comprobaciones" :disabled="!diferenciasValidacion" />
        </div>
        <Message v-if="validaciones.length && !diferenciasValidacion" severity="success" :closable="false">Las comprobaciones no presentan diferencias. Este listado es informativo; no significa que existan errores.</Message>
        <Message v-if="!validaciones.length" severity="info" :closable="false">No hay observaciones de validación registradas. Revisa también la confirmación del saldo inicial antes de guardar.</Message>
        <div v-if="validaciones.length > 0" class="seccion-validaciones">
            <div class="titulo-seccion-principal">Detalle de comprobaciones</div>
            <DataTable :value="validacionesVisibles" size="small" class="tabla-encabezados" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" scrollable scrollHeight="35vh" tableStyle="min-width: 55rem">
                <Column field="tipo" header="Tipo" headerClass="encabezado-columna" />
                <Column field="fila" header="Fila" headerClass="encabezado-columna" />
                <Column field="fecha" header="Fecha" headerClass="encabezado-columna" />
                <Column header="Resultado" headerClass="encabezado-columna">
                    <template #body="slotProps">{{ slotProps.data.correcto ? 'Correcto' : 'Revisar' }}</template>
                </Column>
                <Column header="Calculado" headerClass="encabezado-columna">
                    <template #body="slotProps">{{ handleFormatoMoneda(slotProps.data.calculado) }}</template>
                </Column>
                <Column header="Reportado / historial" headerClass="encabezado-columna">
                    <template #body="slotProps">{{ handleFormatoMoneda(slotProps.data.archivo) }}</template>
                </Column>
                <Column field="mensaje" header="Observación" headerClass="encabezado-columna" />
            </DataTable>
        </div>
        <template #footer><Button label="Cerrar" @click="handleCerrarValidaciones" /></template>
    </Dialog>
    <Dialog v-model:visible="dialogErrores" header="Errores de lectura" modal :style="{ width: 'min(94vw, 1000px)' }">
        <div v-if="errores.length > 0" class="seccion-validaciones">
            <div class="titulo-seccion-principal">Errores de Lectura</div>
            <DataTable :value="errores" size="small" class="tabla-encabezados" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" scrollable scrollHeight="35vh" tableStyle="min-width: 55rem">
                <Column field="fila" header="Fila" headerClass="encabezado-columna" style="width: 100px" />
                <Column field="mensaje" header="Detalle" headerClass="encabezado-columna" />
            </DataTable>
        </div>
        <template #footer><Button label="Cerrar" @click="handleCerrarErrores" /></template>
    </Dialog>
    <Dialog v-model:visible="dialogSaldo" modal header="Confirmar saldo inicial" :closable="!analizando" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
        <div class="dialog-saldo">
            <p>
                {{
                    resultado?.control_saldos?.cuenta_nueva
                        ? 'Esta cuenta todavía no tiene cargas. Confirma el saldo anterior al primer movimiento del archivo.'
                        : 'Indica el saldo anterior al primer movimiento. Se comprobará contra el archivo y el historial disponible.'
                }}
            </p>
            <small v-if="resultado?.control_saldos?.saldo_sugerido !== null">El importe sugerido se obtuvo del archivo o del historial. Puedes revisarlo antes de confirmar.</small>
            <small v-else>El archivo no permite determinarlo. Captura el importe; cero también es válido.</small>
            <label for="saldo-inicial">Saldo inicial</label>
            <InputNumber id="saldo-inicial" v-model="saldoBorrador" :minFractionDigits="2" :maxFractionDigits="2" locale="es-MX" :useGrouping="true" class="w-full" />
            <small>Saldo final = saldo inicial + ingresos − egresos.</small>
        </div>
        <template #footer>
            <Button label="Cancelar" outlined @click="dialogSaldo = false" />
            <Button label="Confirmar y recalcular" icon="pi pi-check" :disabled="saldoBorrador === null" :loading="analizando" @click="handleConfirmarSaldo" />
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';

export default {
    name: 'CargaEstadoCuenta',
    components: {
        Encabezado,
        Dialog,
        InputNumber
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
