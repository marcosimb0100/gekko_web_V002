<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Carga de Estados de Cuenta" subtitulo="Carga y análisis de movimientos bancarios" icono="pi pi-upload">
        <Button v-if="resultado" type="button" label="Nueva Carga" class="btn-nuevo" @click="handleNuevaCarga">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <!-- ========================================================= -->
    <!-- CARD -->
    <!-- ========================================================= -->

    <div class="card p-0 m-0 card-carga">
        <!-- ===================================================== -->
        <!-- FORMULARIO -->
        <!-- ===================================================== -->

        <div class="contenedor-formulario-carga">
            <div class="card-formulario-carga">
                <!-- ================================================= -->
                <!-- TITULO -->
                <!-- ================================================= -->

                <div class="encabezado-formulario">
                    <div class="icono-formulario">
                        <font-icon icon="fa-solid fa-file-invoice-dollar" />
                    </div>

                    <div>
                        <div class="titulo-formulario">Carga de Estado de Cuenta</div>

                        <div class="subtitulo-formulario">Selecciona la empresa, cuenta bancaria, año y archivo que deseas analizar.</div>
                    </div>
                </div>

                <div class="separador-formulario"></div>

                <!-- ================================================= -->
                <!-- EMPRESA -->
                <!-- ================================================= -->

                <div class="campo-carga">
                    <label> Empresa </label>

                    <Dropdown
                        v-model="empresaSeleccionada"
                        :options="empresas"
                        optionLabel="razon_social"
                        placeholder="Seleccione una empresa"
                        filter
                        showClear
                        :loading="cargandoEmpresas"
                        :disabled="analizando"
                        class="w-full"
                        @change="handleCambiarEmpresa"
                    >
                        <!-- ========================================= -->
                        <!-- OPCION -->
                        <!-- ========================================= -->

                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <div class="opcion-empresa-nombre">
                                    {{ slotProps.option.razon_social }}
                                </div>

                                <small>
                                    RFC:

                                    {{ slotProps.option.rfc || 'Sin RFC' }}

                                    ·

                                    {{ slotProps.option.cuentas_disponibles }}

                                    cuenta(s) disponible(s)
                                </small>
                            </div>
                        </template>

                        <!-- ========================================= -->
                        <!-- VALOR -->
                        <!-- ========================================= -->

                        <template #value="slotProps">
                            <span v-if="!slotProps.value">
                                {{ slotProps.placeholder }}
                            </span>

                            <div v-else class="valor-empresa">
                                <strong>
                                    {{ slotProps.value.razon_social }}
                                </strong>
                            </div>
                        </template>
                    </Dropdown>

                    <small class="texto-campo"> Solo aparecen empresas con cuentas bancarias cuyo banco tiene un layout activo. </small>
                </div>

                <!-- ================================================= -->
                <!-- CUENTA BANCARIA / BANCO -->
                <!-- ================================================= -->

                <div class="campo-carga">
                    <label> Banco / Cuenta Bancaria </label>

                    <Dropdown
                        v-model="cuentaSeleccionada"
                        :options="cuentasBancarias"
                        placeholder="Seleccione una cuenta bancaria"
                        filter
                        showClear
                        :loading="cargandoCuentas"
                        :disabled="!empresaSeleccionada || analizando"
                        class="w-full"
                        @change="handleCambiarCuenta"
                    >
                        <!-- ========================================= -->
                        <!-- OPCION -->
                        <!-- ========================================= -->

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

                                <div class="opcion-cuenta-detalle">
                                    <span>
                                        CLABE:

                                        {{ slotProps.option.clabe_bancaria }}
                                    </span>

                                    <span>
                                        {{ slotProps.option.layout_count }}

                                        layout(s)
                                    </span>
                                </div>
                            </div>
                        </template>

                        <!-- ========================================= -->
                        <!-- VALOR -->
                        <!-- ========================================= -->

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

                                <span class="valor-cuenta-numero">
                                    -

                                    {{ slotProps.value.cuenta_banco }}
                                </span>
                            </div>
                        </template>
                    </Dropdown>

                    <small class="texto-campo"> Se muestran únicamente las cuentas registradas en la empresa cuyo banco tiene layout configurado. </small>
                </div>

                <!-- ================================================= -->
                <!-- INFORMACION CUENTA -->
                <!-- ================================================= -->

                <div v-if="cuentaSeleccionada" class="info-cuenta-seleccionada">
                    <div class="info-cuenta-icono">
                        <font-icon icon="fa-solid fa-building-columns" />
                    </div>

                    <div class="info-cuenta-item">
                        <span> Banco </span>

                        <strong>
                            {{ cuentaSeleccionada.clave_banco }}

                            -

                            {{ cuentaSeleccionada.banco }}
                        </strong>
                    </div>

                    <div class="info-cuenta-item">
                        <span> Cuenta </span>

                        <strong>
                            {{ cuentaSeleccionada.cuenta_banco || '-' }}
                        </strong>
                    </div>

                    <div class="info-cuenta-item">
                        <span> CLABE </span>

                        <strong>
                            {{ handleCuentaEnmascarada(cuentaSeleccionada.clabe_bancaria) }}
                        </strong>
                    </div>

                    <div class="info-cuenta-item">
                        <span> Layouts </span>

                        <strong>
                            {{ cuentaSeleccionada.layout_count }}
                        </strong>
                    </div>
                </div>

                <!-- ================================================= -->
                <!-- AÑO -->
                <!-- ================================================= -->

                <div class="campo-carga">
                    <label> Año </label>

                    <Dropdown v-model="frmCarga.anio" :options="anios" optionLabel="label" optionValue="value" placeholder="Seleccione el año" :disabled="analizando" class="w-full" />

                    <small class="texto-campo"> Se utilizará únicamente para completar fechas que no incluyan año. </small>
                </div>

                <!-- ================================================= -->
                <!-- ARCHIVO -->
                <!-- ================================================= -->

                <div class="campo-carga">
                    <label> Archivo </label>

                    <FileUpload
                        ref="fileUpload"
                        mode="basic"
                        name="archivo"
                        accept=".xls,.xlsx,.csv,.txt"
                        chooseLabel="Seleccionar archivo"
                        chooseIcon="pi pi-file"
                        :auto="false"
                        :customUpload="true"
                        :multiple="false"
                        :disabled="!cuentaSeleccionada || analizando"
                        class="archivo-upload"
                        @select="handleSeleccionarArchivo"
                    />

                    <small class="texto-campo"> Formatos permitidos: XLS, XLSX, CSV y TXT. </small>
                </div>

                <!-- ================================================= -->
                <!-- ARCHIVO SELECCIONADO -->
                <!-- ================================================= -->

                <div v-if="archivoSeleccionado" class="archivo-seleccionado-form">
                    <div class="archivo-form-info">
                        <div class="archivo-form-icono-contenedor">
                            <font-icon icon="fa-solid fa-file-excel" class="archivo-form-icon" />
                        </div>

                        <div class="archivo-form-datos">
                            <div class="archivo-form-nombre">
                                {{ archivoSeleccionado.name }}
                            </div>

                            <small>
                                {{ handleFormatoTamano(archivoSeleccionado.size) }}
                            </small>
                        </div>
                    </div>

                    <Button v-if="!analizando" type="button" icon="pi pi-times" severity="danger" text rounded @click="handleQuitarArchivo" />
                </div>

                <!-- ================================================= -->
                <!-- RESUMEN PREVIO -->
                <!-- ================================================= -->

                <div class="resumen-previo">
                    <div class="resumen-previo-item">
                        <span> Empresa </span>

                        <strong>
                            {{ empresaSeleccionada?.razon_social || 'Sin seleccionar' }}
                        </strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span> Banco </span>

                        <strong>
                            {{ cuentaSeleccionada?.banco || 'Sin seleccionar' }}
                        </strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span> Cuenta </span>

                        <strong>
                            {{ cuentaSeleccionada?.cuenta_banco || 'Sin seleccionar' }}
                        </strong>
                    </div>

                    <div class="resumen-previo-item">
                        <span> Año </span>

                        <strong>
                            {{ frmCarga.anio }}
                        </strong>
                    </div>
                </div>

                <div class="separador-formulario"></div>

                <!-- ================================================= -->
                <!-- ACCIONES -->
                <!-- ================================================= -->

                <div class="acciones-formulario">
                    <Button v-if="archivoSeleccionado" type="button" label="Cancelar" class="btn-cancelar" :disabled="analizando" @click="handleQuitarArchivo">
                        <template #icon>
                            <font-icon icon="fa-solid fa-xmark" class="mr-2" />
                        </template>
                    </Button>

                    <Button type="button" label="Analizar" class="btn-guardar" :loading="analizando" :disabled="!empresaSeleccionada || !cuentaSeleccionada || !frmCarga.anio || !archivoSeleccionado || analizando" @click="handleAnalizar">
                        <template #icon>
                            <font-icon icon="fa-solid fa-magnifying-glass" class="mr-2" />
                        </template>
                    </Button>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- RESULTADOS -->
        <!-- ===================================================== -->

        <template v-if="resultado">
            <!-- ================================================= -->
            <!-- DATOS GENERALES -->
            <!-- ================================================= -->

            <div class="seccion-resultado">
                <div class="titulo-seccion">
                    <div>
                        <div class="titulo-seccion-principal">Resultado del Análisis</div>

                        <small class="texto-ayuda"> Información detectada del estado de cuenta. </small>
                    </div>
                </div>

                <div class="grid-datos-resultado">
                    <div class="dato-resultado">
                        <span> Empresa </span>

                        <strong>
                            {{ resultado.empresa?.razon_social || empresaSeleccionada?.razon_social || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Banco </span>

                        <strong>
                            {{ resultado.banco?.descripcion || cuentaSeleccionada?.banco || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Clave Banco </span>

                        <strong>
                            {{ resultado.banco?.clabe_banco || cuentaSeleccionada?.clave_banco || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Cuenta </span>

                        <strong>
                            {{ resultado.cuenta_bancaria?.cuenta_banco || cuentaSeleccionada?.cuenta_banco || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> CLABE </span>

                        <strong>
                            {{ handleCuentaEnmascarada(resultado.cuenta_bancaria?.clabe_bancaria || cuentaSeleccionada?.clabe_bancaria) }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Año </span>

                        <strong>
                            {{ resultado.archivo?.anio || frmCarga.anio || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Layout </span>

                        <strong>
                            {{ resultado.layout?.nombre || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Archivo </span>

                        <strong>
                            {{ resultado.archivo?.nombre || '-' }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Formato Real </span>

                        <strong>
                            {{ handleFormatoTipoArchivo(resultado.archivo?.tipo_real) }}
                        </strong>
                    </div>

                    <div class="dato-resultado">
                        <span> Hoja </span>

                        <strong>
                            {{ resultado.archivo?.hoja || 'No aplica' }}
                        </strong>
                    </div>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- RESUMEN -->
            <!-- ================================================= -->

            <div class="seccion-resumen">
                <div class="titulo-seccion">
                    <div class="titulo-seccion-principal">Resumen</div>
                </div>

                <div class="grid-resumen">
                    <div class="tarjeta-resumen">
                        <span> Movimientos </span>

                        <strong>
                            {{ resultado.resumen?.registros ?? 0 }}
                        </strong>
                    </div>

                    <div class="tarjeta-resumen">
                        <span> Ingresos </span>

                        <strong class="importe-ingreso">
                            {{ handleFormatoMoneda(resultado.resumen?.total_ingresos) }}
                        </strong>
                    </div>

                    <div class="tarjeta-resumen">
                        <span> Egresos </span>

                        <strong class="importe-egreso">
                            {{ handleFormatoMoneda(resultado.resumen?.total_egresos) }}
                        </strong>
                    </div>

                    <div class="tarjeta-resumen">
                        <span> Saldo Inicial </span>

                        <strong>
                            {{ handleFormatoMoneda(resultado.resumen?.saldo_inicial) }}
                        </strong>
                    </div>

                    <div class="tarjeta-resumen">
                        <span> Saldo Final </span>

                        <strong>
                            {{ handleFormatoMoneda(resultado.resumen?.saldo_final) }}
                        </strong>
                    </div>

                    <div class="tarjeta-resumen">
                        <span> Estado </span>

                        <div>
                            <span v-if="resultado.resumen?.correcto" class="estado-analisis estado-correcto">
                                <font-icon icon="fa-solid fa-circle-check" />

                                Correcto
                            </span>

                            <span v-else class="estado-analisis estado-observacion">
                                <font-icon icon="fa-solid fa-circle-exclamation" />

                                Con observaciones
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- METADATA -->
            <!-- ================================================= -->

            <div v-if="metadataArray.length > 0" class="seccion-metadata">
                <div class="titulo-seccion">
                    <div>
                        <div class="titulo-seccion-principal">Información Adicional</div>

                        <small class="texto-ayuda"> Metadata obtenida del estado de cuenta. </small>
                    </div>
                </div>

                <div class="grid-metadata">
                    <div v-for="item in metadataArray" :key="item.campo" class="metadata-item">
                        <span>
                            {{ item.etiqueta }}
                        </span>

                        <strong>
                            {{ item.valor }}
                        </strong>
                    </div>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- MOVIMIENTOS -->
            <!-- ================================================= -->

            <div class="seccion-movimientos">
                <div class="barra-tabla">
                    <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />

                    <IconField iconPosition="left">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>

                        <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
                    </IconField>

                    <div class="contador-registros">
                        {{ movimientos.length }}

                        movimiento(s)
                    </div>
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
                    <template #empty> No se encontraron movimientos. </template>

                    <Column field="fila_archivo" header="Fila" headerClass="encabezado-columna" style="width: 70px" />

                    <Column v-for="columna in columnasMovimientos" :key="columna.field" :field="columna.field" :header="columna.header" headerClass="encabezado-columna" :style="columna.style">
                        <template #body="slotProps">
                            <span v-if="columna.tipo === 'moneda'" :class="handleClaseImporte(columna.field, slotProps.data[columna.field])">
                                {{ handleFormatoMoneda(slotProps.data[columna.field]) }}
                            </span>

                            <span v-else>
                                {{ slotProps.data[columna.field] ?? '' }}
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- ================================================= -->
            <!-- VALIDACIONES -->
            <!-- ================================================= -->

            <div v-if="validaciones.length > 0" class="seccion-validaciones">
                <div class="titulo-seccion">
                    <div>
                        <div class="titulo-seccion-principal">Validaciones</div>

                        <small class="texto-ayuda"> Resultado de las validaciones configuradas. </small>
                    </div>
                </div>

                <DataTable :value="validaciones" size="small" class="tabla-encabezados">
                    <Column field="tipo" header="Tipo" headerClass="encabezado-columna" />

                    <Column field="fila" header="Fila" headerClass="encabezado-columna" />

                    <Column field="fecha" header="Fecha" headerClass="encabezado-columna" />

                    <Column header="Estado" headerClass="encabezado-columna">
                        <template #body="slotProps">
                            <span v-if="slotProps.data.correcto" class="estado-analisis estado-correcto"> Correcto </span>

                            <span v-else class="estado-analisis estado-observacion"> Revisar </span>
                        </template>
                    </Column>

                    <Column field="mensaje" header="Observación" headerClass="encabezado-columna" />
                </DataTable>
            </div>

            <!-- ================================================= -->
            <!-- ERRORES -->
            <!-- ================================================= -->

            <div v-if="errores.length > 0" class="seccion-validaciones">
                <div class="titulo-seccion">
                    <div>
                        <div class="titulo-seccion-principal">Errores de Lectura</div>

                        <small class="texto-ayuda"> Filas que no pudieron procesarse correctamente. </small>
                    </div>
                </div>

                <DataTable :value="errores" size="small" class="tabla-encabezados">
                    <Column field="fila" header="Fila" headerClass="encabezado-columna" style="width: 100px" />

                    <Column field="mensaje" header="Detalle" headerClass="encabezado-columna" />
                </DataTable>
            </div>
        </template>
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
