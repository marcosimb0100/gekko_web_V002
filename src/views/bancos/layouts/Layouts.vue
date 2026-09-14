<template>
    <!-- ========================================================= -->
    <!-- ENCABEZADO -->
    <!-- ========================================================= -->

    <Encabezado titulo="Layouts Bancarios" subtitulo="Administración de formatos para carga de estados de cuenta" icono="pi pi-building">
        <!-- REGRESAR -->

        <Button v-if="bancoSeleccionado && !mostrarFormulario" type="button" label="Regresar" class="btn-cancelar" @click="handleRegresar">
            <template #icon>
                <font-icon icon="fa-solid fa-arrow-left" class="mr-2" />
            </template>
        </Button>

        <!-- NUEVO LAYOUT -->

        <!-- <Button v-if="bancoSeleccionado && !mostrarFormulario" type="button" label="Nuevo Layout" class="btn-nuevo" @click="handleNuevoLayout">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button> -->

        <!-- CANCELAR -->

        <Button v-if="mostrarFormulario" type="button" label="Cancelar" class="btn-cancelar" @click="handleCancelarFormulario">
            <template #icon>
                <font-icon icon="fa-solid fa-xmark" class="mr-2" />
            </template>
        </Button>

        <!-- GUARDAR -->

        <!-- <Button v-if="mostrarFormulario" type="button" label="Guardar" class="btn-guardar" :disabled="guardando" @click="handleGuardar">
            <template #icon>
                <font-icon icon="fa-solid fa-floppy-disk" class="mr-2" />
            </template>
        </Button> -->
    </Encabezado>

    <!-- ========================================================= -->
    <!-- TABLA DE BANCOS -->
    <!-- ========================================================= -->

    <div v-if="!bancoSeleccionado && !mostrarFormulario" class="card p-0 m-0 card-layouts" style="margin-top: 10px">
        <br />
        <div class="barra-tabla">
            <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltro" />

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="filtros.global.value" placeholder="Buscar..." class="buscador" />
            </IconField>
        </div>

        <DataTable
            v-model:filters="filtros"
            :value="bancos"
            :loading="cargando"
            :globalFilterFields="['clabe_banco', 'descripcion', 'razon_social']"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500, 700]"
            scrollable
            scrollHeight="54vh"
            size="small"
            tableStyle="min-width: 75rem"
            class="tabla-encabezados"
            style="font-size: 12px"
        >
            <template #empty> No se encontraron bancos. </template>

            <Column field="clabe_banco" header="Clave" headerClass="encabezado-columna" bodyClass="nowrap" style="width: 90px" />

            <Column field="descripcion" header="Banco" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 230px" />

            <Column field="razon_social" header="Razón Social" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 450px" />

            <Column header="Layouts" headerClass="encabezado-columna" style="width: 100px">
                <template #body="slotProps">
                    <span
                        class="contador-layouts"
                        :class="{
                            'contador-layouts-activo': Number(slotProps.data.numero_layouts_activos) > 0
                        }"
                    >
                        {{ slotProps.data.numero_layouts_activos ?? 0 }}
                    </span>
                </template>
            </Column>

            <Column header="Configuración" headerClass="encabezado-columna" style="width: 170px">
                <template #body="slotProps">
                    <span v-if="slotProps.data.configurado" class="estado-configuracion configurado">
                        <font-icon icon="fa-solid fa-circle-check" />

                        Configurado
                    </span>

                    <span v-else class="estado-configuracion pendiente">
                        <font-icon icon="fa-solid fa-circle-exclamation" />

                        Sin configurar
                    </span>
                </template>
            </Column>

            <Column header="Opciones" headerClass="encabezado-columna" style="width: 100px">
                <template #body="slotProps">
                    <div class="acciones-tabla">
                        <!-- <Button type="button" class="btn-opcion" v-tooltip.top="slotProps.data.configurado ? 'Ver layouts' : 'Configurar layout'" @click="handleAbrirBanco(slotProps.data)">
                            <template #icon>
                                <font-icon :icon="slotProps.data.configurado ? 'fa-solid fa-list' : 'fa-solid fa-plus'" />
                            </template>
                        </Button> -->
                        <Button type="button" class="btn-opcion" v-tooltip.top="'Ver layouts'" @click="handleAbrirBanco(slotProps.data)">
                            <template #icon>
                                <font-icon :icon="'fa-solid fa-list'" />
                            </template>
                        </Button>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- ========================================================= -->
    <!-- LAYOUTS DEL BANCO -->
    <!-- ========================================================= -->

    <div v-else-if="bancoSeleccionado && !mostrarFormulario" class="card p-10 m-0 card-layouts">
        <br />
        <div class="detalle-banco">
            <div>
                <div class="detalle-banco-titulo">
                    {{ bancoSeleccionado.descripcion }}
                </div>

                <div class="detalle-banco-subtitulo">
                    Clave:
                    {{ bancoSeleccionado.clabe_banco }}

                    <span class="separador">|</span>

                    {{ bancoSeleccionado.razon_social }}
                </div>
            </div>

            <div class="badge-total-layouts">
                {{ bancoSeleccionado.numero_layouts ?? 0 }}
                Layout(s)
            </div>
        </div>

        <div class="barra-tabla">
            <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined @click="handleLimpiarFiltroLayouts" />

            <IconField iconPosition="left">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>

                <InputText v-model="filtrosLayouts.global.value" placeholder="Buscar..." class="buscador" />
            </IconField>
        </div>

        <DataTable
            v-model:filters="filtrosLayouts"
            :value="bancoSeleccionado.layouts || []"
            :globalFilterFields="['nombre', 'descripcion', 'tipo_archivo']"
            paginator
            :rows="100"
            :rowsPerPageOptions="[100, 250, 500]"
            scrollable
            scrollHeight="48vh"
            size="small"
            class="tabla-encabezados"
            style="font-size: 12px"
        >
            <template #empty> Este banco todavía no tiene layouts configurados. </template>

            <Column field="orden_layout" header="#" headerClass="encabezado-columna" style="width: 55px" />

            <Column field="nombre" header="Nombre" headerClass="encabezado-columna" bodyClass="nowrap" style="min-width: 230px" />

            <Column field="descripcion" header="Descripción" headerClass="encabezado-columna" style="min-width: 350px" />

            <Column field="tipo_archivo" header="Formato" headerClass="encabezado-columna" bodyClass="nowrap" style="width: 150px">
                <template #body="slotProps">
                    {{ handleFormatoArchivo(slotProps.data.tipo_archivo) }}
                </template>
            </Column>

            <Column header="Extensiones" headerClass="encabezado-columna" style="min-width: 150px">
                <template #body="slotProps">
                    <div class="extensiones">
                        <span v-for="extension in slotProps.data.extensiones || []" :key="extension" class="extension">
                            {{ extension }}
                        </span>
                    </div>
                </template>
            </Column>

            <Column field="fila_encabezados" header="Fila Enc." headerClass="encabezado-columna" style="width: 95px" />

            <Column field="fila_inicial" header="Fila Inicial" headerClass="encabezado-columna" style="width: 95px" />

            <Column field="orden" header="Orden" headerClass="encabezado-columna" style="width: 110px">
                <template #body="slotProps">
                    {{ slotProps.data.orden === 'desc' ? 'Descendente' : 'Ascendente' }}
                </template>
            </Column>

            <Column header="Activo" headerClass="encabezado-columna" style="width: 75px">
                <template #body="slotProps">
                    <font-icon v-if="slotProps.data.activo" icon="fa-solid fa-circle-check" class="icono-activo" />

                    <font-icon v-else icon="fa-solid fa-circle-xmark" class="icono-inactivo" />
                </template>
            </Column>

            <Column header="Opciones" headerClass="encabezado-columna" style="width: 90px">
                <template #body="slotProps">
                    <div class="acciones-tabla">
                        <Button type="button" class="btn-opcion" v-tooltip.top="'Editar'" @click="handleEditar(slotProps.data)">
                            <template #icon>
                                <font-icon icon="fa-solid fa-pen-to-square" />
                            </template>
                        </Button>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- ========================================================= -->
    <!-- FORMULARIO -->
    <!-- ========================================================= -->

    <div v-else-if="mostrarFormulario" class="card formulario-layout">
        <ScrollPanel style="height: 67vh">
            <div class="contenido-formulario">
                <div class="titulo-formulario-principal">
                    {{ frmLayout._id ? 'Editar Layout Bancario' : 'Nuevo Layout Bancario' }}
                </div>

                <!-- ================================================= -->
                <!-- INFORMACION GENERAL -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion">Información General</div>

                    <div class="grid-formulario grid-4">
                        <div class="campo-formulario">
                            <label> Banco: </label>

                            <InputText :modelValue="bancoSeleccionado?.descripcion" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Clave: </label>

                            <InputText :modelValue="bancoSeleccionado?.clabe_banco" disabled />
                        </div>

                        <div class="campo-formulario campo-doble">
                            <label>
                                <span class="requerido">*</span>
                                Nombre Layout:
                            </label>

                            <InputText v-model="frmLayout.nombre" disabled />
                        </div>
                    </div>

                    <div class="grid-formulario grid-4">
                        <div class="campo-formulario campo-triple">
                            <label> Descripción: </label>

                            <InputText v-model="frmLayout.descripcion" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Orden Layout: </label>

                            <InputNumber v-model="frmLayout.orden_layout" :min="1" :useGrouping="false" disabled />
                        </div>
                    </div>
                </div>

                <!-- ================================================= -->
                <!-- CONFIGURACION ARCHIVO -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion">Configuración del Archivo</div>

                    <div class="grid-formulario grid-4">
                        <div class="campo-formulario">
                            <label>
                                <span class="requerido">*</span>
                                Tipo Archivo:
                            </label>

                            <Dropdown v-model="frmLayout.tipo_archivo" :options="catalogoTiposArchivo" optionLabel="label" optionValue="value" class="w-full" @change="handleCambiarTipoArchivo" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Extensiones: </label>

                            <InputText v-model="frmLayout.extensionesTexto" placeholder=".xls, .xlsx" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label>
                                <span class="requerido">*</span>
                                Fila Encabezados:
                            </label>

                            <InputNumber v-model="frmLayout.fila_encabezados" :min="1" :useGrouping="false" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label>
                                <span class="requerido">*</span>
                                Fila Inicial:
                            </label>

                            <InputNumber v-model="frmLayout.fila_inicial" :min="1" :useGrouping="false" disabled />
                        </div>
                    </div>

                    <div class="grid-formulario grid-4">
                        <div class="campo-formulario">
                            <label> Orden Movimientos: </label>

                            <Dropdown v-model="frmLayout.orden" :options="catalogoOrden" optionLabel="label" optionValue="value" class="w-full" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Separador: </label>

                            <Dropdown v-model="frmLayout.separador" :options="catalogoSeparadores" optionLabel="label" optionValue="value" placeholder="No aplica" showClear class="w-full" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Filas Vacías Fin: </label>

                            <InputNumber v-model="frmLayout.filas_vacias_fin" :min="1" :useGrouping="false" disabled />
                        </div>

                        <div class="campo-formulario">
                            <label> Activo: </label>

                            <div class="contenedor-checkbox">
                                <Checkbox v-model="frmLayout.activo" binary disabled />

                                <span> Layout activo </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ================================================= -->
                <!-- HOJA -->
                <!-- ================================================= -->

                <div v-if="handleEsExcel()" class="seccion-formulario">
                    <div class="titulo-seccion">Configuración de Hoja</div>

                    <div class="grid-formulario grid-3">
                        <div class="campo-formulario">
                            <label> Selección: </label>

                            <Dropdown v-model="frmLayout.hoja.modo" :options="catalogoModoHoja" optionLabel="label" optionValue="value" class="w-full" disabled />
                        </div>

                        <div v-if="frmLayout.hoja.modo !== 'primera'" class="campo-formulario campo-doble">
                            <label> Nombre / Contenido: </label>

                            <InputText v-model="frmLayout.hoja.valor" disabled />
                        </div>
                    </div>
                </div>

                <!-- ================================================= -->
                <!-- ENCABEZADOS -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion titulo-seccion-boton">
                        <div>
                            <div>Encabezados Esperados</div>

                            <small class="texto-ayuda"> Se utilizan para identificar automáticamente el layout. </small>
                        </div>

                        <!-- <Button type="button" label="Agregar" class="btn-nuevo" @click="handleAgregarEncabezado">
                            <template #icon>
                                <font-icon icon="fa-solid fa-plus" class="mr-2" />
                            </template>
                        </Button> -->
                    </div>

                    <DataTable :value="frmLayout.encabezadosArray" size="small" class="tabla-encabezados tabla-configuracion">
                        <template #empty> No hay encabezados configurados. </template>

                        <Column header="Índice" headerClass="encabezado-columna" style="width: 150px">
                            <template #body="slotProps">
                                <InputNumber v-model="slotProps.data.indice" :min="0" :useGrouping="false" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Texto Esperado" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <InputText v-model="slotProps.data.texto" class="w-full" disabled />
                            </template>
                        </Column>

                        <!-- <Column header="" headerClass="encabezado-columna" style="width: 65px">
                            <template #body="slotProps">
                                <Button type="button" icon="pi pi-trash" severity="danger" text rounded @click="handleEliminarEncabezado(slotProps.index)" />
                            </template>
                        </Column> -->
                    </DataTable>
                </div>

                <!-- ================================================= -->
                <!-- COLUMNAS -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion titulo-seccion-boton">
                        <div>
                            <div>Columnas de Movimientos</div>

                            <small class="texto-ayuda"> Define qué representa cada columna del archivo. </small>
                        </div>

                        <!-- <Button type="button" label="Agregar" class="btn-nuevo" @click="handleAgregarColumna">
                            <template #icon>
                                <font-icon icon="fa-solid fa-plus" class="mr-2" />
                            </template>
                        </Button> -->
                    </div>

                    <DataTable :value="frmLayout.columnas" size="small" class="tabla-encabezados tabla-configuracion">
                        <template #empty> No hay columnas configuradas. </template>

                        <Column header="Campo" headerClass="encabezado-columna">
                            <template #body="slotProps">
                                <InputText v-model="slotProps.data.campo" placeholder="fecha" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Índice" headerClass="encabezado-columna" style="width: 160px">
                            <template #body="slotProps">
                                <InputNumber v-model="slotProps.data.indice" :min="0" :useGrouping="false" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Tipo" headerClass="encabezado-columna" style="width: 230px">
                            <template #body="slotProps">
                                <Dropdown v-model="slotProps.data.tipo" :options="catalogoTiposDato" optionLabel="label" optionValue="value" class="w-full" disabled />
                            </template>
                        </Column>

                        <!-- <Column header="" headerClass="encabezado-columna" style="width: 65px">
                            <template #body="slotProps">
                                <Button type="button" icon="pi pi-trash" severity="danger" text rounded @click="handleEliminarColumna(slotProps.index)" disabled />
                            </template>
                        </Column> -->
                    </DataTable>
                </div>

                <!-- ================================================= -->
                <!-- METADATA -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion titulo-seccion-boton">
                        <div>
                            <div>Metadata</div>

                            <small class="texto-ayuda"> Datos adicionales del estado de cuenta: cuenta, periodo, RFC, saldos, etc. </small>
                        </div>

                        <!-- <Button type="button" label="Agregar" class="btn-nuevo" @click="handleAgregarMetadata">
                            <template #icon>
                                <font-icon icon="fa-solid fa-plus" class="mr-2" />
                            </template>
                        </Button> -->
                    </div>

                    <DataTable :value="frmLayout.metadataArray" size="small" class="tabla-encabezados tabla-configuracion">
                        <template #empty> No hay metadata configurada. </template>

                        <Column header="Campo" headerClass="encabezado-columna" style="min-width: 180px">
                            <template #body="slotProps">
                                <InputText v-model="slotProps.data.campo" placeholder="cuenta" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Celda" headerClass="encabezado-columna" style="width: 140px">
                            <template #body="slotProps">
                                <InputText v-model="slotProps.data.celda" placeholder="B2" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Tipo" headerClass="encabezado-columna" style="width: 190px">
                            <template #body="slotProps">
                                <Dropdown v-model="slotProps.data.tipo" :options="catalogoTiposDato" optionLabel="label" optionValue="value" class="w-full" disabled />
                            </template>
                        </Column>

                        <Column header="Regex" headerClass="encabezado-columna" style="min-width: 300px">
                            <template #body="slotProps">
                                <InputText v-model="slotProps.data.regex" placeholder="Opcional" class="w-full" disabled />
                            </template>
                        </Column>

                        <!-- <Column header="" headerClass="encabezado-columna" style="width: 65px">
                            <template #body="slotProps">
                                <Button type="button" icon="pi pi-trash" severity="danger" text rounded @click="handleEliminarMetadata(slotProps.index)" />
                            </template>
                        </Column> -->
                    </DataTable>
                </div>

                <!-- ================================================= -->
                <!-- VALIDACIONES -->
                <!-- ================================================= -->

                <div class="seccion-formulario">
                    <div class="titulo-seccion">Validaciones</div>

                    <div class="grid-formulario grid-3">
                        <div class="campo-formulario">
                            <label> Saldo: </label>

                            <div class="contenedor-checkbox">
                                <Checkbox v-model="frmLayout.validaciones.saldo" binary disabled />

                                <span> Validar continuidad de saldo </span>
                            </div>
                        </div>

                        <div class="campo-formulario">
                            <label> Totales: </label>

                            <div class="contenedor-checkbox">
                                <Checkbox v-model="frmLayout.validaciones.totales" binary disabled />

                                <span> Validar totales </span>
                            </div>
                        </div>

                        <div class="campo-formulario">
                            <label> Tolerancia: </label>

                            <InputNumber v-model="frmLayout.validaciones.tolerancia" :min="0" :minFractionDigits="2" :maxFractionDigits="4" disabled />
                        </div>
                    </div>
                </div>
            </div>
        </ScrollPanel>
    </div>
</template>

<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'Layouts',

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
