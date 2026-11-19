<template>
    <Encabezado titulo="Tareas programadas" subtitulo="Seguimiento de procesos autom&aacute;ticos">
        <template #icono><font-icon icon="fa-solid fa-clock" style="font-size: 1.2rem" /></template>
        <Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargar" />
    </Encabezado>
    <div class="card tareas-contenido">
        <div class="tareas-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar tarea" /></IconField><small>Estado de la &uacute;ltima revisi&oacute;n. Pulsa Actualizar para consultar cambios.</small></div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <DataTable :value="filtradas" :loading="cargando" size="small" scrollable scrollHeight="flex" paginator :rows="10" :rowsPerPageOptions="[10, 25, 50]" class="tabla-encabezados tareas-tabla">
            <template #empty>No hay tareas para mostrar.</template>
            <Column header="Tarea" headerClass="encabezado-columna"><template #body="{ data }"><div class="tareas-dato"><strong>{{ data.nombre }}</strong><small>{{ data.descripcion }}</small></div></template></Column>
            <Column header="Frecuencia" headerClass="encabezado-columna"><template #body="{ data }"><div class="tareas-dato"><span>{{ data.frecuencia }}</span><small>{{ data.zona_horaria }}</small></div></template></Column>
            <Column header="Estado" headerClass="encabezado-columna"><template #body="{ data }"><Tag :value="handleEstado(data.estado).label" :severity="handleEstado(data.estado).severity" /></template></Column>
            <Column header="&Uacute;ltima ejecuci&oacute;n" headerClass="encabezado-columna"><template #body="{ data }"><div class="tareas-dato"><span>Inicio: {{ handleFecha(data.ultimo_inicio) }}</span><small>{{ data.id === 'timbrado_worker' ? 'Fin del intento' : 'Fin' }}: {{ handleFecha(data.ultimo_fin) }}</small><small v-if="data.ultima_actividad">Actividad: {{ handleFecha(data.ultima_actividad) }}</small></div></template></Column>
            <Column header="Resultado" headerClass="encabezado-columna"><template #body="{ data }"><div class="tareas-dato"><template v-if="data.id === 'timbrado_worker'"><span>{{ data.pendientes }} CFDI pendientes o en proceso</span><small>{{ data.errores }} con error pendiente de reintento</small></template><template v-else-if="data.id === 'correos_factura'"><span>{{ data.pendientes }} pendientes &middot; {{ data.enviados }} enviados</span><small>{{ data.errores }} con error &middot; {{ data.por_confirmar }} por confirmar</small></template><template v-else><span>{{ data.revisadas }} {{ data.id === 'recordatorios_juridico' ? 'compromisos revisados' : 'pagos revisados' }}</span><small>{{ data.avisos_creados }} avisos nuevos &middot; {{ data.errores }} observaciones</small></template></div></template></Column>
            <Column v-if="puedeModificar" header="Opciones" headerClass="encabezado-columna"><template #body="{ data }"><Button icon="pi pi-pencil" outlined rounded title="Modificar intervalos" aria-label="Modificar intervalos" @click="handleEditar(data)" /></template></Column>
        </DataTable>
        <p class="tareas-nota">Sin ejecuciones: el servicio a&uacute;n no ha registrado una revisi&oacute;n. Sin actividad reciente: no se ha registrado actividad dentro del margen esperado para los intervalos configurados. Revisa el servicio correspondiente en el servidor.</p>
    </div>
    <Dialog v-model:visible="mostrar" modal header="Modificar tarea programada" :style="{ width: '34rem' }" :breakpoints="{ '640px': '95vw' }" :closable="!guardando">
        <strong>{{ seleccionada?.nombre }}</strong>
        <Message v-if="errorEdicion" severity="error" :closable="false">{{ errorEdicion }}</Message>
        <div v-for="campo in campos" :key="campo.key" class="tareas-campo">
            <label :for="campo.key">{{ campo.label }} <span class="tareas-requerido">*</span></label>
            <InputNumber :inputId="campo.key" v-model="valores[campo.key]" :min="campo.min" :max="campo.max" :maxFractionDigits="0" showButtons :disabled="guardando" />
            <small>Entre {{ campo.min }} y {{ campo.max }}.</small>
        </div>
        <p class="tareas-nota">Se aplica al continuar el ciclo del servicio. No interrumpe un trabajo en proceso. El reintento individual de cada CFDI conserva su protecci&oacute;n actual.</p>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Guardar" icon="pi pi-save" :loading="guardando" :disabled="!valido" @click="handleGuardar" /></template>
    </Dialog>
</template>
<script>
import proceso from './js/proceso.js';
export default { name: 'TareasProgramadas', setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
