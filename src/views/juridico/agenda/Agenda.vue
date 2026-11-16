<template>
    <Encabezado titulo="Agenda y tareas" subtitulo="Pendientes y seguimiento jurídico por empresa" icono="fa-solid fa-calendar-days"
        ><template #icono><font-icon icon="fa-solid fa-calendar-days" style="font-size: 1.2rem" /></template><Button icon="pi pi-question-circle" text rounded aria-label="Manual de Agenda y tareas" title="Ayuda de esta pantalla" @click="handleAyuda" /><Button v-if="!mostrarCumplir" label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleActualizar"
    />
        <template v-if="mostrarCumplir"><Button label="Cancelar" icon="pi pi-times" class="btn-cancelar" :disabled="cumpliendo" @click="mostrarCumplir = false" /><Button label="Guardar" icon="pi pi-save" class="btn-guardar" :loading="cumpliendo" :disabled="!valido || cumpliendo || cargandoCumplir" @click="handleConfirmarCumplimiento" /></template>
    </Encabezado>
    <div v-if="!mostrarCumplir" class="card juridico-contenido juridico-vista-resumen">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="juridico-herramientas">
            <SelectButton v-model="vista" :options="vistas" :allowEmpty="false" /><SelectButton v-model="periodo" :options="periodos" :allowEmpty="false" @change="handlePeriodo" /><DatePicker
                v-model="fechaBase"
                showIcon
                dateFormat="yy-mm-dd"
                :manualInput="false"
                @date-select="handlePeriodo"
            /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" />
        </div>
        <div class="juridico-herramientas">
            <Select v-model="empresa" :options="opciones.empresas" optionLabel="nombre" optionValue="id" filter showClear placeholder="Todas las empresas" /><Select
                v-model="responsable"
                :options="opciones.responsables"
                optionLabel="nombre"
                optionValue="id"
                filter
                showClear
                placeholder="Todos los responsables"
            /><Select v-model="estado" :options="estados" optionLabel="nombre" optionValue="valor" /><IconField
                ><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Expediente, empresa o actividad" maxlength="100"
            /></IconField>
        </div>
        <div class="agenda-periodo">
            <div><label for="agenda-desde">Compromisos desde</label><DatePicker inputId="agenda-desde" v-model="desde" showIcon dateFormat="yy-mm-dd" :manualInput="false" /></div>
            <div><label for="agenda-hasta">Hasta</label><DatePicker inputId="agenda-hasta" v-model="hasta" showIcon dateFormat="yy-mm-dd" :manualInput="false" /></div>
            <div class="agenda-totales"><Tag :value="total + ' tareas'" severity="secondary" /><Tag :value="(resumen.Vencida || 0) + ' vencidas'" severity="danger" /><Tag :value="(resumen.Cumplida || 0) + ' cumplidas'" severity="success" /></div>
        </div>
        <div :class="{ 'agenda-con-calendario': vista === 'Calendario' }">
            <aside v-if="vista === 'Calendario'" class="agenda-calendario">
                <Message v-if="errorCalendario" severity="error" :closable="false">{{ errorCalendario }}</Message
                ><ProgressBar v-if="cargandoCalendario" mode="indeterminate" style="height: 0.25rem" /><DatePicker v-model="fechaBase" inline :manualInput="false" @date-select="handleDiaCalendario" @month-change="handleMesCalendario"
                    ><template #date="slotProps"
                        ><span class="agenda-dia"
                            ><span>{{ slotProps.date.day }}</span
                            ><small v-if="handleCantidadDia(slotProps.date)">{{ handleCantidadDia(slotProps.date) }}</small></span
                        ></template
                    ></DatePicker
                ><small>Selecciona un día para consultar sus tareas.</small>
            </aside>
            <DataTable scrollable :value="registros" :loading="cargando" lazy paginator :rows="limite" :first="primero" :totalRecords="total" :rowsPerPageOptions="[10, 25, 50]" size="small" class="juridico-tabla tabla-encabezados" @page="handlePagina"
                ><template #empty>No hay tareas con estos filtros.</template>
                <Column headerClass="encabezado-columna" header="Fecha / estado"
                    ><template #body="{ data }"
                        ><div class="juridico-identidad">
                            <strong>{{ handleFecha(data.fecha) }}</strong
                            ><Tag :value="data.estado" :severity="handleColor(data.estado)" /><small>{{ data.tipo_fecha }}</small>
                        </div></template
                    ></Column
                >
                <Column headerClass="encabezado-columna" header="Expediente / empresa"
                    ><template #body="{ data }"
                        ><div class="juridico-identidad">
                            <strong>{{ data.expediente_folio }}</strong
                            ><span>{{ data.empresa_nombre }}</span
                            ><small>{{ data.expediente_titulo }}</small>
                        </div></template
                    ></Column
                >
                <Column headerClass="encabezado-columna" header="Actividad / responsable"
                    ><template #body="{ data }"
                        ><div class="juridico-identidad">
                            <span class="juridico-texto">{{ data.actividad }}</span
                            ><small>{{ data.responsable_nombre }}</small
                            ><small v-if="data.estado === 'Cumplida'" class="agenda-resultado">Cumplida: {{ handleFecha(data.fecha_cumplimiento) }} - {{ data.resultado }}</small>
                        </div></template
                    ></Column
                >
                <Column headerClass="encabezado-columna" header="Opciones"
                    ><template #body="{ data }"
                        ><div class="agenda-opciones">
                            <Button v-if="data.estado === 'Cumplida'" label="Resultado" icon="pi pi-eye" text size="small" @click="handleResultado(data)" /><Button
                                v-if="data.estado !== 'Cumplida'"
                                label="Cumplida"
                                icon="pi pi-check"
                                outlined
                                size="small"
                                @click="handleCumplir(data)"
                            /><Button v-if="opciones.ver_expedientes" label="Expediente" icon="pi pi-folder-open" text size="small" @click="handleExpediente(data)" /></div></template
                ></Column>
            </DataTable>
        </div>
    </div>
    <Dialog v-model:visible="mostrarResultado" modal header="Resultado de la tarea" :style="{ width: '52rem', maxWidth: '96vw' }"
        ><div v-if="resultado" class="juridico-detalle">
            <div>
                <small>Expediente / empresa</small><strong>{{ resultado.expediente_folio }}</strong
                ><span>{{ resultado.empresa_nombre }}</span>
            </div>
            <div>
                <small>Cumplimiento</small><Tag value="Cumplida" severity="success" /><span>{{ handleFecha(resultado.fecha_cumplimiento) }}</span>
            </div>
            <div class="juridico-ancho">
                <small>Actividad</small><span class="juridico-texto">{{ resultado.actividad }}</span>
            </div>
            <div class="juridico-ancho">
                <small>Resultado</small><span class="juridico-texto">{{ resultado.resultado }}</span>
            </div>
            <div>
                <small>Responsable</small><span>{{ resultado.responsable_nombre }}</span>
            </div>
            <div>
                <small>Registrado por</small><span>{{ resultado.usuario }}</span>
            </div>
            <div class="juridico-ancho">
                <small>Evidencias vinculadas</small><span v-for="f in resultado.evidencias" :key="f.id">{{ f.nombre }}</span
                ><span v-if="!resultado.evidencias?.length">Sin documentos vinculados.</span>
            </div>
        </div>
        <template #footer><Button label="Cerrar" outlined @click="mostrarResultado = false" /></template
    ></Dialog>
    <div v-if="mostrarCumplir" class="card juridico-contenido juridico-pagina-detalle">
        <Tabs value="datos"><TabList><Tab value="datos">Cumplimiento de tarea</Tab></TabList><TabPanels><TabPanel value="datos">
        <Message v-if="errorCumplir" severity="error" :closable="false">{{ errorCumplir }}</Message
        ><ProgressBar v-if="cargandoCumplir" mode="indeterminate" style="height: 0.25rem" />
        <form id="cumplirTarea" class="juridico-formulario" :inert="cumpliendo || cargandoCumplir" @submit.prevent="handleConfirmarCumplimiento">
            <div class="agenda-tarea">
                <strong>{{ tarea?.expediente_folio }} - {{ tarea?.empresa_nombre }}</strong
                ><span>{{ tarea?.actividad }}</span
                ><small>Compromiso: {{ handleFecha(tarea?.fecha) }}</small>
            </div>
            <div class="juridico-rejilla">
                <div>
                    <label for="cum-tipo">Tipo de actuación <span class="requerido">*</span></label
                    ><Select inputId="cum-tipo" v-model="formulario.tipo_id" :options="opcionesCumplir.tipos" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un tipo" emptyMessage="Registra un tipo de actuación activo" />
                </div>
                <div>
                    <label for="cum-fecha">Fecha en que se realizó <span class="requerido">*</span></label
                    ><DatePicker inputId="cum-fecha" v-model="formulario.fecha" showIcon dateFormat="yy-mm-dd" :manualInput="false" :maxDate="hoy" />
                </div>
                <div class="juridico-ancho">
                    <label for="cum-responsable">Responsable <span class="requerido">*</span></label
                    ><Select inputId="cum-responsable" v-model="formulario.responsable_id" :options="opcionesCumplir.responsables" optionLabel="nombre" optionValue="id" filter placeholder="Selecciona un responsable" />
                </div>
                <div class="juridico-ancho">
                    <label for="cum-resultado">Qué se hizo / resultado <span class="requerido">*</span></label
                    ><Textarea id="cum-resultado" v-model="formulario.descripcion" rows="3" maxlength="4000" />
                </div>
                <div class="juridico-ancho">
                    <label for="cum-evidencia">Evidencias del expediente</label
                    ><MultiSelect
                        inputId="cum-evidencia"
                        v-model="formulario.archivo_ids"
                        :options="opcionesCumplir.archivos"
                        optionLabel="nombre"
                        optionValue="id"
                        filter
                        display="chip"
                        placeholder="Selecciona documentos"
                        emptyMessage="Sin documentos vigentes"
                    />
                </div>
                <div class="juridico-ancho juridico-check"><ToggleSwitch inputId="cum-siguiente" v-model="formulario.actualizar_seguimiento" /><label for="cum-siguiente">Programar la siguiente acción</label></div>
                <template v-if="formulario.actualizar_seguimiento"
                    ><div>
                        <label for="cum-accion">Siguiente acción <span class="requerido">*</span></label
                        ><Textarea id="cum-accion" v-model="formulario.proxima_accion" rows="2" maxlength="1000" />
                    </div>
                    <div>
                        <label for="cum-compromiso">Fecha compromiso <span class="requerido">*</span></label
                        ><DatePicker inputId="cum-compromiso" v-model="formulario.fecha_compromiso" showIcon dateFormat="yy-mm-dd" :manualInput="false" :minDate="formulario.fecha" /></div
                ></template>
            </div>
            <small>Se conserva la tarea cumplida y se registra lo realizado en las Actuaciones del expediente.</small>
        </form>
        </TabPanel></TabPanels></Tabs>
    </div>
    <Dialog v-model:visible="mostrarAyuda" modal header="Guía de Agenda y tareas" :style="{ width: '62rem', maxWidth: '96vw' }" class="juridico-ayuda-dialog">
        <div class="juridico-manual">
            <div class="juridico-manual-intro"><i class="pi pi-calendar" /><div><h2>Organiza los compromisos del equipo</h2><p>Consulta lo pendiente, registra lo realizado y programa el siguiente paso de cada expediente.</p></div></div>
            <div class="juridico-manual-flujo"><Tag value="Consultar" severity="info" /><i class="pi pi-angle-right" /><Tag value="Realizar" severity="info" /><i class="pi pi-angle-right" /><Tag value="Registrar resultado" severity="info" /><i class="pi pi-angle-right" /><Tag value="Dar seguimiento" severity="success" /></div>
            <section v-for="seccion in guia" :key="seccion.titulo" class="juridico-manual-seccion"><h3><i :class="seccion.icono" />{{ seccion.titulo }}</h3><ul><li v-for="paso in seccion.pasos" :key="paso">{{ paso }}</li></ul></section>
        </div>
        <template #footer><Button label="Entendido" icon="pi pi-check" @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default {
    name: 'JuridicoAgenda',
    components: { Encabezado },
    setup() {
        return { ...proceso() };
    }
};
</script>
<style scoped>
@import './css/estilo.css';
</style>
