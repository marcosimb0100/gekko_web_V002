<template>
    <Encabezado titulo="Conceptos de Conciliación" subtitulo="Catálogo jerárquico para clasificación de movimientos bancarios" icono="pi pi-sitemap">
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

                    <div class="subtitulo-modulo">El nivel 1 puede asignarse a empresas y cuentas bancarias. Los niveles inferiores pueden crecer sin límite.</div>
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

                <InputText v-model="buscar" placeholder="Buscar concepto, clave, empresa o banco..." />
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

            <Column header="Empresas" style="min-width: 220px">
                <template #body="slotProps">
                    <div v-if="slotProps.node.data.nivel === 1" class="chips-resumen">
                        <span v-for="empresa in slotProps.node.data.empresas_detalle.slice(0, 2)" :key="empresa._id" class="chip-empresa">
                            {{ empresa.nombre }}
                        </span>

                        <span v-if="slotProps.node.data.empresas_detalle.length > 2" class="chip-mas"> +{{ slotProps.node.data.empresas_detalle.length - 2 }} </span>

                        <span v-if="slotProps.node.data.empresas_detalle.length === 0" class="texto-vacio"> Todas / Sin restricción </span>
                    </div>

                    <span v-else class="texto-heredado"> Heredado </span>
                </template>
            </Column>

            <Column header="Bancos / Cuentas" style="min-width: 240px">
                <template #body="slotProps">
                    <div v-if="slotProps.node.data.nivel === 1" class="chips-resumen">
                        <span v-for="banco in slotProps.node.data.bancos_detalle.slice(0, 2)" :key="banco._id" class="chip-banco">
                            {{ banco.banco }}
                            •
                            {{ handleCuentaCorta(banco.cuenta_banco) }}
                        </span>

                        <span v-if="slotProps.node.data.bancos_detalle.length > 2" class="chip-mas"> +{{ slotProps.node.data.bancos_detalle.length - 2 }} </span>

                        <span v-if="slotProps.node.data.bancos_detalle.length === 0" class="texto-vacio"> Todas / Sin restricción </span>
                    </div>

                    <span v-else class="texto-heredado"> Heredado </span>
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

                    <small> Configuración jerárquica de conciliación bancaria </small>
                </div>
            </div>
        </template>

        <div class="formulario-concepto">
            <!-- ================================================= -->
            <!-- PADRE -->
            <!-- ================================================= -->

            <div class="campo-formulario campo-completo">
                <label>Concepto Padre</label>

                <Dropdown v-model="frmConcepto.parent_id" :options="opcionesPadres" optionLabel="label" optionValue="_id" placeholder="Sin padre - Nivel 1" filter showClear class="w-full" @change="handleCambiarPadre" />

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

            <!-- ================================================= -->
            <!-- SOLO NIVEL 1 -->
            <!-- ================================================= -->

            <div v-if="esNivelUno" class="asignaciones-nivel-uno">
                <div class="titulo-seccion">
                    <div>
                        <strong> Asignación del nivel 1 </strong>

                        <small> Estas asignaciones aplicarán a todos sus subconceptos. </small>
                    </div>

                    <span class="badge-nivel"> Nivel 1 </span>
                </div>

                <!-- ============================================= -->
                <!-- EMPRESAS -->
                <!-- ============================================= -->

                <div class="campo-formulario campo-completo">
                    <label>Empresas</label>

                    <MultiSelect v-model="frmConcepto.empresas" :options="empresas" optionLabel="nombre" optionValue="_id" placeholder="Seleccione una o más empresas" display="chip" filter class="w-full" @change="handleCambiarEmpresas">
                        <template #option="slotProps">
                            <div class="opcion-empresa">
                                <strong>
                                    {{ slotProps.option.nombre }}
                                </strong>

                                <small>
                                    RFC:
                                    {{ slotProps.option.rfc || 'Sin RFC' }}
                                </small>
                            </div>
                        </template>
                    </MultiSelect>

                    <small> Si no seleccionas empresas, el concepto no tendrá restricción por empresa. </small>
                </div>

                <!-- ============================================= -->
                <!-- BANCOS -->
                <!-- ============================================= -->

                <div class="campo-formulario campo-completo">
                    <label>Cuentas Bancarias</label>

                    <MultiSelect
                        v-model="frmConcepto.bancos"
                        :options="bancosDisponibles"
                        optionLabel="label"
                        optionValue="_id"
                        placeholder="Seleccione las cuentas bancarias"
                        display="chip"
                        filter
                        class="w-full"
                        :disabled="frmConcepto.empresas.length === 0"
                    >
                        <template #option="slotProps">
                            <div class="opcion-banco">
                                <strong>
                                    {{ slotProps.option.banco }}
                                </strong>

                                <span>
                                    {{ slotProps.option.empresa }}
                                </span>

                                <small>
                                    Cuenta:
                                    {{ slotProps.option.cuenta_banco || '-' }}

                                    · CLABE:
                                    {{ slotProps.option.clabe_banco || '-' }}
                                </small>
                            </div>
                        </template>
                    </MultiSelect>

                    <small> Las cuentas se filtran según las empresas seleccionadas. </small>
                </div>
            </div>

            <!-- ================================================= -->
            <!-- NIVEL HIJO -->
            <!-- ================================================= -->

            <div v-else class="mensaje-herencia">
                <font-icon icon="fa-solid fa-circle-info" />

                <div>
                    <strong> Este concepto es un nivel inferior. </strong>

                    <span> Las empresas y cuentas bancarias se determinan desde su concepto de nivel 1. </span>
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
import Encabezado from '../../../components/encabezado/Encabezado.vue';

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
