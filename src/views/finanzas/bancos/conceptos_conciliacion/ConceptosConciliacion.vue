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
                <div class="selector-catalogo">
                    <label for="tipo-catalogo">Tipo de catálogo</label>
                    <Select id="tipo-catalogo" v-model="vista" :options="tiposCatalogo" optionLabel="nombre" optionValue="valor" :disabled="tipoBloqueado || cargando || guardando || visibleFormulario" />
                    <small>{{ tipoBloqueado ? 'El tipo quedó definido al iniciar el catálogo.' : 'Elige el tipo antes de guardar el primer concepto.' }}</small>
                </div>
                <Button v-if="vista === 'agrupado'" icon="pi pi-plus" label="Expandir" text @click="handleExpandirTodo" />

                <Button v-if="vista === 'agrupado'" icon="pi pi-minus" label="Contraer" text @click="handleContraerTodo" />
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
            <Column field="nombre" :header="vista === 'agrupado' ? 'Concepto' : 'Descripción'" :expander="vista === 'agrupado'" style="min-width: 300px">
                <template #body="slotProps">
                    <div class="concepto-principal">
                        <div v-if="vista === 'agrupado'" class="indicador-nivel" :class="`nivel-${Math.min(slotProps.node.data.nivel, 5)}`">
                            {{ slotProps.node.data.nivel }}
                        </div>

                        <div class="concepto-texto">
                            <strong>
                                {{ slotProps.node.data.nombre }}
                            </strong>
                            <Tag v-if="vista === 'agrupado'" :value="slotProps.node.data.agrupador ? 'Agrupador' : 'Concepto final'" :severity="slotProps.node.data.agrupador ? 'secondary' : 'info'" />
                            <small v-if="vista === 'Lista' && slotProps.node.data.parent_id">{{ slotProps.node.data.ruta_texto }}</small>

                            <small v-if="slotProps.node.data.descripcion">
                                {{ slotProps.node.data.descripcion }}
                            </small>
                        </div>
                    </div>
                </template>
            </Column>

            <Column v-if="vista !== 'lista'" field="clave" header="Clave" style="min-width: 120px">
                <template #body="slotProps">
                    <span class="clave-concepto">
                        {{ slotProps.node.data.clave || '-' }}
                    </span>
                </template>
            </Column>

            <Column v-if="vista === 'agrupado'" field="orden" header="Orden" style="width: 90px" />

            <template v-if="vista === 'especial_1'">
                <Column v-for="item in camposReporte" :key="item.campo" :header="item.nombre">
                    <template #body="{ node }">{{ node.data.clasificacion_reportes?.[item.campo] || '—' }}</template>
                </Column>
            </template>

            <Column v-if="vista !== 'lista'" header="Estado" style="width: 100px">
                <template #body="slotProps">
                    <span class="estado" :class="slotProps.node.data.activo ? 'estado-activo' : 'estado-inactivo'">
                        {{ slotProps.node.data.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
            </Column>

            <Column header="" frozen alignFrozen="right" style="width: 155px">
                <template #body="slotProps">
                    <div class="acciones-fila">
                        <Button v-if="vista === 'agrupado'" icon="pi pi-plus" text rounded severity="success" v-tooltip.top="'Agregar hijo'" @click="handleNuevoHijo(slotProps.node.data)" />

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

    <Dialog v-model:visible="visibleFormulario" modal :closable="!guardando" :draggable="false" :style="{ width: vista === 'lista' ? '32rem' : '850px' }" :breakpoints="{ '900px': '95vw' }" class="dialog-concepto">
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

            <div v-if="vista === 'agrupado'" class="campo-formulario campo-completo">
                <label>Dentro de qué categoría (opcional)</label>

                <Dropdown v-model="frmConcepto.parent_id" :options="opcionesPadres" optionLabel="label" optionValue="_id" placeholder="Sin categoría - Concepto independiente" filter showClear class="w-full" :disabled="guardando" />

                <small>Sin padre crea un concepto simple. Al agregarle subconceptos, se convierte en agrupador y solo sus conceptos finales podrán asignarse a nuevas operaciones.</small>
            </div>

            <small v-else class="campo-completo">{{ frmConcepto.parent_id ? 'Este concepto conserva su categoría. Para cambiarla, cierra el formulario y edítalo desde Árbol.' : 'Concepto independiente, disponible para todas las empresas. No necesitas elegir una categoría.' }}</small>

            <div class="grid-formulario">
                <div class="campo-formulario">
                    <label>
                        {{ vista === 'agrupado' ? 'Nombre' : 'Descripción' }}
                        <span class="requerido">*</span>
                    </label>

                    <InputText v-model="frmConcepto.nombre" maxlength="150" class="w-full" placeholder="Ej. INGRESOS" />
                </div>

                <div v-if="vista !== 'lista'" class="campo-formulario">
                    <label>Clave</label>

                    <InputText v-model="frmConcepto.clave" maxlength="50" class="w-full" placeholder="Ej. ING" />
                </div>

                <div v-if="vista === 'agrupado'" class="campo-formulario">
                    <label>Orden</label>

                    <InputNumber v-model="frmConcepto.orden" :min="1" :useGrouping="false" class="w-full" />
                </div>

                <div v-if="vista !== 'lista'" class="campo-formulario">
                    <label>Activo</label>

                    <div class="switch-activo">
                        <InputSwitch v-model="frmConcepto.activo" />

                        <span>
                            {{ frmConcepto.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="vista === 'agrupado'" class="campo-formulario campo-completo">
                <label>Descripción</label>

                <Textarea v-model="frmConcepto.descripcion" rows="3" maxlength="500" class="w-full" placeholder="Descripción opcional del concepto" />
            </div>

            <Fieldset v-if="vista === 'especial_1'" legend="Clasificación para reportes (opcional)" class="clasificacion-reportes">
                <p>Completa estos datos si utilizas el catálogo detallado del Excel. Para una lista sencilla puedes dejarlos vacíos. Son etiquetas de clasificación; no realizan cálculos.</p>
                <div class="grid-formulario">
                    <div v-for="item in camposReporte" :key="item.campo" class="campo-formulario">
                        <label :for="`reporte-${item.campo}`">{{ item.nombre }}</label>
                        <InputText :id="`reporte-${item.campo}`" v-model="frmConcepto.clasificacion_reportes[item.campo]" maxlength="200" class="w-full" :disabled="guardando" />
                    </div>
                </div>
            </Fieldset>

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
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Fieldset from 'primevue/fieldset';

import proceso from './js/proceso.js';

export default {
    name: 'ConceptosConciliacion',

    components: {
        Encabezado,
        Select,
        Tag,
        Fieldset
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
