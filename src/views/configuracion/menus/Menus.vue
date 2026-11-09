<template>
    <Encabezado titulo="Catálogo de menús" subtitulo="Opciones y estructura de navegación" icono="pi pi-sitemap">
        <Button label="Nuevo menú" icon="pi pi-plus" class="btn-nuevo" @click="handleNuevo" />
    </Encabezado>
    <div class="card menus-contenedor">
        <div class="menus-resumen"><Tag severity="secondary" :value="resumen.total + ' opciones'" /><Tag severity="success" :value="resumen.activos + ' activas'" /><Tag severity="info" :value="resumen.pantallas + ' pantallas'" /></div>
        <div class="menus-barra"><div class="menus-busqueda"><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiarFiltro" /><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar menú o ruta..." /></IconField></div><Button label="Nuevo orden" icon="pi pi-sort-alt" outlined :disabled="cargando || !menus.length" @click="handleNuevoOrden" /><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargarMenus" /><Button label="Actualizar perfiles asignados" icon="pi pi-users" outlined :disabled="cargando || !menus.length" @click="handleVistaPerfiles" /></div>
        <div class="menus-arbol-cabecera"><span>Estructura del menú</span><div><Button label="Expandir todo" icon="pi pi-angle-double-down" text size="small" @click="handleExpandirTodo" /><Button label="Contraer todo" icon="pi pi-angle-double-up" text size="small" @click="handleContraerTodo" /></div></div>
        <ScrollPanel class="menus-desplazamiento">
        <Tree v-model:expandedKeys="nodosAbiertos" :value="arbolMenus" :loading="cargando" class="menus-arbol" aria-label="Estructura de menus">
            <template #empty>No se encontraron menús.</template>
            <template #default="{ node }">
                <div class="menus-nodo" :class="{ 'menus-nodo-inactivo': !node.data.activo }">
                    <div class="menus-nodo-identidad"><span class="menus-nodo-icono"><font-icon :icon="node.data.icono || 'fa-solid fa-list'" /></span><div><div class="menus-nodo-titulo"><strong>{{ node.label }}</strong><Tag :value="node.data.tipo_menu" severity="secondary" /><Tag v-if="!node.data.activo" value="Inactivo" severity="warn" /></div><small>{{ node.data.url || node.data.path || 'Sección principal' }}</small></div></div>
                    <div class="menus-nodo-acciones"><span class="menus-nodo-orden">Orden {{ node.data['orden_' + node.data.tipo_menu] }}</span><Button icon="pi pi-pencil" text rounded :title="'Editar ' + node.label" :aria-label="'Editar ' + node.label" @click.stop="handleEditar(node.data)" /></div>
                </div>
            </template>
        </Tree>
        </ScrollPanel>
    </div>
    <Dialog v-model:visible="mostrarPerfiles" modal header="Actualizar perfiles asignados" :style="{ width: '48rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!actualizandoPerfiles" :closeOnEscape="!actualizandoPerfiles">
        <div class="menus-perfiles-detalle">
            <p>Se aplicarán el orden, la estructura, las etiquetas y los iconos actuales a las opciones que cada perfil ya tiene autorizadas.</p>
            <div class="menus-resumen"><Tag severity="secondary" :value="vistaPerfiles.total + ' perfiles asignados'" /><Tag severity="info" :value="vistaPerfiles.por_actualizar + ' por actualizar'" /></div>
            <Message v-if="errorPerfiles" severity="warn" :closable="false">{{ errorPerfiles }}</Message>
            <DataTable :value="vistaPerfiles.perfiles" :loading="cargandoPerfiles" size="small" scrollable scrollHeight="38vh" class="menus-perfiles-tabla">
                <template #empty>No hay perfiles activos con asignaciones activas.</template>
                <Column field="nombre" header="Perfil" />
                <Column field="asignaciones" header="Asignaciones" />
                <Column field="rutas_antes" header="Rutas actuales" />
                <Column field="rutas_despues" header="Rutas resultantes" />
                <Column header="Estado"><template #body="{ data }"><Tag :severity="data.cambio ? 'info' : 'success'" :value="data.cambio ? 'Por actualizar' : 'Sin cambios'" /></template></Column>
            </DataTable>
            <small>Las opciones nuevas requieren asignación expresa. No cambian las asignaciones de usuarios ni los permisos especiales. Los usuarios verán el menú actualizado al recargar la página.</small>
        </div>
        <template #footer><Button label="Cerrar" outlined :disabled="actualizandoPerfiles" @click="handleCerrarPerfiles" /><Button label="Revisar nuevamente" icon="pi pi-refresh" text :disabled="cargandoPerfiles || actualizandoPerfiles" @click="handleVistaPerfiles" /><Button label="Confirmar actualizacion" icon="pi pi-check" class="btn-guardar" :loading="actualizandoPerfiles" :disabled="cargandoPerfiles || actualizandoPerfiles || !vistaPerfiles.version || !vistaPerfiles.por_actualizar" @click="handleActualizarPerfiles" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarOrden" modal header="Nuevo orden del menú" :style="{ width: '52rem' }" :breakpoints="{ '768px': '96vw' }" :closable="!guardandoOrden" :closeOnEscape="!guardandoOrden" class="menus-dialog-orden">
        <div class="menus-orden-instrucciones"><i class="pi pi-arrows-alt" /><span>Arrastra una opción entre sus hermanos para cambiar el orden, o sobre un agrupador para cambiar su padre. Máximo tres niveles.</span></div>
        <div class="menus-orden-resumen"><Tag severity="info" :value="cambiosOrden + ' opciones modificadas'" /><Button label="Restablecer" icon="pi pi-refresh" text :disabled="guardandoOrden" @click="handleRestablecerOrden" /></div>
        <Message v-if="errorOrden" severity="warn" :closable="false">{{ errorOrden }}</Message>
        <ScrollPanel class="menus-orden-scroll">
            <Tree :value="arbolOrden" v-model:expandedKeys="abiertosOrden" :draggableNodes="!guardandoOrden" :droppableNodes="!guardandoOrden" validateDrop draggableScope="catalogo-menu-orden" droppableScope="catalogo-menu-orden" @node-drop="handleMoverMenu" class="menus-arbol menus-arbol-orden" aria-label="Arrastra para reordenar menus">
                <template #default="{ node }"><div class="menus-orden-nodo"><i class="pi pi-bars menus-asa" /><font-icon :icon="node.data.icono || 'fa-solid fa-list'" /><div><strong>{{ node.label }}</strong><small>{{ node.data.url || node.data.path || 'Sección principal' }}</small></div><Tag :value="node.data.tipo_menu" severity="secondary" /><small class="menus-orden-numero">{{ node.data['orden_' + node.data.tipo_menu] }}</small></div></template>
            </Tree>
        </ScrollPanel>
        <template #footer><Button label="Cancelar" outlined :disabled="guardandoOrden" @click="handleCancelarOrden" /><Button label="Guardar orden" icon="pi pi-save" class="btn-guardar" :loading="guardandoOrden" :disabled="guardandoOrden || !cambiosOrden" @click="handleGuardarOrden" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarFormulario" modal :header="frmMenu._id ? 'Editar menú' : 'Nuevo menú'" :style="{ width: '46rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <form id="formMenu" class="menus-formulario" @submit.prevent="handleGuardar">
            <div class="menus-vista-previa"><font-icon :icon="frmMenu.icono" /><div><strong>{{ frmMenu.etiqueta || 'Nombre de la opcion' }}</strong><small>{{ padreElegido?.etiqueta || 'Seccion principal' }}<span v-if="frmMenu._id"> &middot; {{ frmMenu.id_menu }}</span></small></div></div>
            <div class="menus-grid">
                <div class="menus-campo"><label for="nivelMenu">Nivel *</label><Select inputId="nivelMenu" v-model="frmMenu.tipo_menu" :options="niveles" optionLabel="label" optionValue="value" :disabled="!!frmMenu._id" /></div>
                <div class="menus-campo"><label for="padreMenu">Menú padre<span v-if="frmMenu.tipo_menu !== 'N1'"> *</span></label><Select inputId="padreMenu" v-model="frmMenu.id_menu_padre" :options="padres" optionLabel="texto" optionValue="id_menu" filter placeholder="Selecciona el padre" :disabled="frmMenu.tipo_menu === 'N1' || !!frmMenu._id" /></div>
                <div class="menus-campo"><label for="etiquetaMenu">Etiqueta *</label><InputText id="etiquetaMenu" v-model="frmMenu.etiqueta" maxlength="80" /></div>
                <div class="menus-campo"><label for="iconoMenu">Icono *</label>
                    <Select inputId="iconoMenu" v-model="frmMenu.icono" :options="opcionesIcono" optionLabel="label" optionValue="value" filter filterBy="busqueda,value" filterPlaceholder="Buscar por nombre o palabra..." emptyFilterMessage="No se encontraron iconos" :virtualScrollerOptions="{ itemSize: 44 }" scrollHeight="264px">
                        <template #value="{ value }"><div class="menus-icono-opcion"><font-icon :icon="value" /><span>{{ opcionesIcono.find(item => item.value === value)?.label || value }}</span></div></template>
                        <template #option="{ option }"><div class="menus-icono-opcion menus-icono-lista"><font-icon :icon="option.value" /><span>{{ option.label }}<small>{{ option.codigo }}</small></span></div></template>
                    </Select>
                    <small>{{ opcionesIcono.length }} iconos disponibles. Puedes buscar por nombre o codigo.</small>
                </div>
                <div class="menus-campo"><label for="urlMenu">URL de la pantalla<span v-if="frmMenu.tipo_menu === 'N3'"> *</span></label><InputText id="urlMenu" v-model="frmMenu.url" placeholder="/catalogos/proveedores" :disabled="frmMenu.tipo_menu === 'N1' || menuTieneHijos" /><small>{{ frmMenu.tipo_menu === 'N2' ? 'Deja esta URL vacia si es un agrupador.' : 'Debe corresponder a una ruta existente en la web.' }}</small></div>
                <div class="menus-campo"><label for="pathMenu">Path de agrupación</label><InputText id="pathMenu" v-model="frmMenu.path" placeholder="/administrador_cfdi/operaciones_cfdi" /><small>Opcional para agrupadores; no crea una pantalla.</small></div>
                <div class="menus-campo"><label for="ordenMenu">Orden *</label><InputNumber inputId="ordenMenu" v-model="frmMenu.orden" :min="1" :max="9999" :useGrouping="false" showButtons /></div>
                <div class="menus-activo"><Checkbox inputId="activoMenu" v-model="frmMenu.activo" binary /><label for="activoMenu">Activo</label></div>
            </div>
            <small class="menus-nota">Los identificadores son automáticos. El nivel y el padre permanecen fijos al editar para conservar las relaciones.</small>
        </form>
        <template #footer><Button label="Cancelar" icon="pi pi-times" outlined :disabled="guardando" @click="handleCancelar" /><Button label="Guardar" icon="pi pi-save" class="btn-guardar" form="formMenu" type="submit" :disabled="botonGuardarDeshabilitado" :loading="guardando" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'Menus', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
