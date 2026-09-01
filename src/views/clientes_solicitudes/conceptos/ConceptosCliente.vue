<template>

    <div class="conceptos-cliente">

        <div class="conceptos-contenedor">

            <!-- ================================================= -->
            <!-- ENCABEZADO -->
            <!-- ================================================= -->

            <div class="conceptos-header">

                <div class="header-izquierda">

                    <Button
                        type="button"
                        severity="secondary"
                        text
                        rounded
                        v-tooltip.top="'Regresar al portal'"
                        @click="handleRegresar"
                    >
                        <template #icon>

                            <font-icon
                                icon="fa-solid fa-arrow-left"
                            />

                        </template>
                    </Button>


                    <div class="header-icono">

                        <font-icon
                            icon="fa-solid fa-list-check"
                        />

                    </div>


                    <div>

                        <h2>
                            Conceptos facturables
                        </h2>

                        <p>
                            Consulta los conceptos disponibles
                            para facturación.
                        </p>

                    </div>

                </div>


                <div
                    v-if="nombreCliente"
                    class="cliente-nombre"
                >

                    {{ nombreCliente }}

                </div>

            </div>


            <!-- ================================================= -->
            <!-- FILTROS -->
            <!-- ================================================= -->

            <div class="conceptos-filtros">

                <div class="campo">

                    <label>
                        Empresa facturadora:
                    </label>

                    <Select
                        v-model="empresaSeleccionada"
                        :options="empresas"
                        optionLabel="razon_social_nombre_completo"
                        optionValue="_id"
                        placeholder="Seleccione una empresa"
                        class="w-full"
                        :loading="cargandoEmpresas"
                        @change="handleCambioEmpresa"
                    >

                        <template #option="slotProps">

                            <div class="empresa-opcion">

                                <strong>
                                    {{
                                        slotProps.option
                                            .razon_social_nombre_completo
                                    }}
                                </strong>

                                <small>
                                    {{
                                        slotProps.option.rfc
                                    }}
                                </small>

                            </div>

                        </template>

                    </Select>

                </div>


                <div
                    v-if="empresaActual"
                    class="empresa-seleccionada"
                >

                    <div>

                        <span class="empresa-etiqueta">
                            Empresa seleccionada
                        </span>

                        <strong>
                            {{
                                empresaActual
                                    .razon_social_nombre_completo
                            }}
                        </strong>

                        <small>
                            R.F.C.
                            {{
                                empresaActual.rfc
                            }}
                        </small>

                    </div>

                </div>

            </div>


            <!-- ================================================= -->
            <!-- TABLA -->
            <!-- ================================================= -->

            <div class="tabla-contenedor">

                <DataTable
                    :value="conceptos"
                    size="small"
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[10, 25, 50]"
                    scrollable
                    scrollHeight="52vh"
                    stripedRows
                    class="tabla-conceptos"
                    :loading="cargandoConceptos"
                >

                    <template #empty>

                        <div class="tabla-vacia">

                            <font-icon
                                icon="fa-solid fa-file-circle-xmark"
                            />

                            <span
                                v-if="!empresaSeleccionada"
                            >
                                Seleccione una empresa para
                                consultar los conceptos.
                            </span>

                            <span v-else>
                                No se encontraron conceptos
                                facturables para esta empresa.
                            </span>

                        </div>

                    </template>


                    <!-- CLAVE -->

                    <Column
                        field="prod_serv"
                        header="ProdServ"
                        headerClass="encabezado-columna"
                        style="min-width: 120px"
                    />


                    <!-- DESCRIPCION SAT -->

                    <Column
                        field="descripcion_sat"
                        header="Descripción SAT"
                        headerClass="encabezado-columna"
                        style="min-width: 220px"
                    />


                    <!-- DESCRIPCION -->

                    <Column
                        field="descripcion"
                        header="Descripción"
                        headerClass="encabezado-columna"
                        style="min-width: 260px"
                    />


                    <!-- CLAVE UNIDAD -->

                    <Column
                        field="clave_unidad"
                        header="Clave Unidad"
                        headerClass="encabezado-columna"
                        style="min-width: 125px"
                    />


                    <!-- UNIDAD -->

                    <Column
                        field="unidad"
                        header="Unidad"
                        headerClass="encabezado-columna"
                        style="min-width: 170px"
                    />


                    <!-- OBJETO IMPUESTO -->

                    <Column
                        header="Objeto Imp."
                        headerClass="encabezado-columna"
                        style="min-width: 190px"
                    >

                        <template #body="slotProps">

                            <div class="objeto-impuesto">

                                <span class="objeto-clave">

                                    {{
                                        slotProps.data.objeto_imp
                                    }}

                                </span>

                                <span>

                                    {{
                                        handleObjetoImp(
                                            slotProps.data
                                                .objeto_imp
                                        )
                                    }}

                                </span>

                            </div>

                        </template>

                    </Column>


                    <!-- CUENTA PREDIAL -->

                    <Column
                        field="cuenta_predial"
                        header="Cuenta Predial"
                        headerClass="encabezado-columna"
                        style="min-width: 150px"
                    />

                </DataTable>

            </div>

        </div>

    </div>

</template>


<script>

import proceso from './js/proceso.js';


export default {

    name:
        'ConceptosCliente',

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