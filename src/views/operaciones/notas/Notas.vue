<template>
    <Dialog v-model:visible="visible" modal header="Nota de crédito" :style="{ width: '38rem' }" :breakpoints="{ '640px': '95vw' }">
        <dl v-if="factura" class="nota-factura">
            <div><dt>Factura</dt><dd>{{ [factura.factura_serie, factura.factura_folio].filter(Boolean).join(' / ') || factura.uuid }}</dd></div>
            <div><dt>Empresa emisora</dt><dd>{{ factura.compania }}</dd></div>
            <div><dt>Cliente</dt><dd>{{ factura.cliente }}</dd></div>
            <div><dt>UUID relacionado</dt><dd>{{ factura.uuid }}</dd></div>
        </dl>

        <div class="nota-captura">
            <div>
                <label for="nota-tipo">Tipo de comprobante</label>
                <InputText id="nota-tipo" modelValue="E - Egreso" readonly class="w-full" />
            </div>
            <div>
                <label for="nota-relacion">Tipo de relación</label>
                <Dropdown inputId="nota-relacion" v-model="tipoRelacion" :options="relaciones" optionLabel="etiqueta" optionValue="clave" :loading="cargando" class="w-full" />
                <small v-if="errorCatalogo" role="alert">{{ errorCatalogo }}</small>
            </div>
            <div>
                <label for="nota-motivo">Motivo</label>
                <Textarea id="nota-motivo" v-model="motivo" rows="3" class="w-full" />
            </div>
            <div>
                <label for="nota-importe">Importe a acreditar</label>
                <InputNumber inputId="nota-importe" v-model="importe" :min="0" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
            </div>
        </div>

        <p class="nota-aviso">Captura de prueba. La emisión y el guardado de la nota todavía no est?n disponibles.</p>
        <template #footer>
            <Button label="Cerrar" severity="secondary" outlined @click="visible = false" />
        </template>
    </Dialog>
</template>

<script setup>
import useProceso from './js/proceso.js';

const props = defineProps({ factura: Object });
const emit = defineEmits(['cerrar']);
const { visible, tipoRelacion, relaciones, cargando, errorCatalogo, motivo, importe } = useProceso(props, emit);
</script>

<style scoped>
@import './css/estilo.css';
</style>
