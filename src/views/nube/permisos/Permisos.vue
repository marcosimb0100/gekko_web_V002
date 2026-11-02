<template>
    <Encabezado titulo="Permisos de repositorios" subtitulo="Asignación de acceso y herencia entre carpetas" icono="pi pi-shield">
        <Button type="button" label="Guía de permisos" icon="pi pi-info-circle" outlined @click="handleMostrarInformacion" />
    </Encabezado>

    <div class="card sync-permisos">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="sync-filtros">
            <div class="sync-campo">
                <label>Asignar acceso</label>
                <Tag :value="tipo === 'usuarios' ? 'Permisos por usuario' : 'Permisos por perfil'" severity="info" />
            </div>
            <div class="sync-campo">
                <label for="sync-buscar">Buscar {{ tipo === 'usuarios' ? 'usuario' : 'perfil' }}</label>
                <div class="sync-busqueda">
                    <InputText id="sync-buscar" v-model="buscar" placeholder="Escribe un nombre" :disabled="cargando" @keyup.enter="handleBuscarSujetos" />
                    <Button type="button" label="Buscar" icon="pi pi-search" :disabled="cargando" @click="handleBuscarSujetos" />
                </div>
            </div>
            <div class="sync-campo">
                <label for="sync-sujeto">{{ tipo === 'usuarios' ? 'Usuario' : 'Perfil' }}</label>
                <Select v-model="sujetoId" inputId="sync-sujeto" :options="sujetos" optionLabel="nombre" optionValue="_id" placeholder="Selecciona una opción" :disabled="cargando" filter @change="handleSeleccionarSujeto" />
            </div>
            <div class="sync-controles">
                <Button v-if="hayMasSujetos" type="button" label="Más resultados" text :disabled="cargando" @click="handleMasSujetos" />
                <Button type="button" label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando || !sujetoId" @click="handleActualizar" />
            </div>
        </div>

        <TreeTable v-model:expandedKeys="expandedKeys" :value="filas" :loading="cargando" scrollable scrollHeight="50vh" class="tabla-encabezados sync-matriz" tableStyle="min-width: 85rem" @node-expand="handleExpandirNodo">
            <template #empty><div class="sync-vacio"><i class="pi pi-folder-open" aria-hidden="true" /><span>{{ sujetoId ? 'No hay repositorios disponibles.' : 'Selecciona un perfil o usuario para ver sus repositorios.' }}</span></div></template>
            <Column field="nombre" header="Repositorio / carpeta" expander>
                <template #body="{ node }">
                    <Button v-if="node.data.esMas" type="button" label="Más carpetas" icon="pi pi-plus" text :disabled="cargando" @click="handleMasCarpetas(node)" />
                    <span v-else><i :class="node.data.tipo_recurso === 'carpeta' ? 'pi pi-folder' : 'pi pi-database'" aria-hidden="true" /> {{ node.data.nombre }}</span>
                </template>
            </Column>
            <Column header="Origen de permisos" class="sync-origen-columna">
                <template #body="{ node }">
                    <div v-if="!node.data.esMas" class="sync-origen">
                        <template v-if="node.data.tipo_recurso === 'carpeta'">
                            <div class="sync-herencia-control">
                                <Checkbox v-model="node.data.heredar" :inputId="`herencia-${node.key}`" binary :disabled="cargando" @change="handleHeredar(node.data)" />
                                <label :for="`herencia-${node.key}`">{{ handleOrigenHerencia(node.data) }}</label>
                            </div>
                            <Tag v-if="!node.data.heredar" value="Permisos personalizados" severity="info" />
                            <Tag v-else-if="!node.data.acciones.length" value="Sin permisos heredados" severity="warn" />
                        </template>
                        <Tag v-else :value="tipo === 'usuarios' ? 'Permisos del usuario' : 'Permisos del perfil'" severity="secondary" />
                    </div>
                </template>
            </Column>
            <Column v-for="col in columnasVisibles" :key="col.accion" :header="col.nombre" class="sync-celda-permiso">
                <template #body="{ node }"><Checkbox v-if="!node.data.esMas" v-model="node.data.acciones" :value="col.accion" :disabled="cargando || node.data.heredar" :aria-label="`${col.nombre} en ${node.data.nombre}`" @change="handleCambiarPermiso(node.data, col.accion)" /></template>
            </Column>
            <Column header="Acción"><template #body="{ node }"><Button v-if="!node.data.esMas" type="button" label="Guardar" icon="pi pi-save" class="btn-guardar" :disabled="cargando" @click="handleGuardar(node.data)" /></template></Column>
        </TreeTable>

        <div v-if="sujetoId" class="sync-paginacion"><Button type="button" label="Anterior" icon="pi pi-angle-left" outlined :disabled="cargando || !offset" @click="handlePaginar(-1)" /><span>Página {{ offset / limite + 1 }}</span><Button type="button" label="Siguiente" icon="pi pi-angle-right" iconPos="right" outlined :disabled="cargando || filas.length < limite" @click="handlePaginar(1)" /></div>
    </div>

    <Dialog v-model:visible="informacionVisible" modal header="Guía de permisos" class="sync-ayuda-dialogo">
        <div class="sync-ayuda">
            <div><h3>Administradores de Nube</h3><p>Los usuarios incluidos en Administradores, en Nube → Configuración, tienen acceso completo a todos los repositorios y sus carpetas. Por eso no aparecen en el selector de usuarios de esta pantalla y no necesitan marcar permisos individuales.</p><p>Administra esa lista desde Nube → Configuración. Para los usuarios que no son administradores, se aplican los permisos del modelo seleccionado. Incluso los administradores necesitan que la API de sincronización Windows esté habilitada y que su equipo esté autorizado para sincronizar.</p></div>
            <div><h3>Acceso por repositorio</h3><p>Despliega un repositorio para ver sus carpetas y niveles inferiores. Cada carpeta hereda sus permisos hasta que guardes una regla propia. Guarda los cambios con el botón de cada fila.</p></div>
            <div><h3>Permisos disponibles</h3><DataTable :value="columnas" size="small"><Column field="nombre" header="Permiso" /><Column field="descripcion" header="Qué permite" /></DataTable></div>
            <div><h3>Modelo e herencia</h3><p>El modelo se elige en Nube → Configuración: por usuario o por perfil. Solo se aplica el modelo seleccionado; las reglas del otro modelo se conservan sin aplicarse.</p><p>En la raíz del repositorio, edita los permisos del usuario o perfil seleccionado. Las subcarpetas usan los permisos del directorio padre hasta que desactives la opción de herencia y guardes una regla propia.</p><p>Sin permisos heredados significa que el padre no concede ninguna acción. Una lista personalizada vacía deniega el acceso. Se necesita Lectura en los directorios anteriores para llegar a una subcarpeta. Los administradores de Nube mantienen acceso completo.</p></div>
            <div><h3>Funciones pendientes</h3><p>Sync local y Editar local ya se guardan en la API, pero su ejecución requiere el programa Windows pendiente. La raíz debe permitir Sync local; las carpetas pueden restringirlo. Autoriza los equipos en Nube → Equipos Windows. Mover archivos, compartir enlaces y la vista previa todavía no están disponibles.</p></div>
        </div>
        <template #footer><Button type="button" label="Entendido" icon="pi pi-check" @click="handleCerrarInformacion" /></template>
    </Dialog>
</template>

<script>
import proceso from './js/proceso.js';
import Encabezado from '../../../components/encabezado/Encabezado.vue';

export default {
    name: 'PermisosSync',
    components: { Encabezado },
    setup() { return { ...proceso() }; }
};
</script>

<style scoped>
@import './css/estilo.css';
</style>
