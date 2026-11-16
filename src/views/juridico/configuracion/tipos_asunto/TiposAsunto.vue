<template>
    <Encabezado titulo="Tipos de asunto" subtitulo="Clasificación de las solicitudes y asuntos de Jurídico" icono="fa-solid fa-tags"
        ><template #icono><font-icon icon="fa-solid fa-tags" style="font-size: 1.2rem" /></template><Button icon="pi pi-question-circle" text rounded aria-label="Manual de Tipos de asunto" title="Ayuda de esta pantalla" @click="handleAyuda" /><Button v-if="!mostrar" label="Nuevo tipo" icon="pi pi-plus" outlined :disabled="cargando || !!error" @click="handleNuevo"
    />
        <template v-if="mostrar"><Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="guardando" @click="mostrar = false" /><Button label="Guardar" icon="pi pi-save" class="btn-guardar" :loading="guardando" :disabled="!valido || guardando" @click="handleGuardar" /></template>
    </Encabezado>
    <div v-if="!mostrar" class="card juridico-contenido juridico-listado">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="juridico-herramientas">
            <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar tipo de asunto" /></IconField
            ><Select v-model="estado" :options="estados" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los estados" /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button
                label="Actualizar"
                icon="pi pi-refresh"
                outlined
                :loading="cargando"
                @click="handleCargar"
            />
        </div>
        <DataTable scrollable :value="filas" :loading="cargando" paginator :rows="10" size="small" class="juridico-tabla tabla-encabezados"
            ><template #empty>No hay tipos de asunto registrados.</template><Column headerClass="encabezado-columna" field="nombre" header="Nombre" /><Column headerClass="encabezado-columna" field="descripcion" header="Descripción" /><Column headerClass="encabezado-columna" header="Estado"
                ><template #body="{ data }"><Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'secondary'" /></template></Column
            ><Column headerClass="encabezado-columna" header="Opciones"
                ><template #body="{ data }"
                    ><Button class="btn-nuevo" icon="pi pi-pencil" aria-label="Editar tipo de asunto" @click="handleEditar(data)"  /></template></Column
        ></DataTable>
    </div>
    <div v-if="mostrar" class="card juridico-contenido juridico-pagina-detalle">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <Tabs v-model:value="detalleTab"><TabList><Tab value="datos">Datos</Tab><Tab value="historial">Historial</Tab></TabList><TabPanels>
            <TabPanel value="datos">        <form id="tipoAsunto" class="juridico-formulario juridico-catalogo-formulario" :inert="guardando" @submit.prevent="handleGuardar">
            <div><label for="tipo-nombre">Nombre <span class="requerido">*</span></label><InputText id="tipo-nombre" :modelValue="formulario.nombre" @update:modelValue="handleNombre" maxlength="100" /></div>
            <div class="juridico-catalogo-descripcion"><label for="tipo-descripcion">Descripción</label><Textarea id="tipo-descripcion" v-model="formulario.descripcion" rows="3" maxlength="500" /></div>
            <div class="juridico-check"><ToggleSwitch inputId="tipo-activo" v-model="formulario.activo" /><label for="tipo-activo">Tipo de asunto activo</label></div>
            <small>Al desactivarlo no se ofrece en nuevas solicitudes. Su historial se conserva.</small>
        </form>
</TabPanel>
            <TabPanel value="historial"><DataTable scrollable class="juridico-tabla tabla-encabezados" :value="seleccionado?.historial || []" paginator :rows="5" size="small"
            ><template #empty>{{ formulario.id ? 'Sin movimientos registrados.' : 'El historial se genera al guardar el registro.' }}</template
            ><Column headerClass="encabezado-columna" header="Fecha"
                ><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column
            ><Column headerClass="encabezado-columna" field="usuario" header="Responsable" /><Column headerClass="encabezado-columna" field="accion" header="Movimiento" /><Column headerClass="encabezado-columna" header="Datos modificados"
                ><template #body="{ data }"
                    ><div v-for="(c, i) in data.cambios" :key="i" class="juridico-cambio">
                        <strong>{{ c.campo }}</strong
                        ><span>{{ c.anterior }} → {{ c.nuevo }}</span>
                    </div></template
                ></Column
            ></DataTable
        ></TabPanel>
        </TabPanels></Tabs>
    </div>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de Tipos de asunto" :style="{ width: '62rem', maxWidth: '96vw' }">
        <div class="juridico-manual">
            <div class="juridico-manual-intro"><i class="pi pi-tags" /><div><h2>Tipos de asunto</h2><p>Clasifica lo que necesita atender Jurídico</p></div></div>
            <section v-for="seccion in guia" :key="seccion.titulo" class="juridico-manual-seccion"><h3><i :class="seccion.icono" />{{ seccion.titulo }}</h3><ul><li v-for="paso in seccion.pasos" :key="paso">{{ paso }}</li></ul></section>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default {
    name: 'JuridicoTiposAsunto',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
