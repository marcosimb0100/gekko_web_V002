<template>
    <Encabezado titulo="Pagos programados" subtitulo="Acuerdos, vencimientos y medios de pago" icono="pi pi-calendar-clock">
        <Button label="Nueva programación" icon="pi pi-plus" class="btn-nuevo" :disabled="cargando || !!error" @click="handleNuevo" />
    </Encabezado>
    <div class="card pagos-programados">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div class="pagos-resumen"><div v-for="item in resumen" :key="item.etiqueta"><i :class="item.icono" /><div><small>{{ item.etiqueta }}</small><strong>{{ item.valor }}</strong></div></div></div>
        <div class="pagos-herramientas"><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="Buscar proveedor o concepto" /></IconField><Select v-model="periodicidad" :options="periodicidades" placeholder="Todas las periodicidades" showClear /><Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="handleLimpiar" /><Button label="Actualizar" icon="pi pi-refresh" outlined :loading="cargando" @click="handleCargar" /></div>
        <DataTable :value="filas" :loading="cargando" paginator :rows="8" size="small" class="pagos-tabla">
            <template #empty>No hay programaciones con estos filtros.</template>
            <Column header="Proveedor / concepto"><template #body="{ data }"><div class="pagos-identidad"><strong>{{ data.proveedor_nombre }}</strong><small>{{ data.concepto }}</small><small>{{ data.empresa_nombre }}</small></div></template></Column>
            <Column header="Calendario"><template #body="{ data }"><div class="pagos-identidad"><span>{{ data.periodicidad }}</span><small>{{ handleRegla(data) }}</small></div></template></Column>
            <Column header="Siguiente fecha"><template #body="{ data }">{{ handleFecha(data.proxima_fecha) }}</template></Column>
            <Column header="Importe"><template #body="{ data }"><div class="pagos-identidad"><strong>{{ data.variable ? 'Según factura' : handleMoneda(data.importe) }}</strong><small>MXN · {{ data.variable ? 'Variable' : 'Fijo' }}</small></div></template></Column>
            <Column field="medio" header="Medio de pago" />
            <Column header="Recordatorio"><template #body="{ data }"><span>{{ data.aviso }} días antes</span></template></Column>
            <Column header="Estado"><template #body="{ data }"><Tag :value="data.activo ? 'Activo' : 'Pausado'" :severity="data.activo ? 'success' : 'secondary'" /></template></Column>
            <Column header="Opciones"><template #body="{ data }"><Button icon="pi pi-pencil" text rounded aria-label="Editar programación" @click="handleEditar(data)" /></template></Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="mostrar" modal :header="formulario.id ? 'Editar programación' : 'Nueva programación'" :style="{ width: '48rem' }" :breakpoints="{ '768px': '95vw' }" :closable="!guardando" :closeOnEscape="!guardando">
        <Message v-if="errorFormulario" severity="error" :closable="false">{{ errorFormulario }}</Message>
        <form :inert="guardando" id="programacionPago" class="pagos-formulario" @submit.prevent="handleGuardar">
            <div class="pagos-form-aviso"><i class="pi pi-info-circle" />Se guarda el acuerdo de pago. Los recordatorios automáticos están pendientes de integrar al programador de tareas.</div>
            <Fieldset legend="Acuerdo con el proveedor"><div class="pagos-rejilla">
                <div><label for="pago-proveedor">Proveedor</label><Select inputId="pago-proveedor" v-model="formulario.proveedor" :options="proveedores" optionLabel="nombre" optionValue="id" optionDisabled="deshabilitado" filter placeholder="Selecciona un proveedor" /></div>
                <div><label for="pago-empresa">Empresa que paga</label><Select inputId="pago-empresa" v-model="formulario.empresa" :options="empresas" optionLabel="nombre" optionValue="id" optionDisabled="deshabilitado" filter placeholder="Selecciona una empresa" /></div>
                <div class="pagos-ancho"><label for="pago-concepto">Concepto</label><InputText id="pago-concepto" v-model="formulario.concepto" placeholder="Ej. Internet de oficina" maxlength="150" /></div>
            </div></Fieldset>
            <Fieldset legend="Calendario"><div class="pagos-rejilla">
                <div><label for="pago-periodicidad">Periodicidad</label><Select inputId="pago-periodicidad" v-model="formulario.periodicidad" :options="periodicidades" /></div>
                <div><label for="pago-inicio">Fecha de inicio</label><DatePicker inputId="pago-inicio" v-model="formulario.inicio" dateFormat="dd/mm/yy" showIcon /></div>
                <div v-if="formulario.periodicidad === 'Mensual'"><label for="pago-dia">Día del mes</label><InputNumber inputId="pago-dia" v-model="formulario.dia" :min="1" :max="31" showButtons /><small>Si no existe ese día, se usa el último del mes.</small></div>
                <div v-if="formulario.periodicidad === 'Personalizada'"><label for="pago-intervalo">Cada cuántos días</label><InputNumber inputId="pago-intervalo" v-model="formulario.intervalo" :min="1" showButtons /></div>
                <div><label for="pago-aviso">Avisar días antes</label><InputNumber inputId="pago-aviso" v-model="formulario.aviso" :min="0" :max="60" showButtons /></div>
                <div class="pagos-ancho" v-if="formulario.periodicidad === 'Quincenal'"><small>Calendario: día 15 y último día de cada mes.</small></div>
            </div></Fieldset>
            <Fieldset legend="Condiciones de pago"><div class="pagos-rejilla">
                <div><label for="pago-medio">Medio de pago preferido</label><Select inputId="pago-medio" v-model="formulario.medio" :options="medios" /></div>
                <div><label for="pago-plazo">Plazo desde la factura</label><Select inputId="pago-plazo" v-model="formulario.plazo" :options="plazos" /></div>
                <div v-if="formulario.plazo === 'Fecha acordada'"><label for="pago-acordada">Fecha acordada</label><DatePicker inputId="pago-acordada" v-model="formulario.fecha_acordada" dateFormat="dd/mm/yy" showIcon /></div>
                <div class="pagos-ancho pagos-check"><Checkbox inputId="pago-variable" v-model="formulario.variable" binary /><label for="pago-variable">Importe variable según factura</label></div>
                <div v-if="!formulario.variable"><label for="pago-importe">Importe estimado (MXN)</label><InputNumber inputId="pago-importe" v-model="formulario.importe" mode="currency" currency="MXN" locale="es-MX" :min="0" /></div>
                <div class="pagos-ancho"><label for="pago-notas">Observaciones</label><Textarea id="pago-notas" v-model="formulario.notas" rows="2" autoResize maxlength="500" /></div>
                <div class="pagos-check"><ToggleSwitch inputId="pago-activo" v-model="formulario.activo" /><label for="pago-activo">Programación activa</label></div>
            </div></Fieldset>
        </form>
        <template #footer><Button label="Cancelar" outlined :disabled="guardando" @click="mostrar = false" /><Button label="Guardar" icon="pi pi-save" :loading="guardando" form="programacionPago" type="submit" :disabled="guardando || !formulario.proveedor || !formulario.empresa || !formulario.concepto.trim() || !formulario.inicio || (!formulario.variable && !(formulario.importe > 0)) || (formulario.plazo === 'Fecha acordada' && !formulario.fecha_acordada)" /></template>
    </Dialog>
</template>
<script>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import proceso from './js/proceso';
export default { name: 'PagosProgramados', components: { Encabezado }, setup() { return { ...proceso() }; } };
</script>
<style scoped>
@import './css/estilo.css';
</style>
