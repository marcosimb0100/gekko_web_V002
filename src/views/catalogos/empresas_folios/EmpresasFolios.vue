<template>
    <div v-show="!visible">
        <Empresas modoFolios @administrar-folios="abrir" />
    </div>

    <template v-if="visible">
        <Encabezado titulo="Empresas Folios" :subtitulo="empresa?.razon_social_nombre_completo" icono="pi pi-building">
            <Button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined :disabled="guardando" @click="visible = false" />
            <Button v-if="pestana === 'folios'" type="button" label="Guardar series y folios" icon="pi pi-save" :loading="guardando" :disabled="cargando || !puedeGuardar" @click="guardar" />
        </Encabezado>

        <div class="card folios-panel">
            <Message v-if="error" severity="error" class="mb-3">{{ error }}</Message>
            <Tabs v-model:value="pestana">
                <TabList>
                    <Tab value="folios">Series / Folios</Tab>
                    <Tab value="historial">Historial</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel value="folios">
                        <div class="folios-grid">
                            <Fieldset v-for="tipo in tipos" :key="tipo.clave" :legend="tipo.nombre">
                                <div class="folios-campos">
                                    <div>
                                        <label :for="tipo.clave + '_serie'">Serie</label>
                                        <InputText :id="tipo.clave + '_serie'" v-model="folios[tipo.clave + '_serie']" :disabled="cargando || guardando || !valoresOriginales" class="w-full uppercase" />
                                    </div>
                                    <div>
                                        <label :for="tipo.clave + '_folio'">Folio</label>
                                        <InputNumber :inputId="tipo.clave + '_folio'" v-model="folios[tipo.clave + '_folio']" :min="0" :maxFractionDigits="0" :useGrouping="false" :disabled="cargando || guardando || !valoresOriginales" class="w-full" />
                                    </div>
                                </div>
                            </Fieldset>
                        </div>
                    </TabPanel>
                    <TabPanel value="historial">
                        <DataTable :value="historial" :loading="cargando" :paginator="historial.length > 10" :rows="10" scrollable size="small">
                            <template #empty>No hay cambios de series o folios registrados.</template>
                            <Column field="fecha" header="Fecha"><template #body="{ data }">{{ mostrarFecha(data.fecha) }}</template></Column>
                            <Column field="usuario" header="Usuario" />
                            <Column field="documento" header="Documento" />
                            <Column header="Valores anteriores"><template #body="{ data }">{{ mostrarValores(data.antes) }}</template></Column>
                            <Column header="Valores nuevos"><template #body="{ data }">{{ mostrarValores(data.despues) }}</template></Column>
                        </DataTable>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    </template>
</template>

<script setup>
import Encabezado from '../../../components/encabezado/Encabezado.vue';
import Empresas from '../empresas/Empresas.vue';
import usoFolios from './js/proceso.js';

const { visible, empresa, pestana, tipos, folios, historial, cargando, guardando, error, valoresOriginales, puedeGuardar, abrir, guardar, mostrarFecha, mostrarValores } = usoFolios();
</script>

<style scoped>
@import './css/estilo.css';
</style>
