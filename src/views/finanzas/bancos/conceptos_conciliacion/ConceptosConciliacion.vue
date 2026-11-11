<template>
    <Encabezado titulo="Conceptos de Conciliación" subtitulo="Catálogo global para clasificación de movimientos bancarios" icono="pi pi-sitemap">
        <Button type="button" label="Nuevo Concepto" class="btn-nuevo" @click="handleNuevo">
            <template #icon>
                <font-icon icon="fa-solid fa-plus" class="mr-2" />
            </template>
        </Button>
    </Encabezado>

    <div class="card card-conceptos">
        <!-- ===================================================== -->
        <!-- CABECERA -->
        <!-- ===================================================== -->

        <div class="panel-superior">
            <div class="informacion-modulo">
                <div class="icono-modulo">
                    <font-icon icon="fa-solid fa-sitemap" />
                </div>

                <div>
                    <div class="titulo-modulo">Estructura de Conceptos</div>

                    <div class="subtitulo-modulo">Los conceptos y subconceptos están disponibles para todas las empresas y cuentas bancarias.</div>
                </div>
            </div>

            <div class="acciones-superiores">
                <Button icon="pi pi-plus" label="Expandir" text @click="handleExpandirTodo" />

                <Button icon="pi pi-minus" label="Contraer" text @click="handleContraerTodo" />
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- BUSCADOR -->
        <!-- ===================================================== -->

        <div class="barra-busqueda">
            <span class="p-input-icon-left campo-busqueda">
                <i class="pi pi-search"></i>

                <InputText v-model="buscar" placeholder="Buscar concepto, clave o descripción..." />
            </span>

            <div class="contador-conceptos">
                {{ totalConceptos }}
                conceptos
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- ÁRBOL -->
        <!-- ===================================================== -->

        <TreeTable v-model:expandedKeys="expandedKeys" :value="arbolFiltrado" :loading="cargando" class="tabla-conceptos" scrollable scrollHeight="65vh">
            <Column field="nombre" header="Concepto" expander style="min-width: 300px">
                <template #body="slotProps">
                    <div class="concepto-principal">
                        <div class="indicador-nivel" :class="`nivel-${Math.min(slotProps.node.data.nivel, 5)}`">
                            {{ slotProps.node.data.nivel }}
                        </div>

                        <div class="concepto-texto">
                            <strong>
                                {{ slotProps.node.data.nombre }}
                            </strong>

                            <small v-if="slotProps.node.data.descripcion">
                                {{ slotProps.node.data.descripcion }}
                            </small>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="clave" header="Clave" style="min-width: 120px">
                <template #body="slotProps">
                    <span class="clave-concepto">
                        {{ slotProps.node.data.clave || '-' }}
                    </span>
                </template>
            </Column>

            <Column field="orden" header="Orden" style="width: 90px" />

            <Column header="Estado" style="width: 100px">
                <template #body="slotProps">
                    <span class="estado" :class="slotProps.node.data.activo ? 'estado-activo' : 'estado-inactivo'">
                        {{ slotProps.node.data.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
            </Column>

            <Column header="" frozen alignFrozen="right" style="width: 155px">
                <template #body="slotProps">
                    <div class="acciones-fila">
                        <Button icon="pi pi-plus" text rounded severity="success" v-tooltip.top="'Agregar hijo'" @click="handleNuevoHijo(slotProps.node.data)" />

                        <Button icon="pi pi-pencil" text rounded v-tooltip.top="'Editar'" @click="handleEditar(slotProps.node.data)" />

                        <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Desactivar'" @click="handleEliminar(slotProps.node.data)" />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="tabla-vacia">No existen conceptos de conciliación.</div>
            </template>
        </TreeTable>
    </div>

    <!-- ========================================================= -->
    <!-- DIALOG -->
    <!-- ========================================================= -->

    <Dialog v-model:visible="visibleFormulario" modal :closable="!guardando" :draggable="false" :style="{ width: '850px' }" class="dialog-concepto">
        <template #header>
            <div class="dialog-header">
                <div class="dialog-icono">
                    <font-icon icon="fa-solid fa-sitemap" />
                </div>

                <div>
                    <div class="dialog-titulo">
                        {{ frmConcepto._id ? 'Editar Concepto' : 'Nuevo Concepto' }}
                    </div>

                    <small> Concepto global de conciliación bancaria </small>
                </div>
            </div>
        </template>

        <div class="formulario-concepto">
            <!-- ================================================= -->
            <!-- PADRE -->
            <!-- ================================================= -->

            <div class="campo-formulario campo-completo">
                <label>Concepto Padre</label>

                <Dropdown v-model="frmConcepto.parent_id" :options="opcionesPadres" optionLabel="label" optionValue="_id" placeholder="Sin padre - Nivel 1" filter showClear class="w-full" />

                <small> Sin padre significa que será un concepto de nivel 1. </small>
            </div>

            <div class="grid-formulario">
                <div class="campo-formulario">
                    <label>
                        Nombre
                        <span class="requerido">*</span>
                    </label>

                    <InputText v-model="frmConcepto.nombre" maxlength="150" class="w-full" placeholder="Ej. INGRESOS" />
                </div>

                <div class="campo-formulario">
                    <label>Clave</label>

                    <InputText v-model="frmConcepto.clave" maxlength="50" class="w-full" placeholder="Ej. ING" />
                </div>

                <div class="campo-formulario">
                    <label>Orden</label>

                    <InputNumber v-model="frmConcepto.orden" :min="1" :useGrouping="false" class="w-full" />
                </div>

                <div class="campo-formulario">
                    <label>Activo</label>

                    <div class="switch-activo">
                        <InputSwitch v-model="frmConcepto.activo" />

                        <span>
                            {{ frmConcepto.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="campo-formulario campo-completo">
                <label>Descripción</label>

                <Textarea v-model="frmConcepto.descripcion" rows="3" maxlength="500" class="w-full" placeholder="Descripción opcional del concepto" />
            </div>

            <div class="mensaje-global">
                <font-icon icon="fa-solid fa-circle-info" />
                <div>
                    <strong>Concepto global</strong>
                    <span>Disponible para todas las empresas y cuentas bancarias, al igual que sus subconceptos.</span>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" outlined :disabled="guardando" @click="visibleFormulario = false" />

            <Button label="Guardar" icon="pi pi-save" :loading="guardando" @click="handleGuardar" />
        </template>
    </Dialog>
</template>

<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';

import proceso from './js/proceso.js';

export default {
    name: 'ConceptosConciliacion',

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
