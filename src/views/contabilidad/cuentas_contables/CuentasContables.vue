<template>
    <Encabezado titulo="Cuentas contables" subtitulo="Cat&aacute;logo, estructura y clasificaci&oacute;n por empresa" icono="pi pi-sitemap">
        <template #icono><font-icon icon="fa-solid fa-sitemap" style="font-size:1.2rem" /></template>
        <Button icon="pi pi-question-circle" text rounded aria-label="Gu&iacute;a de cuentas contables" title="Gu&iacute;a de cuentas contables" @click="mostrarAyuda = true" />
        <CatalogoBase v-if="!mostrar && empresaActual" :empresa="empresaActual" :disabled="!empresaActual.activo || cargando || !!error" @guardado="handleCargar" />
        <DeshacerCatalogoBase v-if="!mostrar && empresaActual" :empresa="empresaActual" :disabled="!empresaActual.activo || cargando || !!error" @guardado="handleCargar" />
        <Button v-if="!mostrar" label="Carga masiva" icon="pi pi-upload" outlined :disabled="!empresaActual?.activo || cargando || !!error" @click="handleAbrirImportacion" />
        <Button v-if="!mostrar" label="Nueva cuenta" icon="pi pi-plus" class="btn-nuevo" :disabled="!empresaActual?.activo || cargando || !!error" @click="handleNuevo" />
        <template v-else>
            <Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="guardando" @click="handleCancelar" />
            <Button label="Guardar" icon="pi pi-save" class="btn-guardar" :loading="guardando" :disabled="!valido || guardando || !empresaActual?.activo" @click="handleGuardar" />
        </template>
    </Encabezado>

    <div v-if="!mostrar" class="card cuentas-contenido">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="cuentas-empresa">
            <div class="campo empresa-selector"><label for="empresa-cuentas">Empresa <span class="requerido">*</span></label><Select inputId="empresa-cuentas" v-model="empresa" :options="empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Selecciona una empresa" :disabled="cargando" @change="handleEmpresa" /></div>
            <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" :disabled="cargando" @click="handleCargar" />
        </div>
        <template v-if="empresa">
            <div class="cuentas-resumen"><div v-for="item in resumen" :key="item.nombre" class="resumen-cuenta"><span class="resumen-icono"><i :class="item.icono" /></span><div><small>{{ item.nombre }}</small><strong>{{ item.valor }}</strong></div></div></div>
            <Message v-if="empresaActual && !empresaActual.activo" severity="warn" :closable="false">La empresa est&aacute; inactiva. Su cat&aacute;logo est&aacute; disponible para consulta.</Message>
            <div class="cuentas-herramientas">
                <IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar c&oacute;digo o nombre" aria-label="Buscar cuentas" :disabled="cargando" @update:modelValue="primero = 0" /></IconField>
                <Select v-model="tipo" :options="tipos" optionLabel="nombre" optionValue="valor" showClear placeholder="Todas las clasificaciones" :disabled="cargando" @change="primero = 0" />
                <Select v-model="uso" :options="usos" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los usos" :disabled="cargando" @change="primero = 0" />
                <Select v-model="estado" :options="estados" optionLabel="nombre" optionValue="valor" showClear placeholder="Todos los estados" :disabled="cargando" @change="primero = 0" />
                <Button label="Limpiar" icon="pi pi-filter-slash" outlined :disabled="cargando" @click="handleLimpiar" />
            </div>
            <DataTable v-model:first="primero" :value="filas" :loading="cargando" paginator :rows="25" :rowsPerPageOptions="[10,25,50,100]" scrollable scrollHeight="flex" size="small" class="tabla-cuentas">
                <template #empty>No hay cuentas con estos filtros. Puedes iniciar con una cuenta principal agrupadora.</template>
                <Column header="Cuenta" style="width:30%"><template #body="{ data }"><div class="cuenta-identidad"><strong class="cuenta-codigo">{{ data.codigo }}</strong><span>{{ data.nombre }}</span></div></template></Column>
                <Column header="Clasificaci&oacute;n" style="width:16%"><template #body="{ data }"><div class="dato-doble"><span>{{ handleTipo(data.tipo) }}</span><small>{{ handleNaturaleza(data.naturaleza) }}</small></div></template></Column>
                <Column header="Estructura" style="width:23%"><template #body="{ data }"><div class="dato-doble"><span>{{ handlePadreNombre(data.padre_id) }}</span><small>Nivel {{ data.nivel }}</small></div></template></Column>
                <Column header="Uso" style="width:15%"><template #body="{ data }"><Tag :value="data.permite_movimientos ? 'Movimientos' : 'Agrupadora'" :icon="data.permite_movimientos ? 'pi pi-pencil' : 'pi pi-sitemap'" :severity="data.permite_movimientos ? 'info' : 'secondary'" /></template></Column>
                <Column header="Estado" style="width:8%"><template #body="{ data }"><Tag :value="data.activo ? 'Activa' : 'Inactiva'" :severity="data.activo ? 'success' : 'secondary'" /></template></Column>
                <Column header="Opciones" style="width:8%"><template #body="{ data }"><Button icon="pi pi-pencil" class="btn-nuevo" :disabled="cargando" :aria-label="'Editar cuenta ' + data.codigo" title="Editar cuenta" @click="handleEditar(data)" /></template></Column>
            </DataTable>
        </template>
        <div v-else class="cuentas-sin-empresa"><i class="pi pi-sitemap" /><h2>Cat&aacute;logo de cuentas</h2><p>Selecciona una empresa para consultar o crear su estructura contable.</p></div>
    </div>

    <div v-else class="card cuentas-detalle">
        <div class="cuenta-contexto"><span class="resumen-icono"><i class="pi pi-book" /></span><div><strong>{{ formulario.id ? formulario.codigo + ' · ' + formulario.nombre : 'Nueva cuenta contable' }}</strong><small>{{ empresaActual?.nombre }}</small></div><Tag :value="'Nivel ' + nivel" severity="info" /></div>
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <Tabs v-model:value="detalleTab">
            <TabList><Tab value="datos">Datos</Tab><Tab value="historial">Historial</Tab></TabList>
            <TabPanels>
                <TabPanel value="datos">
                    <form class="cuenta-formulario" :inert="guardando" @submit.prevent="handleGuardar">
                        <Fieldset legend="Identificaci&oacute;n y estructura">
                            <div class="form-grid">
                                <div class="campo"><label for="cuenta-codigo">C&oacute;digo <span class="requerido">*</span></label><InputText id="cuenta-codigo" v-model="formulario.codigo" maxlength="40" placeholder="Ej. 100.01" :disabled="!!formulario.id" /><small>Admite n&uacute;meros, puntos y guiones. Se conserva despu&eacute;s del alta.</small></div>
                                <div class="campo"><label for="cuenta-padre">Cuenta padre</label><Select v-if="!formulario.id" inputId="cuenta-padre" v-model="formulario.padre_id" :options="padres" optionLabel="etiqueta" optionValue="id" filter showClear placeholder="Sin padre: cuenta principal" @change="handlePadre" /><InputText v-else id="cuenta-padre" :modelValue="handlePadreNombre(formulario.padre_id)" disabled /><small>Selecciona una agrupadora activa de esta empresa para crear una subcuenta.</small></div>
                                <div class="campo ancho-completo"><label for="cuenta-nombre">Nombre de la cuenta <span class="requerido">*</span></label><InputText id="cuenta-nombre" :modelValue="formulario.nombre" @update:modelValue="handleNombre" maxlength="150" placeholder="Ej. BANCOS" /></div>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Clasificaci&oacute;n contable">
                            <div class="form-grid">
                                <div class="campo"><label for="cuenta-tipo">Clasificaci&oacute;n <span class="requerido">*</span></label><Select inputId="cuenta-tipo" v-model="formulario.tipo" :options="tipos" optionLabel="nombre" optionValue="valor" :disabled="clasificacionFija" @change="handleClasificacion" /></div>
                                <div class="campo"><label for="cuenta-naturaleza">Naturaleza <span class="requerido">*</span></label><Select inputId="cuenta-naturaleza" v-model="formulario.naturaleza" :options="naturalezas" optionLabel="nombre" optionValue="valor" :disabled="clasificacionFija" /></div>
                                <small v-if="clasificacionFija" class="ancho-completo">La clasificaci&oacute;n y naturaleza se conservan de acuerdo con la estructura de la cuenta.</small>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Uso y estado">
                            <div class="form-grid">
                                <div class="cuenta-switch"><ToggleSwitch inputId="cuenta-movimientos" v-model="formulario.permite_movimientos" :disabled="!!seleccionado?.tiene_hijas" /><div><label for="cuenta-movimientos">Permite registrar movimientos</label><small>{{ formulario.permite_movimientos ? 'Se utilizará al integrar las pólizas contables.' : 'Cuenta agrupadora: organiza otras subcuentas.' }}</small></div></div>
                                <div class="cuenta-switch"><ToggleSwitch inputId="cuenta-activo" v-model="formulario.activo" /><div><label for="cuenta-activo">Cuenta activa</label><small>Desact&iacute;vala cuando deje de utilizarse. El historial se conserva.</small></div></div>
                                <div class="campo ancho-completo"><label for="cuenta-descripcion">Descripci&oacute;n</label><Textarea id="cuenta-descripcion" v-model="formulario.descripcion" rows="3" maxlength="500" /></div>
                            </div>
                        </Fieldset>
                    </form>
                </TabPanel>
                <TabPanel value="historial">
                    <DataTable :value="historial" paginator :rows="10" scrollable size="small" class="tabla-historial">
                        <template #empty>{{ formulario.id ? 'Sin movimientos registrados.' : 'El historial se genera al guardar la cuenta.' }}</template>
                        <Column header="Fecha"><template #body="{ data }">{{ handleFecha(data.fecha) }}</template></Column>
                        <Column header="Responsable" field="usuario" /><Column header="Movimiento" field="accion" />
                        <Column header="Datos modificados"><template #body="{ data }"><div class="historial-campos"><Tag v-for="(c, i) in data.cambios" :key="i" :value="c.campo" severity="secondary" /></div></template></Column>
                        <Column header="Detalle"><template #body="{ data }"><Button icon="pi pi-eye" outlined title="Ver cambios" aria-label="Ver dato anterior y nuevo" @click="handleCambios(data)" /></template></Column>
                    </DataTable>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
    <Dialog v-model:visible="mostrarCambios" modal header="Detalle de cambios" :style="{ width:'52rem', maxWidth:'95vw' }">
        <DataTable :value="cambios" scrollable size="small" class="tabla-historial"><Column header="Dato" field="campo" /><Column header="Anterior" field="anterior" /><Column header="Nuevo" field="nuevo" /></DataTable>
        <template #footer><Button label="Cerrar" outlined @click="mostrarCambios = false" /></template>
    </Dialog>
    <Dialog v-model:visible="mostrarAyuda" modal header="Gu&iacute;a de cuentas contables" :style="{ width:'48rem', maxWidth:'95vw' }">
        <div class="cuentas-guia"><section v-for="item in guia" :key="item.titulo"><h3>{{ item.titulo }}</h3><p>{{ item.texto }}</p></section></div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>

    <Dialog v-model:visible="mostrarImportacion" modal header="Carga masiva de cuentas nuevas" :closable="!importando" :closeOnEscape="!importando" :style="{width:'68rem',maxWidth:'96vw'}">
        <div class="carga-cuentas">
            <Message severity="info" :closable="false">Empresa: {{ empresaActual?.nombre }}. Solo se crearán cuentas nuevas. Máximo 500 cuentas por archivo.</Message>
            <Message severity="warn" :closable="false">La primera fila de datos de la plantilla (fila 2 de Excel) es un ejemplo. B&oacute;rrala antes de capturar e importar tus cuentas. Conserva los encabezados.</Message>
            <div class="carga-herramientas">
                <Button label="Descargar plantilla" icon="pi pi-file-excel" outlined :disabled="importando" @click="handlePlantilla" />
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="2097152" customUpload auto chooseLabel="Seleccionar Excel" :disabled="importando || cargaCompleta" @select="handleArchivoCarga" />
                <span>{{ archivoCarga }}</span>
            </div>
            <Message v-if="errorCarga" severity="error" :closable="false">{{ errorCarga }}</Message>
            <Message v-else-if="cargaCompleta" severity="success" :closable="false">La carga se completó. Las cuentas ya están disponibles en el catálogo.</Message>
            <Message v-else-if="cargaValidada" severity="success" :closable="false">Archivo válido. Revisa las cuentas y pulsa Guardar cuentas.</Message>
            <DataTable :value="resultadoCarga" :loading="importando" paginator :rows="10" :rowsPerPageOptions="[10,25,50]" scrollable scrollHeight="22rem" size="small" class="tabla-historial">
                <Column field="fila" header="Fila" style="width:5rem" />
                <Column field="codigo" header="Código" />
                <Column field="nombre" header="Nombre" />
                <Column header="Resultado"><template #body="{data}"><Tag :severity="data.error ? 'danger' : 'success'" :value="data.error ? 'Revisar' : data.estado || 'Lista'" /><span class="carga-error">{{ data.error }}</span></template></Column>
                <template #empty>Selecciona el Excel para revisar las cuentas antes de guardarlas.</template>
            </DataTable>
        </div>
        <template #footer>
            <Button label="Cerrar" outlined :disabled="importando" @click="mostrarImportacion = false" />
            <Button v-if="!cargaCompleta" label="Guardar cuentas" icon="pi pi-save" class="btn-guardar" :loading="importando" :disabled="!cargaValidada || importando" @click="handleGuardarCarga" />
        </template>
    </Dialog>

</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import Fieldset from 'primevue/fieldset';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import ToggleSwitch from 'primevue/toggleswitch';
import CatalogoBase from './CatalogoBase.vue';
import DeshacerCatalogoBase from './DeshacerCatalogoBase.vue';
import proceso from './js/proceso';
export default {
    name: 'CuentasContables',
    components: { DeshacerCatalogoBase, CatalogoBase, FileUpload, Encabezado, Button, Column, DataTable, Dialog, Fieldset, IconField, InputIcon, InputText, Message, Select, Tab, TabList, TabPanel, TabPanels, Tabs, Tag, Textarea, ToggleSwitch },
    setup() { return { ...proceso() }; }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
