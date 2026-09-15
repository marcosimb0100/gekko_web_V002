<template>
    <Encabezado titulo="Carga de Estados de Cuenta" subtitulo="Carga, análisis y resguardo de movimientos bancarios" icono="pi pi-upload">
        <Button v-if="resultado" type="button" label="Nueva Carga" class="btn-nuevo" @click="handleNuevaCarga">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card p-0 m-0 card-carga">
        <div class="contenedor-formulario-carga">
            <div class="card-formulario-carga">
                <div class="encabezado-formulario">
                    <div class="icono-formulario">
                        <font-icon icon="fa-solid fa-file-invoice-dollar" />
                    </div>

                    <div>
                        <div class="titulo-formulario">Carga de Estado de Cuenta</div>
                        <div class="subtitulo-formulario">Selecciona empresa, cuenta bancaria, año y archivo.</div>
                    </div>
                </div>

                <div class="separador-formulario"></div>

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

                <div class="campo-carga">
                    <label>Año</label>
                    <Dropdown v-model="frmCarga.anio" :options="anios" optionLabel="label" optionValue="value" placeholder="Seleccione el año" :disabled="analizando || guardando" class="w-full" />
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

                <div class="resumen-previo">
                    <div class="resumen-previo-item">
                        <span>Empresa</span>
                        <strong>{{ empresaSeleccionada?.razon_social || 'Sin seleccionar' }}</strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span>Banco</span>
                        <strong>{{ cuentaSeleccionada?.banco || 'Sin seleccionar' }}</strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span>Cuenta</span>
                        <strong>{{ cuentaSeleccionada?.cuenta_banco || 'Sin seleccionar' }}</strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span>Año</span>
                        <strong>{{ frmCarga.anio }}</strong>
                    </div>
                </div>

                <div class="separador-formulario"></div>

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

        <template v-if="resultado">
            <div class="seccion-resultado">
                <div class="titulo-seccion">
                    <div>
                        <div class="titulo-seccion-principal">Resultado del Análisis</div>
                        <small class="texto-ayuda">Revisa el archivo antes de guardarlo definitivamente.</small>
                    </div>
                </div>

                <div class="grid-datos-resultado">
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
            </div>

            <div class="seccion-resumen">
                <div class="titulo-seccion-principal">Resumen</div>
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
            </div>

            <div class="acciones-resultado">
                <div class="acciones-resultado-info">
                    <font-icon icon="fa-solid fa-circle-check" />
                    <div>
                        <strong>Estado de cuenta listo para guardar</strong>
                        <small>Al guardar se conserva el archivo y se deduplican los movimientos.</small>
                    </div>
                </div>

                <Button type="button" label="Guardar Estado de Cuenta" class="btn-guardar" :loading="guardando" :disabled="guardando || analizando || !resultado" @click="handleGuardar">
                    <template #icon>
                        <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
                    </template>
                </Button>
            </div>

            <div v-if="metadataArray.length > 0" class="seccion-metadata">
                <div class="titulo-seccion-principal">Información Adicional</div>
                <div class="grid-metadata">
                    <div v-for="item in metadataArray" :key="item.campo" class="metadata-item">
                        <span>{{ item.etiqueta }}</span>
                        <strong>{{ item.valor }}</strong>
                    </div>
                </div>
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
                    scrollHeight="45vh"
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

            <div v-if="validaciones.length > 0" class="seccion-validaciones">
                <div class="titulo-seccion-principal">Validaciones</div>
                <DataTable :value="validaciones" size="small" class="tabla-encabezados">
                    <Column field="tipo" header="Tipo" headerClass="encabezado-columna" />
                    <Column field="fila" header="Fila" headerClass="encabezado-columna" />
                    <Column field="fecha" header="Fecha" headerClass="encabezado-columna" />
                    <Column field="mensaje" header="Observación" headerClass="encabezado-columna" />
                </DataTable>
            </div>

            <div v-if="errores.length > 0" class="seccion-validaciones">
                <div class="titulo-seccion-principal">Errores de Lectura</div>
                <DataTable :value="errores" size="small" class="tabla-encabezados">
                    <Column field="fila" header="Fila" headerClass="encabezado-columna" style="width: 100px" />
                    <Column field="mensaje" header="Detalle" headerClass="encabezado-columna" />
                </DataTable>
            </div>
        </template>

        <!-- <div class="seccion-historial">
            <div class="titulo-seccion">
                <div>
                    <div class="titulo-seccion-principal">Historial de Cargas</div>
                    <small class="texto-ayuda">Desde aquí puedes identificar y revertir una carga incorrecta.</small>
                </div>
            </div>

            <div class="barra-tabla">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltroCargas" />
                <IconField iconPosition="left">
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filtrosCargas.global.value" placeholder="Buscar..." class="buscador" />
                </IconField>
                <div class="contador-registros">{{ cargas.length }} carga(s)</div>
            </div>

            <DataTable
                v-model:filters="filtrosCargas"
                :value="cargas"
                :loading="cargandoCargas"
                :globalFilterFields="['empresa.razon_social', 'empresa.rfc', 'banco.descripcion', 'clabe_cuenta', 'cuenta_banco', 'layout.nombre', 'archivo.nombre_original', 'archivo.anio', 'fecha_carga']"
                paginator
                :rows="20"
                :rowsPerPageOptions="[20, 50, 100]"
                scrollable
                size="small"
                class="tabla-encabezados"
            >
                <template #empty>No existen cargas guardadas.</template>
                <Column field="empresa.razon_social" header="Empresa" headerClass="encabezado-columna" style="min-width: 220px" />
                <Column field="banco.descripcion" header="Banco" headerClass="encabezado-columna" style="min-width: 120px" />
                <Column field="cuenta_banco" header="Cuenta" headerClass="encabezado-columna" style="min-width: 130px" />
                <Column field="archivo.nombre_original" header="Archivo" headerClass="encabezado-columna" style="min-width: 240px" />
                <Column field="layout.nombre" header="Layout" headerClass="encabezado-columna" style="min-width: 180px" />
                <Column field="archivo.anio" header="Año" headerClass="encabezado-columna" style="width: 80px" />
                <Column field="total_movimientos_archivo" header="Mov." headerClass="encabezado-columna" style="width: 80px" />
                <Column field="movimientos_insertados" header="Nuevos" headerClass="encabezado-columna" style="width: 80px" />
                <Column field="movimientos_duplicados" header="Duplicados" headerClass="encabezado-columna" style="width: 90px" />
                <Column field="fecha_carga" header="Fecha Carga" headerClass="encabezado-columna" style="min-width: 150px" />
                <Column header="Acciones" headerClass="encabezado-columna" style="width: 90px">
                    <template #body="slotProps">
                        <Button type="button" icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Eliminar carga'" @click="handleEliminarCarga(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div> -->
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso.js';

export default {
    name: 'CargaEstadoCuenta',
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
