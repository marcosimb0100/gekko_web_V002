<template>
    <div class="empresa-contabilidad">
        <div class="contabilidad-cabecera">
            <div><h3>Configuración contable</h3><small>Cuentas generales para las futuras pólizas de esta empresa.</small></div>
            <div class="contabilidad-acciones"><Button icon="pi pi-question-circle" text rounded aria-label="Guía contable" @click="mostrarAyuda = true" /><Button label="Actualizar" icon="pi pi-refresh" outlined :disabled="cargando || guardando || !empresaId" @click="handleCargar" /><Button label="Guardar configuración" icon="pi pi-save" severity="success" :loading="guardando" :disabled="!valido" @click="handleGuardar" /></div>
        </div>
        <Message v-if="!empresaId" severity="info" :closable="false">Primero guarda la empresa. Después podrás asignar sus cuentas contables.</Message>
        <template v-else>
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <Message severity="info" :closable="false">En esta etapa solo se guarda la configuración. No se generan pólizas ni se modifican facturas, bancos, cajas o pagos.</Message>
            <div v-if="cargando" class="contabilidad-cargando"><ProgressSpinner style="width:32px;height:32px" /><span>Consultando configuración…</span></div>
            <template v-else-if="cargada">
                <Fieldset legend="Integración">
                    <div class="contabilidad-integracion">
                        <div class="contabilidad-activar"><ToggleSwitch inputId="empresa-integracion" v-model="configuracion.habilitada" :disabled="guardando" /><label for="empresa-integracion">Habilitar integración contable</label><Tag :value="configuracion.habilitada ? 'Configuración habilitada' : 'Desactivada'" :severity="configuracion.habilitada ? 'success' : 'secondary'" /></div>
                        <div class="contabilidad-campo"><label for="contabilidad-inicio">Fecha de inicio <span v-if="configuracion.habilitada" class="requerido">*</span></label><DatePicker inputId="contabilidad-inicio" v-model="fechaInicio" dateFormat="yy-mm-dd" showIcon :manualInput="false" :disabled="guardando || !configuracion.habilitada" /><small>La futura integración respetará esta fecha; no procesa operaciones anteriores.</small></div>
                        <div class="contabilidad-campo"><label>Generación de pólizas</label><InputText modelValue="En borrador, para revisión" disabled /><small>La contabilización automática todavía no está conectada.</small></div>
                    </div>
                </Fieldset>
                <Fieldset legend="Cuentas generales">
                    <p class="contabilidad-nota">Selecciona cuentas activas que permitan movimientos. Los bancos y las cajas se vinculan por separado. Las cuentas pendientes son opcionales y deben ser distintas de sus cuentas efectivas.</p>
                    <div class="contabilidad-cuentas">
                        <div v-for="c in campos" :key="c.campo" class="contabilidad-campo">
                            <label :for="'contable-'+c.campo">{{ c.nombre }} <span v-if="c.requerido && configuracion.habilitada" class="requerido">*</span></label>
                            <Select :inputId="'contable-'+c.campo" v-model="configuracion[c.campo]" :options="handleCuentas(c.tipo)" optionLabel="etiqueta" optionValue="id" filter showClear placeholder="Selecciona una cuenta" :disabled="guardando || !configuracion.habilitada" emptyMessage="No hay cuentas disponibles" emptyFilterMessage="Sin coincidencias" />
                            <small v-if="configuracion[c.campo] && !handleCuentas(c.tipo).some(a=>a.id===configuracion[c.campo])" class="requerido">La cuenta guardada ya no está disponible. Selecciona otra cuenta.</small>
                        </div>
                    </div>
                </Fieldset>
            </template>
        </template>
    </div>
    <Dialog v-model:visible="mostrarAyuda" header="Configuración contable de la empresa" modal :style="{width:'40rem'}" :breakpoints="{'700px':'95vw'}">
        <div class="contabilidad-guia">
            <p><strong>Desactivada por defecto.</strong> La fecha y las cuentas se habilitan al activar el interruptor. Guardar solo se habilita cuando hay cambios. Cada empresa guarda su propia configuración. La opción no cambia el funcionamiento actual de facturas, bancos ni pagos.</p>
            <p><strong>Fecha de inicio.</strong> Define desde cuándo se utilizarán estas reglas cuando integremos la generación de pólizas. No se procesan datos anteriores al guardar.</p>
            <p><strong>Cuentas generales.</strong> Clientes y proveedores representan lo pendiente por cobrar y pagar; Ventas representa el ingreso. Los impuestos tienen cuentas separadas. Solo aparecen cuentas de esta empresa, activas y con movimientos habilitados.</p>
            <p><strong>Impuestos pendientes y efectivos.</strong> Asigna cuentas distintas para el impuesto pendiente y el cobrado o pagado. Las nuevas facturas usarán la cuenta pendiente; las pólizas de cobro o pago reclasificarán la proporción correspondiente. El último abono ajusta los centavos. Las asignaciones específicas de impuestos conservan su cuenta efectiva.</p>
            <p><strong>Configuración opcional.</strong> Sin cuenta pendiente se conserva el tratamiento directo actual. No se modifican pólizas anteriores ni se reclasifican sus impuestos retroactivamente. Revisa con tu contador las cuentas y el tratamiento de cada retención; esta separación no genera declaraciones fiscales.</p>
            <p><strong>Parcialidades.</strong> Revisa las partidas antes de generar. Contabiliza los abonos en el orden de sus borradores. Las partidas con impuestos por flujo quedan protegidas contra edición.</p>
            <p><strong>Guardado independiente.</strong> Utiliza Guardar configuración en esta pestaña. El botón general Guardar de Empresas conserva su funcionamiento y no sobrescribe estos datos.</p>
            <p><strong>Historial.</strong> Los cambios de configuración se registran en el historial de Empresas con el nombre y código de la cuenta.</p>
        </div>
        <template #footer><Button label="Cerrar" outlined @click="mostrarAyuda = false" /></template>
    </Dialog>
</template>
<script>
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Fieldset from 'primevue/fieldset';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import proceso from './js/configuracionContable.js';
export default {name:'ConfiguracionContable',props:{empresaId:{type:String,default:''}},components:{Button,DatePicker,Dialog,Fieldset,InputText,Message,ProgressSpinner,Select,Tag,ToggleSwitch},emits:['guardado'],setup(props,{emit}){return {...proceso(props,emit)};}};
</script>
<style scoped>
@import './css/configuracionContable.css';
</style>
